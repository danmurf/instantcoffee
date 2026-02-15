---
phase: 04-switch-from-d2-to-mermaid
plan: '01'
subsystem: rendering
tags: [mermaid, client-side, rendering, ollama]

# Dependency graph
requires:
  - phase: 03-editing-and-polish
    provides: Working chat-to-diagram pipeline with D2 rendering
provides:
  - Client-side Mermaid rendering library
  - Mermaid code extraction from LLM responses
  - Updated useChat hook wired to Mermaid
affects: [rendering, ai, chat]

# Tech tracking
tech-stack:
  added: [mermaid]
  removed: [d2]
  patterns: [client-side-rendering]

key-files:
  created:
    - src/lib/mermaid.ts
  modified:
    - src/lib/ollama.ts - Added extractMermaidCode function
    - src/hooks/useChat.ts - Updated for Mermaid pipeline
    - src/types/chat.ts - Renamed d2Source to mermaidSource

key-decisions:
  - "Mermaid selected over D2 for client-side rendering (no CLI dependency)"
  - "Kept d2.ts until Plan 04-02 for cleanup"

patterns-established:
  - "Client-side rendering: mermaid.render() with unique ID per render"

# Metrics
duration: ~15min
completed: 2026-02-15
---

# Phase 04 Plan 1: Switch from D2 to Mermaid Summary

**Replace D2 CLI rendering pipeline with client-side Mermaid.js rendering. Update Ollama integration to extract Mermaid code blocks and update system prompt to generate Mermaid syntax.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-15
- **Completed:** 2026-02-15
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 4

## Accomplishments

### Task 1: Create Mermaid rendering library and update code extraction
- Installed `mermaid` npm package
- Created `src/lib/mermaid.ts` with:
  - `initMermaid()` function for one-time initialization
  - `renderMermaid(mermaidSource)` function using `mermaid.render()` API with unique ID generation
  - Try/catch error handling with descriptive messages
- Updated `src/lib/ollama.ts`:
  - Renamed `extractD2Code` to `extractMermaidCode`
  - Changed regex from `/```d2\n([\s\S]*?)```/` to `/```mermaid\s*\n([\s\S]*?)```/`
  - Removed D2-specific fallback heuristic
  - Updated return type to use `mermaidCode` field

### Task 2: Update useChat hook for Mermaid pipeline
- Updated imports: changed from `renderD2` to `renderMermaid`, `extractD2Code` to `extractMermaidCode`
- Rewrote `SYSTEM_PROMPT` constant for Mermaid syntax with:
  - Proper diagram type documentation (flowchart, sequenceDiagram, erDiagram, graph)
  - Iterative refinement instructions
  - Mermaid syntax rules and formatting requirements
- Renamed state variables: `currentD2` → `currentMermaid`, `_partialD2` → `_partialMermaid`
- Updated `toOllamaMessages` to use `currentMermaid` and inject mermaid code blocks
- Updated streaming callbacks: `extractMermaidCode`, `renderMermaid()`, state setters
- Updated `onComplete` callback similarly
- Updated return object with mermaid naming
- Renamed `d2Source` to `mermaidSource` in `src/types/chat.ts`

## Commits

1. **9e8c67d** - Migrate from D2 to Mermaid for client-side rendering
2. **4fb6917** - Validate Mermaid source before rendering

## Files Created

- `src/lib/mermaid.ts` - Client-side Mermaid rendering library

## Files Modified

- `src/lib/ollama.ts` - Added `extractMermaidCode` function
- `src/hooks/useChat.ts` - Updated for Mermaid pipeline
- `src/types/chat.ts` - Renamed `d2Source` to `mermaidSource`

## Decisions Made

- Mermaid selected over D2 for client-side rendering (no CLI dependency)
- Kept `src/lib/d2.ts` until Plan 04-02 for cleanup
- Removed D2-specific fallback heuristic from code extraction (Mermaid syntax is different enough)

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None - all tasks completed without issues.

## Next Steps

Plan 04-02 handles remaining cleanup:
- Update UI components (App.tsx, SourceEditorModal.tsx)
- Remove Express backend
- Delete old D2 files
- Update configuration and documentation

---

*Phase: 04-switch-from-d2-to-mermaid*
*Plan: 01*
*Completed: 2026-02-15*
