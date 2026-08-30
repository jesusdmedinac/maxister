import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export interface LessonSummary {
  lessonNumber: number;
  title: string;
  description: string;
  filePath: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: LessonSummary[];
}

export interface LessonPhases {
  phase1?: string; // Icebreaker / Prior week review
  phase2: string;  // Theory & live experiments
  phase3: string;  // Guided practice / challenges
  phase4: string;  // Debugging & common traps
  phase5: string;  // Weekly structured challenge
  resources: string; // Links and recommended materials
}

export interface LessonDetail {
  courseId: string;
  lessonNumber: number;
  title: string;
  description: string;
  phases: LessonPhases;
  rawContent: string;
}

export interface SearchResult {
  courseId: string;
  lessonNumber: number;
  title: string;
  snippet: string;
}

const COURSE_DEFINITIONS = [
  {
    id: 'para-no-programadores',
    title: 'Programación Desde 0 - Para No Programadores',
    description: 'Fundamentos de programación con analogías claras, lógica y desarrollo web inicial (ShortURL).',
    baseDir: 'from-0-dev/src/content/docs/roadmap/para-no-programadores',
  },
  {
    id: 'para-principiantes',
    title: 'Para Principiantes (Juniors)',
    description: 'Enfocado en empleabilidad, herramientas profesionales, POO, frontend, backend y Git.',
    baseDir: 'from-0-dev/src/content/docs/roadmap/para-principiantes',
  },
  {
    id: 'stack-personalizado',
    title: 'Elige tu Stack Personalizado',
    description: 'Especialización técnica: arquitectura, APIs REST/GraphQL, ORM, testing y CI/CD.',
    baseDir: 'from-0-dev/src/content/docs/roadmap/stack-personalizado',
  },
  {
    id: 'software-engineering',
    title: 'Ingeniería de Software',
    description: 'Principios de diseño (SOLID, DRY, YAGNI), arquitectura limpia y buenas prácticas.',
    baseDir: 'from-0-dev/src/content/docs/roadmap/software-engineering',
  },
  {
    id: 'kotlin-beginners',
    title: 'Kotlin for Beginners (AI Chat CLI)',
    description: 'Domina el lenguaje Kotlin de JetBrains desde cero construyendo un asistente AI Chat en la terminal.',
    baseDir: 'kotlin-0-dev/src/content/docs/course-2-beginners',
  },
];

export async function listCourses(rootPath: string = process.cwd()): Promise<Course[]> {
  const courses: Course[] = [];

  for (const def of COURSE_DEFINITIONS) {
    const courseDir = path.resolve(rootPath, def.baseDir);
    const lessons: LessonSummary[] = [];

    try {
      const files = await fs.readdir(courseDir);
      const mdxFiles = files.filter((f) => f.endsWith('.mdx') && !f.startsWith('index') && !f.startsWith('00-'));

      for (const file of mdxFiles) {
        const filePath = path.join(courseDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);

        // Extract lesson number from file name (e.g., '1.mdx' -> 1, '01-environment...' -> 1)
        const match = file.match(/^0?(\d+)/);
        const lessonNumber = match ? parseInt(match[1], 10) : 1;

        lessons.push({
          lessonNumber,
          title: (parsed.data.title as string) || `Lección ${lessonNumber}`,
          description: (parsed.data.description as string) || '',
          filePath,
        });
      }

      lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);

      courses.push({
        id: def.id,
        title: def.title,
        description: def.description,
        lessons,
      });
    } catch {
      // If course directory does not exist or cannot be read, continue
    }
  }

  return courses;
}

export async function getLesson(
  courseId: string,
  lessonNumber: number,
  rootPath: string = process.cwd()
): Promise<LessonDetail | null> {
  const def = COURSE_DEFINITIONS.find((c) => c.id === courseId);
  if (!def) return null;

  const courseDir = path.resolve(rootPath, def.baseDir);
  try {
    const files = await fs.readdir(courseDir);
    const targetFile = files.find((f) => {
      const match = f.match(/^0?(\d+)/);
      return match && parseInt(match[1], 10) === lessonNumber && f.endsWith('.mdx');
    });

    if (!targetFile) return null;

    const fullPath = path.join(courseDir, targetFile);
    const content = await fs.readFile(fullPath, 'utf-8');
    const parsed = matter(content);

    const phases = extractPhases(parsed.content);

    return {
      courseId,
      lessonNumber,
      title: (parsed.data.title as string) || `Lección ${lessonNumber}`,
      description: (parsed.data.description as string) || '',
      phases,
      rawContent: parsed.content,
    };
  } catch {
    return null;
  }
}

function extractPhases(markdown: string): LessonPhases {
  // Extract content between headings ##
  const sections = markdown.split(/\n(?=##\s+)/);

  let phase1 = '';
  let phase2 = '';
  let phase3 = '';
  let phase4 = '';
  let phase5 = '';
  let resources = '';

  for (const sec of sections) {
    const lower = sec.toLowerCase();
    if (lower.includes('fase 1') || lower.includes('rompehielos') || lower.includes('revisión')) {
      phase1 += sec + '\n';
    } else if (lower.includes('fase 2') || lower.includes('teoría') || lower.includes('experimentos')) {
      phase2 += sec + '\n';
    } else if (lower.includes('fase 3') || lower.includes('práctica') || lower.includes('retos guiados')) {
      phase3 += sec + '\n';
    } else if (lower.includes('fase 4') || lower.includes('debugging') || lower.includes('errores')) {
      phase4 += sec + '\n';
    } else if (lower.includes('fase 5') || lower.includes('reto semanal') || lower.includes('tarea')) {
      phase5 += sec + '\n';
    } else if (lower.includes('recursos') || lower.includes('videos recomendados') || lower.includes('referencias')) {
      resources += sec + '\n';
    } else if (!phase2) {
      // Default to phase2 if not explicitly categorized
      phase2 += sec + '\n';
    }
  }

  return {
    phase1: phase1.trim(),
    phase2: phase2.trim(),
    phase3: phase3.trim(),
    phase4: phase4.trim(),
    phase5: phase5.trim(),
    resources: resources.trim(),
  };
}

export async function searchKnowledge(
  query: string,
  courseIdFilter?: string,
  rootPath: string = process.cwd()
): Promise<SearchResult[]> {
  const courses = await listCourses(rootPath);
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const course of courses) {
    if (courseIdFilter && course.id !== courseIdFilter) continue;

    for (const lesson of course.lessons) {
      try {
        const content = await fs.readFile(lesson.filePath, 'utf-8');
        const lowerContent = content.toLowerCase();

        const index = lowerContent.indexOf(lowerQuery);
        if (index !== -1) {
          const start = Math.max(0, index - 80);
          const end = Math.min(content.length, index + 160);
          const snippet = '...' + content.substring(start, end).replace(/\n+/g, ' ') + '...';

          results.push({
            courseId: course.id,
            lessonNumber: lesson.lessonNumber,
            title: lesson.title,
            snippet,
          });
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return results;
}
