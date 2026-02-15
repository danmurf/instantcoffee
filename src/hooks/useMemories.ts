import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { createMemory, updateMemory, deleteMemory } from '../db/memories';

export function useMemories() {
  const memories = useLiveQuery(
    () => db.memories.orderBy('createdAt').toArray(),
    []
  );

  const addMemory = async (content: string) => {
    await createMemory(content);
  };

  const editMemory = async (id: number, content: string) => {
    await updateMemory(id, { content });
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
