# Instant Coffee

## What This Is

A collaborative whiteboarding tool that facilitates diagramming sessions through conversation. Users chat their intent and Instant Coffee translates it into Mermaid diagrams in real-time, rendering locally. The iteration is quick and fluid—user says what they want, diagram updates until it matches their vision.

## Core Value

Users can instantly create accurate diagrams by describing what they want in natural language, without learning diagram syntax.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Real-time Mermaid diagram generation from chat messages
- [ ] Interactive whiteboard display with live diagram rendering
- [ ] Support for multiple diagram types (sequence diagrams, ERDs, architecture diagrams)
- [ ] Iterative refinement through conversational updates
- [ ] Local execution using Ollama for AI capabilities
- [ ] Client-side Mermaid rendering in browser
- [ ] Session save/restore functionality
- [ ] Semantic memory system for remembering system details (services, teams, etc.)

### Out of Scope

- [Cloud deployment] — Local POC first, cloud optional future enhancement
- [Mobile app] — Web-based only for v1
- [Real-time multi-user collaboration] — Single user session for v1
- [Voice input] — Text-only for v1 (mentioned as future feature)

## Context

- **Mermaid.js Reference:** https://mermaid.js.org/ — client-side diagram rendering
- **Ollama:** Local LLM execution for privacy and offline capability
- **Initial Scope:** Local-first POC to validate the core interaction model

## Constraints

- **Local Execution**: Everything must run locally — no external APIs, all processing on-device
- **Browser-based**: User opens in web browser, no installation required beyond initial setup
- **Modern Design**: Simple, modern, beautiful — like a modern SaaS product

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tech stack: TBD | User has no preference, will pick based on local-first requirements | — Pending |
| Mermaid for all diagrams | Mermaid provides client-side rendering without CLI dependency | — Phase 4 |
| Local Ollama for AI | Explicit requirement for local execution | — Pending |
| Migrated from D2 to Mermaid | Client-side rendering, no CLI dependency, better LLM compatibility | — Phase 4 |

---
*Last updated: 2026-02-15 after Phase 4 migration to Mermaid*
