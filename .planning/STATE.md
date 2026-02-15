# State: Instant Coffee

**Project:** Instant Coffee  
**Core Value:** Users can instantly create accurate diagrams by describing what they want in natural language, without learning diagram syntax.  
**Current Phase:** 04-switch-from-d2-to-mermaid  
**Current Plan:** 04-02 (Complete)

---

## Current Position

| Attribute | Value |
| -------- | ------- |
| **Phase** | 04-switch-from-d2-to-mermaid |
| **Plan** | 04-02 (Complete) |
| **Status** | Complete |
| **Progress Bar** | [==========] 100% (2 of 2 plans complete) |

---

## Project Context

### Core Value Proposition
Users can create accurate Mermaid diagrams by describing what they want in natural language—no diagram syntax knowledge required. Combines local AI (Ollama) with client-side Mermaid rendering for privacy-first diagramming.

### Technical Stack (Researched)
- **Frontend:** React 18.x/19.x + Vite 6.x + TypeScript 5.x
- **Backend:** None (client-side rendering with Mermaid)
- **Diagram Engine:** Mermaid.js (client-side)
- **AI:** Ollama 0.16.x + ollama-js with streaming
- **Storage:** Dexie.js 4.x (IndexedDB)
- **State:** Zustand
- **Styling:** Tailwind CSS + Framer Motion

### Key Risks Identified
1. **LLM output validation** — AI-generated Mermaid may be invalid; need validation pipeline
2. **Blocking UI** — Local LLMs take 5-30s; must use streaming
3. **Conversation context** — Each message must include history + current Mermaid source
4. **Onboarding friction** — Requires Ollama installed locally (Mermaid is bundled)

---

## Phase Breakdown

### Phase 1: Foundation & Rendering Pipeline
- **Goal:** Users can view app and see D2 diagrams rendered
- **Requirements:** CORE-01, CORE-03, UI-01, UI-02 (4)
- **Success Criteria:** 4 observable behaviors
- **Plans:** 01-01 (done), 01-02 (done), 01-03 (done) ✓ COMPLETE

### Phase 2: Core Chat-to-Diagram Loop

- **Goal:** Users can create diagrams through conversation
- **Requirements:** CORE-02, CORE-04, CORE-05, DIAG-01 through DIAG-04, ITER-01, ITER-02, UI-03 (10)
- **Success Criteria:** 6 observable behaviors
- **Plans:** 02-01 (done) ✓, 02-02 (done) ✓, 02-03 (done) ✓, 02-04 (done) ✓ COMPLETE

### Phase 3: Editing & Polish
- **Goal:** Users can manually edit and export diagrams
- **Requirements:** EDIT-01, EDIT-02, NAV-01, NAV-02, EDIT-03, EDIT-04, SAVE-01, SAVE-02 (8)
- **Success Criteria:** 8 observable behaviors
- **Plans:** 03-01 (done) ✓, 03-02 (done) ✓, 03-03 (done) ✓ COMPLETE

### Phase 4: Switch from D2 to Mermaid
- **Goal:** Replace D2 CLI with Mermaid.js for client-side rendering
- **Requirements:** N/A (infrastructure)
- **Success Criteria:** Client-side rendering, no Express backend, no D2 CLI dependency
- **Plans:** 04-01 (done) ✓, 04-02 (done) ✓ COMPLETE

### Phase 5: Persistence & Semantic Memory
- **Goal:** Users can save work and teach system about infrastructure
- **Requirements:** SAVE-03, SAVE-04, MEMO-01, MEMO-02, MEMO-03 (5)
- **Success Criteria:** 5 observable behaviors

---

## Accumulated Context

### Decisions Made
- **4-phase structure** derived from 26 v1 requirements (depth: quick)
- **Phase ordering:** Foundation → AI → Editing → Mermaid → Persistence
- **Dependencies respected:** Each phase builds on previous
- **Phase 1-01:** Vite 6.x + React 18.x + Express 4.x + Tailwind CSS
- **Phase 1-02:** Indigo accent color, md breakpoint for responsive layout
- **Phase 2-01:** Ollama client with native fetch/ReadableStream (no external deps), llama3.2 model default
- **Phase 2-03:** Streaming with 500ms debounce, refs for stale closure avoidance
- **Phase 2-04:** Enhanced system prompt with explicit iterative refinement instructions
- **Phase 3-01:** Source editor modal with split-view layout, 300ms debounced live preview
- **Phase 3-02:** Zoom/pan with CSS transform, 10% zoom steps, history with redo truncation
- **Phase 3-03:** Export dropdown with SVG/PNG download using Blob pattern
- **Phase 4:** Migrated from D2 to Mermaid for client-side rendering
- **Phase 4:** Removed Express backend entirely
- **Phase 4:** Updated system prompt to generate Mermaid instead of D2

### Roadmap Evolution
- Phase 5 added: Switch from D2 to Mermaid
- Phases 4 & 5 swapped: Mermaid switch moved to Phase 4, Persistence moved to Phase 5

### Research Flags (for planning phases)
- **Phase 2:** Prompt engineering for Mermaid generation needs iteration
- **Phase 5 (deferred):** Custom shapes, layout engines need research

### Todos
- [x] Plan Phase 1 (Foundation & Rendering Pipeline)
- [x] Execute 01-01-PLAN.md
- [x] Execute 01-02-PLAN.md (Chat panel and layout)
- [x] Execute 01-03-PLAN.md (D2 rendering pipeline)
- [x] Execute 02-01-PLAN.md (Ollama client and types)
- [x] Execute 02-02-PLAN.md (useChat hook)
- [x] Execute 02-03-PLAN.md (Streaming updates)
- [x] Execute 02-04-PLAN.md (Iterative refinement)
- [x] Plan Phase 3 (Editing & Polish)
- [x] Execute 03-01-PLAN.md (Source Editor Modal)
- [x] Execute 03-02-PLAN.md (Zoom/Pan Navigation + Undo/Redo)
- [x] Execute 03-03-PLAN.md (SVG/PNG Export)
- [x] Plan Phase 4 (Switch from D2 to Mermaid)
- [x] Execute 04-01-PLAN.md (Core rendering swap)
- [x] Execute 04-02-PLAN.md (UI updates, backend removal, config cleanup)
- [ ] Plan Phase 5 (Persistence & Semantic Memory)
- [ ] Execute Phase 5

### Blockers
- None - Mermaid provides client-side rendering without external dependencies

---

## Session Continuity

**Last Updated:** 2026-02-15  
**Phase Status:** Phase 4 complete (2 of 2 plans executed)  
**Next Step:** Plan Phase 5 (Persistence & Semantic Memory)

---

*State maintained for project continuity*
