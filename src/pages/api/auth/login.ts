import type { APIRoute } from 'astro';
import { z } from 'zod';
import { defaultAuthStore } from '../../../lib/auth';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, password } = parsed.data;
    const result = await defaultAuthStore.authenticate(email, password);

    if (!result.success || !result.user || !result.sessionToken) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set secure HTTP-only session cookie
    cookies.set('maxister_session', result.sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return new Response(JSON.stringify({ user: result.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
