import type { APIRoute } from 'astro';
import { defaultAuthStore } from '../../../../lib/auth';
import { defaultConversationStore } from '../../../../lib/conversations';

export const POST: APIRoute = async ({ params, cookies }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionToken = cookies.get('maxister_session')?.value;
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Debes iniciar sesión como profesor para atender la consulta' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await defaultAuthStore.validateSession(sessionToken);
  if (!user || (user.role !== 'teacher' && user.role !== 'root_admin')) {
    return new Response(JSON.stringify({ error: 'Solo profesores verificados pueden atender consultas' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await defaultConversationStore.claimThreadByTeacher(id, user.id, user.name);

  if (!result.success || !result.thread) {
    return new Response(JSON.stringify({ error: result.error || 'Error al atender la consulta' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ thread: result.thread }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
