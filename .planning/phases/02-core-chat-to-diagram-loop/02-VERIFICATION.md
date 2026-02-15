---
phase: 02-core-chat-to-diagram-loop
verified: 2026-02-14T13:30:00Z
status: gaps_found
score: 1/6 must-haves verified
gaps:
  - truth: "User types a diagram request, system sends to Ollama, receives D2 syntax back"
    status: failed
    reason: "useChat calls renderD2() to generate SVG but does NOT return SVG to App.tsx for display in whiteboard"
    artifacts:
      - path: "src/hooks/useChat.ts"
        issue: "renderD2() called internally but SVG not returned or exposed to parent"
      - path: "src/App.tsx"
        issue: "SVG state managed independently, does not receive updates from ChatPanel/useChat"
    missing:
      - "SVG state must be lifted from App.tsx to shared location accessible by ChatPanel"
      - "Or useChat must return currentSvg that App.tsx can use"
      - "Or create context to share diagram state between components"
  - truth: "Diagram updates incrementally as AI streams its response"
    status: failed
    reason: "Streaming works in useChat but no connection to whiteboard display"
    artifacts:
      - path: "src/hooks/useChat.ts"
        issue: "isDiagramUpdating and partialD2 exposed but not used by any component"
      - path: "src/components/ChatPanel.tsx"
        issue: "Does not consume isDiagramUpdating or partialD2 from useChat"
    missing:
      - "ChatPanel must receive SVG updates and pass to whiteboard"
  - truth: "User can request sequence, ERD, flowchart, or architecture diagrams"
    status: verified
    reason: "SYSTEM_PROMPT in useChat lists all four diagram types"
  - truth: "User can say 'add a user node' and AI modifies existing diagram"
    status: verified
    reason: "currentD2 included in system prompt for iterative refinement"
  - truth: "When Ollama is unavailable, user sees clear error message"
    status: verified
    reason: "formatError in ollama.ts + error banner in ChatPanel.tsx"
  - truth: "User sees loading indicator while AI is generating response"
    status: verified
    reason: "isGenerating displayed in ChatPanel with animated dots"
---

# Phase 2: Core Chat-to-Diagram Loop Verification Report

**Phase Goal:** Users can create and iterate on diagrams through conversation with AI.
**Verified:** 2026-02-14T13:30:00Z
**Status:** gaps_found
**Score:** 1/6 must-haves verified

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AI Generates Diagrams | ✗ FAILED | useChat calls renderD2() but SVG not connected to whiteboard |
| 2 | Real-Time Updates | ✗ FAILED | Streaming works but no path to whiteboard display |
| 3 | Handles All Diagram Types | ✓ VERIFIED | SYSTEM_PROMPT lists sequence, ERD, flowchart, architecture |
| 4 | Iterative Refinement Works | ✓ VERIFIED | currentD2 passed in system prompt for modifications |
| 5 | Error Handling Works | ✓ VERIFIED | formatError + error banner in UI |
| 6 | Loading Feedback | ✓ VERIFIED | isGenerating with animated dots shown |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/chat.ts` | Chat type definitions | ✓ VERIFIED | 59 lines, proper interfaces |
| `src/lib/ollama.ts` | Ollama client with streaming | ✓ VERIFIED | 179 lines, full streaming implementation |
| `src/hooks/useChat.ts` | Chat state management | ✓ VERIFIED | 240 lines, streaming + iterative prompts |
| `src/components/ChatPanel.tsx` | Chat UI | ✓ VERIFIED | 176 lines, connected to useChat |
| `src/lib/d2.ts` | D2 rendering | ✓ VERIFIED | 56 lines, API client |
| `src/components/WhiteboardPanel.tsx` | Diagram display | ✓ VERIFIED | 103 lines, SVG rendering |
| `server/index.js` | D2 backend | ✓ VERIFIED | 61 lines, D2 CLI execution |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| ChatPanel | useChat | import | ✓ WIRED | useChat imported and used |
| useChat | Ollama | streamChat | ✓ WIRED | API calls working |
| useChat | renderD2 | import | ⚠️ PARTIAL | Called internally but output not connected |
| App.tsx | WhiteboardPanel | props | ✓ WIRED | SVG passed to whiteboard |
| useChat → App | WhiteboardPanel | NONE | ✗ NOT_WIRED | **CRITICAL GAP** |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/lib/ollama.ts | 9 | DEFAULT_MODEL = 'gpt-oss:20b' | ⚠️ WARNING | PLAN specified 'llama3.2', actual model differs |

### Root Cause Analysis

**The critical gap:** There is no state sharing between ChatPanel (which uses useChat to generate diagrams) and App.tsx (which manages the whiteboard SVG display).

**Flow breakdown:**
1. ChatPanel → useChat.sendMessage() ✓
2. useChat → Ollama API (streaming) ✓
3. useChat → renderD2(d2Code) ✓ (generates SVG)
4. **MISSING:** useChat → App.tsx (SVG not returned)
5. App.tsx → WhiteboardPanel (shows demo SVG only)

The useChat hook returns `currentD2` (the D2 source string) but NOT the rendered SVG. Even if it did, App.tsx doesn't consume it because ChatPanel is used as a child component without passing data back up.

**Additional issues:**
- `isDiagramUpdating` and `partialD2` are exposed from useChat but never used
- No context or state lift to connect diagram generation to display

### Gaps Summary

**BLOCKER (prevents goal achievement):**
1. SVG generated but not displayed - no path from useChat to whiteboard
   - Fix: Either return currentSvg from useChat, or lift diagram state to App/Layout level with context

**WARNING (incomplete but not blocking):**
2. Model mismatch: uses 'gpt-oss:20b' instead of 'llama3.2' from PLAN
   - Fix: Update DEFAULT_MODEL in ollama.ts

### Recommended Fix

To achieve the phase goal, one of these patterns must be implemented:

**Option A: Return SVG from useChat**
```typescript
// useChat returns { ..., currentSvg }
return { messages, currentD2, currentSvg, isGenerating, error, sendMessage, ... }
```

**Option B: Create Diagram Context**
```typescript
// Create diagram-context.ts with useDiagram hook
// Share svg, currentD2, isDiagramUpdating between App and ChatPanel
```

**Option C: Pass state through Layout**
```typescript
// Layout manages diagram state
// Both panels consume/update via props or context
```

---

_Verified: 2026-02-14T13:30:00Z_
_Verifier: Claude (gsd-verifier)_
