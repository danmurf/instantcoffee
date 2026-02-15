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

This is a natural-language-to-diagram app. Users describe diagrams in a chat panel, Ollama generates Mermaid code, and the browser renders it to SVG via the mermaid library.

**Data flow:** User chat input → `useChat` hook → Ollama streaming API (localhost:11434) → extract Mermaid code from response → client-side mermaid.render() → SVG in WhiteboardPanel

**Key design details:**
- The frontend talks to Ollama directly for chat streaming
- `useChat` maintains conversation history and injects the current Mermaid source into the system prompt so the LLM can iteratively refine diagrams
- Mermaid rendering during streaming is debounced (500ms) — partial Mermaid is attempted but failures are silently ignored to keep the last valid diagram visible
- Undo/redo is managed as a Mermaid source history stack in `App.tsx`, not in individual components

## Path Aliases

`@/` maps to `./src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Code Style

- TypeScript with strict mode (`noUnusedLocals`, `noUnusedParameters`)
- Functional React components with hooks
- Tailwind CSS for styling
- PascalCase files for components, camelCase for utilities
- Use `interface` for object shapes, `type` for unions/aliases
