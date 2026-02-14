# Roadmap: Instant Coffee

**Project:** Instant Coffee  
**Core Value:** Users can instantly create accurate diagrams by describing what they want in natural language, without learning D2 syntax.  
**Phase Count:** 4  
**Depth:** Quick (3-5 phases)  
**Coverage:** 26/26 v1 requirements mapped ✓

---

## Overview

This roadmap delivers a local-first conversational diagram generator using D2 and Ollama. The project progresses through four phases: foundation/rendering, AI integration, editing capabilities, and persistence.

**Dependencies:**
- Phase 1 → Phase 2 (rendering required before AI can generate diagrams)
- Phase 2 → Phase 3 (need diagrams to edit and export)
- Phase 3 → Phase 4 (need diagrams to save and enhance with memory)

---

## Phase 1: Foundation & Rendering Pipeline

**Goal:** Users can view the application and see diagrams rendered from D2 source.

### Requirements Mapped
- CORE-01: User can type natural language in chat to request diagrams
- CORE-03: System renders D2 as SVG in the whiteboard area
- UI-01: Interface matches modern SaaS product aesthetic
- UI-02: App runs in browser after simple local setup

### Success Criteria

1. **Chat Input Works:** User can type text in the chat input field and submit messages
2. **Diagram Renders:** When valid D2 source is provided, it renders as an SVG in the whiteboard area
3. **UI Displays Correctly:** Application loads in browser with modern SaaS aesthetic (clean layout, proper typography, responsive)
4. **Local Setup Works:** User can follow simple instructions to set up local environment and open app in browser

**Status:** ✓ Complete (2026-02-14)

**Plans:**
- [x] 01-01-PLAN.md — Project setup (Vite + Express + Tailwind)
- [x] 01-02-PLAN.md — Chat panel and layout
- [x] 01-03-PLAN.md — D2 rendering pipeline

---

## Phase 2: Core Chat-to-Diagram Loop

**Goal:** Users can create and iterate on diagrams through conversation with AI.

### Requirements Mapped
- CORE-02: System sends chat to Ollama and receives D2 syntax response
- CORE-04: Diagram updates in real-time as AI generates response
- CORE-05: System handles Ollama unavailability gracefully with clear error message
- DIAG-01: User can generate sequence diagrams via chat
- DIAG-02: User can generate ERD (entity-relationship) diagrams via chat
- DIAG-03: User can generate flowchart diagrams via chat
- DIAG-04: User can generate architecture diagrams via chat
- ITER-01: User can request iterative changes ("make it bigger", "add a node")
- ITER-02: System maintains conversation context for iterative refinement
- UI-03: Loading states shown during AI generation

### Success Criteria

1. **AI Generates Diagrams:** User types a diagram request, system sends to Ollama, receives D2 syntax back
2. **Real-Time Updates:** Diagram updates incrementally as AI streams its response (not blocking until complete)
3. **Handles All Diagram Types:** User can request sequence, ERD, flowchart, or architecture diagrams and receive valid D2
4. **Iterative Refinement Works:** User can say "add a user node" and AI modifies existing diagram, not starting fresh
5. **Error Handling Works:** When Ollama is unavailable, user sees clear error message with setup instructions
6. **Loading Feedback:** User sees loading indicator while AI is generating response

**Plans:**
- [ ] 02-01-PLAN.md — Ollama client and types
- [ ] 02-02-PLAN.md — useChat hook and ChatPanel integration
- [ ] 02-03-PLAN.md — Real-time streaming diagram updates
- [ ] 02-04-PLAN.md — Iterative refinement support

---

## Phase 3: Editing & Polish

**Goal:** Users can manually edit diagrams and export them for external use.

### Requirements Mapped
- EDIT-01: User can view and manually edit generated D2 source
- EDIT-02: Manual edits re-render immediately in whiteboard
- NAV-01: User can zoom in/out on diagram
- NAV-02: User can pan across diagram
- EDIT-03: User can undo last diagram change
- EDIT-04: User can redo undone diagram change
- SAVE-01: User can export diagram as SVG file
- SAVE-02: User can export diagram as PNG file

### Success Criteria

1. **Source Visible:** User can see the D2 source code for the current diagram
2. **Manual Edits Work:** User can edit D2 source directly and diagram re-renders immediately
3. **Zoom Works:** User can zoom in and out on the diagram using controls or gestures
4. **Pan Works:** User can click and drag to pan across the diagram canvas
5. **Undo Works:** User can undo the last diagram change (both AI and manual)
6. **Redo Works:** User can redo a previously undone change
7. **SVG Export Works:** User can download current diagram as SVG file
8. **PNG Export Works:** User can download current diagram as PNG file

---

## Phase 4: Persistence & Semantic Memory

**Goal:** Users can save their work and teach the system about their infrastructure.

### Requirements Mapped
- SAVE-03: User can save current session state to resume later
- SAVE-04: User can load previously saved session
- MEMO-01: User can tell system about service names, descriptions, team ownership
- MEMO-02: System persists semantic memory across sessions
- MEMO-03: System uses semantic memory context when generating diagrams

### Success Criteria

1. **Save Session:** User can save current work (conversations, diagrams) to local storage
2. **Load Session:** User can load a previously saved session and continue working
3. **Add Memory:** User can tell the system about services, teams, or infrastructure details
4. **Memory Persists:** Semantic memory survives browser sessions (stored in IndexedDB)
5. **Memory Used:** When generating diagrams, system includes relevant memory context in prompts

---

## Progress Table

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Foundation & Rendering Pipeline | 4 | ✓ Complete |
| 2 | Core Chat-to-Diagram Loop | 10 | Pending |
| 3 | Editing & Polish | 8 | Pending |
| 4 | Persistence & Semantic Memory | 4 | Pending |

---

## Coverage Verification

| Category | Requirements | Phase |
|----------|--------------|-------|
| Core Experience | CORE-01, CORE-02, CORE-03, CORE-04, CORE-05 | 1, 2 |
| Diagram Types | DIAG-01, DIAG-02, DIAG-03, DIAG-04 | 2 |
| Iteration & Editing | ITER-01, ITER-02, EDIT-01, EDIT-02 | 2, 3 |
| Navigation & Controls | NAV-01, NAV-02, EDIT-03, EDIT-04 | 3 |
| Export & Save | SAVE-01, SAVE-02, SAVE-03, SAVE-04 | 3, 4 |
| Semantic Memory | MEMO-01, MEMO-02, MEMO-03 | 4 |
| UI/UX | UI-01, UI-02, UI-03 | 1, 2 |

**Total:** 26/26 requirements mapped ✓

---

*Roadmap created: 2026-02-14*
