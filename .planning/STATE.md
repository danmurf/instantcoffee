# State: Instant Coffee

**Project:** Instant Coffee  
**Core Value:** Users can instantly create accurate diagrams by describing what they want in natural language, without learning D2 syntax.  
**Current Phase:** 01-foundation-rendering  
**Current Plan:** 01-03 (Complete)

---

## Current Position

| Attribute | Value |
|-----------|-------|
| **Phase** | 01-foundation-rendering |
| **Plan** | 01-03 (Complete)
| **Status** | In progress |
| **Progress Bar** | [======....] 25% (1 of 4 phases complete) |

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

### Phase 2: Core Chat-to-Diagram Loop
- **Goal:** Users can create diagrams through conversation
- **Requirements:** CORE-02, CORE-04, CORE-05, DIAG-01 through DIAG-04, ITER-01, ITER-02, UI-03 (10)
- **Success Criteria:** 6 observable behaviors

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

### Research Flags (for planning phases)
- **Phase 2:** Prompt engineering for D2 generation needs iteration
- **Phase 5 (deferred):** Custom shapes, layout engines need D2-specific research

### Todos
- [x] Plan Phase 1 (Foundation & Rendering Pipeline)
- [x] Execute 01-01-PLAN.md
- [x] Execute 01-02-PLAN.md (Chat panel and layout)
- [x] Execute 01-03-PLAN.md (D2 rendering pipeline)
- [ ] Plan Phase 2
- [ ] Execute Phase 2
- [ ] Plan Phase 3
- [ ] Execute Phase 3
- [ ] Plan Phase 4
- [ ] Execute Phase 4

### Blockers
- **D2 CLI:** Not installed on system. User needs to install separately from https://d2lang.com/tour/install

---

## Session Continuity

**Last Updated:** 2026-02-14  
**Phase Status:** Phase 1 complete  
**Next Step:** Plan Phase 2 (Core Chat-to-Diagram Loop)

---

*State maintained for project continuity*
