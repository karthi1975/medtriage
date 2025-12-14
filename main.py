"""
Main FastAPI application for FHIR Chat API
Provides endpoints for patient data retrieval and chat-based symptom extraction
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import Dict, Any

from config import settings
from fhir_client import FHIRClient
from chat_service import ChatService
from triage_service import TriageService
from schemas import (
    ChatRequest,
    ChatResponse,
    SymptomExtractionRequest,
    SymptomExtractionResponse,
    PatientHistoryResponse,
    HealthCheckResponse,
    TriageRequest,
    TriageResponse
)
from scheduling_schemas import (
    SchedulingRequest,
    SchedulingResponse,
    AppointmentBookingRequest,
    AppointmentBookingResponse,
    ProviderSearchRequest,
    ProviderSearchResponse
)
from scheduling_service import SchedulingService
from database.connection import get_db
from fastapi import Depends
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
fhir_client = FHIRClient(fhir_server_url=settings.fhir_server_url)
chat_service = ChatService(api_key=settings.openai_api_key, model=settings.openai_model)
triage_service = TriageService(
    api_key=settings.openai_api_key,
    model=settings.openai_model,
    use_rag=settings.use_rag
)

logger.info(f"Application initialized successfully (RAG: {'enabled' if settings.use_rag else 'disabled'})")


@app.get("/", response_model=HealthCheckResponse)
async def root():
    """
    Root endpoint - Health check
    """
    return HealthCheckResponse(
        status="healthy",
        version=settings.api_version
    )


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint
    """
    return HealthCheckResponse(
        status="healthy",
        version=settings.api_version
    )


@app.get("/api/v1/patients/{patient_id}", response_model=PatientHistoryResponse)
async def get_patient_history(patient_id: str):
    """
    Retrieve comprehensive patient history by patient ID

    Args:
        patient_id: FHIR Patient ID

    Returns:
        Complete patient history including demographics, conditions, medications, etc.

    Raises:
        HTTPException: If patient not found or error occurs
    """
    try:
        logger.info(f"Fetching patient history for patient_id: {patient_id}")

        # Fetch patient history from FHIR server
        patient_history = fhir_client.get_patient_history(patient_id)

        # Check if patient exists
        if not patient_history.get('patient'):
            logger.warning(f"Patient {patient_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found"
            )

        logger.info(f"Successfully retrieved patient history for {patient_id}")
        return PatientHistoryResponse(
            patient_id=patient_id,
            data=patient_history
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving patient history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient history: {str(e)}"
        )


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint for conversational AI with optional symptom extraction

    Args:
        request: ChatRequest containing message, optional patient_id, and conversation history

    Returns:
        ChatResponse with AI response, extracted symptoms, and patient context

    Raises:
        HTTPException: If error occurs during chat or symptom extraction
    """
    try:
        logger.info(f"Processing chat request: {request.message[:50]}...")

        # Get patient context if patient_id provided
        patient_context = None
        if request.patient_id:
            logger.info(f"Fetching patient context for {request.patient_id}")
            try:
                patient_history = fhir_client.get_patient_history(request.patient_id)
                if patient_history.get('patient'):
                    patient_context = patient_history
            except Exception as e:
                logger.warning(f"Could not fetch patient context: {str(e)}")

        # Generate chat response and extract symptoms
        chat_response, extracted_symptoms = chat_service.chat_with_symptom_extraction(
            message=request.message,
            conversation_history=request.conversation_history,
            patient_context=patient_context
        )

        logger.info("Chat request processed successfully")

        return ChatResponse(
            response=chat_response,
            extracted_symptoms=extracted_symptoms,
            patient_context=patient_context
        )

    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat request: {str(e)}"
        )


@app.post("/api/v1/extract-symptoms", response_model=SymptomExtractionResponse)
async def extract_symptoms(request: SymptomExtractionRequest):
    """
    Extract symptoms from text using NLP

    Args:
        request: SymptomExtractionRequest containing text and optional patient_id

    Returns:
        SymptomExtractionResponse with extracted symptoms and summary

    Raises:
        HTTPException: If error occurs during symptom extraction
    """
    try:
        logger.info(f"Processing symptom extraction request: {request.text[:50]}...")

        # Get patient context if patient_id provided
        patient_context = None
        if request.patient_id:
            logger.info(f"Fetching patient context for {request.patient_id}")
            try:
                patient_history = fhir_client.get_patient_history(request.patient_id)
                if patient_history.get('patient'):
                    patient_context = patient_history
            except Exception as e:
                logger.warning(f"Could not fetch patient context: {str(e)}")

        # Extract symptoms
        extraction_result = chat_service.extract_symptoms(
            text=request.text,
            patient_context=patient_context
        )

        logger.info("Symptom extraction completed successfully")
        return extraction_result

    except Exception as e:
        logger.error(f"Error extracting symptoms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract symptoms: {str(e)}"
        )


@app.get("/api/v1/patients/{patient_id}/demographics")
async def get_patient_demographics(patient_id: str):
    """
    Retrieve only patient demographic information

    Args:
        patient_id: FHIR Patient ID

    Returns:
        Patient demographic information

    Raises:
        HTTPException: If patient not found or error occurs
    """
    try:
        logger.info(f"Fetching demographics for patient_id: {patient_id}")
        patient = fhir_client.get_patient(patient_id)

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found"
            )

        return JSONResponse(content=patient)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving patient demographics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient demographics: {str(e)}"
        )


@app.get("/api/v1/patients/{patient_id}/conditions")
async def get_patient_conditions(patient_id: str):
    """
    Retrieve patient conditions/diagnoses

    Args:
        patient_id: FHIR Patient ID

    Returns:
        List of patient conditions

    Raises:
        HTTPException: If error occurs
    """
    try:
        logger.info(f"Fetching conditions for patient_id: {patient_id}")
        conditions = fhir_client.get_patient_conditions(patient_id)
        return JSONResponse(content={"patient_id": patient_id, "conditions": conditions})

    except Exception as e:
        logger.error(f"Error retrieving patient conditions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient conditions: {str(e)}"
        )


@app.get("/api/v1/patients/{patient_id}/medications")
async def get_patient_medications(patient_id: str):
    """
    Retrieve patient medications

    Args:
        patient_id: FHIR Patient ID

    Returns:
        List of patient medications

    Raises:
        HTTPException: If error occurs
    """
    try:
        logger.info(f"Fetching medications for patient_id: {patient_id}")
        medications = fhir_client.get_patient_medications(patient_id)
        return JSONResponse(content={"patient_id": patient_id, "medications": medications})

    except Exception as e:
        logger.error(f"Error retrieving patient medications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient medications: {str(e)}"
        )


@app.get("/api/v1/patients/{patient_id}/allergies")
async def get_patient_allergies(patient_id: str):
    """
    Retrieve patient allergies

    Args:
        patient_id: FHIR Patient ID

    Returns:
        List of patient allergies

    Raises:
        HTTPException: If error occurs
    """
    try:
        logger.info(f"Fetching allergies for patient_id: {patient_id}")
        allergies = fhir_client.get_patient_allergies(patient_id)
        return JSONResponse(content={"patient_id": patient_id, "allergies": allergies})

    except Exception as e:
        logger.error(f"Error retrieving patient allergies: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient allergies: {str(e)}"
        )


@app.post("/api/v1/triage", response_model=TriageResponse)
async def perform_triage(request: TriageRequest):
    """
    Perform medical triage assessment based on symptoms

    This endpoint provides a comprehensive triage assessment including:
    - Priority level (emergency, urgent, semi-urgent, non-urgent)
    - Reasoning for the triage decision
    - Care recommendations
    - Warning signs to watch for

    Args:
        request: TriageRequest containing symptom description and optional patient context

    Returns:
        TriageResponse with priority, recommendations, and extracted symptoms

    Raises:
        HTTPException: If error occurs during triage
    """
    try:
        logger.info(f"Processing triage request: {request.message[:50]}...")

        # Get patient context if patient_id provided
        patient_context = None
        if request.patient_id:
            logger.info(f"Fetching patient context for {request.patient_id}")
            try:
                patient_history = fhir_client.get_patient_history(request.patient_id)
                if patient_history.get('patient'):
                    patient_context = patient_history
            except Exception as e:
                logger.warning(f"Could not fetch patient context: {str(e)}")

        # Extract symptoms if not provided
        extracted_symptoms = request.symptoms
        if not extracted_symptoms:
            logger.info("Extracting symptoms from message")
            symptom_extraction = chat_service.extract_symptoms(
                text=request.message,
                patient_context=patient_context
            )
            extracted_symptoms = symptom_extraction.extracted_symptoms

        # Perform triage assessment
        logger.info("Performing triage assessment")
        triage_result = triage_service.determine_triage_priority(
            symptoms=extracted_symptoms,
            patient_context=patient_context,
            user_message=request.message
        )

        # Get care recommendations
        recommendations = triage_service.get_care_recommendations(
            triage_result=triage_result,
            symptoms=extracted_symptoms,
            patient_context=patient_context
        )

        logger.info(f"Triage completed with priority: {triage_result.get('priority')}")

        return TriageResponse(
            priority=triage_result.get('priority', 'non-urgent'),
            reasoning=triage_result.get('reasoning', 'Assessment completed'),
            confidence=triage_result.get('confidence', 'medium'),
            red_flags=triage_result.get('red_flags', []),
            recommendations=recommendations,
            extracted_symptoms=extracted_symptoms,
            patient_context=patient_context
        )

    except Exception as e:
        logger.error(f"Error performing triage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform triage assessment: {str(e)}"
        )


# ============================================
# SCHEDULING ENDPOINTS
# ============================================

@app.post("/api/v1/scheduling/recommend", response_model=SchedulingResponse)
async def recommend_appointment_slots(
    request: SchedulingRequest,
    db: Session = Depends(get_db)
):
    """
    Get intelligent appointment slot recommendations based on triage priority and tribal knowledge

    Args:
        request: Scheduling request with specialty, urgency, and preferences

    Returns:
        Top 3 recommended appointment slots with reasoning
    """
    try:
        logger.info(f"Recommending slots for specialty {request.specialty_id}, priority: {request.triage_priority}")

        scheduling_service = SchedulingService(db)

        recommendations = scheduling_service.recommend_slots(
            specialty_id=request.specialty_id,
            triage_priority=request.triage_priority,
            patient_region=request.patient_region,
            preferred_date_range=request.preferred_date_range,
            limit=3
        )

        return SchedulingResponse(
            recommendations=recommendations,
            total_options_found=len(recommendations),
            message=f"Found {len(recommendations)} recommended slots" if recommendations else "No available slots found"
        )

    except Exception as e:
        logger.error(f"Error recommending slots: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recommend appointment slots: {str(e)}"
        )


@app.post("/api/v1/scheduling/book", response_model=AppointmentBookingResponse)
async def book_appointment(
    request: AppointmentBookingRequest,
    db: Session = Depends(get_db)
):
    """
    Book an appointment slot with race condition handling

    Args:
        request: Appointment booking details

    Returns:
        Confirmation with appointment ID and confirmation number
    """
    try:
        logger.info(f"Booking appointment for patient {request.patient_fhir_id} with provider {request.provider_id}")

        scheduling_service = SchedulingService(db)

        result = scheduling_service.book_appointment(
            provider_id=request.provider_id,
            facility_id=request.facility_id,
            specialty_id=request.specialty_id,
            patient_fhir_id=request.patient_fhir_id,
            appointment_datetime=request.appointment_datetime,
            duration_minutes=request.duration_minutes,
            urgency=request.urgency,
            triage_session_id=request.triage_session_id,
            reason_for_visit=request.reason_for_visit
        )

        if not result['success']:
            if result.get('code') == 409:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=result['error']
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result.get('error', 'Booking failed')
                )

        return AppointmentBookingResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error booking appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to book appointment: {str(e)}"
        )


@app.get("/api/v1/providers/search", response_model=ProviderSearchResponse)
async def search_providers(
    specialty_id: int,
    region: str = None,
    accepts_new_patients: bool = True,
    db: Session = Depends(get_db)
):
    """
    Search for providers by specialty and region

    Args:
        specialty_id: Medical specialty ID
        region: Utah region filter (optional)
        accepts_new_patients: Filter by accepting new patients

    Returns:
        List of matching providers
    """
    try:
        from database.models import Provider, Facility

        query = db.query(Provider).join(Facility).filter(
            Provider.specialty_id == specialty_id,
            Provider.active == True
        )

        if accepts_new_patients:
            query = query.filter(Provider.accepts_new_patients == True)

        if region:
            query = query.filter(Facility.region == region)

        providers = query.all()

        provider_list = []
        for p in providers:
            provider_list.append({
                "provider_id": p.provider_id,
                "npi": p.npi,
                "name": f"Dr. {p.first_name} {p.last_name}",
                "credentials": p.credentials,
                "specialty": p.specialty.name,
                "years_experience": p.years_experience,
                "languages": p.languages
            })

        return ProviderSearchResponse(
            providers=provider_list,
            count=len(provider_list)
        )

    except Exception as e:
        logger.error(f"Error searching providers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search providers: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
