# Instant Coffee

## What This Is

A collaborative whiteboarding tool that facilitates diagramming sessions through conversation. Users chat their intent and Instant Coffee translates it into Mermaid diagrams in real-time, rendering locally. The iteration is quick and fluid—user says what they want, diagram updates until it matches their vision.

## Core Value

Users can instantly create accurate diagrams by describing what they want in natural language, without learning diagram syntax.

## Requirements

### Validated

- ✅ CORE-01: User can type natural language in chat to request diagrams — v1.0
- ✅ CORE-02: System sends chat to Ollama and receives Mermaid syntax response — v1.0
- ✅ CORE-03: System renders Mermaid as SVG in the whiteboard area — v1.0
- ✅ CORE-04: Diagram updates in real-time as AI generates response — v1.0
- ✅ CORE-05: System handles Ollama unavailability gracefully with clear error message — v1.0
- ✅ DIAG-01 through DIAG-04: All diagram types supported — v1.0
- ✅ ITER-01, ITER-02: Iterative refinement supported — v1.0
- ✅ EDIT-01, EDIT-02: Manual source editing with live preview — v1.0
- ✅ NAV-01, NAV-02: Zoom and pan controls — v1.0
- ✅ EDIT-03, EDIT-04: Undo and redo — v1.0
- ✅ SAVE-01, SAVE-02: SVG and PNG export — v1.0
- ✅ SAVE-03, SAVE-04: Session save and load — v1.0
- ✅ MEMO-01, MEMO-02, MEMO-03: Semantic memory system — v1.0
- ✅ UI-01, UI-02, UI-03: Modern SaaS aesthetic, local browser setup, loading states — v1.0

### Active

(Next milestone to be defined)

### Out of Scope

- Real-time multi-user collaboration — Contradicts local-first principle
- Cloud deployment — Local POC first
- Mobile app — Web-only for v1
- Voice input — Text-only for v1

## Context

**Current State (v1.0):**
- **Tech Stack:** React 18.x + Vite 6.x + TypeScript 5.x + Tailwind CSS
- **Diagram Engine:** Mermaid.js (client-side rendering)
- **AI:** Ollama with streaming support
- **Storage:** Dexie.js (IndexedDB)
- **State Management:** Zustand
- **Lines of Code:** ~3,372 TypeScript/React

**Milestone v1.0 shipped:**
- 6 phases, 16 plans, 2 days (2026-02-14 to 2026-02-15)
- All 26 v1 requirements validated
- D2→Mermaid migration completed
- Session persistence and semantic memory implemented
- LLM tool calling enabled

## Constraints

- **Local Execution**: Everything runs locally — no external APIs
- **Browser-based**: Opens in web browser, no installation beyond setup
- **Modern Design**: Clean, modern SaaS aesthetic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mermaid over D2 | Client-side rendering, no CLI dependency | ✅ Phase 4 |
| Ollama for AI | Explicit local-first requirement | ✅ v1.0 |
| Dexie.js for storage | IndexedDB with TypeScript support | ✅ Phase 5 |
| Zustand for state | Simple, minimal boilerplate | ✅ v1.0 |

---

*Last updated: 2026-02-15 after v1.0 milestone*
