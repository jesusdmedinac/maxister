import type { APIRoute } from 'astro';
import { defaultAuthStore } from '../../../lib/auth';

async function requireRootAdmin(cookies: any) {
  const token = cookies.get('maxister_session')?.value;
  if (!token) return null;
  const user = await defaultAuthStore.validateSession(token);
  if (!user || user.role !== 'root_admin') return null;
  return user;
}

export const GET: APIRoute = async ({ cookies }) => {
  const admin = await requireRootAdmin(cookies);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado: se requiere rol root_admin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const teachers = await defaultAuthStore.listTeachers();
  return new Response(JSON.stringify({ teachers }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = await requireRootAdmin(cookies);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado: se requiere rol root_admin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, email, password, assignedCourses } = body;

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Nombre, correo y contraseña requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await defaultAuthStore.createTeacher({
      name,
      email,
      password,
      assignedCourses,
    });

    if (!result.success || !result.user) {
      return new Response(JSON.stringify({ error: result.error || 'Error al crear profesor' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ teacher: result.user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const admin = await requireRootAdmin(cookies);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado: se requiere rol root_admin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { teacherId, isActive } = body;

    if (!teacherId || typeof isActive !== 'boolean') {
      return new Response(JSON.stringify({ error: 'teacherId e isActive son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await defaultAuthStore.setTeacherStatus(teacherId, isActive);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Profesor no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, teacherId, isActive }), {
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
