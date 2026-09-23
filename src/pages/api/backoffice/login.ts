import type { APIRoute } from 'astro';
import { ROOT_ADMIN_EMAIL, ROOT_ADMIN_PASSWORD, ROOT_ADMIN_EMAILS, DEV_ROOT_ADMIN_EMAIL } from 'astro:env/server';
import {
  getAuthStore,
  extractCloudflareAccessEmail,
  authenticateDelegatedAdmin,
} from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const runtimeEnv = (locals as any)?.runtime?.env;
    const db = runtimeEnv?.DB;
    const authStore = getAuthStore(db);
    const allowedEmails =
      ROOT_ADMIN_EMAILS ||
      runtimeEnv?.ROOT_ADMIN_EMAILS ||
      process.env.ROOT_ADMIN_EMAILS ||
      'admin@desde0.dev';

    // 1. Check for incoming Cloudflare Access Header
    const cfAccessEmail = extractCloudflareAccessEmail(request);
    if (cfAccessEmail) {
      const delegated = await authenticateDelegatedAdmin(cfAccessEmail, allowedEmails, authStore);
      if (!delegated.authorized || !delegated.user || !delegated.sessionToken) {
        return new Response(
          JSON.stringify({ error: delegated.error || 'Acceso delegado denegado' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      cookies.set('maxister_session', delegated.sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 24 * 7,
      });

      return new Response(JSON.stringify({ user: delegated.user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { email, password, devMode } = body;

    // 2. Dev mode simulated login
    if (devMode || (!password && import.meta.env.DEV)) {
      const targetEmail =
        email ||
        DEV_ROOT_ADMIN_EMAIL ||
        runtimeEnv?.DEV_ROOT_ADMIN_EMAIL ||
        process.env.DEV_ROOT_ADMIN_EMAIL ||
        'admin@desde0.dev';

      const delegated = await authenticateDelegatedAdmin(targetEmail, allowedEmails, authStore);
      if (!delegated.authorized || !delegated.user || !delegated.sessionToken) {
        return new Response(
          JSON.stringify({ error: delegated.error || 'Acceso de desarrollo denegado' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      cookies.set('maxister_session', delegated.sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 24 * 7,
      });

      return new Response(JSON.stringify({ user: delegated.user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Password credentials authentication (legacy/fallback in dev/test)
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Correo electrónico y contraseña requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const envRootEmail = ROOT_ADMIN_EMAIL || runtimeEnv?.ROOT_ADMIN_EMAIL || process.env.ROOT_ADMIN_EMAIL;
    const envRootPassword = ROOT_ADMIN_PASSWORD || runtimeEnv?.ROOT_ADMIN_PASSWORD || process.env.ROOT_ADMIN_PASSWORD;

    if (!envRootPassword && import.meta.env.PROD) {
      return new Response(
        JSON.stringify({
          error: 'El inicio de sesión por contraseña está deshabilitado en producción. Utilice Cloudflare Zero Trust.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await authStore.authenticateRootAdmin(email, password, {
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
      maxAge: 60 * 60 * 24 * 7,
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
