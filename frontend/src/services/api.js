/**
 * API Service for communicating with the backend
 */
import axios from 'axios';

// If REACT_APP_API_URL is empty string, use relative URLs (production with nginx proxy)
// Otherwise use the specified URL (development or custom deployment)
const API_BASE_URL = process.env.REACT_APP_API_URL !== undefined && process.env.REACT_APP_API_URL !== ''
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:8002';

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

/**
 * Get appointment slot recommendations
 */
export const getSchedulingRecommendations = async (
  specialtyId,
  triagePriority,
  patientFhirId = null,
  patientRegion = null,
  preferredDateRange = null,
  triageSessionId = null
) => {
  const response = await apiClient.post('/api/v1/scheduling/recommend', {
    specialty_id: specialtyId,
    triage_priority: triagePriority,
    patient_fhir_id: patientFhirId,
    patient_region: patientRegion,
    preferred_date_range: preferredDateRange,
    triage_session_id: triageSessionId,
  });
  return response.data;
};

/**
 * Book an appointment
 */
export const bookAppointment = async (
  providerId,
  facilityId,
  specialtyId,
  patientFhirId,
  appointmentDatetime,
  durationMinutes,
  urgency,
  reasonForVisit,
  triageSessionId = null
) => {
  const response = await apiClient.post('/api/v1/scheduling/book', {
    provider_id: providerId,
    facility_id: facilityId,
    specialty_id: specialtyId,
    patient_fhir_id: patientFhirId,
    appointment_datetime: appointmentDatetime,
    duration_minutes: durationMinutes,
    urgency,
    reason_for_visit: reasonForVisit,
    triage_session_id: triageSessionId,
  });
  return response.data;
};

/**
 * Search providers by specialty and region
 */
export const searchProviders = async (specialtyId, region = null, acceptsNewPatients = true) => {
  const params = new URLSearchParams({
    specialty_id: specialtyId,
    accepts_new_patients: acceptsNewPatients,
  });

  if (region) {
    params.append('region', region);
  }

  const response = await apiClient.get(`/api/v1/providers/search?${params.toString()}`);
  return response.data;
};

export default {
  healthCheck,
  getPatientHistory,
  extractSymptoms,
  sendChatMessage,
  performTriage,
  getSchedulingRecommendations,
  bookAppointment,
  searchProviders,
};
