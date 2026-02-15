// Chat message type definitions for the chat-to-diagram loop

/**
 * Role of a message sender in the chat conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * A chat message in the application
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Role of the message sender */
  role: MessageRole;
  /** Content of the message */
  content: string;
  /** Optional Mermaid source code extracted from the message */
  mermaidSource?: string;
  /** Unix timestamp when the message was created */
  timestamp: number;
}

/**
 * State for the chat conversation
 */
export interface ChatState {
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Current D2 source code being displayed */
  currentD2: string;
  /** Whether the AI is currently generating a response */
  isGenerating: boolean;
  /** Error message if something went wrong */
  error: string | null;
}

/**
 * Callbacks for streaming chat responses
 */
export interface StreamCallbacks {
  /** Called for each chunk of content received */
  onChunk: (chunk: string) => void;
  /** Called when streaming completes with the full response */
  onComplete: (fullResponse: string) => void;
  /** Called when an error occurs */
  onError: (error: Error) => void;
}

/**
 * Tool function definition for Ollama tool calling
 */
export interface ToolFunction {
  /** Name of the tool */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** JSON schema for tool parameters */
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Ollama tool format (function type)
 */
export interface OllamaTool {
  type: 'function';
  function: ToolFunction;
}

/**
 * A tool call from the model
 */
export interface ToolCall {
  /** Tool function name */
  name: string;
  /** Tool function arguments (JSON string) */
  arguments: string;
}

/**
 * Message format for Ollama API with tool support
 */
export interface OllamaMessage {
  /** Role of the message sender */
  role: MessageRole;
  /** Content of the message */
  content: string;
  /** Optional tool calls from the model */
  tool_calls?: ToolCall[];
  /** Optional tool name for tool response messages */
  tool_name?: string;
}
