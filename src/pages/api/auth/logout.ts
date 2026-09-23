import type { APIRoute } from 'astro';
import { getAuthStore } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies, locals }) => {
  try {
    const db = (locals as any)?.runtime?.env?.DB;
    const authStore = getAuthStore(db);

    const sessionToken = cookies.get('maxister_session')?.value;

    if (sessionToken) {
      await authStore.revokeSession(sessionToken);
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
