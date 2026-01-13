/**
 * Chat Context Provider
 * Manages conversation state, current patient, and chat interactions
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ChatMessage, MAChatRequest, Patient } from '../types';
import { apiService } from '../services/api';
import { useMASession } from './MASessionContext';

interface ChatContextType {
  messages: ChatMessage[];
  currentPatient: Patient | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  setCurrentPatient: (patient: Patient | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { session } = useMASession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session) {
        setError('No active MA session');
        return;
      }

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Prepare chat request
        const request: MAChatRequest = {
          message: content,
          ma_session_id: session.session_id,
          conversation_history: messages,
          current_patient_id: currentPatient?.id || null,
        };

        // Send to backend
        const response = await apiService.sendChatMessage(request);

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: response.message_id,
          role: 'assistant',
          content: response.content,
          timestamp: response.timestamp,
          metadata: response.metadata,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update current patient if one was found
        if (response.metadata?.patient?.patient) {
          setCurrentPatient(response.metadata.patient.patient);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to send message');
        console.error('Chat error:', err);

        // Add error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [session, messages, currentPatient]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentPatient(null);
    setError(null);
  }, []);

  // Enhanced setCurrentPatient wrapper to handle patient changes
  const handleSetCurrentPatient = useCallback((patient: Patient | null) => {
    setCurrentPatient(patient);
  }, []);

  const value: ChatContextType = {
    messages,
    currentPatient,
    isLoading,
    error,
    sendMessage,
    clearChat,
    setCurrentPatient: handleSetCurrentPatient,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
