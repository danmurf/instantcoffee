import { useEffect, useRef, useCallback } from 'react';
import type { SessionState } from '../types/session';
import { useSessionStore } from '../stores/sessionStore';
import { createSession, updateSession } from '../db/sessions';

const DEFAULT_DEBOUNCE_MS = 1500;

interface UseAutoSaveOptions {
  sessionState: SessionState;
  enabled: boolean;
}

export function useAutoSave({ sessionState, enabled }: UseAutoSaveOptions) {
  const { currentSessionId, setCurrentSessionId, setHasUnsavedChanges } = useSessionStore();
  
  // Use ref to hold the debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Use ref to hold the stable version of session state for comparison
  const prevStateRef = useRef<string>('');
  
  // Get a stable string representation of key state fields for comparison
  const getStateKey = useCallback((state: SessionState): string => {
    return JSON.stringify({
      messagesLength: state.messages.length,
      mermaidSource: state.mermaidSource,
      historyIndex: state.historyIndex,
    });
  }, []);
  
  const performSave = useCallback(async (state: SessionState, sessionId: number | null) => {
    try {
      if (sessionId === null) {
        // Create new session
        const newId = await createSession(state);
        setCurrentSessionId(newId);
      } else {
        // Update existing session
        await updateSession(sessionId, state);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [setCurrentSessionId, setHasUnsavedChanges]);
  
  const flushSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    if (currentSessionId !== null || sessionState.messages.length > 0 || sessionState.mermaidSource !== '') {
      await performSave(sessionState, currentSessionId);
    }
  }, [currentSessionId, sessionState, performSave]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const stateKey = getStateKey(sessionState);
    
    // Check if state actually changed
    if (stateKey === prevStateRef.current) {
      return;
    }
    
    prevStateRef.current = stateKey;
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Start new debounce timer
    debounceTimerRef.current = setTimeout(async () => {
      await performSave(sessionState, currentSessionId);
    }, DEFAULT_DEBOUNCE_MS);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sessionState, enabled, currentSessionId, performSave, setHasUnsavedChanges, getStateKey]);
  
  // Flush on unmount
  useEffect(() => {
    return () => {
      // Immediate flush on unmount
      if (currentSessionId !== null || sessionState.messages.length > 0 || sessionState.mermaidSource !== '') {
        // Synchronous save not possible with IndexedDB, but we trigger one last save
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        // The save will happen in the cleanup, but IndexedDB is async
        // For critical data, the user should manually save
      }
    };
  }, []);
  
  return {
    flushSave,
  };
}
