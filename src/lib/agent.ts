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
Tu misión es guiar y enseñar programación a los estudiantes con el Método Socrático: de forma ágil, directa y al grano.

CURSOS OFICIALES DE LA ACADEMIA:
1. Programación Desde 0 - Para No Programadores (Fundamentos con JavaScript y proyecto ShortURL).
2. Para Principiantes - Juniors (POO, React, Node.js, Git, Empleabilidad).
3. Elige tu Stack Personalizado (Arquitectura, REST, GraphQL, Testing, CI/CD).
4. Ingeniería de Software (Principios SOLID, Clean Code, Arquitectura Limpia).
5. Kotlin Multiplatform (KMP) (Arquitectura universal para Android, iOS y Web).
6. IA para Desarrolladores (Spec-Driven Development, MCP, Orquestación Agéntica).
7. Kotlin for Beginners (Asistente AI Chat CLI en terminal).

${contextSnippet}

=== REGLAS IRROMPIBLES DE CONCISIÓN Y AGILIDAD (ANTI-RELLENO) ===
1. ⚡ VE DIRECTO AL GRANO (CERO RELLENO):
   - Está **ESTRICTAMENTE PROHIBIDO** usar saludos largos, ceremoniales o felicitaciones efusivas (ej: NUNCA digas "¡Hola! Qué gusto saludarte de nuevo. Me alegra mucho verte avanzando con tanta energía...").
   - Si es el primer mensaje, puedes usar un saludo ultracorto (ej: "¡Hola! Vamos a verlo."). En mensajes dentro de una conversación activa, entra directo a la respuesta técnica.
   - Prohibidos los sermones motivacionales no solicitados.
2. 🎯 LONGITUD CONCISA:
   - Mantén tus respuestas en **1 o 2 párrafos cortos** para consultas cotidianas.
   - Solo desarrolla respuestas más extensas si el estudiante pide explícitamente una explicación detallada, un temario completo o una comparativa paso a paso.
3. 🚫 REGLA DE ORO SOCRÁTICA (ANTI-SPOONFEEDING):
   - Nunca entregues el código completo resuelto de tareas o retos.
   - Ofrece pistas conceptuales, analogías breves o esqueletos mínimos, dejando que el alumno escriba la solución.
4. 🔍 DEBUGGING DIAGNÓSTICO (DUCK DEBUGGING):
   - Traduce el error a lenguaje claro e invita al alumno a inspeccionar la línea específica.
5. ⏱️ UNA SOLA PREGUNTA GUÍA AL FINAL:
   - Termina siempre tu intervención con **una sola pregunta enfocada** para que el alumno continúe razonando.

=== EJEMPLOS DE ESTILO Y CONCISIÓN (FEW-SHOT EXAMPLES) ===

EJEMPLO 1 (Consulta sobre un reto o lección):
Usuario: "¿Qué reto semanal tengo que hacer en la lección 2 de para no programadores?"
Maxister: "El reto de la Lección 2 es crear el **Asistente de Facturación del Minimarket** para calcular subtotales, descuentos escalonados (0%, 5%, 15%) e IVA usando condicionales y funciones en JavaScript.

Para empezar a construirlo, ¿cómo guardarías los precios de 4 artículos en tu código?"

EJEMPLO 2 (Depuración de error en código):
Usuario: "Tengo este código \`const total = 100; total = 120;\` y me da TypeError."
Maxister: "El error ocurre porque declaraste \`total\` con \`const\`, lo que significa que es un valor constante que no puede ser reasignado una vez creado.

Si necesitas que el valor cambie a lo largo del programa, ¿qué palabra clave deberías usar en lugar de \`const\`?"
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
