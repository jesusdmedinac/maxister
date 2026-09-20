import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationStore } from '../src/lib/conversations';

describe('Feature 11: Read-Only Rooms, Smart Role Detection & Unified Teacher History', () => {
  let convStore: InMemoryConversationStore;

  beforeEach(() => {
    convStore = new InMemoryConversationStore();
  });

  describe('Scenario 1: Unauthenticated guest accesses shared room in read-only mode', () => {
    it('should have isShared=true and be readable without requiring any credentials', async () => {
      const thread = await convStore.createThread('student_1', 'Duda con variables', 'kotlin-beginners');
      await convStore.shareThread(thread.id);

      const loadedThread = await convStore.getThread(thread.id);
      expect(loadedThread?.isShared).toBe(true);
      expect(loadedThread?.assignedTeacherId).toBeNull();
    });
  });

  describe('Scenario 2: Authenticated student owner accesses their own room and unlocks student messaging', () => {
    it('should match userId with thread.userId to identify the consultation owner', async () => {
      const thread = await convStore.createThread('student_mariana', 'Duda Kotlin', 'kotlin-beginners');
      await convStore.shareThread(thread.id);

      const isOwner = thread.userId === 'student_mariana';
      expect(isOwner).toBe(true);

      const isNotOwner = thread.userId === 'student_carlos';
      expect(isNotOwner).toBe(false);
    });
  });

  describe('Scenario 3: Authenticated student visitor is restricted with read-only status', () => {
    it('should identify a visitor student as not the owner', async () => {
      const thread = await convStore.createThread('student_mariana', 'Duda Kotlin', 'kotlin-beginners');
      await convStore.shareThread(thread.id);

      const currentStudentId = 'student_carlos';
      const canEdit = thread.userId === currentStudentId;
      expect(canEdit).toBe(false);
    });
  });

  describe('Scenario 4: Authenticated teacher connects to unassigned room, claims it into their unified chat history', () => {
    it('should add teacherId to participatingTeacherIds and include it in listUserThreads', async () => {
      const thread = await convStore.createThread('student_mariana', 'Duda Kotlin', 'kotlin-beginners');
      await convStore.shareThread(thread.id);

      // Teacher claims consultation
      const claimResult = await convStore.claimThreadByTeacher(thread.id, 'teacher_jesus', 'Jesús Medina');
      expect(claimResult.success).toBe(true);
      expect(claimResult.thread?.assignedTeacherId).toBe('teacher_jesus');
      expect(claimResult.thread?.participatingTeacherIds).toContain('teacher_jesus');

      // Check teacher's unified chat history
      const teacherThreads = await convStore.listUserThreads('teacher_jesus');
      expect(teacherThreads.some((t) => t.id === thread.id)).toBe(true);
    });
  });

  describe('Scenario 5: Other teachers see assigned teacher banner, and releasing the room preserves the consultation in teacher chat history', () => {
    it('should reject claim from second teacher and preserve consultation in first teacher chat history after release', async () => {
      const thread = await convStore.createThread('student_mariana', 'Duda Kotlin', 'kotlin-beginners');
      await convStore.shareThread(thread.id);

      // Teacher A claims
      await convStore.claimThreadByTeacher(thread.id, 'teacher_jesus', 'Jesús Medina');

      // Teacher B attempts claim
      const claimB = await convStore.claimThreadByTeacher(thread.id, 'teacher_carlos', 'Carlos López');
      expect(claimB.success).toBe(false);
      expect(claimB.error).toContain('Jesús Medina');

      // Teacher A releases the consultation
      const releaseResult = await convStore.releaseThreadByTeacher(thread.id, 'teacher_jesus');
      expect(releaseResult.success).toBe(true);
      expect(releaseResult.thread?.assignedTeacherId).toBeNull();

      // Consultation remains in Teacher A's unified chat history
      const teacherAThreads = await convStore.listUserThreads('teacher_jesus');
      expect(teacherAThreads.some((t) => t.id === thread.id)).toBe(true);

      // Now Teacher B can claim it and both teachers have it in their history
      const claimBSecond = await convStore.claimThreadByTeacher(thread.id, 'teacher_carlos', 'Carlos López');
      expect(claimBSecond.success).toBe(true);

      const teacherBThreads = await convStore.listUserThreads('teacher_carlos');
      expect(teacherBThreads.some((t) => t.id === thread.id)).toBe(true);
    });
  });
});
