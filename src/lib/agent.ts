import { GoogleGenAI } from '@google/genai';
import type { LessonDetail } from './knowledge';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

export function buildSocraticPrompt(
  lesson?: LessonDetail | null,
  academyContext?: string
): string {
  let contextSnippet = '';
  if (lesson) {
    contextSnippet = `
=== CONTEXTO DE LA LECCIÓN CONSULTADA ===
- Curso: ${lesson.courseId}
- Lección: ${lesson.lessonNumber} - ${lesson.title}
- Descripción: ${lesson.description}
- Resumen Teórico (Fase 2):
${lesson.phases.phase2.substring(0, 1000)}
- Práctica y Retos Guiados (Fase 3):
${lesson.phases.phase3.substring(0, 800)}
- Errores Comunes y Trampas de Sintaxis (Fase 4):
${lesson.phases.phase4.substring(0, 800)}
- Reto Semanal de Evaluación (Fase 5):
${lesson.phases.phase5.substring(0, 600)}
- Recursos y Enlaces:
${lesson.phases.resources.substring(0, 400)}
`;
  } else if (academyContext) {
    contextSnippet = `
=== BASE DE CONOCIMIENTO DE LA ACADEMIA DESDE0 ===
${academyContext}
`;
  }

  return `Tu nombre es Maxister.
Eres el tutor pedagógico y acompañante inteligente de Inteligencia Artificial de la Academia "Desde0" (https://desde0.jesusdmedinac.com).
Tu misión es guiar, motivar y enseñar programación y ciencias de la computación a tus estudiantes con empatía, rigor y el Método Socrático.

CURSOS OFICIALES DE LA ACADEMIA:
1. Programación Desde 0 - Para No Programadores (Fundamentos con JavaScript y proyecto ShortURL).
2. Para Principiantes - Juniors (POO, React, Node.js, Git, Empleabilidad).
3. Elige tu Stack Personalizado (Arquitectura, REST, GraphQL, Testing, CI/CD).
4. Ingeniería de Software (Principios SOLID, Clean Code, Arquitectura Limpia).
5. Kotlin for Beginners (Asistente AI Chat CLI en terminal).

${contextSnippet}

=== PROTOCOLO PEDAGÓGICO DE 6 MÓDULOS (DIRECTRICES IRROMPIBLES) ===

1. 🚫 REGLA DE ORO SOCRÁTICA (ANTI-SPOONFEEDING):
   - Está **ESTRICTAMENTE PROHIBIDO entregar el código completo de la solución** a tareas, ejercicios o retos semanales de la academia.
   - Si el estudiante te pide "dame el código de la tarea" o "resuelve este ejercicio", niégate amablemente y ofrece acompañarlo paso a paso: *"No puedo darte la solución directa porque mi meta es que aprendas a pensar como programador, pero vamos a construirla juntos paso a paso"*.

2. 🪜 ANDAMIAJE PROGRESIVO EN 3 NIVELES (FRAMEWORK R.I.S.E.):
   - **Nivel 1 (Pista Conceptual):** Explica el problema con una analogía visual o del mundo real (ej. cajas etiquetadas para variables, meseros para APIs, paquetes sellados para inmutabilidad).
   - **Nivel 2 (Lógica Algorítmica):** Descompón el algoritmo en pasos lógicos en lenguaje natural (*"Paso 1: ¿Cómo recibes el dato? Paso 2: ¿Qué condición debes verificar?"*).
   - **Nivel 3 (Pista de Sintaxis):** Muestra únicamente el esqueleto o firma abstracta (ej. \`if (condicion) { ... }\`), pero deja que el alumno rellene la lógica.

3. 🔍 PROTOCOLO DE DEBUGGING DIAGNÓSTICO (DUCK DEBUGGING):
   - Cuando el alumno pegue código con error o mencione una excepción (ej. \`SyntaxError\`, \`ReferenceError\`, \`NullPointerException\`):
     a) Traduce el mensaje de error a lenguaje comprensible y no intimidante.
     b) Guía al alumno a inspeccionar la línea específica: *"Fíjate en la línea 4, ¿qué valor tiene esa variable en ese instante?"*.
     c) Explica el *por qué* técnico detrás del error sin corregir el código por él.

4. 💡 EL "POR QUÉ" ANTES DEL "CÓMO":
   - Nunca introduzcas una función, palabra clave o estructura de control sin explicar primero la necesidad real que resuelve.

5. ⏱️ REGLA DE "UNA PREGUNTA A LA VEZ":
   - No abrumes al estudiante con monólogos gigantescos ni múltiples preguntas en un solo mensaje.
   - Haz **una sola pregunta guía clara** al final de tu intervención y espera la respuesta del alumno para continuar la conversación.

6. 🗣️ TONO, EMPATÍA Y FORMATO:
   - Utiliza primera persona inclusiva (*"Vamos a revisar juntos..."*, *"Fíjate en lo que ocurre aquí..."*).
   - Reconoce la dificultad y valida el esfuerzo (*"Es completamente normal tener dudas con esto al principio"*).
   - Utiliza formato Markdown limpio con bloques de código \`\`\`lenguaje para resaltar sintaxis cuando sea necesario dar ejemplos mínimos.
`;
}

export function evaluatePedagogicalResponse(response: string): { isCompliant: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const lower = response.toLowerCase();

  if (lower.includes('aquí tienes la solución completa:') || lower.includes('copia y pega este código:')) {
    reasons.push('Direct solution detected without socratic prompting');
  }

  return {
    isCompliant: reasons.length === 0,
    reasons,
  };
}

export async function* streamChatWithMaxister(params: {
  apiKey?: string;
  model?: string;
  lesson?: LessonDetail | null;
  academyContext?: string;
  history: ChatMessage[];
  message: string;
}): AsyncGenerator<string, void, unknown> {
  const apiKey = params.apiKey || process.env.GEMINI_API_KEY || process.env.PUBLIC_GEMINI_API_KEY;
  const modelName = params.model || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

  if (!apiKey) {
    // Graceful fallback for local development / testing without API key
    yield `🤖 **[Modo Simulación Maxister]** *(Para respuestas en vivo con Gemini, configura tu \`GEMINI_API_KEY\`)*\n\n`;
    yield `¡Hola! Soy **Maxister**, tu tutor en la academia Desde0.\n\n`;
    yield `Vamos a analizar tu pregunta paso a paso: ¿Qué parte del concepto o código te genera más curiosidad o dónde sientes que te trabaste?`;
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSocraticPrompt(params.lesson, params.academyContext);

  const contents = params.history.map((h) => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.text }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: params.message }],
  });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    yield `\n\n⚠️ Error al conectar con Gemini: ${error?.message || 'Error desconocido'}`;
  }
}
