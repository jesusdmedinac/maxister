import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationStore } from '../src/lib/conversations';

describe('Feature 13: Multi-Room Sharing Synchronization & Live Teacher Inquiries Stream', () => {
  let convStore: InMemoryConversationStore;

  beforeEach(() => {
    convStore = new InMemoryConversationStore();
  });

  describe('Scenario 1: Student shares a second conversation thread after having previously shared another', () => {
    it('should generate independent shared threads with distinct IDs and shared status', async () => {
      const studentId = 'stu_john';

      // 1. Student creates and shares Thread 1
      const thread1 = await convStore.createThread(studentId, 'Duda con bucles while', 'para-no-programadores');
      const shared1 = await convStore.shareThread(thread1.id);
      expect(shared1?.isShared).toBe(true);

      // 2. Student creates and shares Thread 2
      const thread2 = await convStore.createThread(studentId, 'Error en funciones recursivas', 'para-no-programadores');
      const shared2 = await convStore.shareThread(thread2.id);
      expect(shared2?.isShared).toBe(true);

      // 3. Verify distinct IDs and persistence
      expect(thread1.id).not.toBe(thread2.id);
      const allShared = await convStore.listSharedThreads();
      expect(allShared.length).toBe(2);
      expect(allShared.some((t) => t.id === thread1.id)).toBe(true);
      expect(allShared.some((t) => t.id === thread2.id)).toBe(true);
    });
  });

  describe('Scenario 2: Active conversation thread updates to shared state in UI upon sharing', () => {
    it('should transition thread to shared status and switch AI mode to auto upon share', async () => {
      const thread = await convStore.createThread('stu_maria', 'Consulta de React state', 'para-principiantes');
      expect(thread.isShared).toBe(false);
      expect(thread.aiMode).toBe('on');

      const updated = await convStore.shareThread(thread.id);
      expect(updated).not.toBeNull();
      expect(updated?.isShared).toBe(true);
      expect(updated?.aiMode).toBe('auto');

      const persisted = await convStore.getThread(thread.id);
      expect(persisted?.isShared).toBe(true);
      expect(persisted?.aiMode).toBe('auto');
    });
  });

  describe('Scenario 3: Teacher dashboard dynamically polls and receives newly shared student rooms', () => {
    it('should dynamically reflect newly shared rooms in the unassigned consultation stream', async () => {
      // Teacher initial poll: no shared threads
      const initialPoll = await convStore.listSharedThreads();
      const initialUnassigned = initialPoll.filter((t) => !t.assignedTeacherId);
      expect(initialUnassigned.length).toBe(0);

      // Student shares Thread 1
      const thread1 = await convStore.createThread('stu_carlos', 'Consulta 1', 'kotlin-beginners');
      await convStore.shareThread(thread1.id);

      // Teacher subsequent poll picks up Thread 1
      const poll1 = await convStore.listSharedThreads();
      const unassigned1 = poll1.filter((t) => !t.assignedTeacherId);
      expect(unassigned1.length).toBe(1);
      expect(unassigned1[0].id).toBe(thread1.id);

      // Student shares Thread 2
      const thread2 = await convStore.createThread('stu_carlos', 'Consulta 2', 'kotlin-beginners');
      await convStore.shareThread(thread2.id);

      // Teacher next poll picks up both without reload
      const poll2 = await convStore.listSharedThreads();
      const unassigned2 = poll2.filter((t) => !t.assignedTeacherId);
      expect(unassigned2.length).toBe(2);
      expect(unassigned2.some((t) => t.id === thread1.id)).toBe(true);
      expect(unassigned2.some((t) => t.id === thread2.id)).toBe(true);
    });
  });

  describe('Scenario 4: Teacher views and navigates between multiple shared rooms from the same student', () => {
    it('should allow teacher to claim one room without altering the unassigned status of the other room', async () => {
      const studentId = 'stu_ana';
      const thread1 = await convStore.createThread(studentId, 'Room A', 'stack-personalizado');
      const thread2 = await convStore.createThread(studentId, 'Room B', 'stack-personalizado');

      await convStore.shareThread(thread1.id);
      await convStore.shareThread(thread2.id);

      // Teacher claims Room A
      const claimResult = await convStore.claimThreadByTeacher(thread1.id, 'tea_prof', 'Profesor Medina');
      expect(claimResult.success).toBe(true);

      // Check current state of both rooms
      const sharedRooms = await convStore.listSharedThreads();
      const roomA = sharedRooms.find((t) => t.id === thread1.id);
      const roomB = sharedRooms.find((t) => t.id === thread2.id);

      // Room A is assigned to tea_prof
      expect(roomA?.assignedTeacherId).toBe('tea_prof');
      expect(roomA?.assignedTeacherName).toBe('Profesor Medina');

      // Room B remains open and unassigned
      expect(roomB?.assignedTeacherId).toBeNull();

      // Unassigned queue only contains Room B
      const unassigned = sharedRooms.filter((t) => !t.assignedTeacherId);
      expect(unassigned.length).toBe(1);
      expect(unassigned[0].id).toBe(thread2.id);
    });
  });
});
