/**
 * API Service for MediChat Backend Communication
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  MASession,
  MASessionRequest,
  MAChatRequest,
  MAChatResponse,
  Patient,
  TestingStatus,
  Facility,
  Specialty,
} from '../types';
import type {
  Appointment,
  AppointmentDetail,
  AppointmentsResponse,
  AppointmentStats,
  AppointmentFilters,
} from '../types/appointment';

// API Base URL - use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

class APIService {
  private client: AxiosInstance;

  constructor() {
    // Use longer timeout for production (Backend has slow database queries)
    // Development: 30s, Production: 300s (5 minutes) - backend can take 2+ minutes
    const timeout = API_BASE_URL.includes('run.app') ? 300000 : 30000;

    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout, // 30s for dev, 300s for production
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ========== Health Check ==========
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // ========== MA Session Management ==========
  async createMASession(request: MASessionRequest): Promise<MASession> {
    const response = await this.client.post<MASession>('/api/v1/ma/session', request);
    return response.data;
  }

  // ========== Patient Search ==========
  async searchPatients(query: string, searchType: string = 'auto'): Promise<{ results: Patient[]; total: number }> {
    const response = await this.client.post('/api/v1/patients/search', {
      query,
      search_type: searchType,
    });
    return response.data;
  }

  async getPatientHistory(patientId: string): Promise<{ patient_id: string; data: any }> {
    const response = await this.client.get(`/api/v1/patients/${patientId}`);
    return response.data;
  }

  // ========== Testing Status ==========
  async getTestingStatus(
    patientId: string,
    specialtyName: string,
    visitType: string = 'new_patient',
    urgency: string = 'non-urgent'
  ): Promise<TestingStatus> {
    const response = await this.client.get<TestingStatus>(
      `/api/v1/patients/${patientId}/testing-status`,
      {
        params: {
          specialty_name: specialtyName,
          visit_type: visitType,
          urgency,
        },
      }
    );
    return response.data;
  }

  // ========== Conversational MA Chat ==========
  async sendChatMessage(request: MAChatRequest): Promise<MAChatResponse> {
    const response = await this.client.post<MAChatResponse>('/api/v1/ma/chat', request);
    return response.data;
  }

  // ========== Facilities and Specialties ==========
  async getFacilities(): Promise<Facility[]> {
    const response = await this.client.get<Facility[]>('/api/v1/facilities');
    return response.data;
  }

  async getSpecialties(): Promise<Specialty[]> {
    const response = await this.client.get<Specialty[]>('/api/v1/specialties');
    return response.data;
  }

  // ========== Appointments Management ==========
  async getAppointments(filters: AppointmentFilters = {}): Promise<AppointmentsResponse> {
    const response = await this.client.get<AppointmentsResponse>('/api/v1/appointments', {
      params: filters,
    });
    return response.data;
  }

  async getAppointmentById(appointmentId: number): Promise<AppointmentDetail> {
    const response = await this.client.get<AppointmentDetail>(`/api/v1/appointments/${appointmentId}`);
    return response.data;
  }

  async getTodaysAppointments(facilityId?: number, providerId?: number): Promise<Appointment[]> {
    const response = await this.client.get<Appointment[]>('/api/v1/appointments/today/list', {
      params: {
        facility_id: facilityId,
        provider_id: providerId,
      },
    });
    return response.data;
  }

  async getAppointmentStats(
    facilityId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<AppointmentStats> {
    const response = await this.client.get<AppointmentStats>('/api/v1/appointments/stats', {
      params: {
        facility_id: facilityId,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  }

  // ========== Llama 4 API Integration ==========
  async llamaTest(): Promise<{ success: boolean; message: string; test_response?: any }> {
    const response = await this.client.get('/llama/test');
    return response.data;
  }

  async llamaTriage(
    symptoms: string,
    patientHistory?: Record<string, any>
  ): Promise<{ success: boolean; symptoms: string; triage_recommendation: string }> {
    const response = await this.client.post('/llama/triage', {
      symptoms,
      patient_history: patientHistory,
    });
    return response.data;
  }

  async llamaSummarize(
    clinicalNotes: string
  ): Promise<{ success: boolean; original_notes: string; summary: string }> {
    const response = await this.client.post('/llama/summarize', {
      clinical_notes: clinicalNotes,
    });
    return response.data;
  }

  async llamaChat(
    messages: Array<{ role: string; content: string }>,
    maxTokens?: number,
    temperature?: number
  ): Promise<{ success: boolean; response: any }> {
    const response = await this.client.post('/llama/chat', {
      messages,
      max_tokens: maxTokens,
      temperature,
    });
    return response.data;
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;
