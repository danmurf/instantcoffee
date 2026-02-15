/**
 * Chat Hook
 * 
 * Manages chat state and integrates with Ollama for AI-powered diagram generation.
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, MessageRole, OllamaMessage, OllamaTool, StreamCallbacks, ToolCall } from '../types/chat';
import { streamChatWithTools, extractMermaidCode, formatError, DEFAULT_MODEL } from '../lib/ollama';
import { renderMermaid } from '../lib/mermaid';
import { getAllMemoriesForPrompt, createMemory, deleteMemory } from '../db/memories';
import { db } from '../db';

const MAX_MESSAGES = 20;
const STREAM_DEBOUNCE_MS = 500;

/**
 * Tool definition for updating Mermaid diagrams
 * Allows the LLM to decide when to update the diagram
 */
export const diagramTool: OllamaTool = {
  type: 'function',
  function: {
    name: 'update_diagram',
    description: 'Update the Mermaid diagram with new content. Use this when the user wants to create or modify a diagram. If the user is just asking a question without requesting a diagram change, do NOT call this tool.',
    parameters: {
      type: 'object',
      properties: {
        mermaid_code: {
          type: 'string',
          description: 'The complete Mermaid diagram code to render',
        },
      },
      required: ['mermaid_code'],
    },
  },
};

export const saveMemoryTool: OllamaTool = {
  type: 'function',
  function: {
    name: 'save_memory',
    description: 'Save one or more pieces of context the user wants you to remember. Split compound information into separate atomic statements — one fact per item.',
    parameters: {
      type: 'object',
      properties: {
        memories: {
          type: 'array',
          items: { type: 'string' },
          description: 'A list of concise statements to remember (e.g. ["Our team meets on Tuesdays", "The deploy cadence is weekly"])',
        },
      },
      required: ['memories'],
    },
  },
};

export const deleteMemoryTool: OllamaTool = {
  type: 'function',
  function: {
    name: 'delete_memory',
    description: 'Delete a previously saved memory. Use this when the user asks you to forget something. Pass the content of the memory to delete — it will be matched case-insensitively.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content of the memory to delete (or a substring to match against)',
        },
      },
      required: ['content'],
    },
  },
};

const SYSTEM_PROMPT = `You are a helpful assistant that can create and modify Mermaid diagrams on a whiteboard.

You have an 'update_diagram' tool that updates the whiteboard. Follow these rules strictly:

WHEN TO USE update_diagram:
- The user explicitly asks to create a new diagram
- The user asks to change, modify, add to, or remove from the current diagram
- The user describes something they want visualised

WHEN NOT TO USE update_diagram:
- The user asks a question about the diagram (e.g. "what does this show?", "explain the flow")
- The user is making conversation, asking for help, or discussing concepts
- The user hasn't requested any visual change
- You are unsure whether the user wants a diagram change — just respond with text and ask

If in doubt, do NOT call the tool. Just reply in text.

TOOL USAGE:
- Pass raw Mermaid code to the tool — no markdown fences, no \`\`\`mermaid wrapper
- Always provide the COMPLETE diagram, not just the changed parts
- When modifying an existing diagram, start from the CURRENT DIAGRAM shown below and apply the requested changes

SUPPORTED DIAGRAM TYPES:
Sequence, ERD, Flowchart, Architecture, Class, State, Pie chart

Keep diagrams clear and readable. Use proper Mermaid syntax.

MEMORY TOOLS:
You also have 'save_memory' and 'delete_memory' tools.
- Use 'save_memory' when the user shares context they'd like you to remember — team info, service details, preferences, naming conventions, etc.
- Use 'delete_memory' when the user asks you to forget something.
- Do NOT save trivial conversational info. Only save things the user would want persisted across sessions.
- IMPORTANT: Split information into small, atomic memories — one fact per item in the memories array. For example, "Alice is on the backend team and Bob is on the frontend team" should become two items: ["Alice is on the backend team", "Bob is on the frontend team"].
- Each memory should be a self-contained statement that makes sense on its own.
- Prefer specific, factual statements over vague summaries.`;

function createMessage(role: MessageRole, content: string): ChatMessage {
  return {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    role,
    content,
    timestamp: Date.now(),
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMermaid, setCurrentMermaid] = useState<string>('');
  const [currentSvg, setCurrentSvg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [_streamingContent, setStreamingContent] = useState<string>('');
  const [_partialMermaid, setPartialMermaid] = useState<string>('');
  const [isDiagramUpdating, setIsDiagramUpdating] = useState<boolean>(false);
  
  const streamingContentRef = useRef<string>('');
  const lastRenderTimeRef = useRef<number>(0);
  const partialMermaidRef = useRef<string>('');

  const toOllamaMessages = useCallback(async (history: ChatMessage[], userContent: string): Promise<OllamaMessage[]> => {
    let systemContent = SYSTEM_PROMPT;

    // Inject memories into system prompt
    const memoryContext = await getAllMemoriesForPrompt();
    if (memoryContext) {
      systemContent += `\n\nUSER'S CONTEXT (use this knowledge when generating diagrams):\n${memoryContext}`;
    }

    if (currentMermaid) {
      systemContent += `\n\nCURRENT DIAGRAM:\n\`\`\`mermaid\n${currentMermaid}\n\`\`\``;
    }

    const ollamaMessages: OllamaMessage[] = [
      { role: 'system', content: systemContent }
    ];

    const recentMessages = history.slice(-MAX_MESSAGES);
    
    for (const msg of recentMessages) {
      const content = msg.mermaidSource 
        ? `${msg.content}\n\n[Previous diagram for reference:\n\`\`\`mermaid\n${msg.mermaidSource}\n\`\`\`]`
        : msg.content;
      
      ollamaMessages.push({
        role: msg.role,
        content,
      });
    }

    ollamaMessages.push({ role: 'user', content: userContent });

    return ollamaMessages;
  }, [currentMermaid]);

  const sendMessage = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setError(null);
    setIsGenerating(true);

    const userMessage = createMessage('user', trimmedContent);
    setMessages(prev => [...prev, userMessage]);

    streamingContentRef.current = '';
    partialMermaidRef.current = '';
    lastRenderTimeRef.current = 0;

    try {
      const apiMessages = await toOllamaMessages(messages, trimmedContent);

      const callbacks: StreamCallbacks = {
        onChunk: async (chunk: string) => {
          streamingContentRef.current += chunk;
          setStreamingContent(streamingContentRef.current);
        },
        onComplete: async (fullResponse: string) => {
          streamingContentRef.current = '';
          partialMermaidRef.current = '';
          setStreamingContent('');
          setPartialMermaid('');
          setIsDiagramUpdating(false);

          // This only runs for non-tool-call responses (text-only path)
          const { explanation, mermaidCode } = extractMermaidCode(fullResponse);

          const assistantContent = explanation || fullResponse;
          const assistantMessage = createMessage('assistant', assistantContent);

          if (mermaidCode) {
            try {
              const svg = await renderMermaid(mermaidCode);
              setCurrentMermaid(mermaidCode);
              setCurrentSvg(svg);
              assistantMessage.mermaidSource = mermaidCode;
            } catch (renderErr) {
              console.error('Failed to render Mermaid:', renderErr);
            }
          }

          setMessages(prev => [...prev, assistantMessage]);
        },
        onError: (err: Error) => {
          const formattedError = formatError(err);
          setError(formattedError);
        },
      };

      // Use streamChatWithTools to enable tool calling
      const result = await streamChatWithTools(DEFAULT_MODEL, apiMessages, [diagramTool, saveMemoryTool, deleteMemoryTool], callbacks);
      
      // Handle tool calls if the model used them
      if (result.toolCalls && result.toolCalls.length > 0) {
        await handleToolCalls(result.toolCalls, result.content);
      }

    } catch (err) {
      const formattedError = formatError(err);
      setError(formattedError);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, toOllamaMessages]);

  /**
   * Handle tool calls from the LLM
   * Renders the diagram and sends tool result back to continue the conversation
   */
  const handleToolCalls = useCallback(async (
    toolCalls: ToolCall[],
    initialContent: string,
  ): Promise<void> => {
    let mermaidCode = '';
    let memoryActionTaken = false;

    for (const toolCall of toolCalls) {
      if (toolCall.name === 'update_diagram') {
        try {
          const args = JSON.parse(toolCall.arguments);
          mermaidCode = args.mermaid_code || '';
          // Strip markdown fences if the model included them in the tool argument
          const fenceMatch = mermaidCode.match(/```(?:mermaid)?\s*\n?([\s\S]*?)```/);
          if (fenceMatch) {
            mermaidCode = fenceMatch[1].trim();
          }
        } catch {
          console.error('Failed to parse tool arguments:', toolCall.arguments);
        }

        if (mermaidCode) {
          setIsDiagramUpdating(true);

          try {
            const svg = await renderMermaid(mermaidCode);
            setCurrentMermaid(mermaidCode);
            setCurrentSvg(svg);
          } catch (renderErr) {
            console.error('Failed to render diagram from tool call:', renderErr);
            setError(`Failed to render diagram: ${renderErr instanceof Error ? renderErr.message : String(renderErr)}`);
          } finally {
            setIsDiagramUpdating(false);
          }
        }
      } else if (toolCall.name === 'save_memory') {
        try {
          const args = JSON.parse(toolCall.arguments);
          const memories: string[] = args.memories || [];

          for (const content of memories) {
            if (content) {
              await createMemory(content);
              memoryActionTaken = true;
            }
          }
        } catch {
          console.error('Failed to parse save_memory arguments:', toolCall.arguments);
        }
      } else if (toolCall.name === 'delete_memory') {
        try {
          const args = JSON.parse(toolCall.arguments);
          const content = args.content || '';

          if (content) {
            const allMemories = await db.memories.toArray();
            const existing = allMemories.find(m =>
              m.content.toLowerCase().includes(content.toLowerCase())
            );
            if (existing) {
              await deleteMemory(existing.id!);
            }
            memoryActionTaken = true;
          }
        } catch {
          console.error('Failed to parse delete_memory arguments:', toolCall.arguments);
        }
      }
    }

    // Create assistant message
    const assistantContent = initialContent || (mermaidCode ? 'Diagram updated.' : memoryActionTaken ? 'Done.' : '');
    if (assistantContent) {
      const assistantMessage = createMessage('assistant', assistantContent);
      if (mermaidCode) {
        assistantMessage.mermaidSource = mermaidCode;
      }

      streamingContentRef.current = '';
      partialMermaidRef.current = '';
      setStreamingContent('');
      setPartialMermaid('');

      setMessages(prev => [...prev, assistantMessage]);
    }
  }, []);

  return {
    messages,
    currentMermaid,
    currentSvg,
    isGenerating,
    error,
    sendMessage,
    isDiagramUpdating,
    setMessages,
    streamingContent: _streamingContent,
    partialMermaid: _partialMermaid,
  };
}
