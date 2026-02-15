import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ChatPanel } from './components/ChatPanel';
import { WhiteboardPanel } from './components/WhiteboardPanel';
import { SourceEditorModal } from './components/SourceEditorModal';
import { SessionSidebar } from './components/SessionSidebar';
import { renderMermaid, initMermaid } from './lib/mermaid';
import { useChat } from './hooks/useChat';
import { useAutoSave } from './hooks/useAutoSave';
import { useSessions } from './hooks/useSessions';
import { useSessionStore } from './stores/sessionStore';
import { loadSession, deleteSession } from './db/sessions';
import type { SessionState } from './types/session';

initMermaid();

const DEMO_MERMAID = `flowchart TD
    Start([🚀 Start]) --> Idea[💡 Enter your idea]
    
    Idea --> Generate[✨ AI generates diagram]
    Generate --> Whiteboard[📋 Diagram on whiteboard]
    
    Whiteboard --> Choice{What's next?}
    
    Choice --> Changes[🔄 Request changes]
    Changes --> Generate
    
    Choice --> Questions[💬 Ask questions]
    Questions --> Answer[💭 AI answers]
    Answer --> Choice
    
    Choice --> Done[✅ Finished?]
    Done --> Export{How to save?}
    
    Export --> PNG[🖼️ Export as PNG]
    Export --> SVG[📐 Export as SVG]
    Export --> Code[📄 Copy mermaid code]
    
    PNG --> End([💜 Done!])
    SVG --> End
    Code --> End
    
    style Start fill:#fdf4ff,stroke:#a855f7,stroke-width:2px
    style Idea fill:#f0f9ff,stroke:#6366f1
    style Generate fill:#ecfeff,stroke:#06b6d4,stroke-width:2px
    style Whiteboard fill:#faf5ff,stroke:#a855f7
    style Choice fill:#fff7ed,stroke:#f97316
    style Changes fill:#fef3c7,stroke:#f59e0b
    style Questions fill:#e0e7ff,stroke:#6366f1
    style Answer fill:#e0e7ff,stroke:#6366f1
    style Done fill:#dcfce7,stroke:#22c55e
    style Export fill:#dcfce7,stroke:#22c55e
    style PNG fill:#f0f9ff,stroke:#0ea5e9
    style SVG fill:#f0f9ff,stroke:#0ea5e9
    style Code fill:#f0f9ff,stroke:#0ea5e9
    style End fill:#fdf4ff,stroke:#a855f7,stroke-width:2px
`;

function App() {
  const chat = useChat();
  const { sessions } = useSessions();
  const { currentSessionId, setCurrentSessionId, setHasUnsavedChanges } = useSessionStore();
  
  const [svg, setSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mermaidSource, setMermaidSource] = useState<string>(DEMO_MERMAID);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const [history, setHistory] = useState<string[]>([DEMO_MERMAID]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Build session state from current app state
  const sessionState: SessionState = {
    messages: chat.messages,
    mermaidSource,
    history,
    historyIndex,
  };

  // Auto-save hook
  const { flushSave, resetTracking } = useAutoSave({
    sessionState,
    enabled: true,
  });

  // Save on tab close / navigate away
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSave();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSave();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushSave]);

  useEffect(() => {
    if (chat.currentSvg) {
      setSvg(chat.currentSvg);
      if (chat.currentMermaid) {
        setMermaidSource(chat.currentMermaid);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(chat.currentMermaid);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [chat.currentSvg, chat.currentMermaid]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousSource = history[newIndex];
      setMermaidSource(previousSource);
      
      setIsLoading(true);
      setError(null);
      renderMermaid(previousSource)
        .then(setSvg)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to render diagram'))
        .finally(() => setIsLoading(false));
    }
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextSource = history[newIndex];
      setMermaidSource(nextSource);
      
      setIsLoading(true);
      setError(null);
      renderMermaid(nextSource)
        .then(setSvg)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to render diagram'))
        .finally(() => setIsLoading(false));
    }
  }, [canRedo, history, historyIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    async function loadDemo() {
      setIsLoading(true);
      setError(null);
      
      try {
        const renderedSvg = await renderMermaid(DEMO_MERMAID);
        setSvg(renderedSvg);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render demo');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDemo();
  }, []);

  const handleEditorSave = async (newSource: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSource);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setMermaidSource(newSource);
    setShowEditor(false);
    setIsLoading(true);
    setError(null);

    try {
      const renderedSvg = await renderMermaid(newSource);
      setSvg(renderedSvg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render diagram');
    } finally {
      setIsLoading(false);
    }
  };

  // Load session state - restores app from saved session
  const loadSessionState = useCallback(async (state: SessionState) => {
    chat.setMessages(state.messages);

    if (state.mermaidSource) {
      setMermaidSource(state.mermaidSource);
      setHistory(state.history);
      setHistoryIndex(state.historyIndex);

      try {
        const renderedSvg = await renderMermaid(state.mermaidSource);
        setSvg(renderedSvg);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    }

    setHasUnsavedChanges(false);
  }, [chat, setHasUnsavedChanges]);

  // Handle session selection — auto-saves current session before switching
  const handleSelectSession = useCallback(async (sessionId: number) => {
    chat.cancelGeneration();
    await flushSave();

    const session = await loadSession(sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      await loadSessionState(session.state);
      // Reset tracking so loaded state isn't treated as a new change
      resetTracking();
    }
  }, [flushSave, loadSessionState, setCurrentSessionId, resetTracking]);

  // Handle session deletion
  const handleDeleteSession = useCallback(async (sessionId: number) => {
    await deleteSession(sessionId);
    // If we deleted the current session, reset to new session
    if (currentSessionId === sessionId) {
      await handleNewSession();
    }
  }, [currentSessionId]);

  // Handle new session - saves current and starts fresh
  const handleNewSession = useCallback(async () => {
    chat.cancelGeneration();
    await flushSave();

    chat.setMessages([]);
    setMermaidSource(DEMO_MERMAID);
    setHistory([DEMO_MERMAID]);
    setHistoryIndex(0);
    setSvg('');
    setError(null);

    setCurrentSessionId(null);
    setHasUnsavedChanges(false);
    // Reset tracking so the fresh demo state isn't treated as a change
    resetTracking();

    try {
      const renderedSvg = await renderMermaid(DEMO_MERMAID);
      setSvg(renderedSvg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render demo');
    }
  }, [chat, flushSave, setCurrentSessionId, setHasUnsavedChanges, resetTracking]);

  return (
    <>
      <Layout
        sidebar={
          <SessionSidebar
            sessions={sessions ?? []}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            memoryEnabled={chat.memoryEnabled}
            onMemoryEnabledChange={chat.setMemoryEnabled}
            memorySavingEnabled={chat.memorySavingEnabled}
            onMemorySavingEnabledChange={chat.setMemorySavingEnabled}
          />
        }
        leftPanel={
          <ChatPanel 
            messages={chat.messages}
            onSendMessage={chat.sendMessage} 
            isGenerating={chat.isGenerating} 
            error={chat.error}
          />
        }
        rightPanel={
          <div className="relative h-full w-full">
            <button
              onClick={() => setShowEditor(true)}
              className="absolute right-4 top-4 z-10 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Edit Source
            </button>
            <WhiteboardPanel 
              svg={svg} 
              isLoading={isLoading || chat.isDiagramUpdating}
              error={error}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>
        }
        leftPanelDefaultWidth={33}
      />
      <SourceEditorModal
        isOpen={showEditor}
        mermaidSource={mermaidSource}
        onSave={handleEditorSave}
        onClose={() => setShowEditor(false)}
      />
    </>
  );
}

export default App;
