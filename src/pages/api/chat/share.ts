import type { APIRoute } from 'astro';
import { defaultAuthStore } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const sessionToken = cookies.get('maxister_session')?.value;
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Debes iniciar sesión para compartir conversaciones con el profesor.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await defaultAuthStore.validateSession(sessionToken);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Sesión expirada o inválida. Por favor, inicia sesión de nuevo.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { messages = [], courseId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hay mensajes en la conversación para compartir.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const snapshot = await defaultAuthStore.createSharedChat({
      userId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      courseId: courseId || user.activeCourse,
      messages,
    });

    const shareUrl = `${url.origin}/shared/${snapshot.id}`;

    return new Response(
      JSON.stringify({
        shareId: snapshot.id,
        shareUrl,
        snapshot,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error al compartir la conversación' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Parámetro id es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const snapshot = await defaultAuthStore.getSharedChat(id);
    if (!snapshot) {
      return new Response(JSON.stringify({ error: 'Conversación compartida no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ snapshot }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error al obtener la conversación' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
