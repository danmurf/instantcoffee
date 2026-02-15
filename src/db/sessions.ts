import { db } from './index';
import type { Session, SessionState } from '../types/session';
import { generateSessionTitle } from '../lib/ollama';

/**
 * Generate a fallback session name from the first user message
 */
function generateFallbackName(state: SessionState): string {
  const firstUserMessage = state.messages.find(m => m.role === 'user');

  if (!firstUserMessage) {
    return 'New Diagram';
  }

  const content = firstUserMessage.content;
  const truncated = content.length > 50 ? content.substring(0, 50) + '...' : content;
  return truncated;
}

/**
 * Create a new session. Saves immediately with a fallback name,
 * then asynchronously generates an AI title and updates the session.
 */
export async function createSession(state: SessionState): Promise<number> {
  const fallbackName = generateFallbackName(state);
  const now = Date.now();

  const id = await db.sessions.add({
    name: fallbackName,
    state,
    createdAt: now,
    updatedAt: now
  }) as number;

  return id;
}

/**
 * Generate and update session title in the background.
 * Called after the assistant responds to avoid blocking the main request.
 */
export async function generateTitleForSession(
  sessionId: number,
  userMessage: string
): Promise<void> {
  try {
    const title = await generateSessionTitle(userMessage);
    if (title) {
      await db.sessions.update(sessionId, { name: title, updatedAt: Date.now() });
    }
  } catch {
    // Keep fallback name on failure
  }
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
