# Architecture Research

**Domain:** Local-first conversational diagramming (D2 + Ollama)
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER (React SPA)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Chat Panel  │  │ Diagram View │  │  D2 Source Panel     │  │
│  │  (input +    │  │ (SVG render) │  │  (optional editor)   │  │
│  │   history)   │  │              │  │                      │  │
│  └──────┬───────┘  └──────▲───────┘  └──────────────────────┘  │
│         │                 │                                     │
│  ┌──────┴─────────────────┴──────────────────────────────────┐  │
│  │                  State Layer (Zustand)                     │  │
│  │  chatStore  │  diagramStore  │  sessionStore               │  │
│  └──────┬─────────────────┬──────────────────────────────────┘  │
│         │                 │                                     │
│  ┌──────┴─────────────────┴──────────────────────────────────┐  │
│  │                 Service Layer                              │  │
│  │  ollamaService  │  d2Service  │  storageService            │  │
│  └──────┬───────────────┬─────────────────┬──────────────────┘  │
│         │               │                 │                     │
├─────────┼───────────────┼─────────────────┼──────────────────────┤
│         │               │                 │  Persistence         │
│         │               │          ┌──────┴──────┐              │
│         │               │          │  IndexedDB  │              │
│         │               │          │  (Dexie.js) │              │
│         │               │          └─────────────┘              │
└─────────┼───────────────┼────────────────────────────────────────┘
          │               │
    HTTP :11434     HTTP :3001
          │               │
┌─────────┴───────┐ ┌─────┴──────────────┐
│  Ollama Server  │ │  Backend (Express)  │
│  (local LLM)   │ │  - D2 CLI wrapper   │
│                 │ │  - child_process    │
│  Pre-installed  │ │  - SVG response     │
└─────────────────┘ └──────────────────────┘
```

### Why a Backend is Required

**D2 cannot run in the browser.** D2 is a Go binary (CLI tool). There is no official WASM build or JavaScript implementation. The D2 playground at play.d2lang.com uses a server-side rendering approach. This means Instant Coffee needs a lightweight local backend process to execute D2 CLI commands and return SVG output.

**Ollama could be called directly from the browser** (it runs on localhost:11434 with CORS headers), but routing through the backend gives us a single coordination point for the chat → D2 → render pipeline.

**Recommended approach:** A thin Express/Fastify server that:
1. Proxies Ollama chat requests (optional — browser can call Ollama directly)
2. Accepts D2 source text, runs `d2` CLI, returns SVG
3. Runs alongside the Vite dev server via `concurrently`

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Chat Panel** | User message input, conversation display, streaming responses | React component, subscribes to chatStore |
| **Diagram View** | Renders SVG output from D2, handles zoom/pan | React component with `dangerouslySetInnerHTML` for SVG or embedded `<object>` |
| **D2 Source Panel** | Shows generated D2 code, optional manual editing | Textarea or lightweight code editor (later phase) |
| **State Layer** | App state management across components | Zustand stores: chat messages, current D2 source, rendered SVG, session metadata |
| **Service Layer** | API communication, business logic | TypeScript modules wrapping Ollama and backend calls |
| **Backend** | D2 rendering, optional Ollama proxy | Express server running D2 via `child_process.execFile` |
| **IndexedDB** | Session persistence, chat history, diagram versions | Dexie.js wrapping browser IndexedDB |

## Recommended Project Structure

```
instant-coffee/
├── src/                        # Frontend (React + Vite)
│   ├── components/             # React components
│   │   ├── chat/               # Chat panel components
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── MessageInput.tsx
│   │   ├── diagram/            # Diagram display components
│   │   │   ├── DiagramView.tsx
│   │   │   └── D2SourcePanel.tsx
│   │   └── layout/             # App shell, sidebar, etc.
│   │       └── AppLayout.tsx
│   ├── services/               # API and business logic
│   │   ├── ollama.ts           # Ollama API wrapper
│   │   ├── d2.ts               # D2 backend API wrapper
│   │   └── storage.ts          # IndexedDB/Dexie operations
│   ├── stores/                 # Zustand state stores
│   │   ├── chatStore.ts        # Chat messages, conversation state
│   │   ├── diagramStore.ts     # D2 source, SVG output, render state
│   │   └── sessionStore.ts     # Session metadata, save/load
│   ├── prompts/                # System prompts for Ollama
│   │   └── d2-generator.ts     # Prompt template for D2 generation
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── server/                     # Backend (Express/Fastify)
│   ├── index.ts                # Server entry point
│   ├── routes/
│   │   └── d2.ts               # D2 rendering endpoint
│   └── lib/
│       └── d2-renderer.ts      # D2 CLI wrapper (child_process)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Structure Rationale

- **`src/components/`:** Feature-grouped, not type-grouped. Chat and diagram are the two core UI domains.
- **`src/services/`:** Isolates external dependencies (Ollama, D2 backend, IndexedDB) behind clean interfaces. Components never call APIs directly.
- **`src/stores/`:** Zustand stores are the single source of truth. Services write to stores; components read from stores.
- **`src/prompts/`:** System prompts are a first-class concern — the quality of D2 generation depends entirely on prompt engineering.
- **`server/`:** Kept minimal. Its only job is wrapping D2 CLI. Could be replaced later with a WASM build if D2 ever ships one.

## Data Flow

### Primary Flow: Chat Message → Diagram

This is the core interaction loop and the most important flow to get right.

```
User types message
        │
        ▼
  [ChatPanel] ─── dispatches ───▶ [chatStore.sendMessage()]
        │                                    │
        │                              1. Add user message to history
        │                              2. Build prompt (system + history + new message)
        │                                    │
        │                                    ▼
        │                         [ollamaService.chat()]
        │                              stream: true
        │                                    │
        │                         ◄── streaming tokens ───
        │                              3. Accumulate response
        │                              4. Extract D2 code block from response
        │                                    │
        │                                    ▼
        │                         [diagramStore.setD2Source()]
        │                                    │
        │                                    ▼
        │                         [d2Service.render(d2Source)]
        │                              POST to backend :3001/render
        │                                    │
        │                              D2 CLI executes
        │                              Returns SVG string
        │                                    │
        │                                    ▼
        │                         [diagramStore.setSvg(svg)]
        │                                    │
        ▼                                    ▼
  [MessageList]                    [DiagramView]
  shows conversation               renders SVG
```

### Secondary Flow: Session Persistence

```
On diagram change:
  [diagramStore] ── onChange ──▶ [storageService.saveSession()]
                                        │
                                        ▼
                                  [IndexedDB via Dexie]
                                  Stores: { d2Source, chatHistory, metadata }

On app load:
  [sessionStore.loadSession()] ──▶ [storageService.getSession()]
                                        │
                                        ▼
                                  Restores chatStore + diagramStore
```

### Key Data Entities

```typescript
// Core types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;        // Full response text
  d2Code?: string;        // Extracted D2 code block (if present)
  timestamp: number;
}

interface DiagramState {
  d2Source: string;        // Current D2 source code
  svg: string | null;      // Rendered SVG string
  renderError: string | null;
  isRendering: boolean;
}

interface Session {
  id: string;
  name: string;
  chatHistory: ChatMessage[];
  d2Source: string;
  createdAt: number;
  updatedAt: number;
}
```

## Architectural Patterns

### Pattern 1: Streaming Chat with D2 Extraction

**What:** Ollama streams tokens back. As the full response accumulates, we extract D2 code blocks (fenced in \`\`\`d2 ... \`\`\`) and trigger rendering.
**When to use:** Every chat interaction.
**Trade-offs:** Streaming feels responsive but adds complexity. D2 extraction mid-stream can cause partial renders.

**Recommendation:** Wait for the complete response before extracting D2 and rendering. Stream the text for UX responsiveness, but don't render D2 until the code block is complete.

```typescript
// In chatStore
async sendMessage(userMessage: string) {
  const messages = buildPromptMessages(get().history, userMessage);
  
  let fullResponse = '';
  const stream = await ollamaService.chat({
    model: 'llama3.2',
    messages,
    stream: true,
  });
  
  for await (const chunk of stream) {
    fullResponse += chunk.message.content;
    // Update UI with streaming text
    set({ streamingText: fullResponse });
  }
  
  // Extract D2 after complete response
  const d2Code = extractD2Block(fullResponse);
  if (d2Code) {
    diagramStore.getState().renderD2(d2Code);
  }
}
```

### Pattern 2: Backend D2 Rendering via CLI

**What:** Express endpoint accepts D2 source, writes to temp file, executes `d2` CLI, returns SVG.
**When to use:** Every diagram render.
**Trade-offs:** Adds a backend dependency but is the only viable option since D2 has no browser runtime.

```typescript
// server/lib/d2-renderer.ts
import { execFile } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export async function renderD2(source: string): Promise<string> {
  const inputPath = join(tmpdir(), `d2-${Date.now()}.d2`);
  const outputPath = inputPath.replace('.d2', '.svg');
  
  await writeFile(inputPath, source);
  
  return new Promise((resolve, reject) => {
    execFile('d2', ['--theme', '0', inputPath, outputPath], (error) => {
      if (error) {
        reject(new Error(`D2 render failed: ${error.message}`));
        return;
      }
      readFile(outputPath, 'utf-8').then(resolve).finally(() => {
        unlink(inputPath).catch(() => {});
        unlink(outputPath).catch(() => {});
      });
    });
  });
}
```

### Pattern 3: Prompt Engineering as Architecture

**What:** The system prompt is a critical architectural component, not an afterthought. It instructs Ollama to always output valid D2 syntax inside fenced code blocks.
**When to use:** Every Ollama interaction.
**Trade-offs:** Prompt quality directly determines product quality. Local models (7B-13B) may struggle with complex D2 syntax.

**Key prompt design decisions:**
- System prompt includes D2 syntax reference (key shapes, connections, containers)
- Instruct model to always wrap D2 in \`\`\`d2 fenced blocks
- Include few-shot examples of natural language → D2 output
- Instruct model to output complete D2 (not diffs) so we always have a renderable document

### Pattern 4: Optimistic UI with Error Recovery

**What:** Show diagram immediately on success. On D2 syntax error, show the previous valid diagram + error message.
**When to use:** Handling invalid D2 output from the LLM.
**Trade-offs:** Never show a broken state; always show the last known good diagram.

```typescript
// In diagramStore
async renderD2(d2Source: string) {
  set({ d2Source, isRendering: true, renderError: null });
  
  try {
    const svg = await d2Service.render(d2Source);
    set({ svg, isRendering: false });
  } catch (error) {
    // Keep previous SVG visible, show error
    set({ isRendering: false, renderError: error.message });
  }
}
```

## Anti-Patterns

### Anti-Pattern 1: Rendering D2 in the Browser

**What people try:** Looking for D2 WASM or trying to parse D2 syntax in JavaScript.
**Why it's wrong:** D2 is a Go binary with a complex layout engine (dagre, ELK). There is no official browser runtime. The D2 Playground uses server-side rendering.
**Do this instead:** Accept the thin backend requirement. It's a single Express endpoint.

### Anti-Pattern 2: Sending D2 Diffs Instead of Full Source

**What people try:** Having the LLM output "add node X" diff commands instead of complete D2 source.
**Why it's wrong:** Local models are unreliable at producing consistent diff formats. Applying diffs requires tracking state. A single bad diff corrupts the diagram.
**Do this instead:** Always have the LLM output the complete D2 source. It's small (typically <1KB) and eliminates an entire class of bugs.

### Anti-Pattern 3: Tightly Coupling Chat and Diagram State

**What people try:** Having the chat component directly manage diagram rendering.
**Why it's wrong:** Makes it impossible to have manual D2 editing, re-rendering without chat, or loading saved sessions.
**Do this instead:** Chat produces D2 source → writes to diagramStore → diagramStore handles rendering independently.

### Anti-Pattern 4: Calling Ollama Without Streaming

**What people try:** `await ollama.chat()` without `stream: true` and waiting for the full response.
**Why it's wrong:** Local LLM inference takes 5-30+ seconds. Without streaming, the UI appears frozen.
**Do this instead:** Always use `stream: true` and show tokens as they arrive.

## Integration Points

### External Services (Local)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Ollama** | HTTP REST API at `localhost:11434` | Browser can call directly (CORS enabled by default). Use `ollama-js` with `ollama/browser` import. Streaming via SSE. |
| **D2 CLI** | `child_process.execFile` in backend | Must be installed on system PATH. Backend wraps as HTTP endpoint. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components ↔ Stores | Zustand subscribe/getState | Components are pure readers. Actions live in stores. |
| Stores ↔ Services | Direct async function calls | Services are stateless. Stores orchestrate and hold state. |
| Frontend ↔ Backend | HTTP (fetch) | Single endpoint: `POST /api/render` with D2 source body, returns SVG. |
| Frontend ↔ Ollama | HTTP via ollama-js | Can be direct from browser or proxied through backend. Direct is simpler for POC. |

### Browser ↔ Ollama: Direct vs Proxied

**Direct (recommended for POC):**
- Browser imports `ollama/browser`, calls `localhost:11434` directly
- Simpler, fewer moving parts, one less proxy layer
- Ollama enables CORS by default for localhost

**Proxied (consider for later):**
- Backend proxies Ollama calls, can add prompt management, logging, caching
- Better for adding semantic memory, RAG, or multi-model routing
- More complexity upfront

## Build Order (Dependencies)

The architecture has a clear dependency chain that dictates build order:

### Phase 1: Foundation
1. **Backend D2 renderer** — Must exist first since everything depends on seeing diagrams
2. **Basic React shell** — Layout with chat panel + diagram view areas
3. **Zustand stores** — Wire up state management skeleton

### Phase 2: Core Loop
4. **Ollama chat service** — Connect to local Ollama, get streaming responses
5. **D2 extraction** — Parse D2 code blocks from LLM responses
6. **D2 rendering pipeline** — Send extracted D2 to backend, display SVG

### Phase 3: Polish
7. **Session persistence** — Save/load conversations and diagrams via IndexedDB
8. **Error handling** — Graceful degradation for bad D2 output, Ollama disconnected, etc.
9. **UI refinement** — Zoom/pan, D2 source panel, export

### Why This Order

- **D2 backend first** because it's the riskiest unknown — if D2 CLI integration doesn't work smoothly, we need to know immediately
- **Ollama second** because it's well-documented and the API is stable
- **Persistence last** because in-memory state works fine for validation; persistence is polish

## Scaling Considerations

| Concern | POC (1 user) | Future (multi-session) |
|---------|-------------|------------------------|
| D2 rendering | Sync CLI call per render | Queue renders, debounce rapid changes |
| Ollama responses | Single model, single request | Model selection, request queuing |
| State management | In-memory Zustand | Persist to IndexedDB via Dexie |
| Backend | Express dev server | Could bundle as Electron app for distribution |

### First Bottleneck: LLM Response Time

Local models on consumer hardware take 5-30s for responses. The architecture handles this via streaming, but it's the fundamental UX bottleneck. No amount of architecture solves slow inference — model selection and prompt optimization matter more.

### Second Bottleneck: D2 Rendering Latency

D2 CLI startup + render is typically <1 second. Not a concern for POC. If it becomes an issue, keep the D2 process alive as a long-running server rather than spawning per-render.

## Sources

- **D2 API docs:** https://d2lang.com/tour/api — Go-only programmatic API, no JS/WASM runtime (HIGH confidence)
- **D2 CLI manual:** https://d2lang.com/tour/man — CLI interface for rendering (HIGH confidence)
- **Ollama JS library:** https://github.com/ollama/ollama-js — v0.6.3, browser + Node support, streaming (HIGH confidence)
- **Ollama REST API:** https://github.com/ollama/ollama/blob/main/docs/api.md — localhost:11434 (HIGH confidence)
- **Zustand patterns:** Training data — standard React state management (MEDIUM confidence)
- **D2 playground architecture:** Inferred from D2 being Go-only + playground using server rendering (MEDIUM confidence)

---
*Architecture research for: Instant Coffee — Local-first conversational diagramming*
*Researched: 2026-02-14*
