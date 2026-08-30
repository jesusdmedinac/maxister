import type { APIRoute } from 'astro';
import { listCourses } from '../../lib/knowledge';

export const GET: APIRoute = async () => {
  const courses = await listCourses();
  return new Response(JSON.stringify({ courses }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
