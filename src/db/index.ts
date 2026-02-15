import Dexie, { Table } from 'dexie';
import type { Session } from '../types/session';
import type { Memory } from '../types/memory';

export class InstantCoffeeDB extends Dexie {
  sessions!: Table<Session, number>;
  memories!: Table<Memory, number>;

  constructor() {
    super('InstantCoffeeDB');

    this.version(1).stores({
      sessions: '++id, name, updatedAt',
      memories: '++id, category, name, updatedAt'
    });
  }
}

export const db = new InstantCoffeeDB();
