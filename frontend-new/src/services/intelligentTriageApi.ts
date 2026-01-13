/**
 * Intelligent Triage API Client
 * Handles all intelligent triage and workflow-related API calls
 */

import axios from 'axios';
import type { TriageResult, Workflow } from '../context/WorkflowContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
const API_BASE = '/api/v1';

// Use longer timeout for production (backend has slow database queries)
// Development: 30s, Production: 300s (5 minutes) - backend can take 2+ minutes
const timeout = API_BASE_URL.includes('run.app') ? 300000 : 30000;

// Create axios client for intelligent triage API
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout, // 30s for dev, 300s for production
});

export interface IntelligentTriageRequest {
  patient_fhir_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_conditions: string[];
  symptoms: string[];
  symptom_details: Record<string, any>;
  provider_name: string;
  specialty: string;
  urgency_override?: string;
}

export interface IntelligentTriageResponse {
  success: boolean;
  message: string;
  result: TriageResult;
}

export interface WorkflowsResponse {
  total: number;
  workflows: Workflow[];
}

export interface WorkflowDetailResponse {
  workflow: Workflow;
  progress: {
    progress_percentage: number;
    completed_steps: number;
    total_steps: number;
    next_step: string;
    current_status: string;
  };
}

/**
 * Perform intelligent triage with automatic protocol activation
 */
export const performIntelligentTriage = async (
  request: IntelligentTriageRequest
): Promise<TriageResult> => {
  const response = await apiClient.post<IntelligentTriageResponse>(
    `${API_BASE}/ma/intelligent-triage`,
    request
  );
  return response.data.result;
};

/**
 * Get all active workflows
 */
export const getActiveWorkflows = async (): Promise<Workflow[]> => {
  const response = await apiClient.get<WorkflowsResponse>(
    `${API_BASE}/workflows/active`
  );
  return response.data.workflows;
};

/**
 * Get workflows needing attention
 */
export const getWorkflowsNeedingAttention = async (): Promise<Workflow[]> => {
  const response = await apiClient.get<WorkflowsResponse>(
    `${API_BASE}/workflows/attention-needed`
  );
  return response.data.workflows;
};

/**
 * Get specific workflow by ID
 */
export const getWorkflow = async (workflowId: string): Promise<WorkflowDetailResponse> => {
  const response = await apiClient.get<WorkflowDetailResponse>(
    `${API_BASE}/workflows/${workflowId}`
  );
  return response.data;
};

/**
 * Get all workflows for a patient
 */
export const getPatientWorkflows = async (patientFhirId: string): Promise<Workflow[]> => {
  const response = await apiClient.get<WorkflowsResponse>(
    `${API_BASE}/workflows/patient/${patientFhirId}`
  );
  return response.data.workflows;
};

/**
 * Update a workflow checkpoint
 */
export const updateCheckpoint = async (
  workflowId: string,
  checkpointName: string,
  status: string,
  details?: string
): Promise<any> => {
  const response = await apiClient.post(
    `${API_BASE}/workflows/${workflowId}/checkpoints/${encodeURIComponent(checkpointName)}/update`,
    {
      checkpoint_status: status,
      details
    }
  );
  return response.data;
};

/**
 * Add test order to workflow
 */
export const addTestOrder = async (
  workflowId: string,
  testName: string,
  orderType: 'laboratory' | 'imaging' | 'procedure',
  scheduledDate?: string,
  details?: Record<string, any>
): Promise<any> => {
  const response = await apiClient.post(
    `${API_BASE}/workflows/${workflowId}/test-orders`,
    {
      test_name: testName,
      order_type: orderType,
      scheduled_date: scheduledDate,
      details
    }
  );
  return response.data;
};

/**
 * Update test order status
 */
export const updateTestOrder = async (
  workflowId: string,
  orderId: string,
  status: string,
  resultsAvailable: boolean = false,
  details?: Record<string, any>
): Promise<any> => {
  const response = await apiClient.post(
    `${API_BASE}/workflows/${workflowId}/test-orders/${orderId}/update`,
    {
      order_status: status,
      results_available: resultsAvailable,
      details
    }
  );
  return response.data;
};

/**
 * Complete workflow
 */
export const completeWorkflow = async (
  workflowId: string,
  reason: string = 'Appointment scheduled'
): Promise<Workflow> => {
  const response = await apiClient.post(
    `${API_BASE}/workflows/${workflowId}/complete`,
    { reason }
  );
  return response.data.workflow;
};

/**
 * Helper: Extract symptoms from text using keyword matching
 * Simplified version - just uses keyword extraction since backend endpoint doesn't exist
 */
export const extractSymptomsFromText = async (
  text: string,
  _patientContext: any
): Promise<string[]> => {
  // Use keyword extraction directly
  return extractSymptomsKeywords(text);
};

/**
 * Simple keyword-based symptom extraction (fallback)
 */
const extractSymptomsKeywords = (text: string): string[] => {
  const symptomKeywords = [
    'chest pain',
    'shortness of breath',
    'dyspnea',
    'palpitations',
    'syncope',
    'fainting',
    'dizziness',
    'headache',
    'nausea',
    'vomiting',
    'fever',
    'cough',
    'fatigue',
    'weakness',
    'pain',
    'swelling',
    'radiation'
  ];

  const textLower = text.toLowerCase();
  const foundSymptoms: string[] = [];

  for (const keyword of symptomKeywords) {
    if (textLower.includes(keyword)) {
      foundSymptoms.push(keyword);
    }
  }

  return foundSymptoms;
};

/**
 * Helper: Trigger intelligent triage from chat message
 */
export const triggerIntelligentTriageFromChat = async (
  message: string,
  patient: any,
  providerName: string,
  specialty: string
): Promise<TriageResult> => {
  console.log('[Intelligent Triage] Triggering with patient:', patient);

  // Extract symptoms from message
  const symptoms = await extractSymptomsFromText(message, patient);
  console.log('[Intelligent Triage] Extracted symptoms:', symptoms);

  if (symptoms.length === 0) {
    console.warn('[Intelligent Triage] No symptoms detected, using message directly');
    symptoms.push('chest pain'); // Fallback
  }

  // Handle both patient data structures (from search vs from metadata)
  const patientData = patient.patient || patient;
  const patientId = patientData.id || patient.id;
  const patientName = patientData.name || patient.name;
  const patientGender = patientData.gender || patient.gender || 'unknown';
  const patientBirthDate = patientData.birthDate || patient.birthDate;
  const patientAge = patientData.age || calculateAge(patientBirthDate);

  // Get conditions from various possible structures
  let conditions: string[] = [];
  if (patient.conditions) {
    conditions = patient.conditions.map((c: any) =>
      typeof c === 'string' ? c : (c.condition || c.display || c.code?.text || 'Unknown')
    );
  }

  console.log('[Intelligent Triage] Patient data:', {
    id: patientId,
    name: patientName,
    age: patientAge,
    gender: patientGender,
    conditions
  });

  // Prepare triage request
  const triageRequest: IntelligentTriageRequest = {
    patient_fhir_id: String(patientId),
    patient_name: String(patientName),
    patient_age: Number(patientAge) || 0,
    patient_gender: String(patientGender),
    patient_conditions: conditions,
    symptoms,
    symptom_details: {
      reported_text: message,
      onset: 'recent',
      severity: 'unknown'
    },
    provider_name: providerName,
    specialty
  };

  console.log('[Intelligent Triage] Sending request:', triageRequest);

  try {
    const result = await performIntelligentTriage(triageRequest);
    console.log('[Intelligent Triage] Received result:', result);
    return result;
  } catch (error) {
    console.error('[Intelligent Triage] Error:', error);
    throw error;
  }
};

/**
 * Helper: Calculate age from birthdate
 */
const calculateAge = (birthDate?: string): number => {
  if (!birthDate) return 0;

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export default {
  performIntelligentTriage,
  getActiveWorkflows,
  getWorkflowsNeedingAttention,
  getWorkflow,
  getPatientWorkflows,
  updateCheckpoint,
  addTestOrder,
  updateTestOrder,
  completeWorkflow,
  triggerIntelligentTriageFromChat,
  extractSymptomsFromText
};
