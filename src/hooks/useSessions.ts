import { useLiveQuery } from 'dexie-react-hooks';
import type { Session } from '../types/session';
import { db } from '../db';

export function useSessions(): { sessions: Session[] | undefined; isLoading: boolean } {
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('updatedAt').reverse().toArray(),
    []
  );
  
  return {
    sessions,
    isLoading: sessions === undefined,
  };
}
