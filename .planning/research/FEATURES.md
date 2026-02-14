# Feature Landscape

**Domain:** Conversational AI Diagram Generator (D2 + Ollama)
**Researched:** 2025-02-14
**Confidence:** MEDIUM

Research based on analysis of D2, Mermaid.js, and emerging AI diagram tools. Limited publicly available research specifically on "conversational" diagram generators, but inference drawn from text-to-diagram tools and AI assistant patterns.

## Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Text input for diagram description | Core value proposition - users type intent, get diagram | LOW | Natural language input field |
| Diagram rendering/display | Users must SEE the diagram they created | LOW | D2 renders to SVG in browser |
| Export to image (PNG/SVG) | Diagrams need to be shared outside app | MEDIUM | D2 supports SVG/PNG export |
| Basic diagram types (flowchart, sequence, ERD) | Most common use cases | MEDIUM | D2 supports these natively |
| Real-time preview | Immediate feedback loop is essential | MEDIUM | Watch mode pattern from D2 CLI |
| Edit generated diagram | AI output needs manual adjustment | HIGH | Requires D2 source editor + visual |
| Undo/redo | Basic editing safety net | LOW | Standard editor expectation |
| Zoom/pan on canvas | Large diagrams need navigation | LOW | Essential for usability |

## Differentiators (Competitive Advantage)

Features that set product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Conversational interface | Natural chat-based workflow vs writing D2 syntax | LOW | Core differentiator - chat with AI |
| Local-first (Ollama) | Privacy, no cloud dependency, offline capable | HIGH | Unique vs cloud AI diagram tools |
| Iterative refinement via chat | "Make it bigger" / "Add a node" - conversational editing | LOW | Natural language refinement |
| D2 source visibility | Users learn D2 incrementally, transparency | MEDIUM | Show underlying D2 code |
| Multi-diagram support | Multiple canvases/tabs | MEDIUM | Organize work into projects |
| Diagram history/versioning | Rollback, compare versions | HIGH | Local storage enables this |
| Template library | Quick starts for common patterns | MEDIUM | Pre-built prompts/templates |
| Shape library / custom shapes | Extend beyond basic D2 shapes | HIGH | D2 supports custom icons/shapes |

## Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time collaborative editing | "Google Docs for diagrams" | Local-first makes this complex; conflicts with Ollama single-user model | Focus on single-user first, consider async sharing later |
| Cloud sync | "Access from anywhere" | Contradicts local-first value prop; adds infrastructure complexity | Emphasize local storage benefits |
| Pre-built diagram templates (extensive) | "Get started quickly" | Can limit understanding of how to create own diagrams; bloat | Keep minimal starter templates |
| Auto-save to cloud | "Never lose work" | Local-first means local storage; cloud creates privacy concerns | Robust local persistence |
| Plugin/extension system | "Extensibility" | Adds significant complexity; premature for POC | Focus on core experience first |
| Team/workspace features | "Collaboration" | Different from single-user diagram creation | Defer to v2+ |

## Feature Dependencies

```
[Conversational Input]
        │
        └──requires──> [AI Processing (Ollama)]
                            │
                            └──requires──> [D2 Generation]
                                                    │
                                                    └──requires──> [Diagram Rendering]
                                                                             │
                                                                             └──requires──> [Export]

[Iterative Refinement] ──enhances──> [Conversational Input]

[Diagram History] ──requires──> [Local Storage]

[Multi-diagram Projects] ──requires──> [Basic Rendering]
```

### Dependency Notes

- **Conversational input requires AI processing:** The chat interface only provides value if Ollama generates D2 from natural language
- **AI processing requires D2 generation:** Ollama outputs must be valid D2 syntax for rendering
- **D2 generation requires diagram rendering:** Users need to see output; D2-to-SVG in browser
- **Export requires rendering:** Can only export rendered diagrams (PNG/SVG)
- **Iterative refinement enhances conversational input:** The ability to say "make it bigger" builds on core chat interface
- **Multi-diagram projects requires basic rendering:** Foundation must work before managing multiple diagrams
- **Diagram history requires local storage:** Local-first architecture enables versioning without cloud

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Conversational input** — Type natural language, receive D2 diagram
- [x] **Diagram rendering** — D2 renders in browser as SVG
- [x] **Basic diagram types** — Flowchart, sequence, ERD support via D2
- [x] **Real-time preview** — See diagram update as you interact
- [x] **Local Ollama integration** — Privacy-first, no cloud dependency

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Export to PNG/SVG** — Share diagrams externally
- [ ] **D2 source editor** — Edit underlying code directly
- [ ] **Iterative refinement** — "Make nodes larger" style edits
- [ ] **Undo/redo** — Editing safety net
- [ ] **Zoom/pan** — Navigate large diagrams

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Multi-diagram projects/tabs** — Organize work
- [ ] **Diagram history/versioning** — Rollback capability
- [ ] **Template library** — Quick-start patterns
- [ ] **Custom shapes/icons** — Extend D2 capabilities

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Conversational input | HIGH | LOW | P1 |
| Diagram rendering | HIGH | LOW | P1 |
| Real-time preview | HIGH | MEDIUM | P1 |
| Local Ollama integration | HIGH | HIGH | P1 |
| Basic diagram types | HIGH | MEDIUM | P1 |
| Export (PNG/SVG) | MEDIUM | MEDIUM | P2 |
| D2 source editor | MEDIUM | MEDIUM | P2 |
| Iterative refinement | MEDIUM | LOW | P2 |
| Undo/redo | MEDIUM | LOW | P2 |
| Zoom/pan | MEDIUM | LOW | P2 |
| Multi-diagram projects | MEDIUM | MEDIUM | P3 |
| Diagram versioning | LOW | HIGH | P3 |
| Template library | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | D2 (CLI) | Mermaid.js | ChatGPT (Vision) | Eraser.io | Our Approach |
|---------|----------|------------|------------------|-----------|---------------|
| Text-to-diagram | YES (manual syntax) | YES (manual syntax) | YES (paid) | YES (paid) | YES - conversational |
| Natural language input | NO | NO | YES | YES | YES - core differentiator |
| Local/offline | YES | YES | NO | NO | YES - unique value |
| Browser-based | NO (CLI) | YES | NO | YES | YES - D2 in browser |
| Real-time preview | YES (watch mode) | YES (live editor) | NO | YES | YES |
| Export | YES | YES | NO | YES | YES |
| Collaboration | NO | NO | NO | YES | NO (local-first) |
| Chat refinement | NO | NO | YES | LIMITED | YES - unique |

## Sources

- D2 Official Documentation (https://d2lang.com/tour/intro)
- Mermaid.js Documentation (https://mermaid.js.org/intro/)
- Web search: "AI diagram generator features comparison 2025"
- Competitor analysis: Eraser.io (DiagramGPT), ChatGPT diagram capabilities
- General diagramming tool patterns from MockFlow, Lucidchart, Zapier comparisons

---

*Feature research for: Instant Coffee - Conversational D2 Diagram Generator*
*Researched: 2025-02-14*
