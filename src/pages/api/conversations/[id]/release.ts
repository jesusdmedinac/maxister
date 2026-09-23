import type { APIRoute } from 'astro';
import { getAuthStore } from '../../../../lib/auth';
import { getConversationStore } from '../../../../lib/conversations';

export const POST: APIRoute = async ({ params, cookies, locals }) => {
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

  const sessionToken = cookies.get('maxister_session')?.value;
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Sesión no válida' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await authStore.validateSession(sessionToken);
  if (!user || (user.role !== 'teacher' && user.role !== 'root_admin')) {
    return new Response(JSON.stringify({ error: 'Acceso no autorizado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await convStore.releaseThreadByTeacher(id, user.id);

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
