import { useLiveQuery } from 'dexie-react-hooks';
import type { Memory, MemoryCategory } from '../types/memory';
import { db } from '../db';
import { createMemory, updateMemory, deleteMemory } from '../db/memories';

export function useMemories() {
  const memories = useLiveQuery(
    () => db.memories.orderBy('category').toArray(),
    []
  );
  
  const addMemory = async (category: MemoryCategory, name: string, content: string) => {
    await createMemory(category, name, content);
  };
  
  const editMemory = async (id: number, updates: Partial<Pick<Memory, 'category' | 'name' | 'content'>>) => {
    await updateMemory(id, updates);
  };
  
  const removeMemory = async (id: number) => {
    await deleteMemory(id);
  };
  
  return {
    memories: memories ?? [],
    isLoading: memories === undefined,
    addMemory,
    editMemory,
    removeMemory,
  };
}

/**
 * Parse memory commands from natural language input
 */
export function parseMemoryCommand(
  text: string
): { action: 'remember' | 'forget' | 'update'; name: string; content: string } | null {
  const trimmed = text.trim();
  
  // Pattern: "remember that X is Y"
  const rememberMatch = trimmed.match(/^remember\s+that\s+(.+?)\s+(?:is|are|runs?\s+on|owned\s+by)\s+(.+)$/i);
  if (rememberMatch) {
    return {
      action: 'remember',
      name: rememberMatch[1].trim(),
      content: rememberMatch[2].trim(),
    };
  }
  
  // Pattern: "remember X is Y"
  const rememberSimpleMatch = trimmed.match(/^remember\s+(.+?)\s+(?:is|are|runs?\s+on|owned\s+by)\s+(.+)$/i);
  if (rememberSimpleMatch) {
    return {
      action: 'remember',
      name: rememberSimpleMatch[1].trim(),
      content: rememberSimpleMatch[2].trim(),
    };
  }
  
  // Pattern: "forget about X" or "forget X"
  const forgetMatch = trimmed.match(/^forget\s+(?:about\s+)?(.+)$/i);
  if (forgetMatch) {
    return {
      action: 'forget',
      name: forgetMatch[1].trim(),
      content: '',
    };
  }
  
  // Pattern: "update: X now Y" or "update X now Y"
  const updateMatch = trimmed.match(/^update:?\s+(.+?)\s+(?:now|is\s+now)\s+(.+)$/i);
  if (updateMatch) {
    return {
      action: 'update',
      name: updateMatch[1].trim(),
      content: updateMatch[2].trim(),
    };
  }
  
  return null;
}
