# 🤖 Maxister (v2.0 MVP)

**Maxister** is the intelligent AI tutor and conversational companion for the **Desde0 Academy** (https://desde0.jesusdmedinac.com). Designed to provide 24/7 personalized guidance, Maxister leverages the **Socratic Method**, persistent pedagogical memory, rich Markdown code rendering, and live curriculum grounding across all academy courses.

---

## 🏗️ Project Architecture

```
maxister/
├── docs/
│   ├── features/                 # BDD Specifications in Gherkin (.feature)
│   │   ├── knowledge_ingestion.feature
│   │   ├── mcp_server.feature
│   │   ├── socratic_agent.feature
│   │   ├── student_memory.feature
│   │   └── web_dashboard.feature
│   └── SOCRATIC_PROMPT_RESEARCH.md # AI Tutoring & Socratic Prompt Benchmark Paper
├── src/
│   ├── components/               # React UI Components
│   │   ├── App.tsx               # Minimalist ChatGPT-inspired chat studio
│   │   └── MarkdownRenderer.tsx  # Rich GFM & PrismLight code highlighter with Copy button
│   ├── layouts/
│   │   └── Layout.astro          # Base Astro HTML layout with dark theme
│   ├── lib/
│   │   ├── agent.ts              # 6-Module Socratic prompt engine & Gemini streaming
│   │   ├── knowledge.ts          # Desde0 5-phase lesson parser & search engine
│   │   └── memory.ts             # Student progress & persistent memory store
│   ├── mcp/
│   │   └── server.ts             # Official Model Context Protocol (MCP) server
│   ├── pages/
│   │   ├── index.astro           # Single-page chat interface mount
│   │   └── api/
│   │       ├── chat.ts           # Real-time SSE/ReadableStream chat endpoint with Gemini
│   │       ├── courses.ts        # REST API endpoint listing academy courses
│   │       ├── lesson.ts         # REST API endpoint returning structured 5-phase lesson
│   │       └── memory.ts         # REST API endpoint managing student profile & notes
│   └── styles/
│       └── global.css            # Tailwind directives & dark theme base styles
└── test/                         # Comprehensive Vitest test suites
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your Google Gemini API key:
```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="your-google-gemini-api-key"
GEMINI_MODEL="gemini-flash-lite-latest"
```
*(If no API key is provided, Maxister operates in **Socratic Simulation Mode** for local testing)*.

### 3. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser to interact with Maxister.

---

## 🧪 Testing & Build Verification

Run the automated test suite with Vitest:
```bash
pnpm test
```

Build for production:
```bash
pnpm build
```

---

## 🔌 Model Context Protocol (MCP) Server (Cursor, VS Code, Antigravity)

To connect Maxister as an MCP tool provider in your IDE, add this configuration to your `settings.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "desde0-maxister": {
      "command": "pnpm",
      "args": ["--prefix", "/path/to/maxister", "mcp"]
    }
  }
}
```

### Exposed MCP Tools:
* `get_academy_curriculum`: Retrieves the full course catalog and lesson outlines.
* `get_lesson_content`: Returns the structured 5 pedagogical phases of any lesson.
* `search_academy_knowledge`: Semantic/keyword search across the academy knowledge base.
* `get_student_memory`: Reads student progress, mastered skills, and tutor notes.
* `update_student_progress`: Updates active lesson, mastered concepts, and diagnostic notes.

---

## ☁️ Deployment on Cloudflare Pages

1. **Framework Preset:** Astro
2. **Build Command:** `pnpm build`
3. **Build Output Directory:** `dist`
4. **Environment Variables:**
   * `GEMINI_API_KEY`: Encrypted Gemini API key from AI Studio.
   * `GEMINI_MODEL`: `gemini-flash-lite-latest`
   * `NODE_VERSION`: `20`
