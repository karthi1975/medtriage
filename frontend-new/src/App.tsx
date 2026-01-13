/**
 * Main App Component
 * Sets up theme, routing, and context providers
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { MASessionProvider } from './context/MASessionContext';
import { ChatProvider } from './context/ChatContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { MAContextSelection } from './pages/MAContextSelection';
import { ChatView } from './pages/ChatView';
import { AppointmentsPage } from './pages/AppointmentsPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MASessionProvider>
        <ChatProvider>
          <WorkflowProvider>
            <Router>
              <Routes>
                <Route path="/" element={<MAContextSelection />} />
                <Route path="/chat" element={<ChatView />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
              </Routes>
            </Router>
          </WorkflowProvider>
        </ChatProvider>
      </MASessionProvider>
    </ThemeProvider>
  );
}

export default App;
