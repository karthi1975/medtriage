/**
 * Main App Component
 * Sets up theme, routing, and context providers
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeModeProvider } from './theme/ThemeModeProvider';
import { MASessionProvider } from './context/MASessionContext';
import { ChatProvider } from './context/ChatContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { MAContextSelection } from './pages/MAContextSelection';
import { ChatView } from './pages/ChatView';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { DesignSystemPreview } from './pages/DesignSystemPreview';

function App() {
  return (
    <ThemeModeProvider>
      <MASessionProvider>
        <ChatProvider>
          <WorkflowProvider>
            <Router>
              <Routes>
                <Route path="/" element={<MAContextSelection />} />
                <Route path="/chat" element={<ChatView />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/design-system" element={<DesignSystemPreview />} />
              </Routes>
            </Router>
          </WorkflowProvider>
        </ChatProvider>
      </MASessionProvider>
    </ThemeModeProvider>
  );
}

export default App;
