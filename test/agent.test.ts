import { describe, it, expect } from 'vitest';
import { buildSocraticPrompt, evaluatePedagogicalResponse } from '../src/lib/agent';
import type { LessonDetail } from '../src/lib/knowledge';

describe('Feature 3: Socratic AI Tutor Agent & 6-Module Prompt Engine', () => {
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

  it('Module 1 & 2: Inquire with contextual lesson grounding and anti-spoonfeeding guardrail', () => {
    const prompt = buildSocraticPrompt(sampleLesson);
    expect(prompt).toContain('Maxister');
    expect(prompt).toContain('para-no-programadores');
    expect(prompt).toContain('Lección: 2');
    expect(prompt).toContain('Conceptos Básicos y Fundamentos de JavaScript');
    expect(prompt).toContain('ANTI-SPOONFEEDING');
  });

  it('Module 3: Includes anti-fluff rules and directness constraints', () => {
    const prompt = buildSocraticPrompt(sampleLesson);
    expect(prompt).toContain('ANTI-RELLENO');
    expect(prompt).toContain('VE DIRECTO AL GRANO');
    expect(prompt).toContain('LONGITUD CONCISA');
  });

  it('Module 4: Diagnostic debugging protocol for student errors', () => {
    const prompt = buildSocraticPrompt(sampleLesson);
    expect(prompt).toContain('DEBUGGING DIAGNÓSTICO');
    expect(prompt).toContain('Traduce el error a lenguaje claro');
  });

  it('Module 5: Includes Few-Shot examples for concise Socratic responses', () => {
    const prompt = buildSocraticPrompt(sampleLesson);
    expect(prompt).toContain('FEW-SHOT EXAMPLES');
    expect(prompt).toContain('EJEMPLO 1');
    expect(prompt).toContain('EJEMPLO 2');
  });

  it('Evaluates compliant vs non-compliant pedagogical responses', () => {
    const badResponse = 'Aquí tienes la solución completa: let x = 10;';
    const badEval = evaluatePedagogicalResponse(badResponse);
    expect(badEval.isCompliant).toBe(false);

    const goodResponse = '¿Qué valor crees que tiene la variable en la línea 3 antes de ser modificada?';
    const goodEval = evaluatePedagogicalResponse(goodResponse);
    expect(goodEval.isCompliant).toBe(true);
  });
});
