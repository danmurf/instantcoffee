# Phase 1: Foundation & Rendering Pipeline - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the foundation: chat input UI, D2 rendering pipeline, and modern SaaS aesthetic. Users can type messages in chat and see D2 diagrams render in whiteboard. No AI integration yet - that's Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Visual Style
- Clean SaaS aesthetic — white backgrounds, subtle grays, indigo accent
- Indigo/purple accent color for buttons and highlights
- System font stack (Inter, system-ui)
- Polished visual treatment — shadows, rounded corners, breathing room
- Modern SaaS look like Linear/Vercel

### Layout
- Side-by-side panels: chat on left, whiteboard on right
- Resizable panels with drag handle
- Responsive: stacks vertically on mobile, side-by-side on desktop
- Minimal UI chrome around workspace (maximize diagram space)

### Initial State
- Welcome message when app first opens
- Welcome includes example prompts user can click to try
- Diverse example prompts: sequence diagrams, ERDs, flowcharts

### Local Setup
- Simple npm: `npm install && npm run dev`
- Runtime check for Ollama and D2 availability on startup
- If missing: show actionable error with links to install

### Claude's Discretion
- Exact spacing and typography values
- Loading skeleton design
- Error state styling
- Panel default sizes

</decisions>

<specifics>
## Specific Ideas

- "Like Linear, Vercel — clean whites, subtle grays, accent colors"
- Example prompts should show diverse diagram types

</specifics>

<deferred>
## Deferred Ideas

- Voice input — Phase 2+
- Export functionality — Phase 3
- Session save/load — Phase 4

</deferred>

---

*Phase: 01-foundation-rendering*
*Context gathered: 2026-02-14*
