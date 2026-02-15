import { db } from './index';
import type { Session, SessionState } from '../types/session';

/**
 * Generate a session name from the first user message
 */
function generateSessionName(state: SessionState): string {
  const firstUserMessage = state.messages.find(m => m.role === 'user');
  
  if (!firstUserMessage) {
    return 'New Diagram';
  }
  
  const content = firstUserMessage.content;
  // Truncate to 50 chars
  const truncated = content.length > 50 ? content.substring(0, 50) + '...' : content;
  return truncated;
}

/**
 * Create a new session
 */
export async function createSession(state: SessionState): Promise<number> {
  const name = generateSessionName(state);
  const now = Date.now();
  
  const id = await db.sessions.add({
    name,
    state,
    createdAt: now,
    updatedAt: now
  });
  
  return id as number;
}

/**
 * Load a session by ID
 */
export async function loadSession(id: number): Promise<Session | undefined> {
  return db.sessions.get(id);
}

/**
 * Update a session's state
 */
export async function updateSession(id: number, state: SessionState): Promise<void> {
  await db.sessions.update(id, {
    state,
    updatedAt: Date.now()
  });
}

/**
 * Update session name
 */
export async function renameSession(id: number, name: string): Promise<void> {
  await db.sessions.update(id, {
    name,
    updatedAt: Date.now()
  });
}

/**
 * Delete a session
 */
export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}

/**
 * List all sessions ordered by updatedAt descending
 */
export async function listSessions(): Promise<Session[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray();
}
