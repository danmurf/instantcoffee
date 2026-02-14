import { Layout } from './components/Layout';
import { ChatPanel } from './components/ChatPanel';
import { WhiteboardPanel } from './components/WhiteboardPanel';

function App() {
  return (
    <Layout
      leftPanel={<ChatPanel />}
      rightPanel={<WhiteboardPanel />}
      leftPanelDefaultWidth={33}
    />
  );
}

export default App;
