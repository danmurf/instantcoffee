import { create } from 'zustand';

interface SessionStore {
  currentSessionId: number | null;
  hasUnsavedChanges: boolean;
  setCurrentSessionId: (id: number | null) => void;
  setHasUnsavedChanges: (value: boolean) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentSessionId: null,
  hasUnsavedChanges: false,
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
}));
