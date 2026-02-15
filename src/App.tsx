import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ChatPanel } from './components/ChatPanel';
import { WhiteboardPanel } from './components/WhiteboardPanel';
import { SourceEditorModal } from './components/SourceEditorModal';
import { renderMermaid, initMermaid } from './lib/mermaid';
import { useChat } from './hooks/useChat';

initMermaid();

const DEMO_MERMAID = `flowchart TD
    A[Hello] -->|says hello| B[World]
    B --> C[Hello, World!]
    style A fill:#f0f9ff,stroke:#6366f1
    style B fill:#f0f9ff,stroke:#6366f1
    style C fill:#f0f9ff,stroke:#6366f1
`;

function App() {
  const chat = useChat();
  
  const [svg, setSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mermaidSource, setMermaidSource] = useState<string>(DEMO_MERMAID);
  const [showEditor, setShowEditor] = useState<boolean>(false);

  const [history, setHistory] = useState<string[]>([DEMO_MERMAID]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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

  return (
    <>
      <Layout
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
              isLoading={isLoading || chat.isGenerating}
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
