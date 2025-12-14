"""
Pydantic Schemas for Scheduling API
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ProviderInfo(BaseModel):
    """Provider information"""
    provider_id: int
    npi: str
    name: str
    credentials: str
    specialty: str
    years_experience: int
    languages: List[str]


class FacilityInfo(BaseModel):
    """Facility information"""
    facility_id: int
    name: str
    address: str
    city: str
    region: str
    phone: str


class SlotRecommendation(BaseModel):
    """Single appointment slot recommendation"""
    provider: ProviderInfo
    facility: FacilityInfo
    slot_datetime: datetime
    duration_minutes: int
    reasoning: str = Field(..., description="Why this slot was recommended")
    match_score: float = Field(..., ge=0, le=1, description="Match score (0-1)")
    distance_miles: Optional[float] = None


class SchedulingRequest(BaseModel):
    """Request for appointment slot recommendations"""
    specialty_id: int = Field(..., description="Medical specialty ID")
    triage_priority: str = Field(..., description="emergency|urgent|semi-urgent|non-urgent")
    patient_fhir_id: Optional[str] = Field(None, description="FHIR Patient ID")
    patient_region: Optional[str] = Field(None, description="Utah region preference")
    preferred_date_range: Optional[Dict[str, str]] = Field(
        None,
        description="{'start': 'YYYY-MM-DD', 'end': 'YYYY-MM-DD'}"
    )
    triage_session_id: Optional[str] = None


class SchedulingResponse(BaseModel):
    """Response with appointment recommendations"""
    recommendations: List[SlotRecommendation]
    total_options_found: int
    message: Optional[str] = None


class AppointmentBookingRequest(BaseModel):
    """Request to book an appointment"""
    provider_id: int
    facility_id: int
    specialty_id: int
    patient_fhir_id: str
    appointment_datetime: datetime
    duration_minutes: int = 15
    urgency: str
    reason_for_visit: Optional[str] = None
    triage_session_id: Optional[str] = None


class AppointmentBookingResponse(BaseModel):
    """Response after booking appointment"""
    success: bool
    appointment_id: Optional[int] = None
    confirmation_number: Optional[str] = None
    fhir_appointment_id: Optional[str] = None
    error: Optional[str] = None
    code: Optional[int] = None


class ProviderSearchRequest(BaseModel):
    """Search for providers"""
    specialty_id: int
    region: Optional[str] = None
    accepts_new_patients: bool = True


class ProviderSearchResponse(BaseModel):
    """Provider search results"""
    providers: List[ProviderInfo]
    count: int
