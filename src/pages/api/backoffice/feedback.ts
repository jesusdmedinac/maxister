import type { APIRoute } from 'astro';
import { getAuthStore } from '../../../lib/auth';
import { getConversationStore } from '../../../lib/conversations';

async function requireRootAdmin(cookies: any, authStore: any) {
  const token = cookies.get('maxister_session')?.value;
  if (!token) return null;
  const user = await authStore.validateSession(token);
  if (!user || user.role !== 'root_admin') return null;
  return user;
}

async function requireTeacherOrAdmin(cookies: any, authStore: any) {
  const token = cookies.get('maxister_session')?.value;
  if (!token) return null;
  const user = await authStore.validateSession(token);
  if (!user || (user.role !== 'teacher' && user.role !== 'root_admin')) return null;
  return user;
}

export const GET: APIRoute = async ({ cookies, url, locals }) => {
  const db = (locals as any)?.runtime?.env?.DB;
  const authStore = getAuthStore(db);
  const convStore = getConversationStore(db);

  const admin = await requireRootAdmin(cookies, authStore);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const courseId = url.searchParams.get('courseId') || undefined;
  const teacherId = url.searchParams.get('teacherId') || undefined;
  const status = (url.searchParams.get('status') as any) || undefined;

  const entries = await convStore.listTeacherFeedback({
    courseId,
    teacherId,
    status,
  });

  return new Response(JSON.stringify({ feedback: entries }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const db = (locals as any)?.runtime?.env?.DB;
  const authStore = getAuthStore(db);
  const convStore = getConversationStore(db);

  const admin = await requireRootAdmin(cookies, authStore);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const entry = await convStore.addTeacherFeedback({
      teacherId: admin.id,
      teacherName: admin.name,
      studentId: 'general',
      studentName: 'Todos los Estudiantes',
      courseId: body.courseId || 'all',
      topicTags: body.topicTags || [],
      directiveType: body.directiveType || 'pedagogical_tip',
      title: body.title || 'Directriz manual de administrador',
      directiveContent: body.directiveContent,
      originalTeacherMessage: body.originalTeacherMessage || body.directiveContent,
      status: 'active',
      qualityScore: 5,
    });

    return new Response(JSON.stringify({ entry }), {
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

export const PATCH: APIRoute = async ({ request, cookies, locals }) => {
  const db = (locals as any)?.runtime?.env?.DB;
  const authStore = getAuthStore(db);
  const convStore = getConversationStore(db);

  const admin = await requireRootAdmin(cookies, authStore);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { id, status, qualityScore, adminReviewNotes } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'id requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await convStore.updateTeacherFeedback(id, {
      status,
      qualityScore,
      adminReviewNotes,
    });

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Entrada de feedback no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ entry: updated }), {
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

export const DELETE: APIRoute = async ({ request, cookies, url, locals }) => {
  const db = (locals as any)?.runtime?.env?.DB;
  const authStore = getAuthStore(db);
  const convStore = getConversationStore(db);

  const user = await requireTeacherOrAdmin(cookies, authStore);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let id = url.searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // Body might be empty or not JSON
      }
    }

    if (!id) {
      return new Response(JSON.stringify({ error: 'id requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await convStore.deleteTeacherFeedback(id);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Directriz no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Directriz eliminada de la memoria' }), {
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
