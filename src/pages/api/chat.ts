import type { APIRoute } from 'astro';
import { GEMINI_API_KEY, GEMINI_MODEL } from 'astro:env/server';
import { searchKnowledge, listCourses } from '../../lib/knowledge';
import { streamChatWithMaxister } from '../../lib/agent';
import path from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'message es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rootPath = path.resolve(process.cwd(), '../');

    // Context Search across academy lessons
    let academyContext = '';
    try {
      const searchResults = await searchKnowledge(message, undefined, rootPath);
      if (searchResults.length > 0) {
        academyContext = searchResults
          .slice(0, 3)
          .map((r) => `[Curso: ${r.courseId} | Lección ${r.lessonNumber}]: ${r.snippet}`)
          .join('\n\n');
      } else {
        const courses = await listCourses(rootPath);
        academyContext = `Cursos disponibles: ` + courses.map((c) => `${c.title} (${c.lessons.length} lecciones)`).join(', ');
      }
    } catch {
      // Continue without search context if any error
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatWithMaxister({
            apiKey: GEMINI_API_KEY,
            model: GEMINI_MODEL,
            academyContext,
            history,
            message,
          });

          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`\n\nError: ${err?.message}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
