# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start Vite dev server (port 5173)
npm run build          # Production build to dist/
npm run preview        # Preview production build
```

No test framework or linter is configured.

## Prerequisites

- [Ollama](https://ollama.com/) running locally with a model installed (default model: `gpt-oss:20b`)
- [Mermaid.js](https://mermaid.js.org/) is bundled with the app (no install needed)

## Architecture

This is a natural-language-to-diagram app with persistent memory. Users describe diagrams in a chat panel, Ollama generates Mermaid code, and the browser renders it to SVG via the mermaid library. The AI remembers context across sessions using a local IndexedDB database.

**Data flow:** User chat input → `useChat` hook → Ollama streaming API (localhost:11434) → extract Mermaid code from response → client-side mermaid.render() → SVG in WhiteboardPanel

**Key design details:**
- The frontend talks to Ollama directly for chat streaming
- `useChat` maintains conversation history and injects the current Mermaid source into the system prompt so the LLM can iteratively refine diagrams
- Mermaid rendering during streaming is debounced (500ms) — partial Mermaid is attempted but failures are silently ignored to keep the last valid diagram visible
- Undo/redo is managed as a Mermaid source history stack in `App.tsx`, not in individual components

### Memory System

**Storage:** Dexie.js (IndexedDB wrapper) stores memories locally in the browser (`src/db/`)

**Memory lifecycle:**
1. `useChat` provides the AI with `save_memory`, `update_memory`, `delete_memory` tools
2. AI automatically calls these tools during conversation to save relevant facts
3. All memories are injected into the system prompt as "USER'S CONTEXT" on each request
4. Users can manually manage memories via `MemoryPanel` component
5. Memories can be consolidated/cleaned using `memoryConsolidation.ts` (calls Ollama to deduplicate)

**Key implementation details:**
- Each memory is atomic (one fact per memory) for better retrieval and updates
- Memory operations use optimistic UI updates via `useLiveQuery` from dexie-react-hooks
- The consolidation feature uses a non-streaming Ollama request to process all memories as a batch
- Memory enable/disable toggles control both reading from and saving to memory independently

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatPanel.tsx    # Chat interface with message history
│   ├── WhiteboardPanel.tsx  # Mermaid diagram renderer
│   └── MemoryPanel.tsx  # Memory management UI
├── hooks/
│   ├── useChat.ts       # Chat logic, Ollama streaming, tool calls
│   └── useMemories.ts   # Dexie queries for memory CRUD
├── lib/
│   ├── ollama.ts        # Ollama API client
│   ├── mermaid.ts       # Mermaid rendering utilities
│   └── memoryConsolidation.ts  # AI-powered memory cleanup
├── db/
│   ├── index.ts         # Dexie database schema
│   └── memories.ts      # Memory CRUD operations
└── types/
    └── memory.ts        # Memory TypeScript interface
```

## Path Aliases

`@/` maps to `./src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Code Style

- TypeScript with strict mode (`noUnusedLocals`, `noUnusedParameters`)
- Functional React components with hooks
- Tailwind CSS for styling
- PascalCase files for components, camelCase for utilities
- Use `interface` for object shapes, `type` for unions/aliases
