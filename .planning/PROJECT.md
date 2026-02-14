# Instant Coffee

## What This Is

A collaborative whiteboarding tool that facilitates diagramming sessions through conversation. Users chat their intent and Instant Coffee translates it into D2 diagrams in real-time, rendering locally. The iteration is quick and fluid—user says what they want, diagram updates until it matches their vision.

## Core Value

Users can instantly create accurate diagrams by describing what they want in natural language, without learning D2 syntax.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Real-time D2 diagram generation from chat messages
- [ ] Interactive whiteboard display with live diagram rendering
- [ ] Support for multiple diagram types (sequence diagrams, ERDs, architecture diagrams)
- [ ] Iterative refinement through conversational updates
- [ ] Local execution using Ollama for AI capabilities
- [ ] Local D2 rendering in browser
- [ ] Session save/restore functionality
- [ ] Semantic memory system for remembering system details (services, teams, etc.)

### Out of Scope

- [Cloud deployment] — Local POC first, cloud optional future enhancement
- [Mobile app] — Web-based only for v1
- [Real-time multi-user collaboration] — Single user session for v1
- [Voice input] — Text-only for v1 (mentioned as future feature)

## Context

- **D2 Reference:** https://github.com/terrastruct/d2 — diagram as code language
- **D2 Sketch Mode:** https://d2lang.com/tour/sk/ — hand-drawn aesthetic option
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
| D2 for all diagrams | User specified D2 is the diagram tool | — Pending |
| Local Ollama for AI | Explicit requirement for local execution | — Pending |

---
*Last updated: 2026-02-14 after initialization*
