---
phase: 02-core-chat-to-diagram-loop
plan: '03'
subsystem: ai-integration
tags: [streaming, ollama, d2, real-time, react-hooks]

# Dependency graph
requires:
  - phase: 02-01
    provides: Ollama client with streaming support and extractD2Code
  - phase: 02-02
    provides: useChat hook foundation with message state and sendMessage
provides:
  - Streaming D2 extraction and rendering during AI response generation
  - Debounced partial diagram updates (500ms)
  - Graceful fallback when partial D2 rendering fails
affects: [02-04 (iterative refinement)]

# Tech tracking
tech-stack:
  added: []
  patterns: [streaming-chunk-handler, debounced-rendering, refs-for-stale-closure]

key-files:
  created: []
  modified:
    - src/hooks/useChat.ts

key-decisions:
  - "Used useRef for streaming content to avoid stale closure issues in async callbacks"
  - "500ms debounce balance between responsiveness and performance"

patterns-established:
  - "Streaming content accumulation with refs"
  - "Partial D2 error handling preserves previous valid diagram"

# Metrics
duration: 4 min
completed: 2026-02-14
---

# Phase 2 Plan 3: Streaming D2 Extraction Summary

**Real-time diagram updates as AI streams response, with debouncing and graceful error handling**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-14T12:51:43Z
- **Completed:** 2026-02-14T12:55:22Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Implemented real-time D2 extraction during AI streaming response
- Added debouncing (500ms) to prevent excessive re-renders
- Graceful error handling: if partial D2 fails to render, previous valid diagram is preserved
- Exposed `isDiagramUpdating`, `streamingContent`, and `partialD2` state for UI indicators

## Task Commits

1. **Task 1: Add streaming D2 extraction to useChat** - `ce7e383` (feat)

**Plan metadata:** (to be committed after SUMMARY)

## Files Created/Modified

- `src/hooks/useChat.ts` - Added streaming state, onChunk handler, debounced rendering

## Decisions Made

- Used `useRef` for streaming content accumulation to avoid stale closures in async callbacks
- 500ms debounce interval chosen as balance between responsiveness and performance
- Partial D2 errors are logged but don't crash - previous valid diagram remains visible

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Initial implementation had stale closure bug where accumulated content wasn't accessible in onChunk callback
- Fixed by using `useRef` (streamingContentRef) to store accumulated content instead of relying on state closure
- TypeScript initially complained about unused state variables - resolved by exposing them in return object

## Next Phase Readiness

Plan 02-03 complete. Ready for 02-04 (iterative refinement) which will build on the streaming infrastructure to enable users to modify diagrams through conversation.

---
*Phase: 02-core-chat-to-diagram-loop*
*Completed: 2026-02-14*
