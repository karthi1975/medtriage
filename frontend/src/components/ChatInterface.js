/**
 * Chat Interface Component
 * Provides a conversational interface for symptom collection
 */
import React, { useState, useRef, useEffect } from 'react';
import '../styles/ChatInterface.css';

const ChatInterface = ({ onTriageRequest, loading }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m here to help assess your symptoms. Please describe what you\'re experiencing, and I\'ll provide a triage recommendation.',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [patientId, setPatientId] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    const messageToSend = inputMessage;
    setInputMessage('');

    // Request triage assessment
    if (onTriageRequest) {
      await onTriageRequest(messageToSend, patientId || null);
    }
  };

  const addAssistantMessage = (content) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content,
      },
    ]);
  };

  // Expose method to add assistant messages
  React.useImperativeHandle(
    React.createRef(),
    () => ({
      addAssistantMessage,
    }),
    []
  );

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Symptom Assessment Chat</h2>
        <div className="patient-id-input">
          <input
            type="text"
            placeholder="Patient ID (optional)"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="patient-id-field"
          />
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-role">
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message assistant-message">
            <div className="message-role">Assistant</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Describe your symptoms..."
          className="message-input"
          disabled={loading}
        />
        <button type="submit" className="send-button" disabled={loading || !inputMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
