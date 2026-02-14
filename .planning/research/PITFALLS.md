# Domain Pitfalls

**Domain:** Local-first conversational diagram generator with D2 and Ollama
**Researched:** 2025-02-14
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Trusting AI-Generated D2 Syntax Without Validation

**What goes wrong:** The LLM generates D2 syntax that either fails to render or produces incorrect diagrams. D2 has specific syntax requirements (indentation, quoting, shape declarations) that LLMs frequently get wrong. Invalid D2 silently fails to render or produces garbled output.

**Why it happens:** LLMs hallucinate syntax patterns, especially for less-documented languages. D2's syntax is relatively new and differs from Mermaid.js or PlantUML. The model may produce valid-looking but semantically incorrect D2 code.

**Consequences:** Users see blank diagrams or error messages. Debugging AI-generated code is difficult because the user did not write the code themselves. This breaks the core value proposition of "chat to diagram."

**Prevention:** Implement a validation pipeline between AI output and rendering. Parse the D2 output for syntax correctness before passing to the D2 CLI. Run D2 with error capture and provide meaningful feedback to the user when rendering fails. Consider a secondary AI call to "review and fix" the generated D2 code.

**Detection:** Monitor render failure rates. Log failed D2 syntax for analysis. Test with diverse prompt inputs to identify failure patterns.

**Phase:** This should be addressed in the **Core Rendering Pipeline** phase (Phase 1-2). Without reliable validation, subsequent phases cannot build on a stable foundation.

### Pitfall 2: Blocking the UI During AI Generation

**What goes wrong:** The chat interface freezes while waiting for Ollama to respond. Users experience 5-30 second delays with no feedback. The app feels unresponsive and broken.

**Why it happens:** Making synchronous calls to Ollama blocks the main thread. React state updates do not occur until the call completes. This is especially problematic with local LLMs that may take longer than cloud APIs.

**Consequences:** Poor user experience. Users may think the app is hung and refresh, losing conversation context. The "real-time" promise of the product is violated.

**Prevention:** Implement streaming responses from Ollama. Use React Query or SWR for async state management. Show loading indicators, progress messages, and partial diagram updates as tokens arrive. Never block the main thread.

**Detection:** Measure time-to-first-render. Monitor for frozen UI reports. Test on slower hardware.

**Phase:** Address in **Real-time Chat Interface** phase (Phase 2). This is fundamental to the interactive experience.

### Pitfall 3: No Conversation Context or History Management

**What goes wrong:** "Add a node for the database" fails because the AI has no memory of the previous diagram. Each message is treated independently. The user cannot iterate on diagrams through conversation.

**Why it happens:** Not implementing conversation history in the Ollama prompt. Each chat message is sent in isolation without the current D2 code or previous context.

**Consequences:** The conversational workflow breaks. Users must describe entire diagrams from scratch each time. This defeats the purpose of a "chat-based" diagram tool.

**Prevention:** Maintain conversation history. Include the current D2 source in the system prompt. Allow the AI to "see" and modify existing diagrams. Implement chat context window management to prevent prompt overflow.

**Detection:** Test iterative editing scenarios. Verify the AI can reference and modify previous diagram state.

**Phase:** **Core Rendering Pipeline** and **Real-time Chat Interface** (Phase 1-2). This is essential for the core workflow.

### Pitfall 4: Storing SVG Instead of D2 Source Code

**What goes wrong:** Diagrams become uneditable. Users cannot modify the generated D2 code. The "chat to edit" workflow is impossible because only the rendered SVG exists.

**Why it happens:** Saving the SVG output from D2 directly to storage. The D2 source text is discarded after rendering.

**Consequences:** Loss of editability. Inability to re-render with different themes or layout engines. Collaboration features become much harder to implement later. Storage bloat (SVG is larger than D2 text).

**Prevention:** Always store the D2 source code as the primary artifact. Re-render SVG on load. Treat SVG as a cache, not the source of truth.

**Detection:** Verify storage schema includes D2 source field. Test loading and re-editing saved diagrams.

**Phase:** **Local Storage & Persistence** phase (Phase 2). This decision is foundational and difficult to reverse.

## Moderate Pitfalls

### Pitfall 5: Inadequate Error Messages from D2 Rendering Failures

**What goes wrong:** When D2 fails to render, users see cryptic error output or nothing at all. They cannot fix their prompts to generate valid diagrams.

**Why it happens:** Not capturing and parsing D2 CLI error output. Passing errors directly to the user without translation.

**Consequences:** Users abandon the tool when diagrams fail. Debugging AI prompts becomes impossible without error context.

**Prevention:** Capture stderr from D2. Parse common D2 error patterns. Translate technical errors into user-friendly messages. Show the specific line or syntax that failed if possible.

**Phase:** **Core Rendering Pipeline** (Phase 1-2). Error handling is foundational.

### Pitfall 6: No Way to Manually Edit Generated D2 Code

**What goes wrong:** Users cannot fix AI mistakes. The generated diagram has errors but users can only regenerate from scratch, not fine-tune the code.

**Why it happens:** Building only the chat-to-diagram flow. Not exposing the D2 source code to users for manual editing.

**Consequences:** User frustration when AI produces close-but-incorrect diagrams. Lack of escape hatch when AI fails.

**Prevention:** Show the generated D2 code in a side panel or modal. Allow users to edit directly and re-render. This creates a hybrid workflow (chat + manual).

**Phase:** **D2 Source Editor** phase (Phase 3). Valuable for iteration workflows.

### Pitfall 7: Ignoring Model Capabilities and Limitations

**What goes wrong:** The chosen model (minimax-m2.5:cloud) may struggle with specific diagram types, complex layouts, or D2-specific syntax. Prompt engineering fails to account for these limitations.

**Why it happens:** Not testing diverse diagram types with the specific model. Assuming all LLMs handle code generation equally well.

**Consequences:** Inconsistent diagram quality. Users blame themselves when diagrams fail, rather than understanding model limitations.

**Prevention:** Test the model extensively with different diagram types and prompt styles. Build prompts that work within model capabilities. Consider fallback strategies or model switching for complex cases.

**Phase:** **Prompt Engineering & Model Tuning** (Phase 2-3). Requires iteration based on testing.

### Pitfall 8: No Graceful Degradation When Ollama Is Unavailable

**What goes wrong:** The app crashes or shows unhelpful errors when Ollama is not running, not installed, or the model is not pulled.

**Why it happens:** No connection checking, no user-friendly onboarding for Ollama setup. No offline mode or clear error states.

**Consequences:** Users cannot use the app. First-time user experience fails completely if Ollama is not set up.

**Prevention:** Check Ollama availability on app load. Provide clear setup instructions. Show status indicators. Handle connection errors gracefully with retry options.

**Phase:** **Error Handling & Edge Cases** (Phase 2). Critical for usability.

## Minor Pitfalls

### Pitfall 9: Overly Complex System Prompts

**What goes wrong:** The AI receives too much context, causing slower responses, higher token usage, and worse diagram quality due to context window pressure.

**Why it happens:** Including full D2 documentation, excessive examples, or unlimited conversation history in prompts.

**Consequences:** Slower response times. Higher local resource usage. Possible context truncation where important information is lost.

**Prevention:** Keep system prompts concise. Include only essential D2 syntax reference. Implement smart context window management (summarize old messages, truncate history).

**Phase:** **Prompt Engineering & Model Tuning** (Phase 2-3).

### Pitfall 10: No Version Control for Diagrams

**What goes wrong:** Users cannot undo changes or see diagram history. A bad edit destroys work with no recovery path.

**Why it happens:** Not implementing version control or history tracking for D2 source changes.

**Consequences:** Users fear making changes. No way to explore alternative diagram versions.

**Prevention:** Implement basic versioning for D2 source. Store previous versions on each regeneration. Allow reverting to previous states.

**Phase:** **Advanced Features** (Phase 4+). Nice-to-have for iteration workflows.

### Pitfall 11: Fixed Layout Engine Without User Control

**What goes wrong:** The D2 layout engine (default is Dagre) produces poor results for certain diagram types, but users cannot switch layout engines.

**Why it happens:** Hardcoding a single layout engine. Not exposing D2's multiple layout options (Dagre, ELK, Tala).

**Consequences:** Suboptimal diagrams for specific use cases. Users cannot optimize diagram readability.

**Prevention:** Allow layout engine selection in settings or per-diagram. Document when each engine works best.

**Phase:** **Advanced Features** (Phase 4+). Lower priority but improves diagram quality.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core Rendering Pipeline (Phase 1-2) | Pitfalls 1, 3, 4, 5 | Validate D2 output, maintain conversation context, store source not SVG, parse D2 errors |
| Real-time Chat Interface (Phase 2) | Pitfall 2 | Implement streaming, never block UI |
| Prompt Engineering (Phase 2-3) | Pitfall 7, 9 | Test model extensively, keep prompts concise |
| D2 Source Editor (Phase 3) | Pitfall 6 | Expose D2 source for manual editing |
| Advanced Features (Phase 4+) | Pitfalls 10, 11 | Consider versioning and layout options |

## Sources

- **D2 Official Documentation**: https://d2lang.com/ — D2 syntax requirements and CLI usage
- **D2 GitHub Issues**: https://github.com/terrastruct/d2 — Common syntax errors and rendering issues reported by users
- **Ollama Documentation**: https://github.com/ollama/ollama — Local LLM integration patterns and streaming
- **LLM Code Generation Challenges**: General research on LLM code hallucination and validation strategies
- **Local-First Web Development**: https://localfirstweb.dev/ — Local storage patterns and offline considerations
