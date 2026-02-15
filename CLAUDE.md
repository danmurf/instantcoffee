# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start both client (Vite) and server (Express) concurrently
npm run dev:client     # Start Vite dev server only (port 5173)
npm run dev:server     # Start Express server only (port 3001)
npm run build          # Production build to dist/
```

No test framework or linter is configured.

## Prerequisites

- [Ollama](https://ollama.com/) running locally with a model installed (default model: `gpt-oss:20b`)
- [D2](https://d2lang.com/tour/install) CLI installed and available on PATH

## Architecture

This is a natural-language-to-diagram app. Users describe diagrams in a chat panel, Ollama generates D2 code, and the Express backend renders it to SVG via the D2 CLI.

**Data flow:** User chat input → `useChat` hook → Ollama streaming API (localhost:11434) → extract D2 code from response → POST to Express `/api/render` → D2 CLI pipes source to SVG → rendered in WhiteboardPanel

**Key design details:**
- The frontend talks to Ollama directly (no backend proxy) for chat streaming, but uses the Express backend solely for D2→SVG rendering
- `useChat` maintains conversation history and injects the current D2 source into the system prompt so the LLM can iteratively refine diagrams
- D2 rendering during streaming is debounced (500ms) — partial D2 is attempted but failures are silently ignored to keep the last valid diagram visible
- Undo/redo is managed as a D2 source history stack in `App.tsx`, not in individual components
- Vite proxies `/api` requests to the Express server at port 3001

**Backend (`server/index.js`):** Plain Express (not TypeScript). Pipes D2 source through `echo | d2 -` via child_process. Sanitizes common LLM syntax errors before rendering.

## Path Aliases

`@/` maps to `./src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Code Style

- TypeScript with strict mode (`noUnusedLocals`, `noUnusedParameters`)
- Functional React components with hooks
- Tailwind CSS for styling
- PascalCase files for components, camelCase for utilities
- Use `interface` for object shapes, `type` for unions/aliases
