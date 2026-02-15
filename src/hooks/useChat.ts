/**
 * Chat Hook
 * 
 * Manages chat state and integrates with Ollama for AI-powered diagram generation.
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, MessageRole, OllamaMessage, StreamCallbacks } from '../types/chat';
import { streamChat, extractMermaidCode, formatError, DEFAULT_MODEL } from '../lib/ollama';
import { renderMermaid } from '../lib/mermaid';

const MAX_MESSAGES = 20;
const STREAM_DEBOUNCE_MS = 500;

const SYSTEM_PROMPT = `You are a Mermaid diagram generation assistant. Your role is to help users create diagrams by generating Mermaid code based on their descriptions.

You can generate the following types of diagrams:
- Sequence diagrams (showing interactions between actors/components)
- ERD (Entity-Relationship Diagrams)
- Flowcharts (process flows, decision trees)
- Architecture diagrams (system components, data flow)
- Class diagrams
- State diagrams
- Pie charts

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

      await streamChat(DEFAULT_MODEL, apiMessages, callbacks);

    } catch (err) {
      const formattedError = formatError(err);
      setError(formattedError);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, toOllamaMessages]);

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
