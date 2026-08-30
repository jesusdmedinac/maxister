import { describe, it, expect } from 'vitest';
import { buildSocraticPrompt } from '../src/lib/agent';
import type { LessonDetail } from '../src/lib/knowledge';

describe('Feature 3: Socratic AI Tutor Agent', () => {
  const sampleLesson: LessonDetail = {
    courseId: 'para-no-programadores',
    lessonNumber: 2,
    title: 'Conceptos Básicos y Fundamentos de JavaScript',
    description: 'Variables, tipos de datos y operadores.',
    phases: {
      phase2: 'Las variables son cajas donde guardamos valores.',
      phase3: 'Reto 1: Declara una variable edad.',
      phase4: 'Error común: ReferenceError al llamar variable antes de declararla.',
      phase5: 'Reto semanal: Calculadora de propinas.',
      resources: 'MDN Web Docs',
    },
    rawContent: '',
  };

  it('Scenario 1: Inquire with contextual lesson grounding', () => {
    const prompt = buildSocraticPrompt(sampleLesson);
    expect(prompt).toContain('Maxister');
    expect(prompt).toContain('para-no-programadores');
    expect(prompt).toContain('Lección: 2');
    expect(prompt).toContain('Conceptos Básicos y Fundamentos de JavaScript');
    expect(prompt).toContain('Socrático');
  });

  it('Scenario 2: Request help on a coding challenge without receiving full solution', () => {
    const prompt = buildSocraticPrompt(sampleLesson);
    expect(prompt).toContain('PROHIBIDO entregar el código completo resuelto');
    expect(prompt).toContain('formula preguntas guía');
  });

  it('Scenario 3: Interactive debugging guidance for error messages', () => {
    const prompt = buildSocraticPrompt(sampleLesson);
    expect(prompt.toLowerCase()).toContain('debugging');
    expect(prompt).toContain('interpretar el mensaje de error');
  });
});
