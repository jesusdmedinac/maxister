import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { listCourses, getLesson, searchKnowledge } from '../lib/knowledge';
import { defaultMemoryStore, MemoryStore } from '../lib/memory';

export const MCP_TOOLS: Tool[] = [
  {
    name: 'get_academy_curriculum',
    description: 'Lista todos los cursos, temarios y lecciones disponibles en la academia Desde0.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_lesson_content',
    description: 'Obtiene el contenido detallado de una lección de Desde0 con sus 5 fases estructuradas (teoría, retos guiados, errores comunes y reto semanal).',
    inputSchema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'Identificador del curso (ej: "para-no-programadores", "kotlin-beginners", "para-principiantes").',
        },
        lessonNumber: {
          type: 'number',
          description: 'Número de la lección (ej: 1, 2, 3).',
        },
      },
      required: ['courseId', 'lessonNumber'],
    },
  },
  {
    name: 'search_academy_knowledge',
    description: 'Busca temas, palabras clave o errores en todas las lecciones de la academia.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda (ej: "variables", "NullPointerException", "async").',
        },
        courseId: {
          type: 'string',
          description: 'Filtro opcional por ID de curso.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_student_memory',
    description: 'Obtiene el perfil del estudiante, lección actual, conceptos dominados y debilidades.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: {
          type: 'string',
          description: 'ID o nombre del estudiante (ej: "carlos", "ana").',
        },
      },
      required: ['studentId'],
    },
  },
  {
    name: 'update_student_progress',
    description: 'Actualiza el progreso del estudiante, agrega conceptos dominados o notas pedagógicas.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: {
          type: 'string',
          description: 'ID del estudiante.',
        },
        currentLesson: {
          type: 'number',
          description: 'Nuevo número de lección alcanzado.',
        },
        addMasteredConcepts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Conceptos que el alumno logró dominar.',
        },
        addStrugglingConcepts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Conceptos que causaron dificultad al alumno.',
        },
        addNote: {
          type: 'string',
          description: 'Nota de observación pedagógica para el perfil.',
        },
      },
      required: ['studentId'],
    },
  },
];

export function createMaxisterMcpServer(
  memoryStore: MemoryStore = defaultMemoryStore
) {
  const server = new Server(
    {
      name: 'maxister-mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  async function handleToolCall(name: string, args: any) {
    try {
      if (name === 'get_academy_curriculum') {
        const courses = await listCourses();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(courses, null, 2) }],
        };
      }

      if (name === 'get_lesson_content') {
        const { courseId, lessonNumber } = args;
        const lesson = await getLesson(courseId, Number(lessonNumber));
        if (!lesson) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: `Lección ${lessonNumber} no encontrada para el curso ${courseId}` }],
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(lesson, null, 2) }],
        };
      }

      if (name === 'search_academy_knowledge') {
        const { query, courseId } = args;
        const results = await searchKnowledge(query, courseId);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
        };
      }

      if (name === 'get_student_memory') {
        const { studentId } = args;
        const student = await memoryStore.createOrGetStudent(studentId, studentId);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(student, null, 2) }],
        };
      }

      if (name === 'update_student_progress') {
        const { studentId, ...update } = args;
        const updated = await memoryStore.updateProgress(studentId, update);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(updated, null, 2) }],
        };
      }

      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Herramienta desconocida: ${name}` }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Error ejecutando ${name}: ${err?.message}` }],
      };
    }
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: MCP_TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return handleToolCall(request.params.name, request.params.arguments);
  });

  return { server, tools: MCP_TOOLS, handleToolCall };
}

// Stdio runner when executed directly via CLI (e.g. npx tsx src/mcp/server.ts)
if (import.meta.url === `file://${process.argv[1]}`) {
  const { server } = createMaxisterMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch(console.error);
}
