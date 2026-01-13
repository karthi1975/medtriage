"""
Main FastAPI application for FHIR Chat API
Provides endpoints for patient data retrieval and chat-based symptom extraction
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import Dict, Any, Optional, List
import uuid
from datetime import datetime

from config import settings
from fhir_client import FHIRClient
from chat_service import ChatService
from triage_service import TriageService
from testing_service import TestingService
from schemas import (
    ChatRequest,
    ChatResponse,
    SymptomExtractionRequest,
    SymptomExtractionResponse,
    PatientHistoryResponse,
    HealthCheckResponse,
    TriageRequest,
    TriageResponse,
    MASessionRequest,
    MASessionResponse,
    PatientSearchRequest,
    PatientSearchResponse,
    PatientSearchResult,
    TestingStatusResponse,
    TestRequirement,
    TestResult,
    MAChatRequest,
    MAChatResponse,
    Intent,
    IntelligentTriageRequest
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
from appointments_api import AppointmentsAPIService
from fhir_scheduling_service import FHIRSchedulingService
from fhir_sync_service import FHIRSyncService
from database.connection import get_db
from fastapi import Depends
from sqlalchemy.orm import Session
from intelligent_triage_service import intelligent_triage_service
from workflow_service import workflow_tracker, CheckpointStatus
from llama_api import router as llama_router

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

# Include Llama 4 API router
app.include_router(llama_router)

# Initialize services
fhir_client = FHIRClient(fhir_server_url=settings.fhir_server_url)
chat_service = ChatService(api_key=settings.openai_api_key, model=settings.openai_model)
triage_service = TriageService(
    api_key=settings.openai_api_key,
    model=settings.openai_model,
    use_rag=settings.use_rag
)
testing_service = TestingService(fhir_client=fhir_client)

# In-memory MA session storage (for simplicity - production should use Redis or database)
ma_sessions: Dict[str, Dict[str, Any]] = {}

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


# ============================================
# MA SESSION MANAGEMENT
# ============================================

@app.post("/api/v1/ma/session", response_model=MASessionResponse)
async def create_ma_session(request: MASessionRequest, db: Session = Depends(get_db)):
    """
    Create a new MA (Medical Assistant) session for shift start

    Allows MA to select their facility and specialty context for their shift.
    This context is used throughout their conversations.

    Args:
        request: MA session details (name, facility_id, specialty_id)

    Returns:
        MASessionResponse with session_id and facility/specialty details
    """
    try:
        # Try to use database, but fallback to mock if unavailable
        facility_id = 1
        facility_name = request.facility
        specialty_id = 1
        specialty_name = request.specialty

        try:
            from database.models import Facility, Specialty

            # Validate facility by name
            facility = db.query(Facility).filter(Facility.name == request.facility).first()
            if facility:
                facility_id = facility.facility_id
                facility_name = facility.name

            # Validate specialty by name
            specialty = db.query(Specialty).filter(Specialty.name == request.specialty).first()
            if specialty:
                specialty_id = specialty.specialty_id
                specialty_name = specialty.name
        except Exception as db_error:
            # Database unavailable - use mock data
            logger.warning(f"Database unavailable, using mock session data: {db_error}")

        # Create session
        session_id = str(uuid.uuid4())
        session_data = {
            "session_id": session_id,
            "ma_name": request.ma_name,
            "facility_id": facility_id,
            "facility_name": facility_name,
            "specialty_id": specialty_id,
            "specialty_name": specialty_name,
            "shift_start_time": datetime.now().isoformat(),
            "created_at": datetime.now()
        }

        # Store session (in-memory for now)
        ma_sessions[session_id] = session_data

        logger.info(f"Created MA session {session_id} for {request.ma_name} at {facility_name} ({specialty_name})")

        return MASessionResponse(**session_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating MA session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create MA session: {str(e)}"
        )


# ============================================
# PATIENT SEARCH
# ============================================

@app.post("/api/v1/patients/search", response_model=PatientSearchResponse)
async def search_patients(request: PatientSearchRequest):
    """
    Search for patients by ID, name, DOB, or other criteria

    Searches the FHIR server for matching patients. Supports various search types.

    Args:
        request: Search query and optional search type

    Returns:
        List of matching patients with basic demographics
    """
    try:
        logger.info(f"Searching for patients with query: {request.query}")

        results = []

        # Try direct patient ID lookup first
        if request.search_type in ["auto", "id"]:
            try:
                patient = fhir_client.get_patient(request.query)
                if patient:
                    # fhir_client.get_patient() already returns formatted data
                    # name, address, and telecom are already formatted as strings
                    results.append(PatientSearchResult(
                        patient_id=patient['id'],
                        name=patient.get('name', 'Unknown'),
                        birth_date=patient.get('birthDate'),
                        gender=patient.get('gender'),
                        address=patient.get('address'),
                        phone=patient.get('telecom')  # Already formatted as string
                    ))
            except Exception as e:
                logger.error(f"Direct ID lookup failed: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())

        # If no results and search type allows, try name search
        # (Would need to implement FHIR search by name - simplified for now)

        logger.info(f"Found {len(results)} matching patients")

        return PatientSearchResponse(
            results=results,
            total=len(results)
        )

    except Exception as e:
        logger.error(f"Error searching patients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search patients: {str(e)}"
        )


# ============================================
# TESTING STATUS CHECK
# ============================================

@app.get("/api/v1/patients/{patient_id}/testing-status", response_model=TestingStatusResponse)
async def get_testing_status(
    patient_id: str,
    specialty_name: str,
    visit_type: str = "new_patient",
    urgency: str = "non-urgent",
    db: Session = Depends(get_db)
):
    """
    Check patient's testing status for a specialty appointment

    Evaluates whether patient has required tests (labs, imaging, ECG, vitals)
    based on specialty-specific requirements.

    Args:
        patient_id: FHIR Patient ID
        specialty_name: Specialty name (e.g., "Cardiology")
        visit_type: "new_patient" or "followup"
        urgency: "emergency", "urgent", or "non-urgent"

    Returns:
        Testing status with missing tests and recent valid tests
    """
    try:
        logger.info(f"Checking testing status for patient {patient_id}, specialty {specialty_name}")

        # Check testing status
        status_result = await testing_service.check_testing_status(
            patient_id=patient_id,
            specialty_name=specialty_name,
            visit_type=visit_type,
            urgency=urgency
        )

        # Format for response
        formatted_message = testing_service.format_testing_requirements_for_chat(status_result)
        can_schedule = testing_service.can_schedule_appointment(status_result)

        # Convert dataclasses to dicts for Pydantic
        response = TestingStatusResponse(
            patient_id=status_result.patient_id,
            specialty=status_result.specialty,
            visit_type=status_result.visit_type,
            urgency=status_result.urgency,
            required_tests_missing=[TestRequirement(**vars(t)) for t in status_result.required_tests_missing],
            recommended_tests_missing=[TestRequirement(**vars(t)) for t in status_result.recommended_tests_missing],
            recent_tests=[TestResult(**vars(t)) for t in status_result.recent_tests],
            all_required_met=status_result.all_required_met,
            needs_urgent_testing=status_result.needs_urgent_testing,
            can_schedule=can_schedule,
            formatted_message=formatted_message
        )

        logger.info(f"Testing status check complete: all_required_met={status_result.all_required_met}")

        return response

    except Exception as e:
        logger.error(f"Error checking testing status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check testing status: {str(e)}"
        )


# ============================================
# MA CONVERSATIONAL CHAT
# ============================================

@app.post("/api/v1/ma/chat", response_model=MAChatResponse)
async def ma_chat(request: MAChatRequest, db: Session = Depends(get_db)):
    """
    Conversational MA chat endpoint with intelligent action orchestration

    This endpoint:
    1. Classifies the MA's intent
    2. Executes appropriate actions (patient lookup, triage, testing check, scheduling)
    3. Generates a natural conversational response
    4. Returns structured data + conversational text

    Args:
        request: MA chat request with message, session_id, conversation history

    Returns:
        Conversational response with intent, metadata, and suggested actions
    """
    try:
        logger.info(f"Processing MA chat: {request.message[:50]}...")

        # Validate MA session
        session = ma_sessions.get(request.ma_session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="MA session not found. Please start a new shift."
            )

        # Build conversation context
        conversation_context = {
            "ma_session": session,
            "current_patient_id": request.current_patient_id
        }

        # Add current patient to context if available
        current_patient = None
        if request.current_patient_id:
            try:
                patient_history = fhir_client.get_patient_history(request.current_patient_id)
                if patient_history.get('patient'):
                    current_patient = patient_history
                    conversation_context['current_patient'] = patient_history.get('patient')
            except Exception as e:
                logger.warning(f"Could not fetch current patient context: {str(e)}")

        # Classify intent
        intent = chat_service.classify_intent(
            message=request.message,
            conversation_context=conversation_context
        )

        logger.info(f"Intent classified: {intent.get('intent_type')}")

        # Execute actions based on intent
        action_results = {}
        actions_taken = []

        intent_type = intent.get('intent_type')
        entities = intent.get('extracted_entities', {})

        # PATIENT_LOOKUP
        if intent_type == "PATIENT_LOOKUP":
            logger.info(f"PATIENT_LOOKUP entities: {entities}")
            patient_id = entities.get('patient_id')
            logger.info(f"Extracted patient_id: {patient_id}")

            if patient_id:
                try:
                    logger.info(f"Fetching patient history for: {patient_id}")
                    patient_history = fhir_client.get_patient_history(patient_id)
                    logger.info(f"Patient history retrieved: {bool(patient_history.get('patient'))}")

                    if patient_history.get('patient'):
                        action_results['patient'] = patient_history
                        # Update current patient in context
                        request.current_patient_id = patient_id
                        patient_name = patient_history.get('patient', {}).get('name', 'Unknown')
                        actions_taken.append(f"Retrieved patient: {patient_name}")
                        logger.info(f"Successfully set patient in action_results: {patient_name}")
                    else:
                        logger.warning("Patient history returned but no patient data")
                        actions_taken.append("Patient data incomplete")
                except Exception as e:
                    logger.error(f"Error looking up patient: {str(e)}", exc_info=True)
                    actions_taken.append(f"Patient lookup failed: {str(e)}")
            else:
                logger.warning("No patient_id found in entities")
                actions_taken.append("Could not identify patient ID from message")

        # TRIAGE_START
        elif intent_type == "TRIAGE_START":
            if current_patient:
                try:
                    logger.info(f"Starting triage for message: {request.message}")

                    # Use intelligent triage service with simple symptom extraction
                    # Extract basic symptoms from the message
                    symptoms_text = request.message

                    # Extract patient data from patient_history
                    patient_data = current_patient.get('patient', {}) if isinstance(current_patient, dict) else {}

                    # Perform intelligent triage
                    triage_result = await intelligent_triage_service.perform_intelligent_triage(
                        patient_fhir_id=request.current_patient_id,
                        patient_name=patient_data.get('name', 'Unknown'),
                        patient_age=patient_data.get('age'),
                        patient_gender=patient_data.get('gender'),
                        patient_conditions=current_patient.get('conditions', []) if isinstance(current_patient, dict) else [],
                        symptoms=[symptoms_text],
                        symptom_details={"raw_message": symptoms_text},
                        provider_name=session.get('ma_name', 'Medical Assistant'),
                        specialty=session.get('specialty_name', 'Family Medicine'),
                        urgency_override=None
                    )

                    logger.info(f"Triage result: {triage_result}")

                    action_results['triage'] = {
                        'priority': triage_result.get('priority', 'MEDIUM'),
                        'reasoning': triage_result.get('reasoning', 'Triage assessment completed'),
                        'confidence': triage_result.get('confidence', 0.75),
                        'recommendations': triage_result.get('recommendations', [])
                    }

                    # Auto-check testing requirements
                    specialty_name = session.get('specialty_name', 'Family Medicine')
                    testing_status = await testing_service.check_testing_status(
                        patient_id=request.current_patient_id,
                        specialty_name=specialty_name,
                        visit_type="new_patient",
                        urgency=triage_result.get('priority', 'non-urgent')
                    )

                    formatted_testing = testing_service.format_testing_requirements_for_chat(testing_status)
                    action_results['testing_status'] = {
                        'all_required_met': testing_status.all_required_met,
                        'needs_urgent_testing': testing_status.needs_urgent_testing,
                        'formatted_message': formatted_testing
                    }

                    actions_taken.append(f"Triage completed: {triage_result.get('priority')} priority")
                    actions_taken.append("Checked testing requirements")

                except Exception as e:
                    logger.error(f"Error performing triage: {str(e)}")
                    actions_taken.append(f"Triage failed: {str(e)}")
            else:
                actions_taken.append("Please select a patient first to perform triage")

        # TESTING_CHECK
        elif intent_type == "TESTING_CHECK":
            if current_patient and request.current_patient_id:
                try:
                    specialty_name = session.get('specialty_name', 'Family Medicine')
                    testing_status = await testing_service.check_testing_status(
                        patient_id=request.current_patient_id,
                        specialty_name=specialty_name,
                        visit_type="new_patient",
                        urgency="non-urgent"
                    )

                    formatted_testing = testing_service.format_testing_requirements_for_chat(testing_status)
                    action_results['testing_status'] = {
                        'all_required_met': testing_status.all_required_met,
                        'needs_urgent_testing': testing_status.needs_urgent_testing,
                        'formatted_message': formatted_testing
                    }

                    actions_taken.append("Checked testing requirements")

                except Exception as e:
                    logger.error(f"Error checking testing: {str(e)}")
                    actions_taken.append(f"Testing check failed: {str(e)}")

        # SCHEDULE_REQUEST
        elif intent_type == "SCHEDULE_REQUEST":
            if current_patient and request.current_patient_id:
                try:
                    logger.info(f"Processing SCHEDULE_REQUEST for patient {request.current_patient_id}")
                    logger.info(f"Session type: {type(session)}, Session keys: {session.keys() if isinstance(session, dict) else 'NOT A DICT'}")

                    # Get patient region for scheduling
                    patient = current_patient.get('patient', {})
                    patient_region = "Salt Lake"  # Default to match our facility

                    # Try to get city from patient address
                    try:
                        if patient.get('address'):
                            addr = patient['address']
                            # Handle both list and single address
                            if isinstance(addr, list) and len(addr) > 0:
                                addr = addr[0]

                            # Get city - handle both dict and string cases
                            city = ""
                            if isinstance(addr, dict):
                                city = addr.get('city', '')
                            elif isinstance(addr, str):
                                # Address is a string, try to extract city
                                if 'Salt Lake' in addr:
                                    city = 'Salt Lake City'
                                elif 'Provo' in addr:
                                    city = 'Provo'

                            logger.info(f"Patient city: {city}")

                            # Simple region mapping
                            if city:
                                if 'Provo' in city or 'Orem' in city:
                                    patient_region = "Utah Valley"
                                elif 'Ogden' in city or 'Layton' in city:
                                    patient_region = "Weber"
                                elif 'Salt Lake' in city:
                                    patient_region = "Salt Lake"
                    except Exception as e:
                        logger.warning(f"Could not parse patient address: {str(e)}, using default region")
                        patient_region = "Salt Lake"

                    # Determine priority (check conversation history for recent triage)
                    priority = "non-urgent"
                    # Check if triage was just performed
                    if action_results.get('triage'):
                        priority = action_results['triage'].get('priority', 'non-urgent')
                        logger.info(f"Using triage priority from current session: {priority}")
                    else:
                        # Check conversation history for recent triage
                        for msg in reversed(request.conversation_history):
                            if hasattr(msg, 'metadata') and msg.metadata and isinstance(msg.metadata, dict):
                                if msg.metadata.get('triage'):
                                    priority = msg.metadata['triage'].get('priority', 'non-urgent')
                                    logger.info(f"Using triage priority from history: {priority}")
                                    break

                    logger.info(f"Searching slots with: specialty_id={session.get('specialty_id')}, priority={priority}, region={patient_region}")

                    scheduling_service_inst = SchedulingService(db)
                    recommendations = scheduling_service_inst.recommend_slots(
                        specialty_id=session.get('specialty_id'),
                        triage_priority=priority,
                        patient_region=patient_region,
                        preferred_date_range=None,
                        limit=3
                    )

                    logger.info(f"Found {len(recommendations)} slots")
                    action_results['slots'] = recommendations
                    # Save slots to context for future booking
                    conversation_context['previous_slots'] = recommendations
                    actions_taken.append(f"Found {len(recommendations)} appointment slots")

                except Exception as e:
                    logger.error(f"Error finding slots: {str(e)}", exc_info=True)
                    actions_taken.append(f"Scheduling search failed: {str(e)}")

        # APPOINTMENT_CONFIRM
        elif intent_type == "APPOINTMENT_CONFIRM":
            if current_patient and request.current_patient_id:
                try:
                    # Extract slot selection from entities
                    provider_id = entities.get('provider_id')
                    slot_datetime = entities.get('slot_datetime')
                    slot_index = entities.get('slot_index')  # e.g., "first", "1", "2:00 PM"

                    # If we have slots from previous interaction, use the index
                    selected_slot = None
                    if 'previous_slots' in conversation_context and slot_index is not None:
                        try:
                            idx = int(slot_index) - 1 if str(slot_index).isdigit() else 0
                            selected_slot = conversation_context['previous_slots'][idx]
                        except (IndexError, ValueError):
                            pass

                    # Or if provider_id and datetime are directly specified
                    if not selected_slot and provider_id and slot_datetime:
                        selected_slot = {
                            'provider': {'provider_id': provider_id},
                            'slot_datetime': slot_datetime
                        }

                    if selected_slot:
                        # Get triage priority if available
                        priority = "non-urgent"
                        triage_session_id = None
                        reason_for_visit = "General consultation"

                        # Check if there was a recent triage
                        for msg in reversed(request.conversation_history):
                            if msg.metadata and msg.metadata.get('triage'):
                                priority = msg.metadata['triage'].get('priority', 'non-urgent')
                                reason_for_visit = msg.metadata['triage'].get('reasoning', 'General consultation')
                                break

                        # Book the appointment
                        scheduling_service_inst = SchedulingService(db)
                        booking_result = scheduling_service_inst.book_appointment(
                            provider_id=selected_slot['provider']['provider_id'],
                            facility_id=selected_slot['facility']['facility_id'],
                            specialty_id=session.get('specialty_id'),
                            patient_fhir_id=request.current_patient_id,
                            appointment_datetime=datetime.fromisoformat(selected_slot['slot_datetime']) if isinstance(selected_slot['slot_datetime'], str) else selected_slot['slot_datetime'],
                            duration_minutes=selected_slot.get('duration_minutes', 30),
                            urgency=priority,
                            triage_session_id=triage_session_id,
                            reason_for_visit=reason_for_visit
                        )

                        if booking_result.get('success'):
                            action_results['appointment_confirmed'] = {
                                'confirmation_number': booking_result['confirmation_number'],
                                'appointment_id': booking_result['appointment_id'],
                                'provider': selected_slot['provider'],
                                'facility': selected_slot['facility'],
                                'slot_datetime': selected_slot['slot_datetime'],
                                'patient_name': current_patient.get('patient', {}).get('name')
                            }
                            actions_taken.append(f"Booked appointment - Confirmation #{booking_result['confirmation_number']}")
                        else:
                            actions_taken.append(f"Booking failed: {booking_result.get('error', 'Unknown error')}")
                    else:
                        actions_taken.append("Could not identify which appointment slot to book. Please specify the provider or time.")

                except Exception as e:
                    logger.error(f"Error booking appointment: {str(e)}")
                    actions_taken.append(f"Appointment booking failed: {str(e)}")
            else:
                actions_taken.append("Please select a patient first to book an appointment")

        # Generate conversational response
        conversational_response = chat_service.generate_conversational_response(
            intent=intent,
            action_results=action_results,
            ma_context=session
        )

        # Create response
        message_id = str(uuid.uuid4())

        # Log action results for debugging
        logger.info(f"Action results keys: {list(action_results.keys()) if action_results else 'None'}")
        if action_results.get('patient'):
            logger.info(f"Patient data in response: has patient={bool(action_results['patient'].get('patient'))}")

        response = MAChatResponse(
            message_id=message_id,
            content=conversational_response,
            timestamp=datetime.now().isoformat(),
            intent=Intent(**intent),
            metadata=action_results if action_results else None,
            actions_taken=actions_taken,
            suggested_responses=None  # Could add smart suggestions later
        )

        logger.info(f"MA chat response generated successfully with metadata: {bool(response.metadata)}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in MA chat: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process MA chat: {str(e)}"
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
            reason_for_visit=request.reason_for_visit,
            created_by=request.created_by
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


@app.get("/api/v1/facilities")
async def get_facilities(db: Session = Depends(get_db)):
    """Get all active facilities"""
    try:
        from database.models import Facility
        facilities = db.query(Facility).filter(Facility.active == True).all()

        return [
            {
                "id": f.facility_id,
                "name": f.name,
                "city": f.city,
                "region": f.region,
                "address": f.address_line1 or "",
                "zip_code": f.zip_code or "",
                "type": f.type or ""
            }
            for f in facilities
        ]
    except Exception as e:
        logger.error(f"Error fetching facilities: {str(e)}")
        # Return mock data if database not available
        return [
            {"id": 1, "name": "West Valley City Community Health Center", "city": "West Valley City", "region": "Utah", "address": "2850 W 3500 S", "zip_code": "84119", "type": "Community Health"},
            {"id": 2, "name": "Salt Lake Heart Center", "city": "Salt Lake City", "region": "Utah", "address": "500 E 900 S", "zip_code": "84102", "type": "Specialty Clinic"},
            {"id": 3, "name": "Utah Valley Orthopedics", "city": "Provo", "region": "Utah", "address": "1200 N University Ave", "zip_code": "84604", "type": "Specialty Clinic"}
        ]


@app.get("/api/v1/specialties")
async def get_specialties(db: Session = Depends(get_db)):
    """Get all active specialties"""
    try:
        from database.models import Specialty
        specialties = db.query(Specialty).filter(Specialty.active == True).all()

        return [
            {
                "id": s.specialty_id,
                "name": s.name,
                "description": s.description or ""
            }
            for s in specialties
        ]
    except Exception as e:
        logger.error(f"Error fetching specialties: {str(e)}")
        # Return mock data if database not available
        return [
            {"id": 1, "name": "Primary Care", "description": "General health and wellness"},
            {"id": 2, "name": "Cardiology", "description": "Heart and cardiovascular health"},
            {"id": 3, "name": "Orthopedics", "description": "Bones, joints, and muscles"},
            {"id": 4, "name": "Pulmonology", "description": "Respiratory system"},
            {"id": 5, "name": "Endocrinology", "description": "Hormones and metabolism"}
        ]


# ============================================
# APPOINTMENTS MANAGEMENT API
# ============================================

@app.get("/api/v1/appointments")
async def get_appointments(
    facility_id: Optional[int] = None,
    specialty_id: Optional[int] = None,
    provider_id: Optional[int] = None,
    patient_fhir_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get appointments with comprehensive filtering

    Query parameters:
    - facility_id: Filter by facility
    - specialty_id: Filter by specialty
    - provider_id: Filter by provider
    - patient_fhir_id: Filter by patient
    - status: Filter by status (scheduled, confirmed, completed, cancelled, etc.)
    - start_date: Filter by start date (ISO format)
    - end_date: Filter by end date (ISO format)
    - limit: Number of results (default 50)
    - offset: Pagination offset (default 0)
    """
    try:
        logger.info(f"Fetching appointments with filters: facility={facility_id}, provider={provider_id}, patient={patient_fhir_id}")

        # Parse dates if provided
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None

        appointments_service = AppointmentsAPIService(db)
        result = appointments_service.get_appointments(
            facility_id=facility_id,
            specialty_id=specialty_id,
            provider_id=provider_id,
            patient_fhir_id=patient_fhir_id,
            status=status,
            start_date=start_dt,
            end_date=end_dt,
            limit=limit,
            offset=offset
        )

        logger.info(f"Found {result['total']} appointments")
        return result

    except Exception as e:
        logger.error(f"Error fetching appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointments: {str(e)}"
        )


@app.get("/api/v1/appointments/{appointment_id}")
async def get_appointment_detail(
    appointment_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific appointment"""
    try:
        appointments_service = AppointmentsAPIService(db)
        appointment = appointments_service.get_appointment_by_id(appointment_id)

        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment {appointment_id} not found"
            )

        return appointment

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointment detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointment: {str(e)}"
        )


@app.get("/api/v1/appointments/today/list")
async def get_todays_appointments(
    facility_id: Optional[int] = None,
    provider_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get today's appointments for quick dashboard view"""
    try:
        appointments_service = AppointmentsAPIService(db)
        appointments = appointments_service.get_todays_appointments(
            facility_id=facility_id,
            provider_id=provider_id
        )

        return {
            "date": datetime.now().date().isoformat(),
            "appointments": appointments,
            "total": len(appointments)
        }

    except Exception as e:
        logger.error(f"Error fetching today's appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch today's appointments: {str(e)}"
        )


@app.get("/api/v1/appointments/stats")
async def get_appointment_stats(
    facility_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get appointment statistics for dashboard"""
    try:
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None

        appointments_service = AppointmentsAPIService(db)
        stats = appointments_service.get_appointment_stats(
            facility_id=facility_id,
            start_date=start_dt,
            end_date=end_dt
        )

        return stats

    except Exception as e:
        logger.error(f"Error fetching appointment stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch appointment stats: {str(e)}"
        )


# ======================
# Intelligent MA Workflow Endpoints
# ======================

@app.post("/api/v1/ma/intelligent-triage")
async def intelligent_triage(request: IntelligentTriageRequest):
    """
    Perform intelligent triage with automatic protocol activation.

    This endpoint:
    1. Identifies matching clinical protocol based on symptoms
    2. Assesses patient risk level
    3. Generates immediate action list
    4. Creates test ordering plan
    5. Creates patient workflow
    6. Returns comprehensive triage assessment
    """
    try:
        logger.info(f"Intelligent triage for patient {request.patient_name} with symptoms: {request.symptoms}")

        result = await intelligent_triage_service.perform_intelligent_triage(
            patient_fhir_id=request.patient_fhir_id,
            patient_name=request.patient_name,
            patient_age=request.patient_age,
            patient_gender=request.patient_gender,
            patient_conditions=request.patient_conditions,
            symptoms=request.symptoms,
            symptom_details=request.symptom_details,
            provider_name=request.provider_name,
            specialty=request.specialty,
            urgency_override=request.urgency_override
        )

        return {
            "success": True,
            "message": "Intelligent triage completed",
            "result": result
        }

    except Exception as e:
        logger.error(f"Error in intelligent triage: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Intelligent triage failed: {str(e)}"
        )


@app.get("/api/v1/workflows/active")
async def get_active_workflows():
    """Get all active patient workflows"""
    try:
        workflows = workflow_tracker.get_active_workflows()
        return {
            "total": len(workflows),
            "workflows": workflows
        }
    except Exception as e:
        logger.error(f"Error getting active workflows: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workflows: {str(e)}"
        )


@app.get("/api/v1/workflows/attention-needed")
async def get_workflows_needing_attention():
    """Get workflows that need MA attention"""
    try:
        workflows = workflow_tracker.get_workflows_needing_attention()
        return {
            "total": len(workflows),
            "workflows": workflows
        }
    except Exception as e:
        logger.error(f"Error getting workflows needing attention: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workflows: {str(e)}"
        )


@app.get("/api/v1/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get specific workflow by ID"""
    try:
        workflow = workflow_tracker.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workflow {workflow_id} not found"
            )

        # Get progress
        progress = workflow_tracker.get_workflow_progress(workflow_id)

        return {
            "workflow": workflow,
            "progress": progress
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workflow: {str(e)}"
        )


@app.get("/api/v1/workflows/patient/{patient_fhir_id}")
async def get_patient_workflows(patient_fhir_id: str):
    """Get all workflows for a specific patient"""
    try:
        workflows = workflow_tracker.get_workflows_by_patient(patient_fhir_id)
        return {
            "total": len(workflows),
            "workflows": workflows
        }
    except Exception as e:
        logger.error(f"Error getting patient workflows: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workflows: {str(e)}"
        )


@app.post("/api/v1/workflows/{workflow_id}/checkpoints/{checkpoint_name}/update")
async def update_workflow_checkpoint(
    workflow_id: str,
    checkpoint_name: str,
    checkpoint_status: str,
    details: Optional[str] = None
):
    """Update a workflow checkpoint status"""
    try:
        # Validate status
        try:
            status_enum = CheckpointStatus(checkpoint_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {checkpoint_status}. Must be one of: {[s.value for s in CheckpointStatus]}"
            )

        checkpoint = workflow_tracker.update_checkpoint(
            workflow_id=workflow_id,
            checkpoint_name=checkpoint_name,
            status=status_enum,
            details=details
        )

        return {
            "success": True,
            "message": f"Checkpoint '{checkpoint_name}' updated to {checkpoint_status}",
            "checkpoint": checkpoint
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating checkpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update checkpoint: {str(e)}"
        )


@app.post("/api/v1/workflows/{workflow_id}/test-orders")
async def add_test_order_to_workflow(
    workflow_id: str,
    test_name: str,
    order_type: str,
    scheduled_date: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """Add a test order to a workflow"""
    try:
        scheduled_dt = None
        if scheduled_date:
            scheduled_dt = datetime.fromisoformat(scheduled_date)

        order = workflow_tracker.add_test_order(
            workflow_id=workflow_id,
            test_name=test_name,
            order_type=order_type,
            scheduled_date=scheduled_dt,
            status="ordered",
            details=details
        )

        return {
            "success": True,
            "message": f"Test order '{test_name}' added to workflow",
            "order": order
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error adding test order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add test order: {str(e)}"
        )


@app.post("/api/v1/workflows/{workflow_id}/test-orders/{order_id}/update")
async def update_test_order_status(
    workflow_id: str,
    order_id: str,
    order_status: str,
    results_available: bool = False,
    details: Optional[Dict[str, Any]] = None
):
    """Update a test order status"""
    try:
        order = workflow_tracker.update_test_order(
            workflow_id=workflow_id,
            order_id=order_id,
            status=order_status,
            results_available=results_available,
            details=details
        )

        return {
            "success": True,
            "message": f"Test order {order_id} updated to {order_status}",
            "order": order
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating test order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update test order: {str(e)}"
        )


@app.post("/api/v1/workflows/{workflow_id}/complete")
async def complete_workflow(
    workflow_id: str,
    reason: str = "Appointment scheduled"
):
    """Mark a workflow as completed"""
    try:
        workflow = workflow_tracker.complete_workflow(
            workflow_id=workflow_id,
            reason=reason
        )

        return {
            "success": True,
            "message": f"Workflow {workflow_id} completed",
            "workflow": workflow
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error completing workflow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete workflow: {str(e)}"
        )


# ======================
# FHIR Integration Endpoints
# ======================

@app.post("/api/v1/fhir/sync/all")
async def sync_all_fhir_resources(db: Session = Depends(get_db)):
    """
    Sync all tribal knowledge resources to HAPI FHIR
    Creates Practitioner and Location resources
    """
    try:
        sync_service = FHIRSyncService(settings.fhir_server_url, db)
        results = sync_service.sync_all_resources()

        return {
            "success": True,
            "message": "FHIR resources synced successfully",
            "results": results
        }

    except Exception as e:
        logger.error(f"Error syncing FHIR resources: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync FHIR resources: {str(e)}"
        )


@app.post("/api/v1/fhir/sync/providers")
async def sync_providers_to_fhir(db: Session = Depends(get_db)):
    """Sync all providers to FHIR Practitioner resources"""
    try:
        sync_service = FHIRSyncService(settings.fhir_server_url, db)
        results = sync_service.sync_all_providers()

        return {
            "success": True,
            "message": f"Synced {results['synced']}/{results['total']} providers",
            "results": results
        }

    except Exception as e:
        logger.error(f"Error syncing providers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync providers: {str(e)}"
        )


@app.post("/api/v1/fhir/sync/facilities")
async def sync_facilities_to_fhir(db: Session = Depends(get_db)):
    """Sync all facilities to FHIR Location resources"""
    try:
        sync_service = FHIRSyncService(settings.fhir_server_url, db)
        results = sync_service.sync_all_facilities()

        return {
            "success": True,
            "message": f"Synced {results['synced']}/{results['total']} facilities",
            "results": results
        }

    except Exception as e:
        logger.error(f"Error syncing facilities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync facilities: {str(e)}"
        )


@app.post("/api/v1/fhir/appointments/create")
async def create_fhir_appointment(
    patient_fhir_id: str,
    provider_id: int,
    facility_id: int,
    start_datetime: str,
    duration_minutes: int,
    reason: str,
    urgency: str = "routine",
    confirmation_number: str = None,
    db: Session = Depends(get_db)
):
    """Create a FHIR Appointment resource"""
    try:
        # Get FHIR IDs for provider and facility
        sync_service = FHIRSyncService(settings.fhir_server_url, db)
        provider_fhir_id = sync_service.get_provider_fhir_id(provider_id)
        facility_fhir_id = sync_service.get_facility_fhir_id(facility_id)

        if not provider_fhir_id or not facility_fhir_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provider or facility not synced to FHIR. Run sync first."
            )

        # Create FHIR Appointment
        fhir_service = FHIRSchedulingService(settings.fhir_server_url)
        start_dt = datetime.fromisoformat(start_datetime)

        appointment = fhir_service.create_appointment(
            patient_fhir_id=patient_fhir_id,
            provider_fhir_id=provider_fhir_id,
            facility_fhir_id=facility_fhir_id,
            start_datetime=start_dt,
            duration_minutes=duration_minutes,
            status="booked",
            reason=reason,
            urgency=urgency,
            confirmation_number=confirmation_number
        )

        return {
            "success": True,
            "message": "FHIR Appointment created successfully",
            "appointment": appointment
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating FHIR appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create FHIR appointment: {str(e)}"
        )


@app.get("/api/v1/fhir/appointments/search")
async def search_fhir_appointments(
    patient_id: Optional[str] = None,
    practitioner_id: Optional[str] = None,
    status: Optional[str] = None,
    date_start: Optional[str] = None
):
    """Search FHIR Appointment resources"""
    try:
        fhir_service = FHIRSchedulingService(settings.fhir_server_url)

        start_dt = datetime.fromisoformat(date_start) if date_start else None

        appointments = fhir_service.search_appointments(
            patient_id=patient_id,
            practitioner_id=practitioner_id,
            status=status,
            date_start=start_dt
        )

        return {
            "total": len(appointments),
            "appointments": appointments
        }

    except Exception as e:
        logger.error(f"Error searching FHIR appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search FHIR appointments: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
