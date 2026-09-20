import type { APIRoute } from 'astro';
import { ROOT_ADMIN_EMAIL, ROOT_ADMIN_PASSWORD } from 'astro:env/server';
import { defaultAuthStore } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Correo electrónico y contraseña requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const runtimeEnv = (locals as any)?.runtime?.env;
    const envRootEmail = ROOT_ADMIN_EMAIL || runtimeEnv?.ROOT_ADMIN_EMAIL || process.env.ROOT_ADMIN_EMAIL;
    const envRootPassword = ROOT_ADMIN_PASSWORD || runtimeEnv?.ROOT_ADMIN_PASSWORD || process.env.ROOT_ADMIN_PASSWORD;

    const result = await defaultAuthStore.authenticateRootAdmin(email, password, {
      rootEmail: envRootEmail,
      rootPassword: envRootPassword,
    });

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
