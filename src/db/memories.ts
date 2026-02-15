import { db } from './index';
import type { Memory } from '../types/memory';

/**
 * Create a new memory
 */
export async function createMemory(content: string): Promise<number> {
  const now = Date.now();

  const id = await db.memories.add({
    content,
    createdAt: now,
    updatedAt: now,
  });

  return id as number;
}

/**
 * Update a memory
 */
export async function updateMemory(
  id: number,
  updates: Partial<Pick<Memory, 'content'>>
): Promise<void> {
  await db.memories.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a memory
 */
export async function deleteMemory(id: number): Promise<void> {
  await db.memories.delete(id);
}

/**
 * List all memories ordered by creation time
 */
export async function listMemories(): Promise<Memory[]> {
  return db.memories.orderBy('createdAt').toArray();
}

/**
 * Get all memories formatted for prompt injection
 */
export async function getAllMemoriesForPrompt(): Promise<string> {
  const memories = await db.memories.toArray();

  if (memories.length === 0) {
    return '';
  }

  return memories.map(m => `- ${m.content}`).join('\n');
}
