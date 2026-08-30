import { describe, it, expect } from 'vitest';
import { listCourses, getLesson, searchKnowledge } from '../src/lib/knowledge';

describe('Feature 1: Knowledge Ingestion & Curriculum Parser', () => {
  it('Scenario 1: List available courses and curriculum metadata', async () => {
    const courses = await listCourses();
    expect(courses.length).toBeGreaterThanOrEqual(2);

    const nonProgrammers = courses.find((c) => c.id === 'para-no-programadores');
    expect(nonProgrammers).toBeDefined();
    expect(nonProgrammers?.title.toLowerCase()).toContain('no programadores');
    expect(nonProgrammers?.lessons.length).toBeGreaterThanOrEqual(12);

    const kotlinCourse = courses.find((c) => c.id === 'kotlin-beginners');
    expect(kotlinCourse).toBeDefined();
    expect(kotlinCourse?.title.toLowerCase()).toContain('kotlin');
  });

  it('Scenario 2: Parse structured 5-phase lesson content from web/source', async () => {
    const lesson = await getLesson('para-no-programadores', 1);
    expect(lesson).toBeDefined();
    expect(lesson?.title).toBeDefined();
    expect(lesson?.description).toBeDefined();
    expect(lesson?.phases.phase2).toBeDefined();
    expect(lesson?.phases.phase3).toBeDefined();
    expect(lesson?.phases.phase4).toBeDefined();
    expect(lesson?.phases.phase5).toBeDefined();
  });

  it('Scenario 3: Search knowledge base for specific topics or errors', async () => {
    const results = await searchKnowledge('programación');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].courseId).toBeDefined();
    expect(results[0].lessonNumber).toBeDefined();
  });
});
