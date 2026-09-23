import type { APIRoute } from 'astro';
import { getConversationStore, type AiParticipationMode } from '../../../../lib/conversations';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const db = (locals as any)?.runtime?.env?.DB;
  const convStore = getConversationStore(db);

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const mode = body.mode as AiParticipationMode;

    if (!mode || !['off', 'auto', 'on'].includes(mode)) {
      return new Response(JSON.stringify({ error: 'Modo inválido. Debe ser off, auto u on' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const thread = await convStore.setAiMode(id, mode);
    if (!thread) {
      return new Response(JSON.stringify({ error: 'Conversación no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ thread }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
