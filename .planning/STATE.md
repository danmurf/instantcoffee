# State: Instant Coffee

**Project:** Instant Coffee  
**Core Value:** Users can instantly create accurate diagrams by describing what they want in natural language, without learning D2 syntax.  
**Current Phase:** 02-core-chat-to-diagram-loop  
**Current Plan:** 02-02 (Complete)

---

## Current Position

| Attribute | Value |
|-----------|-------|
| **Phase** | 02-core-chat-to-diagram-loop |
| **Plan** | 02-02 (Complete) |
| **Status** | In Progress |
| **Progress Bar** | [==========] 50% (2 of 4 phases complete) |

---

## Project Context

### Core Value Proposition
Users can create accurate D2 diagrams by describing what they want in natural language—no D2 syntax knowledge required. Combines local AI (Ollama) with local rendering (D2 CLI) for privacy-first diagramming.

### Technical Stack (Researched)
- **Frontend:** React 18.x/19.x + Vite 6.x + TypeScript 5.x
- **Backend:** Thin Express wrapper for D2 CLI (no browser runtime)
- **AI:** Ollama 0.16.x + ollama-js with streaming
- **Storage:** Dexie.js 4.x (IndexedDB)
- **State:** Zustand
- **Styling:** Tailwind CSS + Framer Motion

### Key Risks Identified
1. **LLM output validation** — AI-generated D2 may be invalid; need validation pipeline
2. **Blocking UI** — Local LLMs take 5-30s; must use streaming
3. **Conversation context** — Each message must include history + current D2 source
4. **Onboarding friction** — Requires both Ollama and D2 CLI installed locally

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
- **Plans:** 02-01 (done) ✓, 02-02 (done) ✓, 02-03 (pending), 02-04 (pending)

### Phase 3: Editing & Polish
- **Goal:** Users can manually edit and export diagrams
- **Requirements:** EDIT-01, EDIT-02, NAV-01, NAV-02, EDIT-03, EDIT-04, SAVE-01, SAVE-02 (8)
- **Success Criteria:** 8 observable behaviors

### Phase 4: Persistence & Semantic Memory
- **Goal:** Users can save work and teach system about infrastructure
- **Requirements:** SAVE-03, SAVE-04, MEMO-01, MEMO-02, MEMO-03 (4)
- **Success Criteria:** 5 observable behaviors

---

## Accumulated Context

### Decisions Made
- **4-phase structure** derived from 26 v1 requirements (depth: quick)
- **Phase ordering:** Foundation → AI → Editing → Persistence
- **Dependencies respected:** Each phase builds on previous
- **Phase 1-01:** Vite 6.x + React 18.x + Express 4.x + Tailwind CSS
- **Phase 1-02:** Indigo accent color, md breakpoint for responsive layout
- **Phase 2-01:** Ollama client with native fetch/ReadableStream (no external deps), llama3.2 model default

### Research Flags (for planning phases)
- **Phase 2:** Prompt engineering for D2 generation needs iteration
- **Phase 5 (deferred):** Custom shapes, layout engines need D2-specific research

### Todos
- [x] Plan Phase 1 (Foundation & Rendering Pipeline)
- [x] Execute 01-01-PLAN.md
- [x] Execute 01-02-PLAN.md (Chat panel and layout)
- [x] Execute 01-03-PLAN.md (D2 rendering pipeline)
- [x] Execute 02-01-PLAN.md (Ollama client and types)
- [x] Execute 02-02-PLAN.md (useChat hook)
- [ ] Execute 02-03-PLAN.md (Streaming updates)
- [ ] Execute 02-04-PLAN.md (Iterative refinement)
- [ ] Plan Phase 3
- [ ] Execute Phase 3
- [ ] Plan Phase 4
- [ ] Execute Phase 4

### Blockers
- **D2 CLI:** Not installed on system. User needs to install separately from https://d2lang.com/tour/install

---

## Session Continuity

**Last Updated:** 2026-02-14  
**Phase Status:** Phase 2 in progress (plan 02-02 complete)  
**Next Step:** Execute 02-03-PLAN.md (Streaming updates)

---

*State maintained for project continuity*
