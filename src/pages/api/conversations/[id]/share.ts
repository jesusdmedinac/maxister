import type { APIRoute } from 'astro';
import { defaultConversationStore } from '../../../../lib/conversations';
import { defaultAuthStore } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, request, cookies, url }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const thread = await defaultConversationStore.shareThread(id);
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
        const user = await defaultAuthStore.validateSession(sessionToken);
        if (user) {
          studentInfo = { id: user.id, name: user.name };
        }
      }
      await defaultConversationStore.importMessages(id, body.messages, studentInfo);
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

