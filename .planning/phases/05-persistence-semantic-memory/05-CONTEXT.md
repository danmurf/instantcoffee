# Phase 5: Persistence & Semantic Memory - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can save their work and teach the system about their infrastructure. Sessions persist across browser sessions. Semantic memory (services, teams, preferences) is stored globally and injected into AI prompts. Creating new diagram types or AI capabilities are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Session save/load
- Auto-save in background continuously, plus manual named saves
- Save everything: chat history, current Mermaid source, undo/redo stack, diagram position
- When loading a different session, warn if current session has unsaved changes
- Explicit "New Session" button that auto-saves current work first, then starts blank

### Memory input
- Two input methods: natural language in chat ("remember that auth-service is owned by Platform team") AND a dedicated memory management panel
- Memory covers: services & components, team ownership, diagram preferences, plus anything else Claude determines is useful
- Users can edit and delete memories from both the panel and via chat ("forget about auth-service", "update: auth-service now runs on GCP")

### Memory in prompts
- All memories included in every prompt (no selective filtering)
- Global scope — memories available across all sessions, not per-session
- No hard limit on memory count

### Session organization
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

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-persistence-semantic-memory*
*Context gathered: 2026-02-15*
