import type { APIRoute } from 'astro';
import { defaultConversationStore } from '../../../../lib/conversations';

export const GET: APIRoute = async ({ params }) => {
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

  const messages = await defaultConversationStore.getMessages(id);
  return new Response(JSON.stringify({ thread, messages }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
