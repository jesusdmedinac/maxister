import type { APIRoute } from 'astro';
import { GEMINI_API_KEY, GEMINI_MODEL } from 'astro:env/server';
import { defaultAuthStore } from '../../../../lib/auth';
import { defaultConversationStore } from '../../../../lib/conversations';
import {
  shouldAiRespond,
  detectTeacherDirective,
  buildSocraticPrompt,
} from '../../../../lib/agent';
import { GoogleGenAI } from '@google/genai';

export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const thread = await defaultConversationStore.getThread(id);
  if (!thread) {
    return new Response(JSON.stringify({ error: 'Conversación no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'El texto del mensaje es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Authenticate sender
    const sessionToken = cookies.get('maxister_session')?.value;
    let senderId = 'guest';
    let senderName = 'Estudiante';
    let senderRole: 'student' | 'teacher' | 'assistant' = 'student';

    if (sessionToken) {
      const user = await defaultAuthStore.validateSession(sessionToken);
      if (user) {
        senderId = user.id;
        senderName = user.name;
        senderRole = user.role === 'teacher' || user.role === 'root_admin' ? 'teacher' : 'student';
      }
    }

    let feedbackDirectiveInfo: { id: string; title: string; directiveContent: string } | undefined;

    // If a teacher speaks, automatically evaluate if message contains pedagogical feedback
    if (senderRole === 'teacher') {
      const detection = detectTeacherDirective(text);
      if (detection.isDirective) {
        const feedbackEntry = await defaultConversationStore.addTeacherFeedback({
          teacherId: senderId,
          teacherName: senderName,
          studentId: thread.userId,
          studentName: 'Estudiante',
          courseId: thread.courseId,
          topicTags: detection.tags || [thread.courseId],
          directiveType: detection.type || 'pedagogical_tip',
          title: detection.title || 'Directriz pedagógica del profesor',
          directiveContent: detection.directiveContent || text,
          originalTeacherMessage: text,
          status: 'active',
        });

        feedbackDirectiveInfo = {
          id: feedbackEntry.id,
          title: feedbackEntry.title,
          directiveContent: feedbackEntry.directiveContent,
        };
      }
    }

    // Save posted message
    const savedUserMessage = await defaultConversationStore.addMessage(id, {
      senderId,
      senderName,
      senderRole,
      text: text.trim(),
      feedbackDirective: feedbackDirectiveInfo,
    });

    // Check if Maxister should generate a response
    const isTeacherPresent = Boolean(thread.assignedTeacherId);
    const mustRespond = shouldAiRespond({
      aiMode: thread.aiMode,
      message: text,
      isTeacherPresent,
    });

    let savedAiMessage: any = null;

    if (mustRespond) {
      // Gather room context and previous messages
      const allMessages = await defaultConversationStore.getMessages(id);
      const history = allMessages.slice(-10).map((m) => ({
        role: m.senderRole === 'assistant' ? ('model' as const) : ('user' as const),
        text: `[${m.senderName} (${m.senderRole})]: ${m.text}`,
      }));

      // Gather approved strategic teacher feedback for this course
      const strategicFeedback = await defaultConversationStore.getStrategicFeedback(
        thread.courseId,
        text
      );

      // Cloudflare runtime API key fallback
      const runtimeEnv = (locals as any)?.runtime?.env;
      const apiKey = GEMINI_API_KEY || runtimeEnv?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      const modelName = GEMINI_MODEL || runtimeEnv?.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

      let aiResponseText = '';

      if (!apiKey) {
        // Local simulation fallback
        aiResponseText = `🤖 **[Maxister Socrático]**: Analizando tu consulta sobre **${thread.courseId}**: ¿Qué ocurre cuando ejecutas ese bloque paso a paso?`;
      } else {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = buildSocraticPrompt(null, `Curso: ${thread.courseId}`, {
          strategicFeedback,
          isTeacherPresent,
          teacherName: thread.assignedTeacherName || undefined,
          aiMode: thread.aiMode,
        });

        const contents = history.map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        }));

        try {
          const resp = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: { parts: [{ text: systemInstruction }] },
              temperature: 0.7,
            },
          });
          aiResponseText = resp.text || '¿Podrías detallar qué resultado esperabas obtener?';
        } catch (err: any) {
          aiResponseText = `⚠️ Error al generar respuesta socrática: ${err?.message || 'Error de conexión'}`;
        }
      }

      savedAiMessage = await defaultConversationStore.addMessage(id, {
        senderId: 'maxister_ai',
        senderName: 'Maxister',
        senderRole: 'assistant',
        text: aiResponseText,
      });
    }

    return new Response(
      JSON.stringify({
        message: savedUserMessage,
        aiMessage: savedAiMessage,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
