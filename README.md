# 🤖 Maxister (v2.0 MVP)

**Maxister** es el tutor agéntico y compañero inteligente de Inteligencia Artificial de la academia **Desde0**. Está diseñado para brindar acompañamiento 24/7 a los estudiantes mediante el Método Socrático, memoria persistente de aprendizaje y consulta en vivo del temario y lecciones de la academia.

---

## 🏗️ Arquitectura del Proyecto

```
maxister/
├── docs/
│   └── features/                 # Especificaciones BDD en Gherkin (.feature)
├── src/
│   ├── components/               # UI Dashboard en React
│   │   ├── App.tsx               # Orquestador del Dashboard de 3 paneles
│   │   ├── CurriculumSidebar.tsx # Explorador del temario y fases de lección
│   │   ├── ChatRoom.tsx          # Sala de chat con streaming y atajos socráticos
│   │   └── StudentProfileCard.tsx# Gestor de memoria y progreso del estudiante
│   ├── layouts/
│   │   └── Layout.astro          # Layout HTML base
│   ├── lib/
│   │   ├── agent.ts              # Orquestador de Gemini con system prompt socrático
│   │   ├── knowledge.ts          # Lector y parseador de lecciones MDX de Desde0
│   │   └── memory.ts             # Almacén de perfiles y memoria de estudiantes
│   ├── mcp/
│   │   └── server.ts             # Servidor oficial Model Context Protocol (MCP)
│   └── pages/
│       ├── index.astro           # Página principal del Dashboard
│       └── api/
│           ├── chat.ts           # Endpoint de chat streaming con Gemini
│           ├── courses.ts        # Endpoint para listar cursos y temarios
│           ├── lesson.ts         # Endpoint para obtener fases de una lección
│           └── memory.ts         # Endpoint de gestión de estudiantes
└── test/                         # Suite de pruebas unitarias con Vitest
```

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. Configurar variables de entorno (Opcional)
Crea un archivo `.env` o exporta tu clave de Gemini:
```bash
GEMINI_API_KEY="tu-api-key-de-gemini"
```
*(Si no configuras una API key, Maxister correrá en **Modo Simulación Socrático** para desarrollo local)*.

### 3. Iniciar el servidor de desarrollo web
```bash
pnpm dev
```
Abre [http://localhost:4321](http://localhost:4321) en tu navegador para interactuar con el Dashboard de Maxister.

---

## 🧪 Ejecución de Pruebas

Ejecutar la suite completa de pruebas unitarias con Vitest:
```bash
pnpm test
```

Compilar para producción:
```bash
pnpm build
```

---

## 🔌 Uso como Servidor MCP (Cursor, VS Code, Antigravity)

Para conectar Maxister como servidor MCP en tu editor favorito, agrega la siguiente configuración a tu `mcpServers` en `settings.json`:

```json
{
  "mcpServers": {
    "desde0-maxister": {
      "command": "pnpm",
      "args": ["--prefix", "/Users/jesusdmedinac/proyectos/JesusDMedinaC/Desde0/maxister", "mcp"]
    }
  }
}
```

### Herramientas MCP expuestas:
* `get_academy_curriculum`: Consulta el temario completo de todos los cursos.
* `get_lesson_content`: Obtiene las 5 fases estructuradas de cualquier lección.
* `search_academy_knowledge`: Busca temas o errores en el catálogo de lecciones.
* `get_student_memory`: Consulta el perfil y progreso del alumno.
* `update_student_progress`: Actualiza lección, conceptos dominados y notas pedagógicas.
