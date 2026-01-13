/**
 * Appointment types for EHR integration
 */

export interface Provider {
  provider_id: number;
  name: string;
  credentials?: string;
  npi?: string;
}

export interface Facility {
  facility_id: number;
  name: string;
  city?: string;
  address?: string;
}

export interface Specialty {
  specialty_id: number;
  name: string;
}

export interface Appointment {
  appointment_id: number;
  confirmation_number: string;
  fhir_appointment_id: string;
  patient_fhir_id: string;
  appointment_datetime: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  urgency: 'emergency' | 'urgent' | 'semi-urgent' | 'non-urgent';
  reason_for_visit: string;
  chief_complaint?: string;
  provider: Provider;
  facility: Facility;
  specialty: Specialty;
  created_at: string;
}

export interface AppointmentDetail extends Appointment {
  visit_type?: string;
  triage_priority?: string;
  triage_session_id?: number;
  patient_notified: boolean;
  created_by?: string;
  updated_at?: string;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface AppointmentStats {
  total: number;
  by_status: Record<string, number>;
  by_urgency: Record<string, number>;
}

export interface AppointmentFilters {
  facility_id?: number;
  specialty_id?: number;
  provider_id?: number;
  patient_fhir_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
