# 🤖 Maxister (v2.0 MVP)

**Maxister** is the intelligent AI tutor and conversational companion for the **Desde0 Academy** (https://desde0.jesusdmedinac.com). Designed to provide 24/7 personalized guidance, Maxister leverages the **Socratic Method**, persistent pedagogical memory, rich Markdown code rendering, and live curriculum grounding across all academy courses.

---

## 🏗️ Project Architecture

```
maxister/
├── docs/
│   ├── features/                 # BDD Specifications in Gherkin (.feature)
│   │   ├── conversation_history.feature
│   │   ├── knowledge_ingestion.feature
│   │   ├── mcp_server.feature
│   │   ├── socratic_agent.feature
│   │   ├── student_authentication.feature
│   │   ├── student_memory.feature
│   │   ├── teacher_governance.feature
│   │   ├── tripartite_chat.feature
│   │   └── web_dashboard.feature
│   └── SOCRATIC_PROMPT_RESEARCH.md # AI Tutoring & Socratic Prompt Benchmark Paper
├── src/
│   ├── components/               # React UI Components
│   │   ├── backoffice/           # Teacher management & feedback moderation
│   │   │   ├── FeedbackManager.tsx
│   │   │   └── TeacherManager.tsx
│   │   ├── AiModeSelector.tsx    # 3-tier AI mode switch (Off / Auto / On)
│   │   ├── App.tsx               # Minimalist ChatGPT-inspired chat studio
│   │   ├── AuthModal.tsx         # Student login and registration modal dialog
│   │   ├── ConversationSidebar.tsx # Multi-thread chats & student escalation drawer
│   │   ├── MarkdownRenderer.tsx  # Rich GFM & PrismLight code highlighter with Copy button
│   │   ├── ShareTeacherModal.tsx # Teacher escalation dialog with unique share link
│   │   ├── SharedChatView.tsx    # Read-only teacher review studio
│   │   └── TripartiteRoom.tsx    # Real-time room (Student + Teacher + Maxister)
│   ├── layouts/
│   │   └── Layout.astro          # Base Astro HTML layout with dark theme
│   ├── lib/
│   │   ├── agent.ts              # 6-Module Socratic prompt engine & Gemini streaming
│   │   ├── auth.ts               # Web Crypto PBKDF2 authentication & Teacher RBAC
│   │   ├── conversations.ts      # Multi-thread store, room claim/release & feedback memory
│   │   ├── knowledge.ts          # Desde0 5-phase lesson parser & search engine
│   │   └── memory.ts             # Student progress & persistent memory store
│   ├── mcp/
│   │   └── server.ts             # Official Model Context Protocol (MCP) server
│   ├── pages/
│   │   ├── index.astro           # Single-page chat interface mount
│   │   ├── backoffice/           # Teacher governance & feedback portal
│   │   │   ├── index.astro
│   │   │   └── login.astro
│   │   ├── room/
│   │   │   └── [id].astro        # Tripartite interactive real-time consultation room
│   │   ├── shared/
│   │   │   └── [id].astro        # Teacher inspection view for shared student chats
│   │   └── api/
│   │       ├── auth/             # REST API for student registration, login, logout, me
│   │       ├── backoffice/       # Root admin backoffice APIs (teachers, feedback)
│   │       ├── chat.ts           # Real-time SSE/ReadableStream chat endpoint with Gemini
│   │       ├── chat/share.ts     # Chat snapshot generation & retrieval for teacher escalation
│   │       ├── conversations/    # Multi-thread, room claim, release, sync, messages
│   │       ├── courses.ts        # REST API endpoint listing academy courses
│   │       ├── lesson.ts         # REST API endpoint returning structured 5-phase lesson
│   │       └── memory.ts         # REST API endpoint managing student profile & notes
│   └── styles/
│       └── global.css            # Tailwind directives & dark theme base styles
└── test/                         # Comprehensive Vitest test suites (agent, auth, conversations, governance, knowledge, mcp, memory, tripartite)
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure credentials:
```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="your-google-gemini-api-key"
GEMINI_MODEL="gemini-flash-lite-latest"
ROOT_ADMIN_EMAIL="admin@desde0.internal"
ROOT_ADMIN_PASSWORD="YourSecureAdminPassword123"
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
   * `ROOT_ADMIN_EMAIL`: Root Administrator email for backoffice governance.
   * `ROOT_ADMIN_PASSWORD`: Root Administrator password.
   * `NODE_VERSION`: `20`
