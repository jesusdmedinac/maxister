import type { APIRoute } from 'astro';
import { getAuthStore } from '../../../lib/auth';
import { getConversationStore } from '../../../lib/conversations';

export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const db = (locals as any)?.runtime?.env?.DB;
    const authStore = getAuthStore(db);
    const convStore = getConversationStore(db);

    const sessionToken = cookies.get('maxister_session')?.value;
    if (!sessionToken) {
      return new Response(JSON.stringify({ userThreads: [], sharedThreads: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await authStore.validateSession(sessionToken);
    if (!user) {
      return new Response(JSON.stringify({ userThreads: [], sharedThreads: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userThreads = await convStore.listUserThreads(user.id);
    let sharedThreads: any[] = [];

    if (user.role === 'teacher' || user.role === 'root_admin') {
      sharedThreads = await convStore.listSharedThreads();
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

export const POST: APIRoute = async ({ request, cookies, url, locals }) => {
  try {
    const db = (locals as any)?.runtime?.env?.DB;
    const authStore = getAuthStore(db);
    const convStore = getConversationStore(db);

    const sessionToken = cookies.get('maxister_session')?.value;
    let userId = 'guest_user';
    let userName = 'Estudiante';
    let defaultCourse = 'para-no-programadores';

    if (sessionToken) {
      const user = await authStore.validateSession(sessionToken);
      if (user) {
        userId = user.id;
        userName = user.name;
        defaultCourse = user.activeCourse;
      }
    }

    const body = await request.json();
    const { title, courseId, messages = [], isShared = false } = body;

    let thread = await convStore.createThread(
      userId,
      title || 'Nueva Consulta',
      courseId || defaultCourse
    );

    if (Array.isArray(messages) && messages.length > 0) {
      await convStore.importMessages(thread.id, messages, {
        id: userId,
        name: userName,
      });
    }

    if (isShared) {
      const sharedThread = await convStore.shareThread(thread.id);
      if (sharedThread) thread = sharedThread;
    }

    const roomUrl = `${url.origin}/room/${thread.id}`;

    return new Response(JSON.stringify({ thread, roomUrl }), {
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
