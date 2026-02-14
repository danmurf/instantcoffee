import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ChatPanel } from './components/ChatPanel';
import { WhiteboardPanel } from './components/WhiteboardPanel';
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

  return (
    <Layout
      leftPanel={<ChatPanel />}
      rightPanel={<WhiteboardPanel svg={svg} isLoading={isLoading} error={error} />}
      leftPanelDefaultWidth={33}
    />
  );
}

export default App;
