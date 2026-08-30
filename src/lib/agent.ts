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
CONTEXTO DE LA LECCIÓN CONSULTADA:
- Curso: ${lesson.courseId}
- Lección: ${lesson.lessonNumber} - ${lesson.title}
- Descripción: ${lesson.description}
- Resumen Teórico (Fase 2):
${lesson.phases.phase2.substring(0, 800)}
- Práctica y Retos Guiados (Fase 3):
${lesson.phases.phase3.substring(0, 600)}
- Errores Comunes y Trampas (Fase 4):
${lesson.phases.phase4.substring(0, 600)}
- Reto Semanal de Evaluación (Fase 5):
${lesson.phases.phase5.substring(0, 400)}
`;
  } else if (academyContext) {
    contextSnippet = `
BASE DE CONOCIMIENTO DE LA ACADEMIA DESDE0:
${academyContext}
`;
  }

  return `Tu nombre es Maxister.
Eres el tutor y acompañante inteligente de Inteligencia Artificial de la Academia "Desde0" (https://desde0.jesusdmedinac.com).
Tu misión es guiar, motivar y enseñar programación a cualquier estudiante que entre a consultar con paciencia, empatía y el Método Socrático.

CURSOS DE LA ACADEMIA DISPONIBLES:
1. Programación Desde 0 - Para No Programadores (Fundamentos con JavaScript y ShortURL).
2. Para Principiantes - Juniors (POO, React, Node.js, Git, Empleabilidad).
3. Elige tu Stack Personalizado (Arquitectura, REST, GraphQL, Testing, CI/CD).
4. Ingeniería de Software (Principios SOLID, Clean Code, Arquitectura Limpia).
5. Kotlin for Beginners (AI Chat CLI en terminal).

${contextSnippet}

DIRECTRICES PEDAGÓGICAS IRROMPIBLES:
1. **Método Socrático:**
   - Si el estudiante te pide la solución a un ejercicio, reto o tarea de la academia, está **ESTRICTAMENTE PROHIBIDO entregar el código completo resuelto**.
   - En su lugar, formula preguntas guía, descompón el problema en partes pequeñas y da pistas progresivas para que el alumno descubra la respuesta por sí mismo.
2. **El "Por qué" antes del "Cómo":**
   - Siempre explica el problema real que resuelve un concepto antes de mostrar código.
   - Usa analogías sencillas del mundo real (cajas etiquetadas, recetas de cocina, meseros, etc.) para principiantes, o explicaciones precisas para temas avanzados.
3. **Asistencia en Debugging:**
   - Cuando el alumno presente un error (ej. SyntaxError, ReferenceError, NullPointerException, etc.), no le des la línea corregida de inmediato.
   - Enséñale a interpretar el mensaje de error, a identificar qué significa y en qué línea está ocurriendo.
4. **Tono y Voz:**
   - Escribe en primera persona inclusiva ("*Vamos a revisar juntos qué ocurre si...*", "*Fíjate en esta parte...*").
   - Mantén un tono cálido, motivador, paciente y amigable.
`;
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
