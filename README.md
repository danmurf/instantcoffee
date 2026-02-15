# ☕ Instant Coffee

An instant diagram generator using Mermaid and Ollama.

## Overview

Instant Coffee translates natural language descriptions into Mermaid diagrams using a local LLM. Describe what you want in plain English, and the application renders it as an SVG diagram.

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
- Real-time SVG rendering with Mermaid (client-side)
- Source code editor for manual Mermaid tweaks
- Undo/Redo support (Ctrl+Z / Ctrl+Shift+Z)
- Export to SVG and PNG

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Diagram Engine**: Mermaid.js (client-side)
- **AI**: Ollama

## Project Structure

```
src/
├── components/     # React components
├── lib/           # Mermaid and Ollama utilities
├── hooks/         # Custom React hooks
├── types/         # TypeScript types
```

## License

MIT
