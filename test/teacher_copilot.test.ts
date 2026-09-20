import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationStore } from '../src/lib/conversations';
import {
  buildSocraticPrompt,
  buildTeacherCoPilotPrompt,
  detectTeacherDirective,
} from '../src/lib/agent';

describe('Feature 12: Teacher Co-Pilot Experience, Revertable Directives & Unassigned Consultations', () => {
  let convStore: InMemoryConversationStore;

  beforeEach(() => {
    convStore = new InMemoryConversationStore();
  });

  describe('Scenario 1: Authenticated teacher connects to personal chat and receives Teacher Co-Pilot persona', () => {
    it('should generate a peer-to-peer co-pilot prompt without anti-spoonfeeding constraints', () => {
      const teacherPrompt = buildTeacherCoPilotPrompt('Jesús Medina', 'Curso: Kotlin Beginners');

      expect(teacherPrompt).toContain('COPILOTO PEDAGÓGICO');
      expect(teacherPrompt).toContain('Jesús Medina');
      expect(teacherPrompt).toContain('CERO RESTRICCIONES DE ANTI-SPOONFEEDING');
      expect(teacherPrompt).not.toContain('Nunca entregues el código completo resuelto');
    });

    it('should preserve strict anti-spoonfeeding constraints in student prompt', () => {
      const studentPrompt = buildSocraticPrompt(null, 'Curso: Kotlin Beginners');

      expect(studentPrompt).toContain('ANTI-SPOONFEEDING');
      expect(studentPrompt).toContain('Nunca entregues el código completo resuelto');
    });
  });

  describe('Scenario 2: Teacher requests complete code solutions and unit test suites', () => {
    it('should include instructions to deliver complete production code and TDD suites', () => {
      const teacherPrompt = buildTeacherCoPilotPrompt('Profesor Carlos');

      expect(teacherPrompt).toContain('ENTRÉGALOS COMPLETOS y listos para producción o clase');
      expect(teacherPrompt).toContain('casos de prueba unitarios (TDD)');
    });
  });

  describe('Scenario 3: Teacher provides natural language pedagogical directive in personal chat with revert action', () => {
    it('should auto-detect directive and persist it to TeacherFeedbackStore', async () => {
      const directiveMsg = 'En Kotlin, no uses la palabra iterador con novatos. Explica con la analogía de la rueda de la fortuna.';
      const detection = detectTeacherDirective(directiveMsg);

      expect(detection.isDirective).toBe(true);

      const saved = await convStore.addTeacherFeedback({
        teacherId: 'tea_jesus',
        teacherName: 'Jesús Medina',
        studentId: 'general',
        studentName: 'Todos los Alumnos',
        courseId: 'kotlin-beginners',
        topicTags: detection.tags || ['kotlin'],
        directiveType: detection.type || 'pedagogical_tip',
        title: 'Analogía de la rueda de la fortuna',
        directiveContent: directiveMsg,
        originalTeacherMessage: directiveMsg,
      });

      expect(saved.id).toBeDefined();
      expect(saved.directiveContent).toBe(directiveMsg);

      const allFeedback = await convStore.listTeacherFeedback();
      expect(allFeedback.some((f) => f.id === saved.id)).toBe(true);
    });
  });

  describe('Scenario 4: Teacher reverts an auto-detected directive directly from the chat badge', () => {
    it('should delete the directive from TeacherFeedbackStore when teacher clicks revert', async () => {
      const saved = await convStore.addTeacherFeedback({
        teacherId: 'tea_jesus',
        teacherName: 'Jesús Medina',
        studentId: 'general',
        studentName: 'Todos los Alumnos',
        courseId: 'kotlin-beginners',
        directiveType: 'pedagogical_tip',
        title: 'Regla temporal',
        directiveContent: 'No explicar corrutinas aún',
        originalTeacherMessage: 'No explicar corrutinas aún',
      });

      // Verify it exists
      expect((await convStore.listTeacherFeedback()).length).toBe(1);

      // Teacher reverts the directive
      const deleted = await convStore.deleteTeacherFeedback(saved.id);
      expect(deleted).toBe(true);

      // Verify it is gone
      const remaining = await convStore.listTeacherFeedback();
      expect(remaining.some((f) => f.id === saved.id)).toBe(false);
    });
  });

  describe('Scenario 5: Teacher home screen displays up to 4 latest unassigned student consultation rooms', () => {
    it('should filter up to 4 unassigned shared rooms for teacher priority action', async () => {
      // Create 6 student threads and share them
      for (let i = 1; i <= 6; i++) {
        const thread = await convStore.createThread(`student_${i}`, `Consulta ${i}`, 'kotlin-beginners');
        await convStore.shareThread(thread.id);
      }

      // One is claimed by another teacher
      const allShared = await convStore.listSharedThreads();
      await convStore.claimThreadByTeacher(allShared[0].id, 'tea_carlos', 'Carlos López');

      // Refresh shared threads list
      const refreshedShared = await convStore.listSharedThreads();

      // Filter unassigned
      const unassigned = refreshedShared.filter((t) => !t.assignedTeacherId).slice(0, 4);

      expect(unassigned.length).toBe(4);
      expect(unassigned.every((t) => !t.assignedTeacherId)).toBe(true);
    });
  });
});
