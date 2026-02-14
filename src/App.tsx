import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ChatPanel } from './components/ChatPanel';
import { WhiteboardPanel } from './components/WhiteboardPanel';
import { SourceEditorModal } from './components/SourceEditorModal';
import { renderD2 } from './lib/d2';

// Sample D2 diagram for demo/testing
const DEMO_D2 = `shape: box
hello -> world: says hello
world: Hello, World!

style {
  fill: '#f0f9ff'
  stroke: '#6366f1'
}
`;

function App() {
  const [svg, setSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [d2Source, setD2Source] = useState<string>(DEMO_D2);
  const [showEditor, setShowEditor] = useState<boolean>(false);

  // History management for undo/redo
  const [history, setHistory] = useState<string[]>([DEMO_D2]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Check if we can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Undo handler
  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousSource = history[newIndex];
      setD2Source(previousSource);
      
      // Re-render the diagram
      setIsLoading(true);
      setError(null);
      renderD2(previousSource)
        .then(setSvg)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to render diagram'))
        .finally(() => setIsLoading(false));
    }
  }, [canUndo, history, historyIndex]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextSource = history[newIndex];
      setD2Source(nextSource);
      
      // Re-render the diagram
      setIsLoading(true);
      setError(null);
      renderD2(nextSource)
        .then(setSvg)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to render diagram'))
        .finally(() => setIsLoading(false));
    }
  }, [canRedo, history, historyIndex]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Check for undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Check for redo: Ctrl+Shift+Z or Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Load demo diagram on mount
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

  // Handle save from editor modal
  const handleEditorSave = async (newSource: string) => {
    // Truncate any redo history and push new source
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
        leftPanel={<ChatPanel />}
        rightPanel={
          <div className="relative h-full w-full">
            {/* Edit button in top-right corner */}
            <button
              onClick={() => setShowEditor(true)}
              className="absolute right-4 top-4 z-10 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Edit Source
            </button>
            <WhiteboardPanel 
              svg={svg} 
              isLoading={isLoading} 
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
