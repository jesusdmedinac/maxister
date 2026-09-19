import type { APIRoute } from 'astro';
import { defaultAuthStore } from '../../../lib/auth';
import { defaultConversationStore } from '../../../lib/conversations';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('maxister_session')?.value;
    if (!sessionToken) {
      return new Response(JSON.stringify({ userThreads: [], sharedThreads: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await defaultAuthStore.validateSession(sessionToken);
    if (!user) {
      return new Response(JSON.stringify({ userThreads: [], sharedThreads: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userThreads = await defaultConversationStore.listUserThreads(user.id);
    let sharedThreads: any[] = [];

    if (user.role === 'teacher' || user.role === 'root_admin') {
      sharedThreads = await defaultConversationStore.listSharedThreads();
    }

    return new Response(JSON.stringify({ userThreads, sharedThreads }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error al listar conversaciones' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const sessionToken = cookies.get('maxister_session')?.value;
    let userId = 'guest_user';
    let defaultCourse = 'para-no-programadores';

    if (sessionToken) {
      const user = await defaultAuthStore.validateSession(sessionToken);
      if (user) {
        userId = user.id;
        defaultCourse = user.activeCourse;
      }
    }

    const body = await request.json();
    const { title, courseId } = body;

    const thread = await defaultConversationStore.createThread(
      userId,
      title || 'Nueva Consulta',
      courseId || defaultCourse
    );

    return new Response(JSON.stringify({ thread }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error al crear conversación' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
