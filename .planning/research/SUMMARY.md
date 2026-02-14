# Project Research Summary

**Project:** Instant Coffee
**Domain:** Local-first conversational diagram generator (D2 + Ollama)
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## Executive Summary

Instant Coffee is a local-first diagramming tool that lets users create diagrams through conversation. The user types natural language ("show me a user authentication flow"), an Ollama-powered local LLM generates D2 syntax, and the app renders the diagram in the browser. This combines the privacy benefits of local AI with D2's flexible diagramming capabilities.

The recommended approach uses React + Vite for the frontend, a thin Express backend to wrap the D2 CLI (since D2 has no browser runtime), and Ollama for local AI inference. The architecture requires careful attention to streaming responses (local LLMs take 5-30s), prompt engineering (the LLM must output valid D2 syntax), and error handling (AI-generated code frequently fails validation).

**Key risks:** LLM output validation is the critical bottleneck—if the AI generates invalid D2, the core value proposition breaks. The architecture also requires both Ollama and D2 CLI to be installed locally, which creates onboarding friction. Mitigate by implementing robust validation pipelines, graceful degradation when services are unavailable, and clear setup instructions.

## Key Findings

### Recommended Stack

React 18.x/19.x + Vite 6.x + TypeScript 5.x forms the foundation. D2 CLI 0.7.x runs server-side (no browser runtime exists), wrapped by a thin Express backend. Ollama 0.16.x with ollama-js provides local AI via llama3.2 or qwen2.5 models. Dexie.js 4.x handles IndexedDB for local persistence. Zustand manages state. Tailwind CSS + Framer Motion provide styling and animations.

**Core technologies:**
- **React + Vite:** Standard modern frontend—fast HMR, excellent TypeScript support
- **D2 CLI (server-side):** Go-based diagramming language, exports SVG/PNG—requires thin backend wrapper since no WASM/browser version exists
- **Ollama + ollama-js:** Local LLM runtime at localhost:11434, streaming support essential for UX
- **Dexie.js:** IndexedDB wrapper—enables local-first persistence without cloud dependencies
- **Zustand:** Lightweight state management—simpler than Redux, sufficient for diagram state

### Expected Features

**Must have (table stakes):**
- Conversational input — type natural language, receive diagram
- Diagram rendering — D2 renders in browser as SVG
- Real-time preview — immediate feedback on AI generation
- Basic diagram types — flowchart, sequence, ERD via D2
- Local Ollama integration — privacy-first, no cloud dependency
- Zoom/pan — navigate large diagrams
- Undo/redo — editing safety net
- Export (PNG/SVG) — share diagrams externally

**Should have (competitive):**
- Iterative refinement — "make it bigger" style edits via chat
- D2 source visibility — show underlying code, users learn incrementally
- Multi-diagram support — organize work into projects
- Diagram history/versioning — rollback capability
- Template library — quick-start patterns

**Defer (v2+):**
- Team/workspace features
- Plugin/extension system
- Real-time collaborative editing
- Cloud sync (contradicts local-first principle)

### Architecture Approach

The system has three layers: UI (React components), State (Zustand stores), and Services (Ollama, D2 backend, IndexedDB). A thin Express backend proxies D2 CLI calls since D2 cannot run in the browser. Ollama can be called directly from the browser (CORS enabled by default) or proxied through backend.

Major components: ChatPanel handles message input and streaming display; DiagramView renders SVG output; D2SourcePanel shows generated code for manual editing; Zustand stores (chatStore, diagramStore, sessionStore) manage state; Service layer wraps external APIs.

**Data flow:** User message → chatStore → ollamaService (streaming) → extract D2 code block → diagramStore → d2Service (backend) → D2 CLI renders SVG → diagramStore updates → DiagramView renders.

### Critical Pitfalls

1. **Trusting AI-generated D2 without validation** — LLMs hallucinate D2 syntax. Implement validation pipeline between AI output and rendering. Parse for syntax correctness before CLI execution.

2. **Blocking UI during AI generation** — Local LLMs take 5-30s. Use streaming responses. Show loading indicators. Never block the main thread.

3. **No conversation context** — Each message must include history and current D2 source. Without context, "add a node for database" fails.

4. **Storing SVG instead of D2 source** — Always store D2 source as primary artifact. Re-render SVG on load. SVG is a cache, not source of truth.

5. **No graceful degradation when Ollama unavailable** — Check availability on load. Provide clear setup instructions. Show status indicators.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Rendering Pipeline
**Rationale:** Must verify D2 CLI integration works before building anything else. This is the riskiest unknown—if D2 doesn't render smoothly, the project cannot proceed.
**Delivers:** Thin Express backend wrapping D2 CLI, React shell with chat panel + diagram view areas, Zustand stores skeleton
**Addresses:** Table stakes features (rendering, real-time preview)
**Avoids:** Pitfall 1 (validate D2), Pitfall 4 (store source not SVG)
**Research flag:** Standard patterns—D2 CLI well-documented

### Phase 2: Core Chat-to-Diagram Loop
**Rationale:** Once rendering works, connect Ollama to generate D2 from natural language. This is the core value proposition.
**Delivers:** Ollama integration with streaming, D2 code extraction from LLM responses, conversation context management, error handling for bad D2 output
**Addresses:** Conversational input, iterative refinement, basic diagram types
**Avoids:** Pitfall 2 (streaming UI), Pitfall 3 (context), Pitfall 5 (error messages), Pitfall 8 (graceful degradation)
**Research flag:** Needs research on prompt engineering strategies for D2 generation

### Phase 3: Editing & Polish
**Rationale:** Users need to fix AI mistakes and export diagrams
**Delivers:** D2 source editor panel, manual edit + re-render, PNG/SVG export, zoom/pan, undo/redo
**Addresses:** Edit generated diagram, export, zoom/pan, undo/redo
**Avoids:** Pitfall 6 (manual editing escape hatch)
**Research flag:** Standard UI patterns

### Phase 4: Persistence & Organization
**Rationale:** Core loop works; now add multi-diagram support and local storage
**Delivers:** IndexedDB persistence via Dexie, session save/load, multi-diagram projects/tabs, diagram history/versioning
**Addresses:** Multi-diagram support, diagram history
**Avoids:** Pitfall 10 (version control)
**Research flag:** Standard local-first patterns

### Phase 5: Advanced Features
**Rationale:** Product-market fit established; expand capabilities
**Delivers:** Template library, custom shapes/icons, layout engine selection
**Addresses:** Template library, custom shapes
**Avoids:** Pitfall 11 (fixed layout)
**Research flag:** Defer research until this phase

### Phase Ordering Rationale

- **D2 backend first** because it's the riskiest unknown—if D2 CLI integration doesn't work, nothing else matters
- **Ollama second** because it's well-documented and the API is stable; streaming patterns are well-known
- **Persistence last** because in-memory state works fine for validation; persistence is polish
- **Anti-features explicitly deferred** to avoid scope creep—collaboration, cloud sync, plugins all add massive complexity

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Core Loop):** Prompt engineering for D2 generation—limited research on best practices, will need iteration
- **Phase 5 (Advanced):** Custom shapes, layout engine options—D2-specific research

Phases with standard patterns (skip research-phase):
- **Phase 1:** D2 CLI well-documented
- **Phase 3:** Standard React editor and export patterns
- **Phase 4:** IndexedDB/local-first patterns well-established

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | React/Vite/D2/Ollama all well-documented with official sources |
| Features | MEDIUM | Some inference from competitor analysis; limited research on "conversational diagram" specific features |
| Architecture | MEDIUM-HIGH | Clear component boundaries; backend requirement from D2's Go-only implementation is definitive |
| Pitfalls | HIGH | LLM code generation challenges well-documented; local-first patterns established |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Prompt engineering quality:** Limited public research on optimal prompts for D2 generation. Will need empirical testing with chosen model. Handle via: iterate on prompts during Phase 2, test diverse diagram types.

- **Model capability boundaries:** Not all models handle D2 syntax equally well. llama3.2 vs qwen2.5 performance on diagram generation untested. Handle via: benchmark both models during Phase 2 setup.

- **Onboarding experience:** Requirement for both Ollama and D2 CLI creates friction. Handle via: Phase 2 must include clear setup instructions and availability checks.

## Sources

### Primary (HIGH confidence)
- D2 Official (https://d2lang.com/) — v0.7.1, Go-based CLI, no browser runtime
- D2 GitHub (https://github.com/terrastruct/d2) — CLI interface, rendering API
- Ollama (https://ollama.com/) — v0.16.x, local LLM runtime
- Ollama JS (https://github.com/ollama/ollama-js) — v0.6.3, browser + Node support, streaming

### Secondary (MEDIUM confidence)
- D2 playground architecture — inferred from server-side rendering approach
- Competitor analysis: Mermaid.js, Eraser.io, ChatGPT diagram capabilities
- Local-first web patterns: https://localfirstweb.dev/, Dexie.js documentation

### Tertiary (LOW confidence)
- Prompt engineering for D2 — limited specific research; needs empirical validation
- Model comparison for diagram generation — not extensively documented

---

*Research completed: 2026-02-14*
*Ready for roadmap: yes*
