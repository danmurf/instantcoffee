import type { ChatMessage } from './chat';

export interface SessionState {
  messages: ChatMessage[];
  mermaidSource: string;
  history: string[];
  historyIndex: number;
}

export interface Session {
  id?: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  state: SessionState;
}
