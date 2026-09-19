import type { APIRoute } from 'astro';
import { GEMINI_API_KEY, GEMINI_MODEL } from 'astro:env/server';
import { searchKnowledge, listCourses } from '../../lib/knowledge';
import { streamChatWithMaxister } from '../../lib/agent';
import { defaultAuthStore } from '../../lib/auth';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'message es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cloudflare Workers runtime environment fallback
    const runtimeEnv = (locals as any)?.runtime?.env;
    const apiKey = GEMINI_API_KEY || runtimeEnv?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const modelName = GEMINI_MODEL || runtimeEnv?.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

    // Authenticated student identification
    const sessionToken = cookies.get('maxister_session')?.value;
    let studentInfo = '';
    if (sessionToken) {
      const user = await defaultAuthStore.validateSession(sessionToken);
      if (user) {
        studentInfo = `Estudiante actual: ${user.name} (Ruta activa: ${user.activeCourse})\n`;
      }
    }

    // Context Search across academy lessons
    let academyContext = studentInfo;
    try {
      const searchResults = await searchKnowledge(message);
      if (searchResults.length > 0) {
        academyContext += searchResults
          .slice(0, 3)
          .map((r) => `[Curso: ${r.courseId} | Lección ${r.lessonNumber}]: ${r.snippet}`)
          .join('\n\n');
      } else {
        const courses = await listCourses();
        if (courses.length > 0) {
          academyContext += `Cursos disponibles: ` + courses.map((c) => `${c.title} (${c.lessons.length} lecciones)`).join(', ');
        }
      }
    } catch {
      // Continue without search context if any error
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatWithMaxister({
            apiKey,
            model: modelName,
            academyContext,
            history,
            message,
          });

          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`\n\nError: ${err?.message || 'Error en streaming'}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
