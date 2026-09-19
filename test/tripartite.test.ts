import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationStore } from '../src/lib/conversations';
import {
  shouldAiRespond,
  detectTeacherDirective,
  buildSocraticPrompt,
} from '../src/lib/agent';

describe('Feature 9: Tripartite Interactive Chat & Strategic Teacher Feedback Memory', () => {
  let convStore: InMemoryConversationStore;

  beforeEach(() => {
    convStore = new InMemoryConversationStore();
  });

  describe('Scenario 1: Single student chat enforces AI On and hides AI Mode selector', () => {
    it('should always mandate AI response when no teacher is present', () => {
      // Personal chat with no teacher
      const shouldRespond = shouldAiRespond({
        aiMode: 'off', // Even if somehow sent as off
        message: '¿Cómo funciona una variable?',
        isTeacherPresent: false,
      });

      expect(shouldRespond).toBe(true);
    });
  });

  describe('Scenario 2: In AI Off mode, Maxister listens in the background without generating spoken output', () => {
    it('should return false for AI response in "off" mode when teacher is present, while preserving messages', async () => {
      const thread = await convStore.createThread('student_1', 'Consulta Kotlin', 'kotlin-beginners');
      await convStore.shareThread(thread.id);
      await convStore.claimThreadByTeacher(thread.id, 'teacher_1', 'Jesús Medina');
      await convStore.setAiMode(thread.id, 'off');

      // Teacher and student talk
      await convStore.addMessage(thread.id, {
        senderId: 'teacher_1',
        senderName: 'Jesús Medina',
        senderRole: 'teacher',
        text: 'Revisa la línea 12 de tu código.',
      });
      await convStore.addMessage(thread.id, {
        senderId: 'student_1',
        senderName: 'Mariana',
        senderRole: 'student',
        text: 'Ah, ya vi el punto y coma que faltaba.',
      });

      const shouldRespond = shouldAiRespond({
        aiMode: 'off',
        message: 'Ah, ya vi el punto y coma que faltaba.',
        isTeacherPresent: true,
      });

      expect(shouldRespond).toBe(false);

      // Verify Maxister retains the full background transcript
      const backgroundMessages = await convStore.getMessages(thread.id);
      expect(backgroundMessages.length).toBe(2);
    });
  });

  describe('Scenario 3: In AI Auto mode, Maxister responds when a participant explicitly refers to it', () => {
    it('should respond when a message explicitly refers to Maxister in "auto" mode', () => {
      const addressedToMaxister = shouldAiRespond({
        aiMode: 'auto',
        message: 'Maxister, ¿cómo resumirías este concepto en una frase?',
        isTeacherPresent: true,
      });
      expect(addressedToMaxister).toBe(true);

      const addressedToTeacher = shouldAiRespond({
        aiMode: 'auto',
        message: 'Profesor Jesús, ¿a qué hora nos vemos mañana en la sala?',
        isTeacherPresent: true,
      });
      expect(addressedToTeacher).toBe(false);
    });
  });

  describe('Scenario 4: Maxister automatically detects teacher pedagogical directive, saves it to TeacherFeedbackStore, and displays an explicit badge', () => {
    it('should classify teacher guidance, save directive entry, and associate badge info', async () => {
      const teacherMessage = "No uses 'var' en Kotlin, explica 'val' con la analogía de la caja fuerte.";
      const detection = detectTeacherDirective(teacherMessage);

      expect(detection.isDirective).toBe(true);
      expect(detection.directiveContent).toBeDefined();

      // Store as feedback
      const feedbackEntry = await convStore.addTeacherFeedback({
        teacherId: 'teacher_1',
        teacherName: 'Jesús Medina',
        studentId: 'student_1',
        studentName: 'Mariana',
        courseId: 'kotlin-beginners',
        topicTags: ['val', 'var', 'kotlin'],
        directiveType: 'recommended_analogy',
        title: detection.title || 'Uso de val con analogía de caja fuerte',
        directiveContent: detection.directiveContent || teacherMessage,
        originalTeacherMessage: teacherMessage,
      });

      expect(feedbackEntry.id).toBeDefined();

      const thread = await convStore.createThread('student_1', 'Kotlin Vars', 'kotlin-beginners');

      // Add message with feedback badge
      const msg = await convStore.addMessage(thread.id, {
        senderId: 'teacher_1',
        senderName: 'Jesús Medina',
        senderRole: 'teacher',
        text: teacherMessage,
        feedbackDirective: {
          id: feedbackEntry.id,
          title: feedbackEntry.title,
          directiveContent: feedbackEntry.directiveContent,
        },
      });

      expect(msg.feedbackDirective).toBeDefined();
      expect(msg.feedbackDirective?.title).toBe(feedbackEntry.title);
    });
  });

  describe('Scenario 5: Strategic teacher feedback tagged by student, teacher, and course is retrieved and applied in subsequent inquiries', () => {
    it('should inject active strategic teacher feedback into Maxister system prompt', async () => {
      await convStore.addTeacherFeedback({
        teacherId: 'teacher_1',
        teacherName: 'Jesús Medina',
        studentId: 'student_1',
        studentName: 'Mariana',
        courseId: 'kotlin-beginners',
        topicTags: ['val', 'caja fuerte'],
        directiveType: 'recommended_analogy',
        title: 'Analogía de caja fuerte para val',
        directiveContent: 'Siempre explica val comparándolo con una caja fuerte que guarda un valor inmutable.',
        originalTeacherMessage: 'Usa la analogía de la caja fuerte para val.',
        status: 'active',
      });

      const strategicNotes = await convStore.getStrategicFeedback('kotlin-beginners', 'val');
      expect(strategicNotes.length).toBe(1);

      const prompt = buildSocraticPrompt(null, '', {
        strategicFeedback: strategicNotes,
        isTeacherPresent: true,
        teacherName: 'Jesús Medina',
      });

      expect(prompt).toContain('DIRECTRICES Y RECOMENDACIONES DE LOS PROFESORES');
      expect(prompt).toContain('caja fuerte');
    });
  });
});
