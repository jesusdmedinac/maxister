import type { APIRoute } from 'astro';
import { defaultAuthStore } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Correo electrónico y contraseña requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await defaultAuthStore.authenticateRootAdmin(email, password);

    if (!result.success || !result.user || !result.sessionToken) {
      return new Response(
        JSON.stringify({ error: result.error || 'Credenciales de administrador inválidas' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    cookies.set('maxister_session', result.sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new Response(JSON.stringify({ user: result.user }), {
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
