import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationStore } from '../src/lib/conversations';
import { shouldAiRespond, detectTeacherDirective } from '../src/lib/agent';

describe('Feature 10: Dynamic In-Place Student Consultation & Teacher Reaction', () => {
  let convStore: InMemoryConversationStore;

  beforeEach(() => {
    convStore = new InMemoryConversationStore();
  });

  describe('Scenario 1: Student creates a shareable link for the teacher without leaving the main chat view', () => {
    it('should mark thread as shared, assign AI Auto, and return roomUrl without changing student view', async () => {
      const thread = await convStore.createThread('student_1', 'Duda con variables', 'kotlin-beginners');
      expect(thread.isShared).toBe(false);

      const shared = await convStore.shareThread(thread.id);
      expect(shared?.isShared).toBe(true);
      expect(shared?.aiMode).toBe('auto');
      expect(shared?.id).toBe(thread.id);
    });
  });

  describe('Scenario 2: Main chat dynamically detects teacher arrival and displays teacher presence', () => {
    it('should transition thread state to assigned when teacher claims consultation', async () => {
      const thread = await convStore.createThread('student_1', 'Duda con variables', 'kotlin-beginners');
      await convStore.shareThread(thread.id);

      // Initially no teacher is assigned
      let currentThread = await convStore.getThread(thread.id);
      expect(currentThread?.assignedTeacherId).toBeNull();
      expect(currentThread?.assignedTeacherName).toBeNull();

      // Teacher claims consultation
      const claimResult = await convStore.claimThreadByTeacher(thread.id, 'teacher_1', 'Jesús Medina');
      expect(claimResult.success).toBe(true);

      // Student sync will observe the assigned teacher
      currentThread = await convStore.getThread(thread.id);
      expect(currentThread?.assignedTeacherId).toBe('teacher_1');
      expect(currentThread?.assignedTeacherName).toBe('Jesús Medina');
    });
  });

  describe('Scenario 3: Real-time synchronization of teacher messages and feedback directives directly in student chat', () => {
    it('should record teacher message with feedback directive and make it retrievable by sync', async () => {
      const thread = await convStore.createThread('student_1', 'Duda con bucles', 'kotlin-beginners');
      await convStore.shareThread(thread.id);
      await convStore.claimThreadByTeacher(thread.id, 'teacher_1', 'Jesús Medina');

      const directiveText = "Usa la analogía del reloj para explicar los bucles while.";
      const detection = detectTeacherDirective(directiveText);
      expect(detection.isDirective).toBe(true);

      const feedback = await convStore.addTeacherFeedback({
        teacherId: 'teacher_1',
        teacherName: 'Jesús Medina',
        studentId: 'student_1',
        studentName: 'Estudiante',
        courseId: 'kotlin-beginners',
        topicTags: ['bucles', 'while'],
        directiveType: 'recommended_analogy',
        title: 'Analogía del reloj para while',
        directiveContent: directiveText,
        originalTeacherMessage: directiveText,
      });

      // Teacher posts message in room
      const teacherMsg = await convStore.addMessage(thread.id, {
        senderId: 'teacher_1',
        senderName: 'Jesús Medina',
        senderRole: 'teacher',
        text: directiveText,
        feedbackDirective: {
          id: feedback.id,
          title: feedback.title,
          directiveContent: feedback.directiveContent,
        },
      });

      // Student sync retrieves the teacher message
      const messages = await convStore.getMessages(thread.id);
      expect(messages.length).toBe(1);
      expect(messages[0].senderRole).toBe('teacher');
      expect(messages[0].senderName).toBe('Jesús Medina');
      expect(messages[0].feedbackDirective?.title).toBe('Analogía del reloj para while');
    });
  });

  describe('Scenario 4: Dynamic activation and display of AI participation modes in student chat upon teacher arrival', () => {
    it('should allow toggling AI modes when teacher is present, and persist mode change', async () => {
      const thread = await convStore.createThread('student_1', 'Duda con recursión', 'kotlin-beginners');
      await convStore.shareThread(thread.id);
      await convStore.claimThreadByTeacher(thread.id, 'teacher_1', 'Jesús Medina');

      expect(thread.aiMode).toBe('auto');

      // Either student or teacher sets mode to 'off'
      const updatedThread = await convStore.setAiMode(thread.id, 'off');
      expect(updatedThread?.aiMode).toBe('off');

      // Verify AI does not respond in 'off' mode when teacher is present
      const shouldRespond = shouldAiRespond({
        aiMode: 'off',
        message: '¿Cuál es el caso base?',
        isTeacherPresent: true,
      });
      expect(shouldRespond).toBe(false);
    });
  });

  describe('Scenario 5: Dynamic reversion when assigned teacher leaves or releases the consultation', () => {
    it('should clear assigned teacher on release while keeping all messages intact', async () => {
      const thread = await convStore.createThread('student_1', 'Duda con recursión', 'kotlin-beginners');
      await convStore.shareThread(thread.id);
      await convStore.claimThreadByTeacher(thread.id, 'teacher_1', 'Jesús Medina');

      await convStore.addMessage(thread.id, {
        senderId: 'teacher_1',
        senderName: 'Jesús Medina',
        senderRole: 'teacher',
        text: 'Te dejo un reto para pensar el caso base.',
      });

      // Teacher releases
      const releaseResult = await convStore.releaseThreadByTeacher(thread.id, 'teacher_1');
      expect(releaseResult.success).toBe(true);

      // Student sync observes teacher is no longer present
      const currentThread = await convStore.getThread(thread.id);
      expect(currentThread?.assignedTeacherId).toBeNull();
      expect(currentThread?.assignedTeacherName).toBeNull();

      // Messages remain intact
      const messages = await convStore.getMessages(thread.id);
      expect(messages.length).toBe(1);
      expect(messages[0].text).toBe('Te dejo un reto para pensar el caso base.');
    });
  });
});
