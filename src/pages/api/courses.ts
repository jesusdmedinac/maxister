import type { APIRoute } from 'astro';
import { listCourses } from '../../lib/knowledge';
import path from 'node:path';

export const GET: APIRoute = async () => {
  const rootPath = path.resolve(process.cwd(), '../');
  const courses = await listCourses(rootPath);
  return new Response(JSON.stringify({ courses }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
