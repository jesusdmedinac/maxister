import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationStore } from '../src/lib/conversations';

describe('Feature 8: Multi-Thread Conversation History & 1-to-1 Shared Rooms', () => {
  let convStore: InMemoryConversationStore;

  beforeEach(() => {
    convStore = new InMemoryConversationStore();
  });

  describe('Scenario 1: Student creates multiple conversation threads and switches between them in sidebar', () => {
    it('should maintain multiple independent conversation threads per student', async () => {
      const thread1 = await convStore.createThread('student_123', 'Variables en Kotlin', 'kotlin-beginners');
      const thread2 = await convStore.createThread('student_123', 'POO en JavaScript', 'para-principiantes');

      const studentThreads = await convStore.listUserThreads('student_123');
      expect(studentThreads.length).toBe(2);

      // Add messages to thread1
      await convStore.addMessage(thread1.id, {
        senderId: 'student_123',
        senderName: 'Mariana',
        senderRole: 'student',
        text: '¿Cómo funciona val?',
      });

      // Add messages to thread2
      await convStore.addMessage(thread2.id, {
        senderId: 'student_123',
        senderName: 'Mariana',
        senderRole: 'student',
        text: '¿Qué es una clase en JS?',
      });

      const messages1 = await convStore.getMessages(thread1.id);
      const messages2 = await convStore.getMessages(thread2.id);

      expect(messages1.length).toBe(1);
      expect(messages1[0].text).toBe('¿Cómo funciona val?');

      expect(messages2.length).toBe(1);
      expect(messages2[0].text).toBe('¿Qué es una clase en JS?');
    });
  });

  describe('Scenario 2: Student escalates thread into a shared room, automatically transitioning default mode to AI Auto', () => {
    it('should mark thread as shared and automatically set aiMode to "auto"', async () => {
      const thread = await convStore.createThread('student_123', 'Duda de Bucles', 'kotlin-beginners');
      expect(thread.aiMode).toBe('on'); // Starts as mandatory on
      expect(thread.isShared).toBe(false);

      const shared = await convStore.shareThread(thread.id);
      expect(shared?.isShared).toBe(true);
      expect(shared?.aiMode).toBe('auto'); // Transitions automatically to AI Auto
    });

    it('should import and persist all active chat messages when student shares conversation', async () => {
      const thread = await convStore.createThread('student_123', 'Duda de Bucles', 'kotlin-beginners');

      const chatHistory = [
        { role: 'user', text: '¿Por qué mi bucle for es infinito?' },
        { role: 'model', text: 'Revisa la condición de parada: ¿se está incrementando el índice?' },
        { role: 'user', text: 'No lo incrementé. Ya lo cambié pero sigue fallando.' },
      ];

      // Import conversation messages
      const imported = await convStore.importMessages(thread.id, chatHistory, {
        id: 'student_123',
        name: 'Mariana',
      });

      expect(imported.length).toBe(3);
      expect(imported[0].senderRole).toBe('student');
      expect(imported[0].senderName).toBe('Mariana');
      expect(imported[0].text).toBe('¿Por qué mi bucle for es infinito?');

      expect(imported[1].senderRole).toBe('assistant');
      expect(imported[1].senderName).toBe('Maxister');
      expect(imported[1].text).toBe('Revisa la condición de parada: ¿se está incrementando el índice?');

      // Verify no duplicates on subsequent sync
      const afterSync = await convStore.importMessages(thread.id, chatHistory, {
        id: 'student_123',
        name: 'Mariana',
      });
      expect(afterSync.length).toBe(3);

      // Verify messages are readable for the room
      const roomMessages = await convStore.getMessages(thread.id);
      expect(roomMessages.length).toBe(3);
    });
  });


  describe('Scenario 3: Teacher views separate sections for personal chats and student shared consultations', () => {
    it('should separate personal teacher threads from shared student consultations', async () => {
      // Teacher personal thread
      const teacherPersonal = await convStore.createThread('teacher_1', 'Notas del Módulo 3', 'kotlin-beginners');

      // Student shared thread
      const studentThread = await convStore.createThread('student_1', 'Ayuda con Ejercicio', 'kotlin-beginners');
      await convStore.shareThread(studentThread.id);

      const teacherPersonalThreads = await convStore.listUserThreads('teacher_1');
      expect(teacherPersonalThreads.length).toBe(1);
      expect(teacherPersonalThreads[0].id).toBe(teacherPersonal.id);

      const sharedConsultations = await convStore.listSharedThreads();
      expect(sharedConsultations.length).toBe(1);
      expect(sharedConsultations[0].id).toBe(studentThread.id);
      expect(sharedConsultations[0].userId).toBe('student_1');
    });
  });

  describe('Scenario 4: Teacher claims room locking it 1-to-1 and reveals AI Mode selector', () => {
    it('should allow first teacher to claim room, and reject claim from second teacher', async () => {
      const thread = await convStore.createThread('student_1', 'Consulta Kotlin', 'kotlin-beginners');
      await convStore.shareThread(thread.id);

      // Teacher A claims
      const claimA = await convStore.claimThreadByTeacher(thread.id, 'teacher_A', 'Jesús Medina');
      expect(claimA.success).toBe(true);
      expect(claimA.thread?.assignedTeacherId).toBe('teacher_A');
      expect(claimA.thread?.assignedTeacherName).toBe('Jesús Medina');

      // Teacher B attempts to claim the same room
      const claimB = await convStore.claimThreadByTeacher(thread.id, 'teacher_B', 'Carlos López');
      expect(claimB.success).toBe(false);
      expect(claimB.error).toMatch(/ya está siendo atendida/i);
    });
  });

  describe('Scenario 5: Assigned teacher releases room; messages persist and room reverts to open claim state', () => {
    it('should release room, keep all messages intact, and allow another teacher to claim it', async () => {
      const thread = await convStore.createThread('student_1', 'Consulta Kotlin', 'kotlin-beginners');
      await convStore.shareThread(thread.id);

      // Teacher A claims and participates
      await convStore.claimThreadByTeacher(thread.id, 'teacher_A', 'Jesús Medina');
      await convStore.addMessage(thread.id, {
        senderId: 'teacher_A',
        senderName: 'Jesús Medina',
        senderRole: 'teacher',
        text: '¡Hola Mariana! Cuéntame qué duda tienes.',
      });
      await convStore.addMessage(thread.id, {
        senderId: 'student_1',
        senderName: 'Mariana',
        senderRole: 'student',
        text: 'Tengo un NullPointerException en este punto.',
      });

      // Teacher A releases the room (leaves/abandons)
      const releaseResult = await convStore.releaseThreadByTeacher(thread.id, 'teacher_A');
      expect(releaseResult.success).toBe(true);
      expect(releaseResult.thread?.assignedTeacherId).toBeNull();
      expect(releaseResult.thread?.assignedTeacherName).toBeNull();

      // Verify all messages are preserved
      const messagesAfterRelease = await convStore.getMessages(thread.id);
      expect(messagesAfterRelease.length).toBe(2);

      // Now Teacher B can claim the open room
      const claimB = await convStore.claimThreadByTeacher(thread.id, 'teacher_B', 'Carlos López');
      expect(claimB.success).toBe(true);
      expect(claimB.thread?.assignedTeacherId).toBe('teacher_B');
    });
  });
});
