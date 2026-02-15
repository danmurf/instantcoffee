import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ChatPanel } from './components/ChatPanel';
import { WhiteboardPanel } from './components/WhiteboardPanel';
import { SourceEditorModal } from './components/SourceEditorModal';
import { renderD2 } from './lib/d2';
import { useChat } from './hooks/useChat';

const DEMO_D2 = `shape: rectangle
hello -> world: says hello
world: Hello, World!

style {
  fill: '#f0f9ff'
  stroke: '#6366f1'
}
`;

function App() {
  const chat = useChat();
  
  const [svg, setSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [d2Source, setD2Source] = useState<string>(DEMO_D2);
  const [showEditor, setShowEditor] = useState<boolean>(false);

  const [history, setHistory] = useState<string[]>([DEMO_D2]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    if (chat.currentSvg) {
      setSvg(chat.currentSvg);
      if (chat.currentD2) {
        setD2Source(chat.currentD2);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(chat.currentD2);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [chat.currentSvg, chat.currentD2]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousSource = history[newIndex];
      setD2Source(previousSource);
      
      setIsLoading(true);
      setError(null);
      renderD2(previousSource)
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
      setD2Source(nextSource);
      
      setIsLoading(true);
      setError(null);
      renderD2(nextSource)
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
        const renderedSvg = await renderD2(DEMO_D2);
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
    setD2Source(newSource);
    setShowEditor(false);
    setIsLoading(true);
    setError(null);

    try {
      const renderedSvg = await renderD2(newSource);
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
        d2Source={d2Source}
        onSave={handleEditorSave}
        onClose={() => setShowEditor(false)}
      />
    </>
  );
}

export default App;
