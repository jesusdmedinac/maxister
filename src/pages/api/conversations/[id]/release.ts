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
    return new Response(JSON.stringify({ error: 'Sesión no válida' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await defaultAuthStore.validateSession(sessionToken);
  if (!user || (user.role !== 'teacher' && user.role !== 'root_admin')) {
    return new Response(JSON.stringify({ error: 'Acceso no autorizado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await defaultConversationStore.releaseThreadByTeacher(id, user.id);

  if (!result.success || !result.thread) {
    return new Response(JSON.stringify({ error: result.error || 'Error al liberar la consulta' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ thread: result.thread }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
