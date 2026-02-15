export type MemoryCategory = 'service' | 'team' | 'preference' | 'general';

export interface Memory {
  id?: number;
  category: MemoryCategory;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
