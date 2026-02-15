# Phase 6 Research: LLM Tool Calling for Diagram Updates

**Phase:** 06-use-llm-tool-calling-for-diagram-updates  
**Date:** 2026-02-15

---

## Research Question

How to implement LLM tool calling with Ollama to enable the AI to update Mermaid diagrams while also providing text responses?

---

## Ollama Tool Calling API

Ollama supports tool calling via the `/api/chat` endpoint with a `tools` parameter.

### Request Format

```typescript
{
  "model": "llama3.2",
  "messages": [
    { "role": "user", "content": "add a user database to the diagram" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "update_diagram",
        "description": "Update the Mermaid diagram with new content",
        "parameters": {
          "type": "object",
          "properties": {
            "mermaid_code": {
              "type": "string",
              "description": "The complete Mermaid diagram code"
            }
          },
          "required": ["mermaid_code"]
        }
      }
    }
  ]
}
```

### Response Format

When the model decides to use a tool, the response includes `tool_calls`:

```json
{
  "message": {
    "role": "assistant",
    "content": "I'll add a database for users.",
    "tool_calls": [
      {
        "function": {
          "name": "update_diagram",
          "arguments": {
            "mermaid_code": "flowchart TD\n  A[User] --> B[API"
          }
        }
      }
    ]
  },
  "done": true
}
```

### Tool Result Feedback Loop

After receiving tool calls, the client must:
1. Execute the tool(s)
2. Send the results back as a message with role: `tool`
3. Continue the conversation

```typescript
// After receiving tool_calls
const toolMessage = {
  role: "tool",
  content: JSON.stringify(toolResult),
  tool_name: "update_diagram"
};

// Send back to continue
await streamChat(model, [...messages, toolMessage], callbacks);
```

---

## Tool Definition for Diagram Updates

### Tool Schema

```typescript
const diagramTool = {
  type: "function" as const,
  function: {
    name: "update_diagram",
    description: "Update the Mermaid diagram with new content. Use this when the user wants to create or modify a diagram. If the user is just asking a question without requesting a diagram change, do NOT call this tool.",
    parameters: {
      type: "object",
      properties: {
        mermaid_code: {
          type: "string",
          description: "The complete Mermaid diagram code to render"
        }
      },
      required: ["mermaid_code"]
    }
  }
};
```

### Instruction in System Prompt

The system prompt must instruct the model when to use the tool:

```
TOOL USE:
- Use the 'update_diagram' tool when the user wants to create or modify a Mermaid diagram
- Do NOT use the tool if the user is just asking a question, making small talk, or not requesting any diagram changes
- When using the tool, provide the COMPLETE updated diagram code, not just the changes
```

---

## Implementation Approach

### 1. Update Types (src/types/chat.ts)

Add tool-related types:
- `OllamaTool`, `ToolFunction`
- `ToolCall` - represents a tool invocation from the model
- `ToolResult` - result of tool execution
- Update `OllamaMessage` to include optional `tool_calls` and `tool_name`

### 2. Update Ollama Client (src/lib/ollama.ts)

Add a new function `streamChatWithTools` that:
- Accepts tools array parameter
- Handles streaming response with potential `tool_calls`
- Returns both content and tool calls
- Supports the tool result feedback loop

### 3. Update useChat Hook (src/hooks/useChat.ts)

- Add `diagramTool` definition
- Pass tools to `streamChatWithTools`
- Handle tool calls:
  - Extract Mermaid code from tool arguments
  - Render the diagram
  - Send tool result back to continue conversation
  - Display assistant's text response alongside diagram

---

## Model Support

**Important:** Tool calling support depends on the model:
- **llama3.1+**: Supports tool calling
- **llama3.2**: Supports tool calling
- **Other models**: May not support, fallback to current behavior

Check: https://ollama.com/search?c=tool for models with tool calling capabilities.

---

## Edge Cases

1. **Model doesn't use tool**: If model provides Mermaid in text (current behavior), continue supporting both
2. **Tool call without Mermaid**: Validate tool arguments, show error if invalid
3. **Multiple tool calls**: Handle array of tool calls (though unlikely for this use case)
4. **Model without tool support**: Fall back to current text-based extraction

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-------------|
| Model doesn't support tools | Medium | Fallback to text extraction; detect capability |
| Tool schema not followed by model | Low | Validate and sanitize input |
| Streaming with tools complex | Medium | Separate handling for content vs tool_calls |

---

## Next Steps for Planning

1. Define tool types and schema
2. Implement tool-aware Ollama client
3. Update useChat to handle tool calls
4. Test with llama3.2 (verify tool support)
5. Provide fallback for unsupported models
