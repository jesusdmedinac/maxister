import { GoogleGenAI } from '@google/genai';
import type { LessonDetail } from './knowledge';
import type { TeacherFeedbackEntry, DirectiveType, AiParticipationMode } from './conversations';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

export interface SocraticPromptOptions {
  strategicFeedback?: TeacherFeedbackEntry[];
  isTeacherPresent?: boolean;
  teacherName?: string;
  aiMode?: AiParticipationMode;
  userRole?: 'student' | 'teacher' | 'root_admin';
  userName?: string;
}

export function shouldAiRespond(params: {
  aiMode: AiParticipationMode;
  message: string;
  isTeacherPresent: boolean;
}): boolean {
  // If no teacher is present, AI is strictly mandatory On
  if (!params.isTeacherPresent) {
    return true;
  }

  if (params.aiMode === 'off') {
    return false;
  }

  if (params.aiMode === 'on') {
    return true;
  }

  // In AI Auto mode:
  // 1. If addressed to Maxister directly -> true
  // 2. If addressed to human teacher explicitly -> false
  const lower = params.message.toLowerCase();
  const mentionsMaxister =
    lower.includes('maxister') ||
    lower.includes('@maxister') ||
    lower.includes('ia') ||
    lower.includes('asistente') ||
    lower.includes('tutor virtual');

  const mentionsTeacher =
    lower.includes('profe') ||
    lower.includes('profesor') ||
    lower.includes('maestro');

  if (mentionsTeacher && !mentionsMaxister) {
    return false;
  }

  if (mentionsMaxister) {
    return true;
  }

  // Auto-detect technical or coding questions
  const hasQuestion = params.message.includes('?') || params.message.includes('¿');
  const hasCodeSnippet =
    params.message.includes('```') ||
    params.message.includes('const') ||
    params.message.includes('val') ||
    params.message.includes('var') ||
    params.message.includes('function') ||
    params.message.includes('fun') ||
    params.message.includes('class');

  return hasQuestion || hasCodeSnippet;
}

export function detectTeacherDirective(text: string): {
  isDirective: boolean;
  title?: string;
  directiveContent?: string;
  type?: DirectiveType;
  tags?: string[];
} {
  const lower = text.toLowerCase();
  const directiveIndicators = [
    'no uses',
    'no use',
    'explica con',
    'explica usando',
    'analogía',
    'analogia',
    'caja fuerte',
    'regla:',
    'directriz',
    'en kotlin siempre',
    'en javascript siempre',
    'recuerda explicar',
    'en lugar de',
    'enseña primero',
    'ojo con',
    'error común',
  ];

  const matches = directiveIndicators.filter((kw) => lower.includes(kw));
  if (matches.length === 0) {
    return { isDirective: false };
  }

  let type: DirectiveType = 'pedagogical_tip';
  if (lower.includes('analogía') || lower.includes('analogia') || lower.includes('caja fuerte')) {
    type = 'recommended_analogy';
  } else if (lower.includes('no uses') || lower.includes('evita') || lower.includes('prohibido')) {
    type = 'forbidden_anti_pattern';
  } else if (lower.includes('error') || lower.includes('corrección') || lower.includes('en lugar de')) {
    type = 'code_correction';
  }

  // Extract topic tags
  const candidateTags = [
    'kotlin',
    'val',
    'var',
    'javascript',
    'react',
    'poo',
    'async',
    'promesas',
    'memoria',
    'bucles',
  ];
  const tags = candidateTags.filter((t) => lower.includes(t));

  return {
    isDirective: true,
    title: `Pauta docente: ${text.substring(0, 50)}...`,
    directiveContent: text,
    type,
    tags: tags.length > 0 ? tags : ['pedagogía'],
  };
}

export function buildSocraticPrompt(
  lesson?: LessonDetail | null,
  academyContext?: string,
  options?: SocraticPromptOptions
): string {
  if (options?.userRole === 'teacher' || options?.userRole === 'root_admin') {
    return buildTeacherCoPilotPrompt(options?.userName, academyContext, options);
  }
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

  let teacherPresenceSnippet = '';
  if (options?.isTeacherPresent) {
    teacherPresenceSnippet = `
=== PARTICIPACIÓN DOCENTE EN LA SALA ===
El profesor humano (${options.teacherName || 'Profesor de Desde0'}) está presente en esta conversación.
- Si el profesor interviene, apoya su línea pedagógica sin contradecirle.
- Si el profesor te da una instrucción directa, acátala con prioridad absoluta.
`;
  }

  let feedbackSnippet = '';
  if (options?.strategicFeedback && options.strategicFeedback.length > 0) {
    const feedbackItems = options.strategicFeedback
      .map((f) => `- [${f.title}] (${f.directiveType}): ${f.directiveContent}`)
      .join('\n');
    feedbackSnippet = `
=== DIRECTRICES Y RECOMENDACIONES DE LOS PROFESORES (ALTA PRIORIDAD) ===
Los profesores humanos de la academia han establecido las siguientes pautas pedagógicas que DEBES seguir estrictamente:
${feedbackItems}
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
${teacherPresenceSnippet}
${feedbackSnippet}

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

export function evaluatePedagogicalResponse(response: string): {
  isCompliant: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const lower = response.toLowerCase();

  if (
    lower.includes('aquí tienes la solución completa:') ||
    lower.includes('copia y pega este código:')
  ) {
    reasons.push('Direct solution detected without socratic prompting');
  }

  return {
    isCompliant: reasons.length === 0,
    reasons,
  };
}

export function buildTeacherCoPilotPrompt(
  teacherName?: string,
  academyContext?: string,
  options?: SocraticPromptOptions
): string {
  let contextSnippet = '';
  if (academyContext) {
    contextSnippet = `
=== CONTEXTO DEL CURSO / ACADEMIA DESDE0 ===
${academyContext}
`;
  }

  let feedbackSnippet = '';
  if (options?.strategicFeedback && options.strategicFeedback.length > 0) {
    const feedbackItems = options.strategicFeedback
      .map((f) => `- [${f.title}] (${f.directiveType}): ${f.directiveContent}`)
      .join('\n');
    feedbackSnippet = `
=== DIRECTRICES ACTIVAS EN TU MEMORIA ESTRATÉGICA ===
${feedbackItems}
`;
  }

  return `Tu nombre es Maxister.
Estás interactuando en privado con un PROFESOR de la Academia "Desde0" (${teacherName || 'Profesor'}).
Tu rol actual NO es ser tutor de un alumno. Eres el COPILOTO PEDAGÓGICO Y ASISTENTE TÉCNICO DOCENTE (Teaching Assistant & Syllabus Co-pilot).

=== DIRECTRICES PRINCIPALES PARA EL TRATO CON PROFESORES ===
1. 🤝 TRATO DE COLEGA A COLEGA:
   - Comunícate como un par técnico y pedagógico de alto nivel.
   - Cero condescendencia o explicaciones paternalistas. El usuario es un docente o ingeniero experto.

2. 🚀 CERO RESTRICCIONES DE ANTI-SPOONFEEDING:
   - Si el profesor pide código, soluciones completas, ejercicios o bancos de preguntas, ENTRÉGALOS COMPLETOS y listos para producción o clase.
   - No escondas respuestas ni des pistas mínimas como harías con un estudiante.
   - Incluye casos de prueba unitarios (TDD), análisis de complejidad, casos de borde y buenas prácticas.

3. 📚 ALINEACIÓN CON LA METODOLOGÍA PEDAGÓGICA DE DESDE0 (5 FASES):
   - Cada lección de 4 horas en la academia se estructura en 5 fases pedagógicas obligatorias:
     1. Fase 1: Rompehielos / Puente conceptual con la semana previa (~30 min).
     2. Fase 2: Introducción teórica dialogada y experimentos guiados en vivo (~45 min).
     3. Fase 3: Práctica asistida con 3-4 retos guiados progresivos (~90 min).
     4. Fase 4: Exposición, debate y debugging de trampas y errores comunes (~45 min).
     5. Fase 5: Reto semanal estructurado y criterios de evaluación (~30 min).
   - Cuando el profesor pida diseñar clases o retos, utiliza esta estructura pedagógica exacta.

4. 🧠 RECONOCIMIENTO Y REGISTRO DE DIRECTRICES PEDAGÓGICAS:
   - Si el profesor te instruye sobre cómo explicar un concepto (ej: analogías a usar, términos a evitar, advertencias de sintaxis), reconoce la pauta con entusiasmo profesional y confirma cómo la aplicarás con los alumnos.

5. ⚡ ESTILO Y TONO:
   - Ágil, claro, modular y estructurado con Markdown impecable.

${contextSnippet}
${feedbackSnippet}
`;
}

export async function* streamChatWithMaxister(params: {
  apiKey?: string;
  model?: string;
  lesson?: LessonDetail | null;
  academyContext?: string;
  promptOptions?: SocraticPromptOptions;
  history: ChatMessage[];
  message: string;
}): AsyncGenerator<string, void, unknown> {
  const apiKey = params.apiKey || process.env.GEMINI_API_KEY || process.env.PUBLIC_GEMINI_API_KEY;
  const modelName = params.model || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

  const isTeacherUser =
    params.promptOptions?.userRole === 'teacher' ||
    params.promptOptions?.userRole === 'root_admin';

  if (!apiKey) {
    // Graceful fallback for local development / testing without API key
    if (isTeacherUser) {
      yield `🤖 **[Copiloto Docente Maxister]** *(Para respuestas completas con Gemini, configura tu \`GEMINI_API_KEY\`)*\n\n`;
      yield `¡Saludos, Profesor! ¿En qué puedo asistirte hoy con la preparación de tus clases, retos o la memoria de Maxister?`;
    } else {
      yield `🤖 **[Modo Simulación Maxister]** *(Para respuestas en vivo con Gemini, configura tu \`GEMINI_API_KEY\`)*\n\n`;
      yield `¡Hola! Soy **Maxister**, tu tutor en la academia Desde0.\n\n`;
      yield `Vamos a analizar tu pregunta paso a paso: ¿Qué parte del concepto o código te genera más curiosidad o dónde sientes que te trabaste?`;
    }
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = isTeacherUser
    ? buildTeacherCoPilotPrompt(
        params.promptOptions?.userName || params.promptOptions?.teacherName,
        params.academyContext,
        params.promptOptions
      )
    : buildSocraticPrompt(
        params.lesson,
        params.academyContext,
        params.promptOptions
      );

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
