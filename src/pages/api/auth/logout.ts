import type { APIRoute } from 'astro';
import { defaultAuthStore } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('maxister_session')?.value;

    if (sessionToken) {
      await defaultAuthStore.revokeSession(sessionToken);
    }

    cookies.delete('maxister_session', { path: '/' });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error al cerrar sesión' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
