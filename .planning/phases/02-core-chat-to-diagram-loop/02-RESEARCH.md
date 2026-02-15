# Phase 02: Core Chat-to-Diagram Loop - Research

**Researched:** February 14, 2026  
**Domain:** Ollama API integration, D2 diagram generation, React state management  
**Confidence:** HIGH

## Summary

This phase implements the core chat-to-diagram workflow where users describe diagrams in natural language and receive D2 syntax that renders to SVG. The integration uses Ollama's `/api/chat` endpoint with conversation history for iterative refinement. Streaming responses provide real-time feedback during generation, while the backend Express server renders D2 to SVG. Key challenges include prompt engineering for consistent D2 output, handling validation errors gracefully, and maintaining conversation context across multiple turns.

**Primary recommendation:** Use Ollama's streaming chat completion API (`POST /api/chat`) with message history, implement a system prompt that constrains D2 output, and build error boundaries around both Ollama connectivity and D2 rendering failures.

---

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fetch` (built-in) | N/A | HTTP requests to Ollama | Native browser API, no additional dependency |
| `react` | 18.x | UI framework | Project baseline from Phase 1 |
| `express` | 4.x | Backend server | Project baseline from Phase 1 |

### No Additional Dependencies Required

The implementation uses native browser APIs and existing project dependencies. No new packages needed for this phase.

**Installation:**
```bash
# No new dependencies - using existing project stack
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── ChatPanel.tsx      # Message input, history display
│   ├── WhiteboardPanel.tsx # SVG rendering area
│   └── LoadingSpinner.tsx  # Reusable loading indicator
├── hooks/
│   ├── useOllama.ts        # Ollama API communication
│   └── useChatHistory.ts   # Conversation state management
├── lib/
│   ├── ollama.ts           # Ollama client (NEW)
│   └── d2.ts               # Existing D2 rendering client
└── types/
    └── chat.ts             # Chat message types (NEW)
```

### Pattern 1: Streaming Chat Completion

**What:** Use Ollama's streaming API to receive D2 responses incrementally

**When to use:** For real-time user feedback during diagram generation

**Example:**
```typescript
// Source: Ollama API docs - https://github.com/ollama/ollama/blob/main/docs/api.md
async function* streamChatCompletion(
  model: string,
  messages: Message[],
  systemPrompt: string
): AsyncGenerator<string> {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const data = JSON.parse(line);
      if (data.message?.content) {
        yield data.message.content;
      }
    }
  }
}
```

### Pattern 2: Conversation Context Management

**What:** Maintain full message history plus current D2 state for iterative refinement

**When to use:** For ITER-01 and ITER-02 requirements (iterative changes)

**Example:**
```typescript
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  d2Source?: string; // D2 code from assistant, if applicable
}

interface ConversationState {
  messages: ChatMessage[];
  currentD2: string;        // Latest valid D2 diagram
  isGenerating: boolean;
  error: string | null;
}

function useChatHistory() {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    currentD2: '',
    isGenerating: false,
    error: null
  });

  const addUserMessage = (content: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content }]
    }));
  };

  const addAssistantMessage = (content: string, d2Source?: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'assistant', content, d2Source }],
      currentD2: d2Source || prev.currentD2
    }));
  };

  return { state, addUserMessage, addAssistantMessage };
}
```

### Pattern 3: D2 Output Extraction

**What:** Parse D2 code from AI response using delimiters or pattern matching

**When to use:** To separate explanatory text from D2 diagram code

**Example:**
```typescript
function extractD2Code(response: string): { explanation: string; d2Code: string } {
  // Look for D2 code blocks marked with ```d2 or ```
  const d2BlockMatch = response.match(/```d2\n([\s\S]*?)```/);
  
  if (d2BlockMatch) {
    return {
      explanation: response.replace(d2BlockMatch[0], '').trim(),
      d2Code: d2BlockMatch[1].trim()
    };
  }
  
  // Fallback: treat entire response as D2 if it looks like D2
  if (response.includes(':') && response.includes('[')) {
    return { explanation: '', d2Code: response };
  }
  
  // No D2 found - return as explanation
  return { explanation: response, d2Code: '' };
}
```

### Pattern 4: Error Handling for Ollama Unavailability

**What:** Graceful degradation when Ollama is unreachable

**When to use:** For CORE-05 requirement (clear error messages)

**Example:**
```typescript
async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function sendChatWithFallback(
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<string> {
  // Check availability first
  const isAvailable = await checkOllamaHealth();
  
  if (!isAvailable) {
    throw new Error(
      'Ollama is not available. Please ensure Ollama is running:\n' +
      '1. Open Terminal\n' +
      '2. Run: ollama serve\n' +
      '3. Ensure a model is downloaded: ollama pull llama3.2'
    );
  }
  
  // Proceed with streaming chat...
}
```

### Anti-Patterns to Avoid

- **Single request without history:** Don't send only the latest message. The AI won't know what diagram it's modifying.
- **No D2 validation:** Never render AI output directly without extracting D2 code first.
- **Blocking UI during streaming:** Don't block the entire interface; show partial responses as they arrive.
- **Ignoring connection errors:** Always implement retry logic with exponential backoff.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP streaming | Custom readable stream implementation | Native fetch with ReadableStream | Browser native, well-tested |
| JSON parsing | Regex-based extraction | `JSON.parse()` with try/catch | Robust against malformed input |
| Abort long requests | Custom timeout logic | `AbortController` | Built into fetch API |
| SVG rendering | Client-side D2 compiler | Express backend with `d2` CLI | D2 requires Go runtime |

---

## Common Pitfalls

### Pitfall 1: Missing D2 Code in Response

**What goes wrong:** AI provides explanation without D2 code, or includes extra text around D2

**Why it happens:** Default prompts don't specify required output format

**How to avoid:** Use strict system prompt with format requirements:
```typescript
const SYSTEM_PROMPT = `You are a diagram generation assistant. 
Generate D2 diagram code based on user requests.

OUTPUT FORMAT:
- Always include D2 code in a code block marked with \`\`\`d2
- Provide brief explanation before the diagram
- D2 syntax reference: https://d2lang.com/tour/intro

Example:
user: "A simple flowchart"
assistant: "Here's a flowchart diagram:
\`\`\`d2
start => operation => end
\`\`\`"

Now generate diagrams following this format.`;
```

**Warning signs:** `extractD2Code()` returns empty `d2Code`, rendering fails

### Pitfall 2: Streaming Without Error Handling

**What goes wrong:** Network interruption during streaming leaves UI in inconsistent state

**Why it happens:** Not catching errors mid-stream

**How to avoid:**
```typescript
async function* safeStreamChat(...) {
  try {
    for await (const chunk of streamChat(...)) {
      yield chunk;
    }
  } catch (error) {
    // Reset generation state, show error
    yield { type: 'error', message: error.message };
  }
}
```

### Pitfall 3: Context Window Overflow

**What goes wrong:** Long conversation history exceeds model's context limit

**Why it happens:** Unbounded message array growth

**How to avoid:** Implement sliding window or truncation:
```typescript
const MAX_CONTEXT_MESSAGES = 20;

function trimHistory(messages: Message[]): Message[] {
  if (messages.length > MAX_CONTEXT_MESSAGES) {
    // Keep system prompt + most recent messages
    const systemMsg = messages[0]; // Assume first is system
    return [
      systemMsg,
      ...messages.slice(-(MAX_CONTEXT_MESSAGES - 1))
    ];
  }
  return messages;
}
```

### Pitfall 4: D2 Rendering Errors from Invalid Syntax

**What goes wrong:** AI generates syntactically invalid D2

**Why it happens:** LLM hallucination or unclear prompts

**How to avoid:** Validate D2 before rendering:
```typescript
async function validateAndRender(d2Source: string): Promise<string> {
  // Basic syntax check - look for common issues
  const hasBrackets = d2Source.includes('[') && d2Source.includes(']');
  const hasArrows = d2Source.includes('=>');
  
  if (!hasBrackets && !hasArrows) {
    throw new Error('Invalid D2: No shapes or connections detected');
  }
  
  // Proceed to render - backend will catch remaining errors
  return renderD2(d2Source);
}
```

---

## Code Examples

### Complete Chat Flow Hook

```typescript
// Source: Based on Ollama API + React patterns
import { useState, useCallback, useRef } from 'react';
import { renderD2 } from 'lib/d2';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  d2Source?: string;
}

const OLLAMA_BASE = 'http://localhost:11434';
const MODEL = 'llama3.2';

const SYSTEM_PROMPT = `You are a D2 diagram generation assistant.
Generate D2 code for: sequence diagrams, ERDs, flowcharts, and architecture diagrams.
Always output D2 code in a \`\`\`d2 code block.
Keep diagrams simple and clear.`;

export function useChatToDiagram() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentD2, setCurrentD2] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (userInput: string) => {
    setIsGenerating(true);
    setError(null);

    // Add user message
    const userMessage: Message = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Build messages with system prompt
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        userMessage
      ];

      // Stream from Ollama
      const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: apiMessages,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama unavailable: ${response.status}`);
      }

      // Accumulate response
      let fullResponse = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
              // Could update UI with partial response here
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Extract D2 code
      const d2Match = fullResponse.match(/```d2\n([\s\S]*?)```/);
      const d2Code = d2Match ? d2Match[1].trim() : '';

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        d2Source: d2Code
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Render diagram if D2 found
      if (d2Code) {
        const svg = await renderD2(d2Code);
        setCurrentD2(d2Code);
        return svg;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [messages]);

  return {
    messages,
    currentD2,
    isGenerating,
    error,
    generate
  };
}
```

### Loading State UI

```typescript
// Source: Tailwind CSS patterns
function LoadingState({ message = 'Generating diagram...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-4 space-x-2">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Non-streaming Ollama requests | Streaming with real-time feedback | Ollama 0.1+ | Users see progress during generation |
| Single-shot diagram generation | Conversation history for iteration | This phase | Supports iterative refinement |
| No D2 validation | Extract D2 from response + backend validation | This phase | Better error messages |

**Deprecated/outdated:**
- `POST /api/generate` - Use `/api/chat` for conversation support
- Client-side D2 compilation - Not viable (requires Go runtime)

---

## Open Questions

1. **Which Ollama model to use?**
   - What we know: llama3.2 is recommended for general use, codellama may be better for technical diagrams
   - What's unclear: Performance comparison for D2-specific generation
   - Recommendation: Start with llama3.2, test codellama:code as alternative

2. **How to handle very large diagrams?**
   - What we know: D2 CLI has timeout limits, complex diagrams take longer
   - What's unclear: Optimal timeout values, progressive rendering
   - Recommendation: Start with 30s timeout (existing in d2.ts), adjust based on testing

3. **Should D2 rendering happen on each streaming chunk or only on final response?**
   - What we know: Real-time updates (CORE-04) suggests incremental rendering
   - What's unclear: Performance impact of frequent re-renders
   - Recommendation: Render on final response initially, add streaming rendering if performance allows

---

## Sources

### Primary (HIGH confidence)
- Ollama API Documentation - https://github.com/ollama/ollama/blob/main/docs/api.md
- D2 Language Tour - https://d2lang.com/tour/intro
- D2 Oracle API - https://d2lang.com/tour/api

### Secondary (MEDIUM confidence)
- Existing project code (src/lib/d2.ts, server/index.js) - Verified current implementation

### Tertiary (LOW confidence)
- Community discussions on prompt engineering for code generation - marked for validation during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using native browser APIs and existing project dependencies
- Architecture: HIGH - Based on verified Ollama API documentation
- Pitfalls: MEDIUM - Common patterns identified, some specific issues may emerge during implementation

**Research date:** February 14, 2026
**Valid until:** March 14, 2026 (Ollama API is stable; D2 language changes infrequently)
