# AGENTS.md - Agentic Coding Guidelines

This file provides guidelines for agents working on this codebase.

## Project Overview

- **Project Name**: Instant Coffee
- **Type**: Web Application (Vite + React + TypeScript)
- **Description**: Instant diagram generator using Mermaid and Ollama
- **Tech Stack**: React 18, TypeScript 5, Vite 6, Tailwind CSS 3

---

## Commands

### Development

```bash
npm run dev          # Start Vite dev server (port 5173)
```

### Build & Preview

```bash
npm run build       # Production build to dist/
npm run preview     # Preview production build
```

### Testing

> **Note**: No test framework is currently configured. Do not write tests unless one is installed.

If tests are added (prefer Vitest), run them with:
```bash
npm test            # Run all tests
npm test -- --run   # Run tests once (non-watch mode)
npm test -- --run src/components/  # Run single file/folder
```

### Linting

> **Note**: No linter is currently configured.

If ESLint is added, run:
```bash
npm run lint        # Lint all files
npm run lint -- --fix src/file.ts  # Fix auto-fixable issues
```

---

## Code Style Guidelines

### TypeScript

- **Always use explicit types** for function parameters and return values
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any` - use `unknown` when type is truly unknown
- Prefer `const` over `let` - use `let` only when reassignment is necessary

```typescript
// Good
function handleSubmit(data: FormData): Promise<void> { ... }
interface User { id: number; name: string; }

// Avoid
function handleSubmit(data) { ... }
```

### Imports

- Use absolute imports from `src/` root (configured in tsconfig.json)
- Order: external libs → internal components → internal utils/styles
- Group imports with blank lines between groups

```typescript
// React
import { useState, useEffect } from 'react';

// Components
import { Layout } from 'components/Layout';
import { ChatPanel } from 'components/ChatPanel';

// Utils
import { renderMermaid } from 'lib/mermaid';
import { api } from 'lib/api';
```

### Naming Conventions

- **Files**: PascalCase for components (`ChatPanel.tsx`), camelCase for utils (`api.ts`)
- **Components**: PascalCase (`function MyComponent()`)
- **Variables/functions**: camelCase
- **Interfaces**: PascalCase, prefix with `I` only when needed for disambiguation
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for object constants

```typescript
const MAX_RETRIES = 3;
const config = { apiUrl: '/api' };
function handleClick() { ... }
interface UserProfile { ... }
```

### React Patterns

- Use functional components with hooks
- Destructure props for clarity
- Keep components focused (single responsibility)
- Extract logic into custom hooks when reusable

```typescript
interface Props {
  title: string;
  onSubmit: (data: Data) => void;
}

export function MyComponent({ title, onSubmit }: Props) {
  const [value, setValue] = useState('');
  
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

### Error Handling

- Use try/catch for async operations
- Check `err instanceof Error` before accessing `.message`
- Provide user-friendly error messages

```typescript
try {
  const result = await fetchData();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to fetch data');
}
```

### CSS / Tailwind

- Use Tailwind utility classes for styling
- Extract repetitive class combinations into components
- Use arbitrary values sparingly (`bg-[#hex]`)

```tsx
// Good
<div className="flex items-center justify-between p-4">

// Avoid inline styles unless dynamic
<div style={{ padding: '1rem' }}>
```

---

## Project Structure

```
src/
├── components/     # React components
│   ├── Layout.tsx
│   ├── ChatPanel.tsx
│   └── WhiteboardPanel.tsx
├── lib/            # Utilities and libraries
│   └── mermaid.ts
├── hooks/          # Custom React hooks
├── types/          # TypeScript types
├── App.tsx         # Root component
├── main.tsx        # Entry point
└── index.css       # Global styles

dist/               # Production build output (gitignored)
```

---

## General Guidelines

1. **Keep changes focused** - one feature/fix per commit
2. **Verify builds** - run `npm run build` before submitting changes
3. **No secrets** - never commit `.env` files or credentials
4. **TypeScript strictness** - maintain type safety, do not use `as any`
5. **Accessibility** - use semantic HTML and ARIA labels where needed

---

## Adding Dependencies

Before adding new packages:
1. Check if functionality already exists in dependencies
2. Prefer established, well-maintained libraries
3. Run `npm install <package>` and commit `package-lock.json`

---

## When Unsure

- Follow existing code patterns in the repository
- Keep code simple and readable
- Ask for clarification if requirements are ambiguous
