# State: Instant Coffee

**Project:** Instant Coffee  
**Core Value:** Users can instantly create accurate diagrams by describing what they want in natural language, without learning D2 syntax.  
**Current Phase:** Planning (Roadmap created)

---

## Current Position

| Attribute | Value |
|-----------|-------|
| **Phase** | Roadmap Complete |
| **Plan** | Ready for Phase 1 planning |
| **Status** | Awaiting user approval |
| **Progress Bar** | [====........] 0% (0 of 4 phases complete) |

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

### Research Flags (for planning phases)
- **Phase 2:** Prompt engineering for D2 generation needs iteration
- **Phase 5 (deferred):** Custom shapes, layout engines need D2-specific research

### Todos
- [ ] User approves roadmap
- [ ] Plan Phase 1 (Foundation & Rendering Pipeline)
- [ ] Execute Phase 1
- [ ] Plan Phase 2
- [ ] Execute Phase 2
- [ ] Plan Phase 3
- [ ] Execute Phase 3
- [ ] Plan Phase 4
- [ ] Execute Phase 4

### Blockers
None yet identified.

---

## Session Continuity

**Last Updated:** 2026-02-14  
**Roadmap Status:** Complete, awaiting approval  
**Next Step:** `/gsd-plan-phase 1` after user approval

---

*State maintained for project continuity*
