import type { APIRoute } from 'astro';
import { getConversationStore } from '../../../../lib/conversations';

export const GET: APIRoute = async ({ params, locals }) => {
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

  const messages = await convStore.getMessages(id);
  return new Response(JSON.stringify({ thread, messages }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
