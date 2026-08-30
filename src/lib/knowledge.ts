export interface LessonSummary {
  lessonNumber: number;
  title: string;
  description: string;
  url: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  baseUrl: string;
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

export const ACADEMY_COURSES: Course[] = [
  {
    id: 'para-no-programadores',
    title: 'Programación Desde 0 - Para No Programadores',
    description: 'Fundamentos de programación con JavaScript, lógica y ShortURL.',
    baseUrl: 'https://desde0.jesusdmedinac.com/roadmap/para-no-programadores',
    lessons: Array.from({ length: 12 }, (_, i) => ({
      lessonNumber: i + 1,
      title: `Lección ${i + 1}`,
      description: `Fundamentos de programación - Lección ${i + 1}`,
      url: `https://desde0.jesusdmedinac.com/roadmap/para-no-programadores/${i + 1}/`,
    })),
  },
  {
    id: 'para-principiantes',
    title: 'Para Principiantes (Juniors)',
    description: 'POO, React, Node.js, Git y Empleabilidad.',
    baseUrl: 'https://desde0.jesusdmedinac.com/roadmap/para-principiantes',
    lessons: Array.from({ length: 12 }, (_, i) => ({
      lessonNumber: i + 1,
      title: `Lección ${i + 1}`,
      description: `Desarrollo profesional y empleabilidad - Lección ${i + 1}`,
      url: `https://desde0.jesusdmedinac.com/roadmap/para-principiantes/${i + 1}/`,
    })),
  },
  {
    id: 'stack-personalizado',
    title: 'Elige tu Stack Personalizado',
    description: 'Arquitectura, APIs REST/GraphQL, ORM, testing y CI/CD.',
    baseUrl: 'https://desde0.jesusdmedinac.com/roadmap/stack-personalizado',
    lessons: Array.from({ length: 12 }, (_, i) => ({
      lessonNumber: i + 1,
      title: `Lección ${i + 1}`,
      description: `Especialización de Stack - Lección ${i + 1}`,
      url: `https://desde0.jesusdmedinac.com/roadmap/stack-personalizado/${i + 1}/`,
    })),
  },
  {
    id: 'software-engineering',
    title: 'Ingeniería de Software',
    description: 'Principios SOLID, Clean Code y Arquitectura Limpia.',
    baseUrl: 'https://desde0.jesusdmedinac.com/roadmap/software-engineering',
    lessons: Array.from({ length: 12 }, (_, i) => ({
      lessonNumber: i + 1,
      title: `Lección ${i + 1}`,
      description: `Principios de Ingeniería de Software - Lección ${i + 1}`,
      url: `https://desde0.jesusdmedinac.com/roadmap/software-engineering/${i + 1}/`,
    })),
  },
  {
    id: 'kotlin-multiplatform',
    title: 'Kotlin Multiplatform (KMP)',
    description: 'Arquitectura universal y Compose Multiplatform para Android, iOS y Web.',
    baseUrl: 'https://desde0.jesusdmedinac.com/roadmap/kotlin-multiplatform',
    lessons: Array.from({ length: 12 }, (_, i) => ({
      lessonNumber: i + 1,
      title: `Lección ${i + 1}`,
      description: `Kotlin Multiplatform - Lección ${i + 1}`,
      url: `https://desde0.jesusdmedinac.com/roadmap/kotlin-multiplatform/${i + 1}/`,
    })),
  },
  {
    id: 'ia-para-desarrolladores',
    title: 'IA para Desarrolladores',
    description: 'Spec-Driven Development, MCP y Orquestación Agéntica.',
    baseUrl: 'https://desde0.jesusdmedinac.com/roadmap/ia-para-desarrolladores',
    lessons: Array.from({ length: 12 }, (_, i) => ({
      lessonNumber: i + 1,
      title: `Lección ${i + 1}`,
      description: `Desarrollo de Software Asistido por IA - Lección ${i + 1}`,
      url: `https://desde0.jesusdmedinac.com/roadmap/ia-para-desarrolladores/${i + 1}/`,
    })),
  },
  {
    id: 'kotlin-beginners',
    title: 'Kotlin for Beginners (AI Chat CLI)',
    description: 'Aprende Kotlin construyendo un asistente AI Chat en la terminal.',
    baseUrl: 'https://kotlin-0-dev.jesusdmedinac.com/course-2-beginners',
    lessons: Array.from({ length: 12 }, (_, i) => ({
      lessonNumber: i + 1,
      title: `Lección ${i + 1}`,
      description: `Kotlin Fundamentos - Lección ${i + 1}`,
      url: `https://kotlin-0-dev.jesusdmedinac.com/course-2-beginners/${i + 1}/`,
    })),
  },
];

// In-memory cache for live lesson fetches
const lessonCache = new Map<string, LessonDetail>();

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePhasesFromText(content: string): LessonPhases {
  const findSection = (keywords: string[]): string => {
    for (const kw of keywords) {
      const regex = new RegExp(`(?:##|#|Fase|Phase)\\s*.*${kw}[\\s\\S]*?(?=(?:##|#|Fase|Phase)|$)`, 'i');
      const match = content.match(regex);
      if (match) {
        return match[0].trim();
      }
    }
    return '';
  };

  const phase2 = findSection(['Teoría', 'Fase 2', 'Experimentos', 'Conceptos', 'Theory']);
  const phase3 = findSection(['Práctica', 'Fase 3', 'Retos', 'Ejercicios', 'Practice']);
  const phase4 = findSection(['Debugging', 'Fase 4', 'Errores', 'Trampas', 'Comunes']);
  const phase5 = findSection(['Reto Semanal', 'Fase 5', 'Evaluación', 'Challenge']);
  const resources = findSection(['Recursos', 'Videos', 'Enlaces', 'Resources']);

  return {
    phase1: findSection(['Rompehielos', 'Fase 1', 'Revisión', 'Icebreaker']),
    phase2: phase2 || content.substring(0, 1500),
    phase3: phase3 || 'Retos guiados progresivos para construir en vivo.',
    phase4: phase4 || 'Análisis de errores comunes y depuración.',
    phase5: phase5 || 'Reto semanal de práctica y evaluación.',
    resources: resources || 'Documentación oficial y recursos complementarios.',
  };
}

export async function listCourses(): Promise<Course[]> {
  return ACADEMY_COURSES;
}

export async function getLesson(
  courseId: string,
  lessonNumber: number
): Promise<LessonDetail | null> {
  const cacheKey = `${courseId}-${lessonNumber}`;
  if (lessonCache.has(cacheKey)) {
    return lessonCache.get(cacheKey)!;
  }

  const course = ACADEMY_COURSES.find((c) => c.id === courseId);
  if (!course) return null;

  const lessonSummary = course.lessons.find((l) => l.lessonNumber === lessonNumber);
  const targetUrl = lessonSummary?.url || `${course.baseUrl}/${lessonNumber}/`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const html = await response.text();

    // Extract main Starlight content
    let mainContent = html;
    const match = html.match(/<div class="sl-markdown-content">([\s\S]*?)<\/div>\s*<\/main>/i) ||
                  html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (match) {
      mainContent = match[1];
    }

    const cleanText = stripHtmlTags(mainContent);
    const phases = parsePhasesFromText(cleanText);

    const detail: LessonDetail = {
      courseId,
      lessonNumber,
      title: `${course.title} - Lección ${lessonNumber}`,
      description: lessonSummary?.description || course.description,
      phases,
      rawContent: cleanText,
    };

    lessonCache.set(cacheKey, detail);
    return detail;
  } catch {
    // Fallback if network is unreachable
    const fallbackDetail: LessonDetail = {
      courseId,
      lessonNumber,
      title: `${course.title} - Lección ${lessonNumber}`,
      description: course.description,
      phases: {
        phase2: `Fundamentos teóricos de ${course.title} (Lección ${lessonNumber}).`,
        phase3: `Retos prácticos guiados de la lección ${lessonNumber}.`,
        phase4: `Errores comunes y depuración para la lección ${lessonNumber}.`,
        phase5: `Reto semanal de la lección ${lessonNumber}.`,
        resources: 'https://desde0.jesusdmedinac.com',
      },
      rawContent: '',
    };
    return fallbackDetail;
  }
}

export async function searchKnowledge(
  query: string,
  filterCourseId?: string
): Promise<SearchResult[]> {
  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  const targetCourses = filterCourseId
    ? ACADEMY_COURSES.filter((c) => c.id === filterCourseId)
    : ACADEMY_COURSES;

  for (const course of targetCourses) {
    for (const lesson of course.lessons) {
      if (
        course.title.toLowerCase().includes(queryLower) ||
        course.description.toLowerCase().includes(queryLower) ||
        lesson.title.toLowerCase().includes(queryLower) ||
        lesson.description.toLowerCase().includes(queryLower)
      ) {
        results.push({
          courseId: course.id,
          lessonNumber: lesson.lessonNumber,
          title: `${course.title} - ${lesson.title}`,
          snippet: `${course.description} | Enlace: ${lesson.url}`,
        });
      }
    }
  }

  return results.slice(0, 5);
}
