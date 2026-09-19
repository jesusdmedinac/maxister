import type { APIRoute } from 'astro';
import { defaultAuthStore } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('maxister_session')?.value;

    if (!sessionToken) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await defaultAuthStore.validateSession(sessionToken);

    if (!user) {
      cookies.delete('maxister_session', { path: '/' });
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error al validar sesión' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
