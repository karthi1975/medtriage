/**
 * Main Application Component
 * Medical Triage System
 */
import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import TriageResults from './components/TriageResults';
import { performTriage, healthCheck } from './services/api';
import './styles/App.css';

function App() {
  const [triageData, setTriageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  // Check API health on mount
  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthCheck();
        setApiStatus('connected');
      } catch (err) {
        setApiStatus('disconnected');
        setError('Cannot connect to backend API. Please ensure the server is running.');
      }
    };
    checkHealth();
  }, []);

  const handleTriageRequest = async (message, patientId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await performTriage(message, patientId);
      setTriageData(result);
    } catch (err) {
      console.error('Triage error:', err);
      setError(
        err.response?.data?.detail || 'Failed to perform triage assessment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTriageData(null);
    setError(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Medical Triage System</h1>
        <p>AI-Powered Symptom Assessment &amp; Care Recommendations</p>
        <div className={`api-status ${apiStatus}`}>
          <span className="status-dot"></span>
          {apiStatus === 'connected' && 'Connected to API'}
          {apiStatus === 'disconnected' && 'API Disconnected'}
          {apiStatus === 'checking' && 'Checking connection...'}
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} className="close-error">
              ×
            </button>
          </div>
        )}

        <div className="content-container">
          <div className="chat-panel">
            <ChatInterface onTriageRequest={handleTriageRequest} loading={loading} />
          </div>

          <div className="results-panel">
            {triageData ? (
              <>
                <div className="panel-header">
                  <button onClick={handleReset} className="reset-button">
                    New Assessment
                  </button>
                </div>
                <TriageResults triageData={triageData} />
              </>
            ) : (
              <div className="empty-results">
                <div className="empty-icon">🏥</div>
                <h3>No Assessment Yet</h3>
                <p>
                  Describe your symptoms in the chat to receive a triage assessment and care
                  recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          <strong>Disclaimer:</strong> This system is for educational purposes and should not
          replace professional medical advice. Always consult healthcare providers for proper
          diagnosis and treatment.
        </p>
      </footer>
    </div>
  );
}

export default App;
