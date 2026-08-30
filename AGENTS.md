# Guidelines for AI Agents Working on "Maxister"

This document defines the core architecture, pedagogical principles, and engineering workflows for AI agents working on the **Maxister** codebase.

---

## 1. Project Mission & Overview
**Maxister** is the 24/7 intelligent Socratic AI Tutor for the **Desde0 Academy** (https://desde0.jesusdmedinac.com). Its mission is to guide, motivate, and teach programming and software engineering to students ranging from absolute beginners to junior developers through personalized dialog, empathetic feedback, and targeted inquiry.

---

## 2. Technology Stack
* **Framework:** Astro (SSR with Cloudflare adapter `@astrojs/cloudflare`)
* **Type-Safe Env:** `astro:env/server` with `envField` definitions
* **UI Components:** React + Tailwind CSS (`@tailwindcss/typography`) + Lucide Icons
* **Markdown & Syntax Highlighting:** `react-markdown`, `remark-gfm`, `react-syntax-highlighter` (`PrismLight`)
* **LLM Engine:** `@google/genai` (Google Gemini SDK)
* **Extensibility Protocol:** `@modelcontextprotocol/sdk` (MCP Server over `stdio`)
* **Testing:** Vitest
* **Target Cloud Platform:** Cloudflare Pages (Workers runtime `workerd`)

---

## 3. Language & Documentation Policy
* **Engineering & Platform (STRICTLY IN ENGLISH):**
  * All documentation files (`README.md`, `AGENTS.md`, `PROGRESS.md`, `docs/**/*.md`).
  * All Gherkin BDD specifications (`docs/features/*.feature`).
  * Git commit messages and Pull Request descriptions.
  * Code variables, functions, tests, and comments.
* **Student-Facing Chat Output (STRICTLY IN SPANISH):**
  * System prompt instructions for Socratic tutoring to students in Spanish.
  * UI labels and chat suggestions in the web interface.

---

## 4. Non-Negotiable Pedagogical Principles (The 6-Module Framework)
1. **The "Why" Before the "How":** Always explain the real-world problem a concept solves before showing syntax.
2. **Strict Anti-Spoonfeeding Guardrail:** Never provide the complete solution to exercises, challenges, or assignments. Guide with questions and small minimal skeletons.
3. **3-Tier Progressive Scaffolding (R.I.S.E.):** Conceptual analogy -> Algorithmic logic -> Syntax skeleton.
4. **Diagnostic Duck Debugging:** Translate compiler/runtime errors into plain language and direct the student to inspect the specific offending line without writing the fix for them.
5. **One Question at a Time:** Keep answers concise and end with a single, clear guiding question.
6. **5-Phase Curriculum Alignment:** Ground responses in the 5 pedagogical phases (Review, Theory, Guided Practice, Pitfalls/Debugging, Weekly Challenge).

---

## 5. Development Workflow (AI Planning Process)
1. Define features in Gherkin `.feature` files inside `docs/features/`.
2. Maintain `PROGRESS.md` with complete scenario checklists.
3. Write unit tests in `test/` alongside implementations.
4. Verify builds with `pnpm build` and test suites with `pnpm test`.
