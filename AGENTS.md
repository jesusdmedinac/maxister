# Guía para Agentes de IA sobre "Maxister"

Este documento contiene el contexto arquitectónico, directrices pedagógicas y flujos de desarrollo para agentes de IA que trabajen en el proyecto **Maxister**.

---

## 1. Propósito del Proyecto
**Maxister** es el tutor inteligente 24/7 de la academia **Desde0**. Proporciona asistencia pedagógica personalizada basada en el Método Socrático, manteniendo memoria persistente del estudiante y consultando en tiempo real las lecciones `.mdx` de la academia.

## 2. Stack Tecnológico
* **Framework:** Astro (SSR / Server Endpoints)
* **UI:** React + Tailwind CSS + Lucide Icons
* **LLM:** `@google/genai` (Gemini 2.0 Flash)
* **Protocolo:** `@modelcontextprotocol/sdk` (MCP)
* **Testing:** Vitest
* **Deploy Target:** Cloudflare Pages

## 3. Principios Pedagógicos Irrompibles
* **El "Por qué" antes del "Cómo":** Explicar la motivación real de cada concepto antes de mostrar código.
* **Prohibido dar soluciones completas:** Guiar con preguntas diagnósticas, analogías cotidianas y pistas progresivas.
* **Alineación con las 5 Fases:** Toda lección en Desde0 sigue 5 fases (Revisión, Teoría, Práctica asistida, Debugging, Reto semanal). Maxister debe utilizar estas fases para contextualizar sus explicaciones.

## 4. Proceso de Desarrollo (AI Planning Process)
* Toda nueva funcionalidad debe tener su archivo `.feature` en `docs/features/`.
* Mantener actualizado `PROGRESS.md`.
* Escribir pruebas unitarias con Vitest antes o en conjunto con la implementación.
