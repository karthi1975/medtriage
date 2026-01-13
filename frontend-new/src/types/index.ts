/**
 * TypeScript type definitions for MediChat MA Assistant
 */

// Patient types
export interface Patient {
  id: string;
  name: string | null;
  gender: string;
  birthDate: string;
  age?: number;
  address: string | null;
  telecom: string | null;
  conditions?: string[];
  medications?: Medication[];
  allergies?: string[];
}

export interface Medication {
  medication: string;
  dosage?: string;
  route?: string;
  frequency?: string;
}

// MA Session types
export interface MASession {
  session_id: string;
  ma_id: string | null;
  ma_name: string;
  facility_id: number;
  facility_name: string;
  specialty_id: number;
  specialty_name: string;
  shift_start_time: string;
}

export interface MASessionRequest {
  ma_name: string;
  facility_id: number;
  specialty_id: number;
}

// Triage types
export interface TriageResult {
  priority: 'emergency' | 'urgent' | 'semi-urgent' | 'non-urgent';
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  red_flags?: string[];
  recommendations: {
    immediate_action: string;
    care_level: string;
    timeframe: string;
    self_care_tips?: string[];
    warning_signs?: string[];
  };
}

// Testing types
export interface TestRequirement {
  type: string;
  max_age_days: number;
  loinc_codes: string[];
  dicom_modality: string | null;
  description: string;
  urgent: boolean;
}

export interface TestResult {
  type: string;
  date: string;
  days_ago: number;
  value: string | null;
  unit: string | null;
  status: string;
}

export interface TestingStatus {
  patient_id: string;
  specialty: string;
  visit_type: string;
  urgency: string;
  required_tests_missing: TestRequirement[];
  recommended_tests_missing: TestRequirement[];
  recent_tests: TestResult[];
  all_required_met: boolean;
  needs_urgent_testing: boolean;
  can_schedule: boolean;
  formatted_message: string;
}

// Scheduling types
export interface AppointmentSlot {
  id: string;
  provider: {
    id: string;
    name: string;
    specialty: string;
  };
  facility: {
    id: string;
    name: string;
    address: string;
  };
  date: string;
  time: string;
  distance?: string;
  score?: number;
  testingTimeline?: string;
}

export interface AppointmentConfirmation {
  confirmation_number: string;
  patient_id: string;
  provider_name: string;
  facility_name: string;
  date: string;
  time: string;
  specialty: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    patient?: {
      patient: Patient;
    };
    triage?: TriageResult;
    testingStatus?: TestingStatus;
    availableSlots?: AppointmentSlot[];
    appointmentConfirmation?: AppointmentConfirmation;
  };
}

export interface Intent {
  intent_type: 'PATIENT_LOOKUP' | 'TRIAGE_START' | 'TESTING_CHECK' | 'SCHEDULE_REQUEST' | 'APPOINTMENT_CONFIRM' | 'GENERAL_QUESTION';
  confidence: number;
  extracted_entities: Record<string, any>;
}

export interface MAChatRequest {
  message: string;
  ma_session_id: string;
  conversation_history: ChatMessage[];
  current_patient_id: string | null;
}

export interface MAChatResponse {
  message_id: string;
  content: string;
  timestamp: string;
  intent: Intent;
  metadata?: Record<string, any>;
  actions_taken: string[];
  suggested_responses?: string[];
}

// Facility types
export interface Facility {
  id: number;
  name: string;
  city: string;
  region: string;
}

export interface Specialty {
  id: number;
  name: string;
  description: string;
}
