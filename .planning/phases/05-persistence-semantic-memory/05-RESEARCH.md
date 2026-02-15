# Phase 05: Persistence & Semantic Memory - Research

**Researched:** 2026-02-15
**Domain:** IndexedDB persistence, state management, semantic memory systems
**Confidence:** HIGH

## Summary

This phase implements session persistence and semantic memory for a React/Mermaid diagram application. Users need to save complete session state (chat history, Mermaid source, undo/redo stack, diagram position) to IndexedDB and store global semantic memory (services, teams, preferences) that injects into AI prompts.

The standard approach uses **Dexie.js 4.x** (already in tech stack) with `dexie-react-hooks` for reactive IndexedDB access, **Zustand** for ephemeral UI state (current session, unsaved changes), and **custom hooks** for auto-save with debouncing. The codebase already has chat history (`ChatMessage[]`), Mermaid source tracking, and undo/redo history in `App.tsx`, making persistence a straightforward lift into IndexedDB.

**Primary recommendation:** Use Dexie.js with versioned schema for sessions and memories tables, `useLiveQuery` hook for reactive session list, Zustand for current-session state, and a debounced auto-save pattern (1000-2000ms) that fires on state changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Session save/load:**
- Auto-save in background continuously, plus manual named saves
- Save everything: chat history, current Mermaid source, undo/redo stack, diagram position
- When loading a different session, warn if current session has unsaved changes
- Explicit "New Session" button that auto-saves current work first, then starts blank

**Memory input:**
- Two input methods: natural language in chat ("remember that auth-service is owned by Platform team") AND a dedicated memory management panel
- Memory covers: services & components, team ownership, diagram preferences, plus anything else Claude determines is useful
- Users can edit and delete memories from both the panel and via chat ("forget about auth-service", "update: auth-service now runs on GCP")

**Memory in prompts:**
- All memories included in every prompt (no selective filtering)
- Global scope — memories available across all sessions, not per-session
- No hard limit on memory count

**Session organization:**
- Auto-generated session names based on first message or diagram type
- Session list lives in a collapsible sidebar (ChatGPT-style)
- Delete sessions with confirmation dialog
- Session list shows name + last modified date

### Claude's Discretion

- How the system confirms when a memory is stored via chat (acknowledgment style)
- Whether to show a subtle indicator when memories are being used in generation
- Auto-save interval/strategy (debounce, on-change, etc.)
- Memory panel UI layout and interaction patterns
- How auto-generated session names are derived

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Dexie.js | 4.x | IndexedDB wrapper | Typed, reactive, versioned schema, de facto standard for React IndexedDB |
| dexie-react-hooks | 4.x | React integration | Official hooks (`useLiveQuery`) for reactive queries, cross-tab sync |
| Zustand | Latest | Ephemeral UI state | Lightweight, already in tech stack, perfect for current-session state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lodash.debounce | 4.x | Debounce auto-save | Standard debounce implementation, prevents excessive writes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie.js | Raw IndexedDB | Less abstraction, no TypeScript types, manual versioning, no reactivity |
| Dexie.js | LocalStorage | 10MB limit, no async, blocks UI, no structured queries |
| dexie-react-hooks | Manual useEffect | Loses reactivity, manual change detection, no cross-tab sync |
| Zustand | React Context | More boilerplate, harder to test, no devtools |

**Installation:**
```bash
npm install dexie dexie-react-hooks lodash.debounce
npm install --save-dev @types/lodash.debounce
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/
│   ├── index.ts              # Dexie database class, schema definition
│   ├── sessions.ts           # Session CRUD operations
│   └── memories.ts           # Memory CRUD operations
├── hooks/
│   ├── useAutoSave.ts        # Debounced auto-save hook
│   ├── useSessions.ts        # Session list with useLiveQuery
│   └── useMemories.ts        # Memory management with useLiveQuery
├── stores/
│   └── sessionStore.ts       # Zustand store for current session state
├── components/
│   ├── SessionSidebar.tsx    # ChatGPT-style session list
│   └── MemoryPanel.tsx       # Memory management UI
└── types/
    ├── session.ts            # Session, SessionState types
    └── memory.ts             # Memory, MemoryCategory types
```

### Pattern 1: Dexie Database Schema with Versioning
**What:** Define typed database with tables for sessions and memories, use versioning for schema evolution
**When to use:** Initial setup and whenever schema changes

**Example:**
```typescript
// Source: https://dexie.org/docs/Tutorial/Design
// src/db/index.ts
import Dexie, { Table } from 'dexie';

export interface Session {
  id?: number;
  name: string;
  messages: ChatMessage[];
  mermaidSource: string;
  undoStack: string[];
  redoStack: string[];
  diagramPosition?: { x: number; y: number; zoom: number };
  createdAt: number;
  updatedAt: number;
}

export interface Memory {
  id?: number;
  category: 'service' | 'team' | 'preference' | 'other';
  key: string;
  value: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export class AppDatabase extends Dexie {
  sessions!: Table<Session>;
  memories!: Table<Memory>;

  constructor() {
    super('InstantCoffeeDB');

    // Version 1: Initial schema
    this.version(1).stores({
      sessions: '++id, name, updatedAt',
      memories: '++id, category, key, updatedAt'
    });
  }
}

export const db = new AppDatabase();
```

### Pattern 2: Reactive Queries with useLiveQuery
**What:** React components automatically re-render when IndexedDB data changes (even from other tabs)
**When to use:** Session list, memory list, any UI displaying persisted data

**Example:**
```typescript
// Source: https://dexie.org/docs/dexie-react-hooks/useLiveQuery()
// src/hooks/useSessions.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function useSessions() {
  // Automatically re-queries when sessions table changes
  const sessions = useLiveQuery(
    () => db.sessions
      .orderBy('updatedAt')
      .reverse()
      .toArray(),
    [] // deps - empty because query doesn't depend on external state
  );

  return sessions ?? []; // useLiveQuery returns undefined during initial load
}
```

### Pattern 3: Debounced Auto-Save Hook
**What:** Save session state to IndexedDB after user stops typing/interacting, with configurable delay
**When to use:** Auto-save for chat messages, Mermaid source, undo/redo stack

**Example:**
```typescript
// Source: https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e
// src/hooks/useAutoSave.ts
import { useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import { db } from '../db';
import type { Session } from '../db';

export function useAutoSave(
  sessionId: number | null,
  sessionData: Partial<Session>,
  delay: number = 1500
) {
  // CRITICAL: Use ref to avoid recreating debounced function on every render
  const debouncedSaveRef = useRef(
    debounce(async (id: number, data: Partial<Session>) => {
      await db.sessions.update(id, {
        ...data,
        updatedAt: Date.now()
      });
    }, delay)
  );

  useEffect(() => {
    if (sessionId && sessionData) {
      debouncedSaveRef.current(sessionId, sessionData);
    }
  }, [sessionId, sessionData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSaveRef.current.cancel();
    };
  }, []);
}
```

### Pattern 4: Zustand Store for Current Session State
**What:** Track current session ID, unsaved changes, UI state in memory (not IndexedDB)
**When to use:** Ephemeral state like "which session is active", "show unsaved warning"

**Example:**
```typescript
// Source: https://zustand.docs.pmnd.rs/getting-started/introduction
// src/stores/sessionStore.ts
import { create } from 'zustand';

interface SessionStore {
  currentSessionId: number | null;
  hasUnsavedChanges: boolean;
  setCurrentSession: (id: number | null) => void;
  markUnsaved: () => void;
  markSaved: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentSessionId: null,
  hasUnsavedChanges: false,
  setCurrentSession: (id) => set({ currentSessionId: id }),
  markUnsaved: () => set({ hasUnsavedChanges: true }),
  markSaved: () => set({ hasUnsavedChanges: false }),
}));
```

### Pattern 5: Memory Injection into System Prompt
**What:** Load all memories from IndexedDB and append to system prompt before each AI request
**When to use:** Every chat message sent to Ollama

**Example:**
```typescript
// src/hooks/useChat.ts (modification)
import { db } from '../db';

async function buildSystemPrompt(basePrompt: string): Promise<string> {
  const memories = await db.memories.toArray();

  if (memories.length === 0) {
    return basePrompt;
  }

  const memorySection = memories
    .map(m => `- ${m.category}: ${m.key} = ${m.value}${m.description ? ` (${m.description})` : ''}`)
    .join('\n');

  return `${basePrompt}\n\nSEMANTIC MEMORY:\nThe user has taught you the following:\n${memorySection}`;
}
```

### Pattern 6: Natural Language Memory Commands
**What:** Parse chat input for "remember", "forget", "update" patterns and store in memories table
**When to use:** User types memory commands in chat

**Example:**
```typescript
// src/lib/memoryParser.ts
export function parseMemoryCommand(input: string): {
  action: 'remember' | 'forget' | 'update' | null;
  key: string;
  value?: string;
  category?: string;
} | null {
  const rememberMatch = input.match(/remember(?:\s+that)?\s+([^=]+?)\s+(?:is|are|runs on|owned by)\s+(.+)/i);
  if (rememberMatch) {
    return {
      action: 'remember',
      key: rememberMatch[1].trim(),
      value: rememberMatch[2].trim(),
      category: inferCategory(rememberMatch[0])
    };
  }

  const forgetMatch = input.match(/forget(?:\s+about)?\s+(.+)/i);
  if (forgetMatch) {
    return {
      action: 'forget',
      key: forgetMatch[1].trim()
    };
  }

  const updateMatch = input.match(/update:?\s+([^=]+?)\s+(?:now|is now)\s+(.+)/i);
  if (updateMatch) {
    return {
      action: 'update',
      key: updateMatch[1].trim(),
      value: updateMatch[2].trim()
    };
  }

  return null;
}

function inferCategory(text: string): 'service' | 'team' | 'preference' | 'other' {
  if (/service|component|api|database/i.test(text)) return 'service';
  if (/team|owned|managed/i.test(text)) return 'team';
  if (/prefer|like|want/i.test(text)) return 'preference';
  return 'other';
}
```

### Anti-Patterns to Avoid

- **Don't recreate debounced functions on every render:** Use `useRef` or `useMemo` to maintain identity, otherwise debouncing breaks
- **Don't use localStorage for structured data:** IndexedDB handles large objects, async operations, and structured queries
- **Don't query IndexedDB in render:** Use `useLiveQuery` for automatic reactivity, not manual `useEffect` loops
- **Don't forget schema versioning:** Always increment version when changing table schema, or existing users lose data
- **Don't block auto-save on user actions:** Debounce saves so typing/scrolling doesn't trigger constant writes
- **Don't assume synchronous hydration:** IndexedDB is async; handle loading states for initial data fetch

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB wrapper | Custom promise wrappers, manual versioning | Dexie.js | Schema versioning, TypeScript types, query builder, transaction handling, upgrade paths |
| Reactive queries | `useEffect` + manual change detection | `useLiveQuery` from dexie-react-hooks | Cross-tab sync, automatic re-renders, optimized query caching |
| Debouncing | `setTimeout` + `clearTimeout` logic | `lodash.debounce` or `useDebouncedCallback` | Edge cases (trailing/leading), cancel handling, tested at scale |
| Session name generation | String parsing + manual rules | LLM extraction or heuristic library | Context understanding, natural summarization, handles edge cases |
| State synchronization | Manual `useState` + `useEffect` chains | Zustand | Less boilerplate, better devtools, easier testing, no Context hell |

**Key insight:** IndexedDB is low-level and error-prone. Dexie.js handles versioning, migrations, TypeScript types, and transaction edge cases that take weeks to get right manually. React integration via `useLiveQuery` adds cross-tab sync and reactivity for free.

## Common Pitfalls

### Pitfall 1: Debounced Function Recreated on Every Render
**What goes wrong:** Auto-save fires on every keystroke despite debouncing
**Why it happens:** Debounced function is recreated on each render, losing internal timer state
**How to avoid:** Wrap debounced function in `useRef` or `useMemo` with empty deps
**Warning signs:** Auto-save triggers immediately instead of after delay

```typescript
// BAD: Creates new debounced function on every render
useEffect(() => {
  const save = debounce(() => db.sessions.update(...), 1000);
  save();
}, [sessionData]);

// GOOD: Maintains same debounced function across renders
const saveRef = useRef(debounce(() => db.sessions.update(...), 1000));
useEffect(() => {
  saveRef.current();
}, [sessionData]);
```

### Pitfall 2: Schema Changes Without Version Increment
**What goes wrong:** Users lose data or app crashes when schema changes
**Why it happens:** IndexedDB requires explicit version bumps to trigger upgrade events
**How to avoid:** Always increment `this.version(N)` and provide migration logic
**Warning signs:** "VersionError" in console, data not appearing after schema change

```typescript
// BAD: Changed schema without version bump
this.version(1).stores({
  sessions: '++id, name, updatedAt, newField' // Added newField
});

// GOOD: Increment version and migrate data
this.version(2).stores({
  sessions: '++id, name, updatedAt, newField'
}).upgrade(tx => {
  return tx.table('sessions').toCollection().modify(session => {
    session.newField = 'default_value';
  });
});
```

### Pitfall 3: Async Hydration Race Condition
**What goes wrong:** UI renders before IndexedDB data loads, shows empty session list
**Why it happens:** `useLiveQuery` returns `undefined` during initial query
**How to avoid:** Check for `undefined` and show loading state, or use default empty array
**Warning signs:** Flicker from empty state to populated list on load

```typescript
// BAD: Assumes sessions is always an array
const sessions = useLiveQuery(() => db.sessions.toArray());
return sessions.map(s => <SessionItem key={s.id} {...s} />); // Crashes on undefined

// GOOD: Handle undefined during load
const sessions = useLiveQuery(() => db.sessions.toArray());
if (!sessions) return <LoadingSpinner />;
return sessions.map(s => <SessionItem key={s.id} {...s} />);
```

### Pitfall 4: Forgetting to Update `updatedAt` Timestamp
**What goes wrong:** Session list doesn't sort correctly, "last modified" shows wrong date
**Why it happens:** Partial updates don't automatically refresh timestamps
**How to avoid:** Always set `updatedAt: Date.now()` in every update operation
**Warning signs:** Session order doesn't reflect recent activity

```typescript
// BAD: Timestamp not updated
await db.sessions.update(sessionId, { messages: newMessages });

// GOOD: Always update timestamp
await db.sessions.update(sessionId, {
  messages: newMessages,
  updatedAt: Date.now()
});
```

### Pitfall 5: Not Handling Unsaved Changes Warning
**What goes wrong:** User loses work when switching sessions
**Why it happens:** Auto-save is debounced; rapid session switch happens before save completes
**How to avoid:** Check Zustand `hasUnsavedChanges` flag before session switch, show dialog
**Warning signs:** Users report lost chat messages when switching sessions quickly

```typescript
// Check before switching sessions
const handleSessionSwitch = async (newSessionId: number) => {
  if (hasUnsavedChanges) {
    const confirmed = window.confirm('You have unsaved changes. Save before switching?');
    if (!confirmed) return;
    // Force immediate save (cancel debounce, save now)
    await debouncedSave.flush();
  }
  setCurrentSession(newSessionId);
};
```

### Pitfall 6: Memory Command Conflicts with Diagram Commands
**What goes wrong:** "remember to add a database node" creates a memory instead of modifying diagram
**Why it happens:** Regex pattern matches too broadly
**How to avoid:** Parse memory commands first, only if not a diagram modification request
**Warning signs:** Unwanted memories created from casual language

```typescript
// Check if message is diagram-related before parsing memory command
if (!isDiagramCommand(input)) {
  const memoryCmd = parseMemoryCommand(input);
  if (memoryCmd) {
    await handleMemoryCommand(memoryCmd);
    return; // Don't send to AI
  }
}
```

## Code Examples

Verified patterns from official sources:

### Session CRUD Operations
```typescript
// Source: https://dexie.org/docs/Table/Table.add()
// src/db/sessions.ts
import { db, Session } from './index';

export async function createSession(name: string): Promise<number> {
  const id = await db.sessions.add({
    name,
    messages: [],
    mermaidSource: '',
    undoStack: [],
    redoStack: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return id as number;
}

export async function loadSession(id: number): Promise<Session | undefined> {
  return db.sessions.get(id);
}

export async function updateSession(id: number, changes: Partial<Session>): Promise<void> {
  await db.sessions.update(id, {
    ...changes,
    updatedAt: Date.now()
  });
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}
```

### Memory Management with Natural Language
```typescript
// src/db/memories.ts
import { db, Memory } from './index';

export async function addMemory(
  key: string,
  value: string,
  category: Memory['category'] = 'other',
  description?: string
): Promise<number> {
  // Check if memory already exists for this key
  const existing = await db.memories.where('key').equals(key).first();

  if (existing) {
    // Update existing memory
    await db.memories.update(existing.id!, {
      value,
      category,
      description,
      updatedAt: Date.now()
    });
    return existing.id!;
  }

  // Create new memory
  const id = await db.memories.add({
    key,
    value,
    category,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return id as number;
}

export async function deleteMemory(key: string): Promise<void> {
  await db.memories.where('key').equals(key).delete();
}

export async function getMemoriesByCategory(category: Memory['category']): Promise<Memory[]> {
  return db.memories.where('category').equals(category).toArray();
}

export async function getAllMemories(): Promise<Memory[]> {
  return db.memories.toArray();
}
```

### Session Sidebar with Live Updates
```typescript
// Source: https://dexie.org/docs/dexie-react-hooks/useLiveQuery()
// src/components/SessionSidebar.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useSessionStore } from '../stores/sessionStore';

export function SessionSidebar() {
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('updatedAt').reverse().toArray()
  );

  const { currentSessionId, setCurrentSession, hasUnsavedChanges } = useSessionStore();

  const handleSessionClick = async (sessionId: number) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Save current session before switching?');
      if (!confirmed) return;
    }
    setCurrentSession(sessionId);
  };

  const handleDelete = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Delete this session?');
    if (confirmed) {
      await db.sessions.delete(sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSession(null);
      }
    }
  };

  if (!sessions) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div className="session-sidebar">
      {sessions.map(session => (
        <div
          key={session.id}
          onClick={() => handleSessionClick(session.id!)}
          className={currentSessionId === session.id ? 'active' : ''}
        >
          <span>{session.name}</span>
          <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
          <button onClick={(e) => handleDelete(session.id!, e)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Auto-Generate Session Names
```typescript
// src/lib/sessionNames.ts
import type { ChatMessage } from '../types/chat';

export function generateSessionName(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return `Session ${new Date().toLocaleDateString()}`;
  }

  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) {
    return `Session ${new Date().toLocaleDateString()}`;
  }

  // Extract diagram type if mentioned
  const diagramTypes = [
    'sequence', 'flowchart', 'class', 'state', 'ERD', 'architecture', 'pie'
  ];

  for (const type of diagramTypes) {
    if (firstUserMessage.content.toLowerCase().includes(type.toLowerCase())) {
      return `${type.charAt(0).toUpperCase() + type.slice(1)} Diagram`;
    }
  }

  // Fallback: truncate first message
  const truncated = firstUserMessage.content.slice(0, 30);
  return truncated.length < firstUserMessage.content.length
    ? `${truncated}...`
    : truncated;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage + JSON.parse | IndexedDB + Dexie.js | 2018-2020 | Structured queries, async, no 10MB limit, better for complex apps |
| Manual IndexedDB API | Dexie.js with TypeScript | 2020-present | Type safety, versioning, less boilerplate |
| Redux for all state | Zustand for client state, IndexedDB for persistence | 2021-present | Less boilerplate, faster, separation of concerns |
| Manual useEffect queries | useLiveQuery (Dexie hooks) | 2020-present | Automatic reactivity, cross-tab sync, less code |
| Vector search for memory | Simple key-value for semantic memory | N/A | Phase requirement is no filtering, load all memories |

**Deprecated/outdated:**
- **PouchDB/CouchDB sync:** Overcomplicated for client-only persistence, maintenance ceased
- **LocalForage:** Abstracts over IndexedDB/localStorage but lacks TypeScript types and versioning
- **Zustand persist middleware with IndexedDB:** Experimental, use Dexie directly for complex schemas

## Open Questions

1. **Session name generation strategy**
   - What we know: Can extract first message or diagram type
   - What's unclear: Should we use Ollama to generate better names? (Would add API call overhead)
   - Recommendation: Start with heuristic (pattern 6 above), upgrade to LLM-generated names if users complain

2. **Memory confirmation UI**
   - What we know: Need to acknowledge when memory is stored via chat
   - What's unclear: Toast notification, inline message, or silent confirmation?
   - Recommendation: Inline assistant message "Remembered: auth-service is owned by Platform team" (low friction, clear)

3. **Auto-save frequency**
   - What we know: 1000-2000ms is standard for auto-save
   - What's unclear: Should debounce vary based on action type? (chat message vs undo/redo)
   - Recommendation: 1500ms debounce for all actions, flush immediately before session switch

4. **Diagram position persistence**
   - What we know: Should save diagram position (x, y, zoom)
   - What's unclear: Current codebase doesn't track diagram position (WhiteboardPanel is SVG display only)
   - Recommendation: Add pan/zoom to WhiteboardPanel in this phase or defer to future phase

## Sources

### Primary (HIGH confidence)
- [Dexie.js Official Docs - React Tutorial](https://dexie.org/docs/Tutorial/React)
- [Dexie.js Official Docs - Design Patterns](https://dexie.org/docs/Tutorial/Design)
- [Dexie.js Official Docs - useLiveQuery](https://dexie.org/docs/dexie-react-hooks/useLiveQuery())
- [Dexie.js Official Docs - Version.stores()](https://dexie.org/docs/Version/Version.stores())
- [Dexie.js Official Docs - TypeScript](https://dexie.org/docs/Typescript)
- [Zustand Official Docs - Persisting Store Data](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [MDN - Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

### Secondary (MEDIUM confidence)
- [Dexie.js Schema Design for Multiple Tables](https://app.studyraid.com/en/read/11356/355143/optimizing-database-schema-design)
- [LogRocket - Using Dexie.js in React Apps for Offline Data Storage](https://blog.logrocket.com/dexie-js-indexeddb-react-apps-offline-data-storage/)
- [Medium - Building a useAutoSave Hook with Debounce](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e)
- [Developer Way - How to Debounce in React](https://www.developerway.com/posts/debouncing-in-react)
- [Medium - Context Engineering in Agent Memory](https://medium.com/agenticais/context-engineering-in-agent-982cb4d36293)

### Tertiary (LOW confidence)
- [GitHub Discussion - Zustand Persist with IndexedDB](https://github.com/pmndrs/zustand/discussions/1721)
- [Stack Patterns - Session Management ChatGPT-style](https://www.patterns.dev/react/react-2026/)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Dexie.js is official recommendation for React IndexedDB, well-documented
- Architecture: HIGH - Patterns verified from official docs and production apps
- Pitfalls: MEDIUM - Based on common GitHub issues and community discussions, verified patterns

**Research date:** 2026-02-15
**Valid until:** March 15, 2026 (30 days - stable stack, unlikely to change)
