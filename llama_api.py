"""
API endpoints for Llama 4 integration
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging

from llama_service import get_llama_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llama", tags=["Llama 4"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    stream: bool = False
    temperature: float = 0.7
    max_tokens: int = 1024


class TriageRequest(BaseModel):
    symptoms: str
    patient_history: Optional[Dict] = None


class SummaryRequest(BaseModel):
    clinical_notes: str


@router.post("/chat")
async def chat_completion(request: ChatRequest):
    """
    Send a chat completion request to Llama 4

    Example:
    ```json
    {
        "messages": [
            {"role": "user", "content": "What are common symptoms of flu?"}
        ],
        "temperature": 0.7,
        "max_tokens": 512
    }
    ```
    """
    try:
        llama_service = get_llama_service()

        # Convert Pydantic models to dicts
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        response = llama_service.chat_completion(
            messages=messages,
            stream=request.stream,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        if response is None:
            raise HTTPException(status_code=500, detail="Failed to get response from Llama 4 API")

        return {
            "success": True,
            "response": response
        }

    except Exception as e:
        logger.error(f"Error in chat_completion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/triage")
async def medical_triage(request: TriageRequest):
    """
    Perform medical triage using Llama 4

    Example:
    ```json
    {
        "symptoms": "High fever, severe headache, stiff neck",
        "patient_history": {
            "age": "45",
            "allergies": "Penicillin",
            "conditions": "Hypertension"
        }
    }
    ```
    """
    try:
        llama_service = get_llama_service()

        response = llama_service.medical_triage(
            patient_symptoms=request.symptoms,
            patient_history=request.patient_history
        )

        if response is None:
            raise HTTPException(status_code=500, detail="Failed to get triage recommendation")

        return {
            "success": True,
            "symptoms": request.symptoms,
            "triage_recommendation": response
        }

    except Exception as e:
        logger.error(f"Error in medical_triage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_notes(request: SummaryRequest):
    """
    Generate a medical summary from clinical notes

    Example:
    ```json
    {
        "clinical_notes": "Patient presents with acute onset chest pain radiating to left arm. BP 145/92, HR 98. ECG shows ST elevation. Patient has history of smoking and family history of CAD."
    }
    ```
    """
    try:
        llama_service = get_llama_service()

        summary = llama_service.generate_medical_summary(request.clinical_notes)

        if summary is None:
            raise HTTPException(status_code=500, detail="Failed to generate summary")

        return {
            "success": True,
            "original_notes": request.clinical_notes,
            "summary": summary
        }

    except Exception as e:
        logger.error(f"Error in summarize_notes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test")
async def test_llama_connection():
    """
    Test the Llama 4 API connection with a simple query
    """
    try:
        llama_service = get_llama_service()

        messages = [
            {"role": "user", "content": "Hello! Can you help with medical questions?"}
        ]

        response = llama_service.chat_completion(messages, max_tokens=100)

        if response is None:
            return {
                "success": False,
                "message": "Failed to connect to Llama 4 API. Please check authentication.",
                "details": "Ensure gcloud is authenticated and PROJECT_ID, ENDPOINT, REGION are set correctly."
            }

        return {
            "success": True,
            "message": "Successfully connected to Llama 4 API",
            "test_response": response
        }

    except Exception as e:
        logger.error(f"Error testing Llama connection: {str(e)}")
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "details": "Check logs for more information"
        }
