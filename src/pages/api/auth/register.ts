import type { APIRoute } from 'astro';
import { z } from 'zod';
import { defaultAuthStore } from '../../../lib/auth';
import { defaultMemoryStore } from '../../../lib/memory';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  activeCourse: z.string().optional(),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Datos de registro inválidos';
      return new Response(JSON.stringify({ error: firstError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { name, email, password, activeCourse } = parsed.data;
    const result = await defaultAuthStore.registerUser({
      name,
      email,
      password,
      activeCourse: activeCourse || 'para-no-programadores',
    });

    if (!result.success || !result.user || !result.sessionToken) {
      return new Response(JSON.stringify({ error: result.error || 'Error al registrar usuario' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize student profile in MemoryStore
    await defaultMemoryStore.createOrGetStudent(
      result.user.id,
      result.user.name,
      result.user.activeCourse
    );

    // Set secure HTTP-only session cookie
    cookies.set('maxister_session', result.sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return new Response(JSON.stringify({ user: result.user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
