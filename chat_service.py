"""
Chat service with OpenAI integration for symptom extraction and conversational AI
"""
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from schemas import ChatMessage, ExtractedSymptom, SymptomExtractionResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatService:
    """Service for handling chat and symptom extraction using OpenAI"""

    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        """
        Initialize ChatService with OpenAI credentials

        Args:
            api_key: OpenAI API key
            model: OpenAI model to use (default: gpt-3.5-turbo)
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model
        logger.info(f"ChatService initialized with model: {model}")

    def chat(
        self,
        message: str,
        conversation_history: Optional[List[ChatMessage]] = None,
        patient_context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate a chat response using OpenAI

        Args:
            message: User's message
            conversation_history: Previous conversation messages
            patient_context: Optional patient context for enhanced responses
            system_prompt: Optional custom system prompt

        Returns:
            AI assistant's response
        """
        try:
            # Build messages for the API call
            messages = []

            # Add system prompt
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            else:
                default_prompt = """You are a helpful medical assistant AI. You help users understand their symptoms
                and provide general health information. Always remind users to consult with healthcare professionals
                for proper diagnosis and treatment. Be empathetic, clear, and professional."""

                if patient_context:
                    patient_info = self._format_patient_context(patient_context)
                    default_prompt += f"\n\nPatient Context:\n{patient_info}"

                messages.append({"role": "system", "content": default_prompt})

            # Add conversation history
            if conversation_history:
                for msg in conversation_history:
                    messages.append({"role": msg.role, "content": msg.content})

            # Add current message
            messages.append({"role": "user", "content": message})

            # Call OpenAI API
            logger.info(f"Sending chat request to OpenAI with {len(messages)} messages")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )

            assistant_response = response.choices[0].message.content
            logger.info("Successfully received response from OpenAI")
            return assistant_response

        except Exception as e:
            logger.error(f"Error in chat: {str(e)}")
            raise Exception(f"Failed to generate chat response: {str(e)}")

    def extract_symptoms(
        self,
        text: str,
        patient_context: Optional[Dict[str, Any]] = None
    ) -> SymptomExtractionResponse:
        """
        Extract symptoms from text using OpenAI's NLP capabilities

        Args:
            text: Text containing symptom descriptions
            patient_context: Optional patient context

        Returns:
            SymptomExtractionResponse with extracted symptoms
        """
        try:
            # Create extraction prompt
            extraction_prompt = """You are a medical symptom extraction system. Extract all symptoms mentioned in the user's text.

For each symptom, identify:
- symptom: The name of the symptom
- severity: mild, moderate, or severe (if mentioned)
- duration: How long the symptom has been present (if mentioned)
- location: Body part or location (if mentioned)

Return the results in the following JSON format:
{
  "symptoms": [
    {
      "symptom": "headache",
      "severity": "moderate",
      "duration": "2 days",
      "location": "forehead"
    }
  ],
  "summary": "Brief summary of the symptoms"
}

Only extract symptoms that are explicitly mentioned. If severity, duration, or location are not mentioned, use null for those fields."""

            if patient_context:
                patient_info = self._format_patient_context(patient_context)
                extraction_prompt += f"\n\nPatient Context:\n{patient_info}"

            messages = [
                {"role": "system", "content": extraction_prompt},
                {"role": "user", "content": f"Extract symptoms from this text: {text}"}
            ]

            logger.info("Sending symptom extraction request to OpenAI")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,  # Lower temperature for more consistent extraction
                max_tokens=800
            )

            raw_response = response.choices[0].message.content
            logger.info("Received symptom extraction response")

            # Parse the JSON response
            try:
                # Try to extract JSON from the response
                json_start = raw_response.find('{')
                json_end = raw_response.rfind('}') + 1

                if json_start != -1 and json_end > json_start:
                    json_str = raw_response[json_start:json_end]
                    result = json.loads(json_str)

                    # Convert to ExtractedSymptom objects
                    extracted_symptoms = []
                    for symptom_data in result.get('symptoms', []):
                        extracted_symptoms.append(
                            ExtractedSymptom(
                                symptom=symptom_data.get('symptom', ''),
                                severity=symptom_data.get('severity'),
                                duration=symptom_data.get('duration'),
                                location=symptom_data.get('location')
                            )
                        )

                    summary = result.get('summary', 'No summary available')

                    return SymptomExtractionResponse(
                        extracted_symptoms=extracted_symptoms,
                        summary=summary,
                        raw_response=raw_response
                    )
                else:
                    # If no JSON found, return empty response with raw text
                    logger.warning("No valid JSON found in response")
                    return SymptomExtractionResponse(
                        extracted_symptoms=[],
                        summary="Could not parse symptoms from response",
                        raw_response=raw_response
                    )

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {str(e)}")
                return SymptomExtractionResponse(
                    extracted_symptoms=[],
                    summary="Failed to parse symptom extraction response",
                    raw_response=raw_response
                )

        except Exception as e:
            logger.error(f"Error in symptom extraction: {str(e)}")
            raise Exception(f"Failed to extract symptoms: {str(e)}")

    def chat_with_symptom_extraction(
        self,
        message: str,
        conversation_history: Optional[List[ChatMessage]] = None,
        patient_context: Optional[Dict[str, Any]] = None
    ) -> tuple[str, Optional[List[ExtractedSymptom]]]:
        """
        Generate chat response and extract symptoms from the conversation

        Args:
            message: User's message
            conversation_history: Previous conversation
            patient_context: Optional patient context

        Returns:
            Tuple of (chat response, extracted symptoms)
        """
        # Generate chat response
        chat_response = self.chat(
            message=message,
            conversation_history=conversation_history,
            patient_context=patient_context
        )

        # Extract symptoms from the user's message
        try:
            symptom_extraction = self.extract_symptoms(
                text=message,
                patient_context=patient_context
            )
            extracted_symptoms = symptom_extraction.extracted_symptoms if symptom_extraction.extracted_symptoms else None
        except Exception as e:
            logger.warning(f"Failed to extract symptoms: {str(e)}")
            extracted_symptoms = None

        return chat_response, extracted_symptoms

    def _format_patient_context(self, patient_context: Dict[str, Any]) -> str:
        """
        Format patient context for inclusion in prompts

        Args:
            patient_context: Patient data dictionary

        Returns:
            Formatted patient context string
        """
        context_parts = []

        # Patient demographics
        patient = patient_context.get('patient', {})
        if patient:
            name = patient.get('name', 'Unknown')
            age_info = patient.get('birthDate', 'Unknown')
            gender = patient.get('gender', 'Unknown')
            context_parts.append(f"Patient: {name}, Gender: {gender}, DOB: {age_info}")

        # Current conditions
        conditions = patient_context.get('conditions', [])
        if conditions:
            condition_names = [c.get('code', 'Unknown condition') for c in conditions[:5]]  # Limit to 5
            context_parts.append(f"Current Conditions: {', '.join(condition_names)}")

        # Current medications
        medications = patient_context.get('medications', [])
        if medications:
            med_names = [m.get('medication', 'Unknown medication') for m in medications[:5]]
            context_parts.append(f"Current Medications: {', '.join(med_names)}")

        # Allergies
        allergies = patient_context.get('allergies', [])
        if allergies:
            allergy_names = [a.get('code', 'Unknown allergy') for a in allergies[:5]]
            context_parts.append(f"Allergies: {', '.join(allergy_names)}")

        return "\n".join(context_parts) if context_parts else "No patient context available"
