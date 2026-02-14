# Stack Research

**Domain:** Local-first diagramming web app with D2 and Ollama
**Researched:** 2025-02-14
**Confidence:** MEDIUM-HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.x or 19.x | UI framework | Most mature ecosystem for interactive web apps; excellent TypeScript support; large community |
| Vite | 6.x | Build tool | Fast HMR, native ES modules, optimal dev experience; industry standard for 2025 |
| TypeScript | 5.x | Language | Type safety critical for AI/diagram code; excellent D2 and Ollama type definitions |
| React Router | 7.x | Routing | Official React routing solution; handles SPA navigation cleanly |

### Diagramming Engine (D2)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| D2 CLI | 0.7.x | Diagram rendering | Most current version (v0.7.1 released Aug 2025); Go-based; exports SVG/PNG/PDF; runs server-side |
| @terrastruct/d2 | latest (npm) | JavaScript bindings | Official npm package; enables programmatic D2 rendering from JS |
| D2 as local server | 0.7.x | Browser-callable API | Run D2 CLI as child process or local HTTP server; browser sends D2 source, receives SVG |

### AI Integration (Ollama)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Ollama | 0.16.x | Local LLM runtime | Industry standard for local AI (40k+ integrations); runs on localhost:11434 |
| ollama-js | 0.6.x | JavaScript SDK | Official JavaScript library; supports streaming, chat, generate; TypeScript included |
| Model: llama3.2 or qwen2.5 | latest | Default model | Recommended for code/diagram generation; good balance of capability and local performance |

### Local Storage (Local-First)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Dexie.js | 4.x | IndexedDB wrapper | Simplest IndexedDB API; excellent TypeScript support; widely adopted (15k+ stars) |
| IndexedDB | native | Browser storage | Native browser database; persists offline; required for local-first architecture |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.x | Data fetching | When calling Ollama API; handles caching, loading states |
| zustand | 5.x | State management | Lightweight; simpler than Redux; good for diagram state |
| lucide-react | 0.468.x | Icons | Clean, consistent icons; easy to customize |
| Tailwind CSS | 3.4.x | Styling | Utility-first; fast development; excellent for custom designs |
| framer-motion | 11.x | Animations | Smooth diagram transitions; React-native feel |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint + Prettier | Code quality | Standard React tooling |
| Vitest | Testing | Fast, Vite-native testing |
| concurrently | Run multiple processes | Run Vite dev server + D2 server + Ollama |

## Installation

```bash
# Core dependencies
npm create vite@latest instant-coffee -- --template react-ts
cd instant-coffee

# Install core dependencies
npm install react-router-dom @tanstack/react-query zustand lucide-react framer-motion

# Install D2 and Ollama libraries
npm install @terrastruct/d2 ollama

# Install styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install dev dependencies
npm install -D eslint prettier vitest @testing-library/react @types/node concurrently

# Install Ollama (system-level - for local AI)
# macOS:
brew install ollama

# Linux:
curl -fsSL https://ollama.com/install.sh | sh
```

## Architecture: How D2 + Ollama Work Together

### Option 1: D2 CLI as Child Process (Recommended for POC)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Ollama (JS)    │────▶│  D2 CLI         │
│   - Chat input  │     │  - AI prompts    │     │  - Render SVG   │
│   - SVG display │     │  - Local :11434  │     │  - Child process│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Option 2: D2 CLI as Local HTTP Server
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Ollama (JS)    │────▶│  D2 Server      │
│                 │     │  (localhost)    │     │  (localhost)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Integration Points

1. **Ollama handles intent → D2 code**: User types "show user authentication flow" → Ollama generates D2 syntax
2. **D2 renders diagram**: D2 CLI takes syntax → outputs SVG → React displays inline
3. **Both run locally**: No cloud dependencies; works offline after initial model download

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|------------------------|
| UI Framework | React + Vite | Svelte + Vite | If seeking simpler reactivity model |
| State Management | Zustand | Jotai | If preferring atomic state |
| Local Storage | Dexie.js | RxDB | If needing real-time sync features |
| AI Library | ollama-js (official) | langchain.js | If needing more complex AI orchestration |
| Styling | Tailwind CSS | CSS Modules | If preferring scoped styles |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Mermaid.js | Less flexible than D2 for software diagrams; different syntax | D2 |
| cloud AI APIs (OpenAI, Anthropic) | Violates local-first principle | Ollama with local models |
| Redux | Overkill for diagram state; too much boilerplate | Zustand |
| Create React App | Deprecated; slow; Vite is standard | Vite |
| jQuery | Antiquated; no TypeScript support | React |

## Stack Patterns by Variant

**If targeting rapid POC with minimal complexity:**
- Use D2 CLI via Node.js `child_process` 
- Keep diagrams in memory, not persisted initially
- Minimal error handling for D2 parsing errors

**If needing persistent diagrams:**
- Add Dexie.js for IndexedDB storage
- Store D2 source text (not SVG) for editability
- Re-render SVG on load

**If needing collaboration later:**
- Design for CRDT sync from start (store as D2 source, not SVG)
- Consider ElectricSQL or similar for eventual sync layer

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| React 18.x | Vite 5.x, 6.x | Full compatibility |
| React 19.x | Vite 5.x, 6.x | Newer; slightly less ecosystem maturity |
| ollama-js 0.6.x | Ollama 0.16.x | Check Ollama version matches |
| @terrastruct/d2 | D2 CLI 0.7.x | Version alignment important |
| Tailwind 3.4.x | PostCSS, autoprefixer | Standard config |

## Sources

- **D2 Official**: https://d2lang.com/ — v0.7.1 (Aug 2025), 23k GitHub stars
- **D2 GitHub**: https://github.com/terrastruct/d2 — Go-based, CLI + library
- **Ollama**: https://ollama.com/ — v0.16.x, 40k+ integrations
- **Ollama JS**: https://github.com/ollama/ollama-js — v0.6.3, TypeScript included
- **Local-First Web**: https://localfirstweb.dev/ — Community resource for
- **Dex local-first patternsie.js**: https://dexie.org/ — IndexedDB made simple
- **Vite**: https://vite.dev/ — Next-generation build tool

---

*Stack research for: Instant Coffee - Local-first diagramming with D2 and Ollama*
*Researched: 2025-02-14*
