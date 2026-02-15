// Ollama API client with streaming support for chat-to-diagram loop

import type { OllamaMessage, OllamaTool, StreamCallbacks, ToolCall } from '../types/chat';

/** Base URL for Ollama API */
export const OLLAMA_BASE = 'http://localhost:11434';

/** Default model to use for chat */
export const DEFAULT_MODEL = 'gpt-oss:20b';

/** Timeout for health check in milliseconds */
export const HEALTH_TIMEOUT = 5000;

/**
 * Check if Ollama is running and accessible
 * @returns Promise<boolean> - true if Ollama is healthy, false otherwise
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

    const response = await fetch(OLLAMA_BASE, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Stream chat response from Ollama
 * @param model - Model name to use
 * @param messages - Array of messages for context
 * @param callbacks - Stream handling callbacks
 * @returns Promise<string> - Full response text
 */
export async function streamChat(
  model: string,
  messages: OllamaMessage[],
  callbacks: StreamCallbacks
): Promise<string> {
  const abortController = new AbortController();
  let fullResponse = '';

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const error = new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      callbacks.onError(error);
      throw error;
    }

    if (!response.body) {
      const error = new Error('No response body from Ollama');
      callbacks.onError(error);
      throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const content = data.message?.content;

          if (content) {
            fullResponse += content;
            callbacks.onChunk(content);
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    callbacks.onComplete(fullResponse);
    return fullResponse;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out');
      callbacks.onError(timeoutError);
      throw timeoutError;
    }
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Result from streamChatWithTools containing content and any tool calls
 */
export interface StreamWithToolsResult {
  /** Full content from the assistant */
  content: string;
  /** Tool calls made by the model (if any) */
  toolCalls: ToolCall[];
}

/**
 * Stream chat response from Ollama with tool support
 * @param model - Model name to use
 * @param messages - Array of messages for context
 * @param tools - Array of available tools
 * @param callbacks - Stream handling callbacks
 * @returns Promise<StreamWithToolsResult> - Content and tool calls
 */
export async function streamChatWithTools(
  model: string,
  messages: OllamaMessage[],
  tools: OllamaTool[],
  callbacks: StreamCallbacks
): Promise<StreamWithToolsResult> {
  const abortController = new AbortController();
  let fullResponse = '';
  let toolCalls: ToolCall[] = [];

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        stream: true,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const error = new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      callbacks.onError(error);
      throw error;
    }

    if (!response.body) {
      const error = new Error('No response body from Ollama');
      callbacks.onError(error);
      throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          // Extract content
          const content = data.message?.content;
          if (content) {
            fullResponse += content;
            callbacks.onChunk(content);
          }
          
          // Extract tool calls
          if (data.message?.tool_calls && Array.isArray(data.message.tool_calls)) {
            for (const tc of data.message.tool_calls) {
              toolCalls.push({
                name: tc.function?.name || '',
                arguments: typeof tc.function?.arguments === 'string' 
                  ? tc.function.arguments 
                  : JSON.stringify(tc.function?.arguments || {}),
              });
            }
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    // Only call onComplete if no tool calls — when tools are used,
    // the caller (handleToolCalls) manages message creation instead
    if (toolCalls.length === 0) {
      callbacks.onComplete(fullResponse);
    }
    return { content: fullResponse, toolCalls };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out');
      callbacks.onError(timeoutError);
      throw timeoutError;
    }
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Extract Mermaid code from an AI response
 * Looks for markdown code blocks with 'mermaid' language identifier
 * @param response - Full AI response text
 * @returns Object with explanation and extracted Mermaid code
 */
export function extractMermaidCode(
  response: string
): { explanation: string; mermaidCode: string } {
  const mermaidBlockMatch = response.match(/```mermaid\n([\s\S]*?)```/);

  if (mermaidBlockMatch) {
    const mermaidCode = mermaidBlockMatch[1];
    const explanation = response.replace(mermaidBlockMatch[0], '').trim();
    return { explanation, mermaidCode };
  }

  if (response.includes('-->') || response.includes('flowchart') || response.includes('sequenceDiagram')) {
    return { explanation: '', mermaidCode: response };
  }

  return { explanation: response, mermaidCode: '' };
}

/**
 * Extract D2 code from an AI response
 * Looks for markdown code blocks with 'd2' language identifier
 * @param response - Full AI response text
 * @returns Object with explanation and extracted D2 code
 */
export function extractD2Code(
  response: string
): { explanation: string; d2Code: string } {
  // Try to match d2 code block
  const d2BlockMatch = response.match(/```d2\n([\s\S]*?)```/);

  if (d2BlockMatch) {
    const d2Code = d2BlockMatch[1];
    const explanation = response.replace(d2BlockMatch[0], '').trim();
    return { explanation, d2Code };
  }

  // Fallback: check if response looks like D2 (has : and [ characters)
  if (response.includes(':') && response.includes('[')) {
    return { explanation: '', d2Code: response };
  }

  // No D2 found
  return { explanation: response, d2Code: '' };
}

/**
 * Format errors into user-friendly messages
 * @param error - Error object or unknown
 * @returns Formatted error message string
 */
export function formatError(error: Error | unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred';
  }

  const message = error.message.toLowerCase();

  // Connection refused
  if (message.includes('connection refused') || message.includes('fetch failed')) {
    return 'Cannot connect to Ollama. Please ensure Ollama is running on your system.';
  }

  // Timeout
  if (message.includes('timeout') || message.includes('abort')) {
    return 'Request timed out. Ollama may be taking too long to respond.';
  }

  // Model not found
  if (message.includes('model not found') || message.includes('not found')) {
    return `Model not found. Please ensure the model is installed.`;
  }

  // Rate limit
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }

  // Default: return the original message
  return error.message;
}
