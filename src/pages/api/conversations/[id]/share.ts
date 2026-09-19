import type { APIRoute } from 'astro';
import { defaultConversationStore } from '../../../../lib/conversations';

export const POST: APIRoute = async ({ params, url }) => {
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

  const roomUrl = `${url.origin}/room/${thread.id}`;
  return new Response(JSON.stringify({ thread, roomUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
