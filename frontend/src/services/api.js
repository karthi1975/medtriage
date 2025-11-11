/**
 * API Service for communicating with the backend
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Health check endpoint
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Get patient history
 */
export const getPatientHistory = async (patientId) => {
  const response = await apiClient.get(`/api/v1/patients/${patientId}`);
  return response.data;
};

/**
 * Extract symptoms from text
 */
export const extractSymptoms = async (text, patientId = null) => {
  const response = await apiClient.post('/api/v1/extract-symptoms', {
    text,
    patient_id: patientId,
  });
  return response.data;
};

/**
 * Chat with AI assistant
 */
export const sendChatMessage = async (message, patientId = null, conversationHistory = []) => {
  const response = await apiClient.post('/api/v1/chat', {
    message,
    patient_id: patientId,
    conversation_history: conversationHistory,
  });
  return response.data;
};

/**
 * Perform triage assessment
 */
export const performTriage = async (message, patientId = null, symptoms = null) => {
  const response = await apiClient.post('/api/v1/triage', {
    message,
    patient_id: patientId,
    symptoms,
  });
  return response.data;
};

export default {
  healthCheck,
  getPatientHistory,
  extractSymptoms,
  sendChatMessage,
  performTriage,
};
