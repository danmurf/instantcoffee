import { useEffect, useRef, useCallback } from 'react';
import type { SessionState } from '../types/session';
import { useSessionStore } from '../stores/sessionStore';
import { createSession, updateSession, generateTitleForSession } from '../db/sessions';

const DEFAULT_DEBOUNCE_MS = 1500;

interface UseAutoSaveOptions {
  sessionState: SessionState;
  enabled: boolean;
}

export function useAutoSave({ sessionState, enabled }: UseAutoSaveOptions) {
  const { currentSessionId, setCurrentSessionId, setHasUnsavedChanges } = useSessionStore();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStateRef = useRef<string | null>(null);
  const prevMessagesLengthRef = useRef<number>(sessionState.messages.length);
  // Use a ref for currentSessionId so the debounce timer always has the latest value
  const sessionIdRef = useRef<number | null>(currentSessionId);
  sessionIdRef.current = currentSessionId;

  // Guard against concurrent saves — queue the latest state if a save is in progress
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef<SessionState | null>(null);

  // Track whether title has been generated for this session
  const titleGeneratedRef = useRef(false);

  // Track the most recent session ID created in this hook
  const latestSessionIdRef = useRef<number | null>(currentSessionId);

  const getStateKey = useCallback((state: SessionState): string => {
    return JSON.stringify({
      messagesLength: state.messages.length,
      mermaidSource: state.mermaidSource,
      historyIndex: state.historyIndex,
    });
  }, []);

  const performSave = useCallback(async (state: SessionState) => {
    if (isSavingRef.current) {
      // A save is already running — queue this state so it's saved after
      pendingSaveRef.current = state;
      return;
    }

    isSavingRef.current = true;
    try {
      const sessionId = sessionIdRef.current;
      if (sessionId === null) {
        const newId = await createSession(state);
        setCurrentSessionId(newId);
        latestSessionIdRef.current = newId;
      } else {
        await updateSession(sessionId, state);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      isSavingRef.current = false;

      // If another save was queued while we were writing, flush it now
      const queued = pendingSaveRef.current;
      if (queued) {
        pendingSaveRef.current = null;
        await performSave(queued);
      }
    }
  }, [setCurrentSessionId, setHasUnsavedChanges]);

  const flushSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Only save if user has actually interacted (has messages)
    if (sessionState.messages.length > 0 || sessionIdRef.current !== null) {
      await performSave(sessionState);
    }
  }, [sessionState, performSave]);

  useEffect(() => {
    if (!enabled) return;

    const stateKey = getStateKey(sessionState);

    // On first render, just record the initial state — don't treat it as a change
    if (prevStateRef.current === null) {
      prevStateRef.current = stateKey;
      prevMessagesLengthRef.current = sessionState.messages.length;
      return;
    }

    // Check if state actually changed
    if (stateKey === prevStateRef.current) {
      return;
    }

    prevStateRef.current = stateKey;

    // Only mark as dirty if user has actually done something (has messages or an existing session)
    if (sessionState.messages.length === 0 && sessionIdRef.current === null) {
      return;
    }

    setHasUnsavedChanges(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Detect whether message count changed (new message added)
    const messagesChanged = sessionState.messages.length !== prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = sessionState.messages.length;

    // Save immediately for new sessions or when a new message arrives
    const effectiveSessionId = sessionIdRef.current ?? latestSessionIdRef.current;
    if (effectiveSessionId === null || messagesChanged) {
      performSave(sessionState);

      // Generate title after first assistant response (non-blocking)
      if (
        messagesChanged &&
        effectiveSessionId !== null &&
        !titleGeneratedRef.current
      ) {
        const hasAssistantMessage = sessionState.messages.some(m => m.role === 'assistant');
        if (hasAssistantMessage) {
          titleGeneratedRef.current = true;
          const firstUserMessage = sessionState.messages.find(m => m.role === 'user');
          if (firstUserMessage) {
            generateTitleForSession(effectiveSessionId, firstUserMessage.content);
          }
        }
      }

      return;
    }

    // Debounce mermaid/history-only changes
    debounceTimerRef.current = setTimeout(async () => {
      await performSave(sessionState);
    }, DEFAULT_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sessionState, enabled, performSave, setHasUnsavedChanges, getStateKey]);

  // Reset change tracking — call after loading a session or starting fresh
  // so the next state is treated as a baseline, not a change
  const resetTracking = useCallback(() => {
    prevStateRef.current = null;
    prevMessagesLengthRef.current = 0;
    titleGeneratedRef.current = false;
    latestSessionIdRef.current = null;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  return {
    flushSave,
    resetTracking,
  };
}
