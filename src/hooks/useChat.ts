/**
 * Chat Hook
 * 
 * Manages chat state and integrates with Ollama for AI-powered diagram generation.
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, MessageRole, OllamaMessage, OllamaTool, StreamCallbacks, ToolCall } from '../types/chat';
import { streamChatWithTools, extractMermaidCode, formatError, DEFAULT_MODEL } from '../lib/ollama';
import { renderMermaid } from '../lib/mermaid';

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

const SYSTEM_PROMPT = `You are a Mermaid diagram generation assistant. Your role is to help users create diagrams by generating Mermaid code based on their descriptions.

You can generate the following types of diagrams:
- Sequence diagrams (showing interactions between actors/components)
- ERD (Entity-Relationship Diagrams)
- Flowcharts (process flows, decision trees)
- Architecture diagrams (system components, data flow)
- Class diagrams
- State diagrams
- Pie charts

TOOL USE:
- Use the 'update_diagram' tool when the user wants to create or modify a Mermaid diagram
- Do NOT use the tool if the user is just asking a question, making small talk, or not requesting any diagram changes
- When using the tool, provide the COMPLETE updated diagram code, not just the changes
- After using the tool, you can provide additional text explanation to the user

ITERATIVE REFINEMENT:
When user requests changes to an existing diagram (e.g., 'add a node', 'make it bigger', 'change color to blue', 'move the arrow'), you must MODIFY the CURRENT DIAGRAM below, not create a new one from scratch.

Examples of iterative changes:
- "add a user approval step" → Add new node connected to existing flow
- "make the arrows thicker" → Add style attribute to connections
- "change the color of server to red" → Modify node style
- "add another database" → Add new node and connection

CRITICAL: Always output ONLY the modified Mermaid code. Do NOT explain what changed. The user wants to see the result, not a description of changes.

When generating diagrams:
1. Use proper Mermaid syntax: https://mermaid.js.org/intro/
2. Always wrap Mermaid code in markdown code blocks with the 'mermaid' language identifier
3. Keep diagrams clear and readable

Format your response like this:
\`\`\`mermaid
# Your Mermaid code here
\`\`\`

If the user asks to modify an existing diagram, output the complete modified Mermaid code (not just the changes).`;

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

  const toOllamaMessages = useCallback((history: ChatMessage[], userContent: string): OllamaMessage[] => {
    let systemContent = SYSTEM_PROMPT;

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
      const apiMessages = toOllamaMessages(messages, trimmedContent);

      const callbacks: StreamCallbacks = {
        onChunk: async (chunk: string) => {
          streamingContentRef.current += chunk;
          setStreamingContent(streamingContentRef.current);
          
          // Only extract from text if no tool call happened (fallback behavior)
          const { mermaidCode } = extractMermaidCode(streamingContentRef.current);
          
          if (mermaidCode && mermaidCode !== partialMermaidRef.current) {
            const now = Date.now();
            if (now - lastRenderTimeRef.current >= STREAM_DEBOUNCE_MS) {
              lastRenderTimeRef.current = now;
              partialMermaidRef.current = mermaidCode;
              setIsDiagramUpdating(true);
              setPartialMermaid(mermaidCode);
              
              try {
                const svg = await renderMermaid(mermaidCode);
                setCurrentMermaid(mermaidCode);
                setCurrentSvg(svg);
              } catch (renderErr) {
                console.warn('Partial Mermaid render failed, keeping previous diagram:', renderErr);
              } finally {
                setIsDiagramUpdating(false);
              }
            }
          }
        },
        onComplete: async (fullResponse: string) => {
          streamingContentRef.current = '';
          partialMermaidRef.current = '';
          setStreamingContent('');
          setPartialMermaid('');
          setIsDiagramUpdating(false);
          
          const { explanation, mermaidCode } = extractMermaidCode(fullResponse);
          
          let assistantContent = explanation || fullResponse;
          if (!mermaidCode) {
            assistantContent += '\n\n⚠️ No Mermaid code was detected in my response. Please try describing the diagram differently.';
          }

          const assistantMessage = createMessage('assistant', assistantContent);
          
          if (mermaidCode) {
            try {
              const svg = await renderMermaid(mermaidCode);
              setCurrentMermaid(mermaidCode);
              setCurrentSvg(svg);
              assistantMessage.mermaidSource = mermaidCode;
            } catch (renderErr) {
              console.error('Failed to render Mermaid:', renderErr);
              assistantContent += '\n\n⚠️ Diagram generated but rendering failed.';
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
      const result = await streamChatWithTools(DEFAULT_MODEL, apiMessages, [diagramTool], callbacks);
      
      // Handle tool calls if the model used them
      if (result.toolCalls && result.toolCalls.length > 0) {
        await handleToolCalls(result.toolCalls, apiMessages, callbacks);
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
    existingMessages: OllamaMessage[],
    callbacks: StreamCallbacks
  ): Promise<void> => {
    for (const toolCall of toolCalls) {
      if (toolCall.name === 'update_diagram') {
        let mermaidCode = '';
        
        try {
          // Parse the arguments JSON
          const args = JSON.parse(toolCall.arguments);
          mermaidCode = args.mermaid_code || '';
        } catch {
          console.error('Failed to parse tool arguments:', toolCall.arguments);
          mermaidCode = '';
        }

        if (mermaidCode) {
          setIsDiagramUpdating(true);
          
          try {
            const svg = await renderMermaid(mermaidCode);
            setCurrentMermaid(mermaidCode);
            setCurrentSvg(svg);
            
            // Send tool result back to the model to continue conversation
            const toolResultMessage: OllamaMessage = {
              role: 'tool',
              content: JSON.stringify({ success: true, mermaid_code: mermaidCode }),
              tool_name: 'update_diagram',
            };

            // Continue conversation with tool result
            const continuedMessages = [...existingMessages, toolResultMessage];
            
            await streamChatWithTools(DEFAULT_MODEL, continuedMessages, [diagramTool], callbacks);
            
          } catch (renderErr) {
            console.error('Failed to render diagram from tool call:', renderErr);
            callbacks.onError(renderErr instanceof Error ? renderErr : new Error(String(renderErr)));
          } finally {
            setIsDiagramUpdating(false);
          }
        }
      }
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
    streamingContent: _streamingContent,
    partialMermaid: _partialMermaid,
  };
}
