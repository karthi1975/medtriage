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
