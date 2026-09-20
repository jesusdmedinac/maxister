import type { APIRoute } from 'astro';
import { GEMINI_API_KEY, GEMINI_MODEL } from 'astro:env/server';
import { searchKnowledge, listCourses } from '../../lib/knowledge';
import { streamChatWithMaxister, detectTeacherDirective } from '../../lib/agent';
import { defaultAuthStore } from '../../lib/auth';
import { defaultConversationStore } from '../../lib/conversations';

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

    // Authenticated user identification
    const sessionToken = cookies.get('maxister_session')?.value;
    let studentInfo = '';
    let userRole: 'student' | 'teacher' | 'root_admin' = 'student';
    let userName = '';
    let authenticatedUser: any = null;

    if (sessionToken) {
      const user = await defaultAuthStore.validateSession(sessionToken);
      if (user) {
        authenticatedUser = user;
        userRole = user.role;
        userName = user.name;
        if (user.role === 'teacher' || user.role === 'root_admin') {
          studentInfo = `Docente autenticado: ${user.name}\n`;
        } else {
          studentInfo = `Estudiante actual: ${user.name} (Ruta activa: ${user.activeCourse})\n`;
        }
      }
    }

    // Auto-detect teacher directive if user is teacher/root_admin
    let detectedDirective: { id: string; title: string; directiveContent: string } | null = null;
    if (authenticatedUser && (userRole === 'teacher' || userRole === 'root_admin')) {
      const detection = detectTeacherDirective(message);
      if (detection.isDirective) {
        const feedbackEntry = await defaultConversationStore.addTeacherFeedback({
          teacherId: authenticatedUser.id,
          teacherName: authenticatedUser.name,
          studentId: 'general',
          studentName: 'Todos los Alumnos',
          courseId: authenticatedUser.activeCourse || 'all',
          topicTags: detection.tags || [],
          directiveType: detection.type || 'pedagogical_tip',
          title: detection.title || 'Directriz docente en chat personal',
          directiveContent: detection.directiveContent || message,
          originalTeacherMessage: message,
          status: 'active',
          qualityScore: 5,
        });

        detectedDirective = {
          id: feedbackEntry.id,
          title: feedbackEntry.title,
          directiveContent: feedbackEntry.directiveContent,
        };
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
            promptOptions: {
              userRole,
              userName,
            },
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

    const headers: Record<string, string> = {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    };
    if (detectedDirective) {
      headers['X-Maxister-Feedback-Directive'] = encodeURIComponent(
        JSON.stringify(detectedDirective)
      );
    }

    return new Response(stream, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
