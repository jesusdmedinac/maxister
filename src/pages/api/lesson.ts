import type { APIRoute } from 'astro';
import { getLesson } from '../../lib/knowledge';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const courseId = url.searchParams.get('courseId') || 'para-no-programadores';
  const lessonNumber = parseInt(url.searchParams.get('lessonNumber') || '1', 10);

  const lesson = await getLesson(courseId, lessonNumber);

  if (!lesson) {
    return new Response(JSON.stringify({ error: 'Lección no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ lesson }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
