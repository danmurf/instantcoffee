# ☕ Instant Coffee

An instant diagram generator using D2 and Ollama.

## Overview

Instant Coffee translates natural language descriptions into D2 diagrams using a local LLM. Describe what you want in plain English, and the application renders it as an SVG diagram.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Prerequisites

- [Ollama](https://ollama.com/) running locally with a model installed

## Features

- Natural language to diagram conversion via Ollama
- Real-time SVG rendering with D2
- Source code editor for manual D2 tweaks
- Undo/Redo support (Ctrl+Z / Ctrl+Shift+Z)
- Export to SVG and PNG

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express
- **Diagram Engine**: D2
- **AI**: Ollama

## Project Structure

```
src/
├── components/     # React components
├── lib/           # D2 and Ollama utilities
├── hooks/         # Custom React hooks
├── types/         # TypeScript types
server/
└── index.js       # Express backend
```

## License

MIT
