/**
 * Chat Hook
 * 
 * Manages chat state and integrates with Ollama for AI-powered diagram generation.
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, MessageRole, OllamaMessage, StreamCallbacks } from '../types/chat';
import { streamChat, extractD2Code, formatError, DEFAULT_MODEL } from '../lib/ollama';
import { renderD2 } from '../lib/d2';

const MAX_MESSAGES = 20;
const STREAM_DEBOUNCE_MS = 500;

/**
 * System prompt for the D2 diagram generation assistant
 * Supports both initial diagram creation and iterative refinement
 */
const SYSTEM_PROMPT = `You are a D2 diagram generation assistant. Your role is to help users create diagrams by generating D2 code based on their descriptions.

You can generate the following types of diagrams:
- Sequence diagrams (showing interactions between actors/components)
- ERD (Entity-Relationship Diagrams)
- Flowcharts (process flows, decision trees)
- Architecture diagrams (system components, data flow)

ITERATIVE REFINEMENT:
When user requests changes to an existing diagram (e.g., 'add a node', 'make it bigger', 'change color to blue', 'move the arrow'), you must MODIFY the CURRENT DIAGRAM below, not create a new one from scratch.

Examples of iterative changes:
- "add a user approval step" → Add new shape connected to existing flow
- "make the arrows thicker" → Add style attribute to connections
- "change the color of server to red" → Modify shape style
- "add another database" → Add new shape and connection

CRITICAL: Always output ONLY the modified D2 code. Do NOT explain what changed. The user wants to see the result, not a description of changes.

When generating diagrams:
1. Use proper D2 syntax: https://d2lang.com/tour/intro
2. Always wrap D2 code in markdown code blocks with the 'd2' language identifier
3. Keep diagrams clear and readable

Format your response like this:
\`\`\`d2
# Your D2 code here
\`\`\`

If the user asks to modify an existing diagram, output the complete modified D2 code (not just the changes).`;

/**
 * Create a new chat message
 */
function createMessage(role: MessageRole, content: string): ChatMessage {
  return {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    role,
    content,
    timestamp: Date.now(),
  };
}

/**
 * Hook for managing chat state and AI-powered diagram generation
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentD2, setCurrentD2] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Streaming state for real-time diagram updates (exposed for UI)
  const [_streamingContent, setStreamingContent] = useState<string>('');
  const [_partialD2, setPartialD2] = useState<string>('');
  const [isDiagramUpdating, setIsDiagramUpdating] = useState<boolean>(false);
  
  // Refs for streaming - avoid stale closures
  const streamingContentRef = useRef<string>('');
  const lastRenderTimeRef = useRef<number>(0);
  const partialD2Ref = useRef<string>('');

  /**
   * Convert chat messages to Ollama message format
   * Includes current D2 for iterative refinement
   */
  const toOllamaMessages = useCallback((history: ChatMessage[], userContent: string): OllamaMessage[] => {
    let systemContent = SYSTEM_PROMPT;

    // Add current D2 to system prompt if available for iterative refinement
    if (currentD2) {
      systemContent += `\n\nCURRENT DIAGRAM:\n\`\`\`d2\n${currentD2}\n\`\`\``;
    }

    const ollamaMessages: OllamaMessage[] = [
      { role: 'system', content: systemContent }
    ];

    // Add conversation history (truncated if too long)
    const recentMessages = history.slice(-MAX_MESSAGES);
    
    for (const msg of recentMessages) {
      // Include D2 source from previous assistant messages if available
      const content = msg.d2Source 
        ? `${msg.content}\n\n[Previous diagram for reference:\n\`\`\`d2\n${msg.d2Source}\n\`\`\`]`
        : msg.content;
      
      ollamaMessages.push({
        role: msg.role,
        content,
      });
    }

    // Add the new user message
    ollamaMessages.push({ role: 'user', content: userContent });

    return ollamaMessages;
  }, [currentD2]);

  /**
   * Send a message to the AI and handle the response
   */
  const sendMessage = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Clear any previous error
    setError(null);
    
    // Set generating state
    setIsGenerating(true);

    // Add user message immediately
    const userMessage = createMessage('user', trimmedContent);
    setMessages(prev => [...prev, userMessage]);

    // Reset streaming refs for new request
    streamingContentRef.current = '';
    partialD2Ref.current = '';
    lastRenderTimeRef.current = 0;

    try {
      // Build API messages
      const apiMessages = toOllamaMessages(messages, trimmedContent);

      // Set up streaming callbacks
      const callbacks: StreamCallbacks = {
        onChunk: async (chunk: string) => {
          // Accumulate streaming content using ref to avoid stale closure
          streamingContentRef.current += chunk;
          setStreamingContent(streamingContentRef.current);
          
          // Extract D2 from accumulated content
          const { d2Code } = extractD2Code(streamingContentRef.current);
          
          if (d2Code && d2Code !== partialD2Ref.current) {
            // Check debounce - skip if we rendered too recently
            const now = Date.now();
            if (now - lastRenderTimeRef.current >= STREAM_DEBOUNCE_MS) {
              lastRenderTimeRef.current = now;
              partialD2Ref.current = d2Code;
              setIsDiagramUpdating(true);
              setPartialD2(d2Code);
              
              try {
                // Try to render partial D2 - if it fails, keep previous valid diagram
                await renderD2(d2Code);
                setCurrentD2(d2Code);
              } catch (renderErr) {
                // If partial D2 fails to render, keep previous valid diagram
                console.warn('Partial D2 render failed, keeping previous diagram:', renderErr);
              } finally {
                setIsDiagramUpdating(false);
              }
            }
          }
        },
        onComplete: async (fullResponse: string) => {
          // Clear streaming state
          streamingContentRef.current = '';
          partialD2Ref.current = '';
          setStreamingContent('');
          setPartialD2('');
          setIsDiagramUpdating(false);
          
          // Extract D2 code from response
          const { explanation, d2Code } = extractD2Code(fullResponse);
          
          // Create assistant message
          let assistantContent = explanation || fullResponse;
          if (!d2Code) {
            assistantContent += '\n\n⚠️ No D2 code was detected in my response. Please try describing the diagram differently.';
          }

          const assistantMessage = createMessage('assistant', assistantContent);
          
          // If D2 was extracted, render it and update state
          if (d2Code) {
            try {
              await renderD2(d2Code);
              setCurrentD2(d2Code);
              // Attach D2 source to message for potential future use
              assistantMessage.d2Source = d2Code;
            } catch (renderErr) {
              console.error('Failed to render D2:', renderErr);
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

      // Call Ollama API
      await streamChat(DEFAULT_MODEL, apiMessages, callbacks);

    } catch (err) {
      // Handle any errors not caught by the stream
      const formattedError = formatError(err);
      setError(formattedError);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, toOllamaMessages]);

  return {
    messages,
    currentD2,
    isGenerating,
    error,
    sendMessage,
    // Streaming state for real-time updates
    isDiagramUpdating,
    streamingContent: _streamingContent,
    partialD2: _partialD2,
  };
}
