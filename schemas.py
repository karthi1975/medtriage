"""
Pydantic models for request and response schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str = Field(..., description="Role of the message sender (user/assistant/system)")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., description="User's message/symptom description")
    patient_id: Optional[str] = Field(None, description="Optional patient ID for context")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation history")


class SymptomExtractionRequest(BaseModel):
    """Request model for symptom extraction"""
    text: str = Field(..., description="Text containing symptom descriptions")
    patient_id: Optional[str] = Field(None, description="Optional patient ID for context")


class ExtractedSymptom(BaseModel):
    """Model for extracted symptom"""
    symptom: str = Field(..., description="Name of the symptom")
    severity: Optional[str] = Field(None, description="Severity level (mild/moderate/severe)")
    duration: Optional[str] = Field(None, description="Duration of the symptom")
    location: Optional[str] = Field(None, description="Body location of the symptom")


class SymptomExtractionResponse(BaseModel):
    """Response model for symptom extraction"""
    extracted_symptoms: List[ExtractedSymptom] = Field(..., description="List of extracted symptoms")
    summary: str = Field(..., description="Summary of the symptom extraction")
    raw_response: str = Field(..., description="Raw response from the AI")


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str = Field(..., description="AI assistant's response")
    extracted_symptoms: Optional[List[ExtractedSymptom]] = Field(None, description="Symptoms extracted from conversation")
    patient_context: Optional[Dict[str, Any]] = Field(None, description="Patient context if patient_id was provided")


class PatientHistoryResponse(BaseModel):
    """Response model for patient history endpoint"""
    patient_id: str = Field(..., description="Patient ID")
    data: Dict[str, Any] = Field(..., description="Patient history data")


class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint"""
    status: str = Field(..., description="Health status")
    version: str = Field(..., description="API version")


class TriageRequest(BaseModel):
    """Request model for triage assessment"""
    message: str = Field(..., description="Patient's symptom description")
    patient_id: Optional[str] = Field(None, description="Optional patient ID for context")
    symptoms: Optional[List[ExtractedSymptom]] = Field(None, description="Pre-extracted symptoms (optional)")


class TriageRecommendations(BaseModel):
    """Care recommendations from triage"""
    immediate_action: str = Field(..., description="What to do immediately")
    care_level: str = Field(..., description="Recommended level of care")
    timeframe: str = Field(..., description="When to seek care")
    self_care_tips: Optional[List[str]] = Field(None, description="Self-care measures")
    warning_signs: Optional[List[str]] = Field(None, description="Signs requiring escalation")
    follow_up: Optional[str] = Field(None, description="Follow-up recommendations")


class TriageResponse(BaseModel):
    """Response model for triage assessment"""
    priority: str = Field(..., description="Triage priority (emergency/urgent/semi-urgent/non-urgent)")
    reasoning: str = Field(..., description="Explanation of the triage decision")
    confidence: str = Field(..., description="Confidence level (high/medium/low)")
    red_flags: Optional[List[str]] = Field(None, description="Concerning symptoms identified")
    recommendations: Dict[str, Any] = Field(..., description="Care recommendations")
    extracted_symptoms: List[ExtractedSymptom] = Field(..., description="Symptoms identified")
    patient_context: Optional[Dict[str, Any]] = Field(None, description="Patient context if provided")


# MA Session Management Schemas
class MASessionRequest(BaseModel):
    """Request model for creating MA session"""
    ma_name: str = Field(..., description="Medical Assistant's name")
    facility: str = Field(..., description="Facility name where MA is working")
    specialty: str = Field(..., description="Specialty name for this shift")


class MASessionResponse(BaseModel):
    """Response model for MA session"""
    session_id: str = Field(..., description="Unique session ID")
    ma_id: Optional[str] = Field(None, description="MA user ID (if implemented)")
    ma_name: str = Field(..., description="Medical Assistant's name")
    facility_id: int = Field(..., description="Facility ID")
    facility_name: str = Field(..., description="Facility name")
    specialty_id: int = Field(..., description="Specialty ID")
    specialty_name: str = Field(..., description="Specialty name")
    shift_start_time: str = Field(..., description="Shift start timestamp")


# Patient Search Schemas
class PatientSearchRequest(BaseModel):
    """Request model for patient search"""
    query: str = Field(..., description="Search query (patient ID, name, DOB, etc.)")
    search_type: Optional[str] = Field("auto", description="Search type: auto, id, name, dob")


class PatientSearchResult(BaseModel):
    """Individual patient search result"""
    patient_id: str = Field(..., description="Patient ID")
    name: str = Field(..., description="Patient name")
    birth_date: Optional[str] = Field(None, description="Date of birth")
    gender: Optional[str] = Field(None, description="Gender")
    address: Optional[str] = Field(None, description="Primary address")
    phone: Optional[str] = Field(None, description="Phone number")


class PatientSearchResponse(BaseModel):
    """Response model for patient search"""
    results: List[PatientSearchResult] = Field(..., description="List of matching patients")
    total: int = Field(..., description="Total number of results")


# Testing Status Schemas
class TestRequirement(BaseModel):
    """Individual test requirement"""
    type: str = Field(..., description="Test type (e.g., ECG, Lipid Panel)")
    max_age_days: int = Field(..., description="Maximum age in days for test to be valid")
    loinc_codes: List[str] = Field(default=[], description="LOINC codes for this test")
    dicom_modality: Optional[str] = Field(None, description="DICOM modality for imaging")
    description: str = Field("", description="Human-readable description")
    urgent: bool = Field(False, description="Whether this test is urgent")


class TestResult(BaseModel):
    """Individual test result"""
    type: str = Field(..., description="Test type")
    date: str = Field(..., description="Test date")
    days_ago: int = Field(..., description="Days since test was performed")
    value: Optional[str] = Field(None, description="Test value")
    unit: Optional[str] = Field(None, description="Test unit")
    status: str = Field("final", description="Test status")


class TestingStatusResponse(BaseModel):
    """Response model for testing status check"""
    patient_id: str = Field(..., description="Patient ID")
    specialty: str = Field(..., description="Specialty name")
    visit_type: str = Field(..., description="Visit type (new_patient/followup)")
    urgency: str = Field(..., description="Urgency level")
    required_tests_missing: List[TestRequirement] = Field(..., description="Missing required tests")
    recommended_tests_missing: List[TestRequirement] = Field(..., description="Missing recommended tests")
    recent_tests: List[TestResult] = Field(..., description="Recent valid tests")
    all_required_met: bool = Field(..., description="Whether all required tests are met")
    needs_urgent_testing: bool = Field(..., description="Whether urgent tests are needed")
    can_schedule: bool = Field(..., description="Whether appointment can be scheduled")
    formatted_message: str = Field(..., description="Human-readable testing status message")


# Intent Classification Schemas
class Intent(BaseModel):
    """Classified user intent"""
    intent_type: str = Field(..., description="Intent type: PATIENT_LOOKUP, TRIAGE_START, TESTING_CHECK, SCHEDULE_REQUEST, APPOINTMENT_CONFIRM, GENERAL_QUESTION")
    confidence: float = Field(..., description="Confidence score 0-1")
    extracted_entities: Dict[str, Any] = Field(default={}, description="Extracted entities from message")


# MA Conversational Chat Schemas
class MAChatMessage(BaseModel):
    """Message in MA conversation"""
    id: str = Field(..., description="Message ID")
    role: str = Field(..., description="Message role (user/assistant)")
    content: str = Field(..., description="Message content")
    timestamp: str = Field(..., description="Message timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata (triage result, slots, etc.)")


class MAChatRequest(BaseModel):
    """Request model for MA chat endpoint"""
    message: str = Field(..., description="MA's message")
    ma_session_id: str = Field(..., description="MA session ID")
    conversation_history: List[MAChatMessage] = Field(default=[], description="Previous conversation messages")
    current_patient_id: Optional[str] = Field(None, description="Currently selected patient ID")


class MAChatResponse(BaseModel):
    """Response model for MA chat endpoint"""
    message_id: str = Field(..., description="Response message ID")
    content: str = Field(..., description="Conversational response text")
    timestamp: str = Field(..., description="Response timestamp")
    intent: Intent = Field(..., description="Classified intent")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Structured data (patient, triage, slots, etc.)")
    actions_taken: List[str] = Field(default=[], description="List of actions performed")
    suggested_responses: Optional[List[str]] = Field(None, description="Suggested quick replies for MA")


# Intelligent Triage Schemas
class IntelligentTriageRequest(BaseModel):
    """Request model for intelligent triage with protocol activation"""
    patient_fhir_id: str = Field(..., description="Patient's FHIR ID")
    patient_name: str = Field(..., description="Patient's full name")
    patient_age: int = Field(..., description="Patient's age in years")
    patient_gender: str = Field(..., description="Patient's gender")
    patient_conditions: List[str] = Field(default=[], description="Patient's existing conditions")
    symptoms: List[str] = Field(..., description="List of symptoms")
    symptom_details: Dict[str, Any] = Field(default={}, description="Additional symptom details (onset, severity, etc.)")
    provider_name: str = Field(..., description="Provider's name")
    specialty: str = Field(..., description="Specialty for this triage")
    urgency_override: Optional[str] = Field(None, description="Optional urgency override")


class IntelligentTriageResponse(BaseModel):
    """Response model for intelligent triage"""
    success: bool = Field(..., description="Whether triage was successful")
    message: str = Field(..., description="Status message")
    result: Dict[str, Any] = Field(..., description="Complete triage result with protocol, risk, actions, tests, workflow")
