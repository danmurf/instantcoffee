# Phase 4: Switch from D2 to Mermaid - Research

**Researched:** 2026-02-15
**Domain:** Client-side diagram rendering / JavaScript diagramming libraries
**Confidence:** HIGH

## Summary

This research investigated migrating from D2 CLI-based diagram rendering to Mermaid.js client-side rendering. The migration will eliminate the Express backend dependency, simplify the architecture, and improve rendering performance by moving diagram generation entirely to the browser.

Mermaid.js is a mature, widely-adopted JavaScript library that renders diagrams client-side from text definitions. It supports all diagram types currently used in the app (flowcharts, sequence diagrams, ERD, architecture diagrams) and has excellent LLM compatibility. The latest version (11.12.2) provides a modern async render API and extensive configuration options.

The key architectural change is that Mermaid renders entirely in the browser via JavaScript, eliminating the need for the Express backend's D2 CLI child process. The rendered output is SVG (same as D2), so export functionality remains compatible.

**Primary recommendation:** Use the core `mermaid` npm package (v11.12.2+) with a custom React hook implementation. Avoid third-party React wrappers due to limited maintenance and the simplicity of direct integration.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mermaid | 11.12.2+ | Diagram rendering engine | Official library, 1019+ dependent packages, active development |
| React | 18+ | UI framework (already in use) | App's existing stack |
| TypeScript | 5+ | Type safety (already in use) | App's existing stack |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct mermaid integration | react-x-mermaid wrapper | Wrapper adds dependency but reduces boilerplate; however, custom hook is simple enough to justify avoiding the dependency |
| mermaid | Keep D2 | D2 has better auto-layout but requires backend CLI; Mermaid is pure JS and more LLM-friendly |
| Client-side rendering | Mermaid CLI (@mermaid-js/mermaid-cli) | CLI useful for build pipelines but defeats purpose of eliminating backend dependency |

**Installation:**
```bash
npm install mermaid
```

**Node requirement:** Node >= 16

## Architecture Patterns

### Recommended Project Structure

Since this is a migration, the structure stays largely the same with file renames:

```
src/
├── lib/
│   ├── mermaid.ts           # Replaces d2.ts - rendering client
│   ├── ollama.ts            # Update to extract Mermaid syntax instead of D2
│   └── export.ts            # Unchanged - works with SVG from any source
├── hooks/
│   └── useChat.ts           # Update system prompt for Mermaid syntax
├── components/
│   ├── WhiteboardPanel.tsx  # Unchanged - displays SVG
│   └── SourceEditorModal.tsx # Update to say "Mermaid" instead of "D2"
└── App.tsx                  # Update demo diagram to Mermaid syntax
```

### Pattern 1: Mermaid Initialization

**What:** Initialize Mermaid once at app startup with security and theme configuration
**When to use:** In main.tsx or App.tsx useEffect on mount
**Example:**
```typescript
// Source: https://mermaid.js.org/config/usage.html
import mermaid from 'mermaid';

// Initialize once at app startup
mermaid.initialize({
  startOnLoad: false,        // Manual rendering via API
  theme: 'default',          // or 'dark', 'forest', 'neutral'
  securityLevel: 'strict',   // Prevent XSS from LLM-generated content
  logLevel: 'error',         // Reduce console noise
});
```

### Pattern 2: Async Rendering with React Hook

**What:** Use `mermaid.render()` API with async/await pattern
**When to use:** Every time diagram source changes
**Example:**
```typescript
// Source: https://mermaid.js.org/config/usage.html + React best practices
import mermaid from 'mermaid';
import { useEffect, useState } from 'react';

export async function renderMermaid(mermaidSource: string): Promise<string> {
  const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    const { svg } = await mermaid.render(uniqueId, mermaidSource);
    return svg;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Mermaid rendering failed');
  }
}
```

### Pattern 3: Debounced Streaming Updates

**What:** Debounce partial Mermaid rendering during LLM streaming to avoid excessive re-renders
**When to use:** When LLM is streaming partial diagram code (already implemented in useChat.ts)
**Example:**
```typescript
// Current pattern in useChat.ts already supports this
// Just replace renderD2() calls with renderMermaid()
const callbacks: StreamCallbacks = {
  onChunk: async (chunk: string) => {
    const { mermaidCode } = extractMermaidCode(streamingContentRef.current);

    if (mermaidCode && now - lastRenderTimeRef.current >= STREAM_DEBOUNCE_MS) {
      try {
        const svg = await renderMermaid(mermaidCode);
        setCurrentSvg(svg);
      } catch (renderErr) {
        // Keep previous valid diagram on partial render failure
        console.warn('Partial render failed, keeping previous diagram');
      }
    }
  }
};
```

### Pattern 4: Code Block Extraction

**What:** Extract Mermaid code from LLM markdown responses
**When to use:** In ollama.ts when parsing LLM output
**Example:**
```typescript
// Replaces extractD2Code() in ollama.ts
export function extractMermaidCode(content: string): {
  explanation: string;
  mermaidCode: string | null;
} {
  // Match ```mermaid code blocks
  const mermaidMatch = content.match(/```mermaid\s*\n([\s\S]*?)```/);

  if (mermaidMatch) {
    const mermaidCode = mermaidMatch[1].trim();
    const explanation = content
      .replace(/```mermaid\s*\n[\s\S]*?```/, '')
      .trim();
    return { explanation, mermaidCode };
  }

  return { explanation: content, mermaidCode: null };
}
```

### Anti-Patterns to Avoid

- **Using startOnLoad: true**: Don't rely on automatic DOM scanning; use explicit render() API for better control and React integration
- **Reusing element IDs**: Each render() call needs a unique ID; reusing IDs can cause rendering conflicts
- **Missing error handling**: Mermaid throws on syntax errors; always wrap render() calls in try/catch
- **Ignoring securityLevel**: LLM-generated content could contain XSS attacks; use 'strict' or 'antiscript' security level
- **Using third-party React wrappers**: Most are outdated or unmaintained; direct integration is simpler

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Diagram syntax parsing | Custom parser for Mermaid syntax | Mermaid's built-in parser | Extremely complex; handles edge cases, error recovery |
| SVG generation | Custom SVG renderer | Mermaid's render engine | Sophisticated layout algorithms, thousands of edge cases |
| Diagram theme/styling | Custom CSS styling system | Mermaid's built-in themes | Comprehensive theme system with preset options |
| Syntax validation | Custom validator | Try/catch on mermaid.render() | Parser provides detailed error messages |

**Key insight:** Mermaid is a mature library (7+ years, 70k+ GitHub stars) with sophisticated layout engines. The render API is the only interface needed; everything else is handled internally.

## Common Pitfalls

### Pitfall 1: Silent Security Issues

**What goes wrong:** Using securityLevel 'loose' allows XSS attacks through LLM-generated content with embedded scripts
**Why it happens:** Default is 'strict' but developers change it to enable click functionality without understanding risks
**How to avoid:** Keep securityLevel as 'strict' or 'antiscript'; avoid 'loose' with untrusted LLM content
**Warning signs:** Unexpected JavaScript execution, console errors about blocked content

### Pitfall 2: Syntax Errors Crash Rendering

**What goes wrong:** Mermaid throws exceptions on invalid syntax, breaking the UI if not caught
**Why it happens:** LLMs generate partial or invalid Mermaid during streaming; missing error boundaries
**How to avoid:** Always wrap render() in try/catch; during streaming, silently fail and keep previous valid diagram
**Warning signs:** Uncaught promise rejections, blank whiteboard on partial updates

### Pitfall 3: WYSIWYG Unpredictability

**What goes wrong:** Mermaid's auto-layout produces inconsistent results; small syntax changes cause dramatic layout shifts
**Why it happens:** Mermaid prioritizes automation over control; layout is not configurable
**How to avoid:** Set user expectations that layout is automatic; avoid promising pixel-perfect control
**Warning signs:** User complaints about "diagram looks different than expected"

### Pitfall 4: Character Encoding Issues

**What goes wrong:** Emoji and extended ASCII characters break Mermaid parsing
**Why it happens:** Mermaid parser has limited character support compared to D2
**How to avoid:** Instruct LLM in system prompt to avoid emoji in labels; sanitize user input
**Warning signs:** Cryptic parser errors, diagrams failing to render with special characters

### Pitfall 5: React Re-render ID Collisions

**What goes wrong:** Reusing the same element ID across renders causes stale diagram cache
**Why it happens:** Mermaid caches by ID; React components re-render but ID stays the same
**How to avoid:** Generate unique ID per render call (timestamp + random)
**Warning signs:** Diagram doesn't update when source changes; old diagram persists

### Pitfall 6: useEffect vs useLayoutEffect Confusion

**What goes wrong:** Flickering or "flash of unstyled content" when diagram renders
**Why it happens:** useEffect runs after browser paint; user sees raw text briefly
**How to avoid:** For critical rendering, use useLayoutEffect; for this app, async render() means useEffect is fine since we're updating state, not DOM directly
**Warning signs:** Brief flash of code block before diagram appears

## Code Examples

Verified patterns from official sources:

### Basic Rendering
```typescript
// Source: https://mermaid.js.org/config/usage.html
import mermaid from 'mermaid';

const drawDiagram = async function () {
  const element = document.querySelector('#graphDiv');
  const graphDefinition = 'graph TB\na-->b';
  const { svg, bindFunctions } = await mermaid.render('graphDiv', graphDefinition);
  element.innerHTML = svg;
  if (bindFunctions) {
    bindFunctions(element);
  }
};
```

### Complete renderMermaid() Utility
```typescript
// Source: Adapted from https://mermaid.js.org/config/usage.html
export interface RenderResponse {
  svg: string;
}

export async function renderMermaid(mermaidSource: string): Promise<string> {
  // Generate unique ID to avoid caching issues
  const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    const { svg } = await mermaid.render(uniqueId, mermaidSource);
    return svg;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Mermaid rendering failed: ${err.message}`);
    }
    throw new Error('Unknown error during Mermaid rendering');
  }
}
```

### Initialization Configuration
```typescript
// Source: https://mermaid.js.org/config/usage.html
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
  logLevel: 'error',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
});
```

## LLM Prompt Engineering for Mermaid

### System Prompt Template

Based on research, LLMs generate Mermaid diagrams effectively with structured prompts:

```
You are a Mermaid diagram generation assistant. Generate diagrams using Mermaid syntax.

Supported diagram types:
- flowchart (process flows, architecture)
- sequenceDiagram (interactions between actors)
- erDiagram (entity-relationship diagrams)
- graph (general directed graphs)

CRITICAL: Always output ONLY Mermaid code in markdown code blocks:

\`\`\`mermaid
[your diagram here]
\`\`\`

When modifying existing diagrams, output the COMPLETE modified diagram, not just changes.

CURRENT DIAGRAM:
\`\`\`mermaid
[inject current diagram source here for iterative refinement]
\`\`\`
```

### Syntax Differences from D2

| Feature | D2 Syntax | Mermaid Syntax |
|---------|-----------|----------------|
| Flowchart arrows | `a -> b: "label"` | `a --> b` or `a --\|label\|--> b` |
| Node with label | `server: "Web Server"` | `server["Web Server"]` |
| Styling | `server.style.fill: red` | `style server fill:red` |
| Comments | `# comment` | `%% comment` |
| Code blocks | ` ```d2` | ` ```mermaid` |
| Diagram type | Inferred | Explicit (`flowchart`, `sequenceDiagram`, etc.) |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based components | Hooks for Mermaid integration | React 16.8+ (2019) | Use useEffect/useState, not lifecycle methods |
| mermaid.init() | mermaid.render() async API | Mermaid v9.0 (2022) | Modern async/await pattern, better error handling |
| Callback-based rendering | Async/await rendering | Mermaid v9.0 (2022) | Cleaner code, Promise-based |
| Global mermaid.init | Explicit initialize() config | Mermaid v8.2+ | Better security defaults with securityLevel |
| Server-side rendering | Client-side only | Current standard | No backend needed for Mermaid |

**Deprecated/outdated:**
- `mermaid.init()` callback pattern: Replaced by `mermaid.render()` async API
- `startOnLoad: true` for React apps: Use explicit render() API instead
- Third-party React wrappers (`react-mermaid`, `react-mermaid2`): Most unmaintained; use direct integration
- `securityLevel: 'loose'` default: Changed to 'strict' for security

## Migration Impact Analysis

### Files to Modify

| File | Change Type | Effort | Risk |
|------|-------------|--------|------|
| `src/lib/d2.ts` | Rename to `mermaid.ts`, update render function | Low | Low |
| `src/lib/ollama.ts` | Update extractD2Code to extractMermaidCode | Low | Low |
| `src/hooks/useChat.ts` | Update system prompt, imports | Medium | Medium |
| `src/App.tsx` | Update demo diagram syntax | Low | Low |
| `src/components/SourceEditorModal.tsx` | Update UI labels "D2" → "Mermaid" | Low | Low |
| `src/components/WhiteboardPanel.tsx` | No changes (works with SVG) | None | None |
| `src/lib/export.ts` | No changes (works with SVG) | None | None |
| `server/index.js` | DELETE or reduce to static file server | High | High |
| `package.json` | Add mermaid, update dev scripts | Low | Low |
| `CLAUDE.md` | Update architecture docs | Low | None |

### Backend Elimination Strategy

**Current:** Vite dev server (port 5173) + Express backend (port 3001) for D2 rendering

**Option 1: Complete Elimination (RECOMMENDED)**
- Remove Express backend entirely
- Update npm scripts to only run Vite
- Remove `/api` proxy from vite.config.ts
- Benefits: Simpler architecture, fewer dependencies, faster startup
- Risk: None (backend only used for D2 rendering)

**Option 2: Minimal Static Server**
- Keep Express for future API needs
- Remove D2 rendering endpoint
- Keep health check endpoint
- Benefits: Infrastructure ready for future features (persistence, auth)
- Risk: Unnecessary complexity for current scope

**Recommendation:** Option 1 unless Phase 5 (persistence) requires backend.

### Breaking Changes

| Breaking Change | Impact | Migration Path |
|----------------|--------|----------------|
| System prompt syntax | Old D2 conversations won't work | Accept break; old history uses D2, new uses Mermaid |
| Diagram source format | Can't load old D2 diagrams | Add migration utility or accept fresh start |
| URL scheme (if any) | URLs with D2 source won't parse | Not applicable (no URL state in current app) |
| Export file contents | Old SVGs work fine | No migration needed (SVG is SVG) |

## Open Questions

Things that couldn't be fully resolved:

1. **Mermaid Layout Quality vs D2**
   - What we know: D2 has superior auto-layout algorithms; Mermaid layout is less sophisticated
   - What's unclear: Whether layout quality difference will frustrate users
   - Recommendation: Accept this tradeoff; Mermaid's ecosystem benefits outweigh layout concerns

2. **LLM Mermaid Syntax Accuracy**
   - What we know: MermaidSeqBench benchmark shows LLMs handle Mermaid well; syntax is well-documented in training data
   - What's unclear: Whether gpt-oss:20b (local Ollama model) generates Mermaid as accurately as D2
   - Recommendation: Test with sample prompts during planning phase; adjust system prompt if needed

3. **Theme Customization**
   - What we know: Mermaid has built-in themes (default, dark, forest, neutral)
   - What's unclear: Whether custom theme creation is needed or if defaults suffice
   - Recommendation: Start with default theme; add theme selector in Phase 4 or defer to future

4. **Streaming Render Performance**
   - What we know: Current D2 backend has 500ms debounce; Mermaid renders client-side
   - What's unclear: Whether client-side rendering will be faster, slower, or comparable
   - Recommendation: Keep 500ms debounce initially; profile and adjust if needed

5. **React 19 Compatibility**
   - What we know: Mermaid 11.12.2 works with React 18; React 19 stable released
   - What's unclear: Whether Mermaid has any React 19 compatibility issues
   - Recommendation: Test after migration; Mermaid doesn't deeply integrate with React so risk is low

## Sources

### Primary (HIGH confidence)
- [Mermaid Official Documentation](https://mermaid.js.org/) - Core library capabilities, diagram types, installation
- [Mermaid Usage Guide](https://mermaid.js.org/config/usage.html) - render() API, configuration options
- [Mermaid npm package](https://www.npmjs.com/package/mermaid) - Latest version (11.12.2), installation instructions

### Secondary (MEDIUM confidence)
- [Mermaid vs D2 Comparison (AaronJBecker)](https://aaronjbecker.com/posts/mermaid-vs-d2-comparing-text-to-diagram-tools/) - Syntax differences, use case recommendations
- [Integrating MermaidJS with ReactJS Hooks](https://www.devtoolsdaily.com/blog/integrate-mermaidjs-with-react-hooks/) - React integration patterns
- [Why Mermaid Charts Disappear in React](https://rendazhang.medium.com/why-mermaid-charts-disappear-in-react-and-how-to-fix-it-351545ef1ebc) - useLayoutEffect guidance
- [Mermaid.js Common Mistakes](https://swimm.io/learn/mermaid-js/mermaid-js-a-complete-guide) - Pitfalls, gotchas
- [LLM + Mermaid Article](https://mike-vincent.medium.com/llm-mermaid-how-modern-teams-create-uml-diagrams-without-lucidchart-e54c56350804) - Prompt engineering best practices
- [MermaidSeqBench Research](https://arxiv.org/html/2511.14967v1) - LLM Mermaid generation capabilities

### Tertiary (LOW confidence)
- [react-x-mermaid npm package](https://socket.dev/npm/package/react-x-mermaid) - React wrapper option (not recommended)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official npm package with 1019+ dependents, actively maintained
- Architecture: HIGH - Official documentation, verified code examples, mature ecosystem
- Pitfalls: MEDIUM - Web search aggregated community experience, not all from official sources
- LLM compatibility: MEDIUM - Recent research (MermaidSeqBench) but not tested with specific Ollama model

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - stable, mature library)
