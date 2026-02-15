---
phase: 06-use-llm-tool-calling-for-diagram-updates
plan: '01'
subsystem: ai
tags: [ollama, tool-calling, mermaid, react-hooks]

# Dependency graph
requires:
  - phase: 04-switch-from-d2-to-mermaid
    provides: Mermaid rendering pipeline, chat state management
provides:
  - LLM tool calling capability via Ollama
  - update_diagram tool for intelligent diagram updates
  - Fallback to text extraction for models without tool support
affects: [ai, chat, diagram-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns: [tool-calling, function-calling-api]

key-files:
  created: []
  modified:
    - src/types/chat.ts - Tool type definitions
    - src/lib/ollama.ts - streamChatWithTools function
    - src/hooks/useChat.ts - Tool call handling in chat flow

key-decisions:
  - "Added 'tool' role to MessageRole for tool message support"
  - "Kept backward compatibility with text extraction fallback"

patterns-established:
  - "Tool calling pattern: define tool schema → send with request → handle tool_calls → send result back → continue"

# Metrics
duration: 5min
completed: 2026-02-15
---

# Phase 6 Plan 1: LLM Tool Calling for Diagram Updates Summary

**Tool-enabled chat flow where LLM can decide when to update diagrams via update_diagram tool, with fallback to text extraction for unsupported models**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-15T12:58:59Z
- **Completed:** 2026-02-15T13:03:58Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Tool types defined in chat.ts (OllamaTool, ToolCall, ToolFunction)
- streamChatWithTools function implemented in ollama.ts
- useChat hook updated to handle tool calls with diagramTool
- System prompt updated with tool usage instructions
- Backward compatibility maintained with text extraction fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tool types to chat.ts** - `0b36c88` (feat)
2. **Task 2: Add streamChatWithTools to ollama.ts** - `0328e3a` (feat)
3. **Task 3: Update useChat to handle tool calls** - `ba4aad6` (feat)

**Plan metadata:** `lmn012o` (docs: complete plan)

## Files Created/Modified
- `src/types/chat.ts` - Added ToolFunction, OllamaTool, ToolCall interfaces, updated OllamaMessage and MessageRole
- `src/lib/ollama.ts` - Added StreamWithToolsResult interface and streamChatWithTools function
- `src/hooks/useChat.ts` - Added diagramTool, handleToolCalls function, updated sendMessage to use tool calling

## Decisions Made
- Added 'tool' role to MessageRole type for tool result messages
- Kept existing streamChat function for backward compatibility
- Implemented fallback to text extraction when model doesn't use tools

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all tasks completed without issues.

## Next Phase Readiness
Tool calling implementation complete. Ready for:
- Testing with llama3.2 model (which supports tool calling)
- Plan 06-02 if additional refinement is needed

---
*Phase: 06-use-llm-tool-calling-for-diagram-updates*
*Completed: 2026-02-15*
