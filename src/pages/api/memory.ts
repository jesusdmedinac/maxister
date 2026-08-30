import type { APIRoute } from 'astro';
import { defaultMemoryStore } from '../../lib/memory';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');

  if (!studentId) {
    const all = await defaultMemoryStore.listStudents();
    return new Response(JSON.stringify({ students: all }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const student = await defaultMemoryStore.createOrGetStudent(studentId, studentId);
  return new Response(JSON.stringify({ student }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { studentId, name, activeCourse, update } = body;

    if (!studentId) {
      return new Response(JSON.stringify({ error: 'studentId es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let student = await defaultMemoryStore.createOrGetStudent(
      studentId,
      name || studentId,
      activeCourse || 'para-no-programadores'
    );

    if (update) {
      student = (await defaultMemoryStore.updateProgress(studentId, update)) || student;
    }

    return new Response(JSON.stringify({ student }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
