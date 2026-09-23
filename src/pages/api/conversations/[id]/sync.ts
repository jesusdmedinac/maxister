import type { APIRoute } from 'astro';
import { getConversationStore } from '../../../../lib/conversations';
import { getAuthStore } from '../../../../lib/auth';

export const GET: APIRoute = async ({ params, url, locals }) => {
  const db = (locals as any)?.runtime?.env?.DB;
  const convStore = getConversationStore(db);

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const thread = await convStore.getThread(id);
  if (!thread) {
    return new Response(JSON.stringify({ error: 'Conversación no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const since = url.searchParams.get('since') || undefined;
  const newMessages = await convStore.getMessages(id, since);

  return new Response(JSON.stringify({ thread, newMessages }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
};

export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  const db = (locals as any)?.runtime?.env?.DB;
  const authStore = getAuthStore(db);
  const convStore = getConversationStore(db);

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const thread = await convStore.getThread(id);
  if (!thread) {
    return new Response(JSON.stringify({ error: 'Conversación no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { messages = [] } = body;

    let studentInfo = { id: thread.userId, name: 'Estudiante' };
    const sessionToken = cookies.get('maxister_session')?.value;
    if (sessionToken) {
      const user = await authStore.validateSession(sessionToken);
      if (user) {
        studentInfo = { id: user.id, name: user.name };
      }
    }

    const allMessages = await convStore.importMessages(id, messages, studentInfo);

    return new Response(JSON.stringify({ success: true, count: allMessages.length, messages: allMessages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error al sincronizar mensajes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
