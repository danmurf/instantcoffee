import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types/chat';
import { LoadingAnimation } from './LoadingAnimation';
import { MessageContent } from './MessageContent';
import { fetchAvailableModels, DEFAULT_MODEL } from '../lib/ollama';

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  error: string | null;
  onSendMessage: (content: string) => Promise<void>;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const EXAMPLE_PROMPTS = [
  "Create a sequence diagram for user login",
  "Make an ERD for a blog platform",
  "Remember that our team meets on Tuesdays",
  "Draw a flowchart for order processing",
];

export function ChatPanel({ messages, isGenerating, error, onSendMessage, selectedModel, onModelChange }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([DEFAULT_MODEL]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    async function loadModels() {
      setIsLoadingModels(true);
      const models = await fetchAvailableModels();
      if (models.length > 0) {
        setAvailableModels(models);
      }
      setIsLoadingModels(false);
    }
    loadModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isGenerating) return;

    setInput('');
    await onSendMessage(trimmedInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
      </div>

      {error && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showWelcome ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 text-4xl">☕</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Welcome to Instant Coffee
            </h3>
            <p className="mb-6 max-w-xs text-sm text-gray-500">
              Describe what you want to diagram, and I'll generate it using Mermaid.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Try an example
              </p>
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(prompt)}
                  className="block w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <MessageContent
                    content={message.content}
                    isUser={message.role === 'user'}
                  />
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start pl-2">
                <LoadingAnimation />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-2 flex items-center gap-2">
          <label className="text-xs text-gray-500">Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={isLoadingModels}
            className="flex-1 max-w-[200px] text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <button
            onClick={async () => {
              const models = await fetchAvailableModels();
              if (models.length > 0) {
                setAvailableModels(models);
              }
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Refresh models"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex items-start gap-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to diagram..."
              className="max-h-30 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="flex h-[36px] items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
