import type { APIRoute } from 'astro';
import { getConversationStore } from '../../../../lib/conversations';
import { getAuthStore } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, request, cookies, url, locals }) => {
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

  const thread = await convStore.shareThread(id);
  if (!thread) {
    return new Response(JSON.stringify({ error: 'Conversación no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If client provided messages, persist them to the thread
  try {
    const body = await request.json();
    if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      let studentInfo = { id: thread.userId, name: 'Estudiante' };
      const sessionToken = cookies.get('maxister_session')?.value;
      if (sessionToken) {
        const user = await authStore.validateSession(sessionToken);
        if (user) {
          studentInfo = { id: user.id, name: user.name };
        }
      }
      await convStore.importMessages(id, body.messages, studentInfo);
    }
  } catch {
    // Body is optional
  }

  const roomUrl = `${url.origin}/room/${thread.id}`;
  return new Response(JSON.stringify({ thread, roomUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
