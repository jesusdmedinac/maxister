import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../src/lib/memory';

describe('Feature 2: Student Profile & Persistent Memory', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore(); // In-memory for testing
  });

  it('Scenario 1: Create and retrieve a student profile', async () => {
    const student = await store.createOrGetStudent('carlos-1', 'Carlos', 'para-no-programadores');
    expect(student).toBeDefined();
    expect(student.id).toBe('carlos-1');
    expect(student.name).toBe('Carlos');
    expect(student.activeCourse).toBe('para-no-programadores');
    expect(student.currentLesson).toBe(1);
    expect(student.masteredConcepts).toEqual([]);

    const retrieved = await store.getStudent('carlos-1');
    expect(retrieved?.name).toBe('Carlos');
  });

  it('Scenario 2: Update lesson progress and record mastered skills', async () => {
    await store.createOrGetStudent('carlos-1', 'Carlos', 'para-no-programadores');

    const updated = await store.updateProgress('carlos-1', {
      currentLesson: 2,
      addMasteredConcepts: ['variables', 'console logging'],
    });

    expect(updated?.currentLesson).toBe(2);
    expect(updated?.masteredConcepts).toContain('variables');
    expect(updated?.masteredConcepts).toContain('console logging');
  });

  it('Scenario 3: Record struggling concepts and persistent tutor notes', async () => {
    await store.createOrGetStudent('ana-1', 'Ana', 'kotlin-beginners');

    const updated = await store.updateProgress('ana-1', {
      addStrugglingConcepts: ['null-safety'],
      addNote: 'Ana struggled with Elvis operator on Lesson 2, recommended extra practice.',
    });

    expect(updated?.strugglingConcepts).toContain('null-safety');
    expect(updated?.notes.length).toBe(1);
    expect(updated?.notes[0]).toContain('Elvis operator');
  });
});
