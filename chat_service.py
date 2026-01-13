"""
Chat service with Llama 4 integration for symptom extraction and conversational AI
"""
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from schemas import ChatMessage, ExtractedSymptom, SymptomExtractionResponse
from llama_service import LlamaService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatService:
    """Service for handling chat and symptom extraction using Llama 4 and rule-based fallback"""

    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        """
        Initialize ChatService with Llama 4 and OpenAI (fallback)

        Args:
            api_key: OpenAI API key (for fallback only)
            model: OpenAI model to use (default: gpt-3.5-turbo)
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model

        # Initialize Llama 4 service for primary AI classification
        try:
            self.llama_service = LlamaService()
            logger.info("ChatService initialized with Llama 4 as primary AI")
        except Exception as e:
            logger.warning(f"Failed to initialize Llama service: {e}, using rule-based only")
            self.llama_service = None

        logger.info(f"ChatService initialized with OpenAI fallback model: {model}")

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

    def classify_intent(
        self,
        message: str,
        conversation_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Classify the intent of an MA's message using GPT-4 or rule-based fallback

        Args:
            message: MA's message
            conversation_context: Context including patient state, previous actions

        Returns:
            Dictionary with intent_type, confidence, and extracted_entities
        """
        import re

        # Rule-based fallback for common patterns (used when OpenAI unavailable)
        message_lower = message.lower()

        # Check if there's a current patient in context
        current_patient = conversation_context.get('current_patient') if conversation_context else None

        # PRIORITY 1: If current patient exists and message has symptoms, it's TRIAGE
        symptom_keywords = [
            # Pain-related
            'pain', 'hurt', 'ache', 'sore', 'tender', 'discomfort',
            # Respiratory
            'breath', 'breathing', 'shortness of breath', 'sob', 'cough', 'wheez',
            # Neurological
            'dizzy', 'dizziness', 'weakness', 'numbness', 'confusion', 'droop', 'droopy', 'facial droop', 'slurred', 'speech',
            # Cardiovascular
            'chest', 'palpitations', 'racing heart', 'crushing',
            # Gastrointestinal
            'nausea', 'vomiting', 'diarrhea', 'vomit',
            # Dermatological
            'rash', 'swelling', 'swollen', 'bleeding', 'wound', 'ulcer',
            # General/Systemic
            'fever', 'temperature', 'chills', 'sweating', 'fatigue',
            # Emergency keywords
            'can\'t get up', 'fell', 'fall', 'collapsed'
        ]
        has_symptoms = any(keyword in message_lower for keyword in symptom_keywords)

        if current_patient and has_symptoms:
            logger.info(f"Rule-based classification: TRIAGE_START (current patient exists + symptoms detected)")
            return {
                "intent_type": "TRIAGE_START",
                "confidence": 0.90,
                "extracted_entities": {"symptoms_detected": True}
            }

        # PRIORITY 2: Patient lookup patterns (only if no current patient or no symptoms)
        patient_id_patterns = [
            # Numeric patient IDs (e.g., 1000, 1001, 1002, 1003, 1004)
            (r'^\s*(\d{4})\s*$', 1),  # Just the number alone
            (r'patient[\s-]*(id)?[\s:-]*(\d{4})\s*$', 2),  # "patient 1000" or "patient id 1000" (must end after ID)
            (r'find\s+(?:patient\s+)?(\d{4})', 1),  # "find patient 1000" or "find 1000"
            (r'look\s*up\s+(?:patient\s+)?(\d{4})', 1),  # "lookup patient 1000"
            (r'search\s+(?:for\s+)?(?:patient\s+)?(\d{4})', 1),  # "search patient 1000"
            (r'get\s+(?:patient\s+)?(\d{4})', 1),  # "get patient 1000"
            (r'show\s+(?:patient\s+)?(\d{4})', 1),  # "show patient 1000"
            # Direct patient ID format (e.g., cardiac-emergency-001, stroke-emergency-002)
            (r'^([a-z]+\-[a-z]+\-\d+)$', 1),
            # Patient ID with find/lookup/search verbs
            (r'find\s+(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
            (r'look\s*up\s+(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
            (r'search\s+(?:for\s+)?(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
            (r'get\s+(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
            (r'show\s+(?:patient\s+)?([a-zA-Z0-9\-]+)', 1),
            # Just the ID alone (last resort - match IDs with hyphens and numbers)
            (r'\b([a-z]+\-[a-z]+\-\d{3,})\b', 1),
        ]

        # Only check patient lookup if no symptoms detected
        if not has_symptoms:
            for pattern, group_idx in patient_id_patterns:
                match = re.search(pattern, message, re.IGNORECASE)
                if match:
                    patient_id = match.group(group_idx)
                    logger.info(f"Rule-based classification: PATIENT_LOOKUP with ID {patient_id}")
                    return {
                        "intent_type": "PATIENT_LOOKUP",
                        "confidence": 0.85,
                        "extracted_entities": {"patient_id": patient_id}
                    }

        # PRIORITY 3: Triage patterns (if symptoms but no current patient)
        if has_symptoms:
            logger.info(f"Rule-based classification: TRIAGE_START (symptoms detected)")
            return {
                "intent_type": "TRIAGE_START",
                "confidence": 0.75,
                "extracted_entities": {}
            }

        # Appointment scheduling patterns
        schedule_keywords = ['appointment', 'schedule', 'book', 'slot', 'available']
        if any(keyword in message_lower for keyword in schedule_keywords):
            return {
                "intent_type": "SCHEDULE_REQUEST",
                "confidence": 0.75,
                "extracted_entities": {}
            }

        # Try Llama 4 AI-based classification as secondary option
        if self.llama_service:
            try:
                # Build context string
                context_str = ""
                if conversation_context:
                    if conversation_context.get('current_patient'):
                        context_str += f"Current patient: {conversation_context['current_patient'].get('name', 'Unknown')}\n"
                    if conversation_context.get('last_triage'):
                        context_str += f"Last triage priority: {conversation_context['last_triage'].get('priority')}\n"
                    if conversation_context.get('available_slots'):
                        context_str += f"Available slots shown: {len(conversation_context['available_slots'])}\n"

                intent_prompt = f"""You are an intent classifier for a Medical Assistant (MA) chat interface.

Classify the intent of the MA's message into ONE of these categories:

1. PATIENT_LOOKUP - MA is looking for a patient (mentions patient ID, name, DOB)
   Examples: "I have patient ID 232", "Looking for John Smith"

2. TRIAGE_START - MA is describing patient symptoms for triage assessment
   Examples: "Patient has chest pain", "Patient is having severe headache"
   IMPORTANT: If a patient is already loaded (context shows current_patient), symptom descriptions are ALWAYS TRIAGE_START, NOT patient lookup

3. TESTING_CHECK - MA is asking about test results or testing requirements
   Examples: "Check if patient has recent labs", "What tests are needed?"

4. SCHEDULE_REQUEST - MA wants to find available appointment slots
   Examples: "Find appointments", "Schedule patient", "Show available slots"

5. APPOINTMENT_CONFIRM - MA is confirming/booking a specific appointment slot
   Examples: "Book the 2pm slot", "Schedule the first appointment"

6. GENERAL_QUESTION - Other questions or requests

Context:
{context_str if context_str else "No context"}

Message from MA: "{message}"

CRITICAL RULES:
- If context shows a current_patient AND message describes symptoms → TRIAGE_START
- If message mentions patient ID/name/DOB → PATIENT_LOOKUP
- If message requests appointments/slots → SCHEDULE_REQUEST
- If message confirms a specific slot → APPOINTMENT_CONFIRM

Return JSON in this exact format:
{{
  "intent_type": "TRIAGE_START",
  "confidence": 0.95,
  "extracted_entities": {{
    "symptoms": ["chest pain", "radiating to arm"],
    "severity": "severe"
  }}
}}

Only include entities that are explicitly mentioned in the message."""

                messages = [
                    {"role": "system", "content": intent_prompt},
                    {"role": "user", "content": message}
                ]

                logger.info("Classifying intent with Llama 4")
                response = self.llama_service.chat_completion(
                    messages=messages,
                    temperature=0.1,  # Very low for consistent classification
                    max_tokens=300
                )

                if response and response.get('choices'):
                    raw_response = response['choices'][0]['message']['content']
                    logger.debug(f"Llama 4 intent classification raw response: {raw_response}")

                    # Parse JSON response
                    json_start = raw_response.find('{')
                    json_end = raw_response.rfind('}') + 1

                    if json_start != -1 and json_end > json_start:
                        json_str = raw_response[json_start:json_end]
                        result = json.loads(json_str)

                        # Validate intent type
                        valid_intents = ["PATIENT_LOOKUP", "TRIAGE_START", "TESTING_CHECK", "SCHEDULE_REQUEST", "APPOINTMENT_CONFIRM", "GENERAL_QUESTION"]
                        if result.get('intent_type') not in valid_intents:
                            logger.warning(f"Invalid intent type: {result.get('intent_type')}, defaulting to GENERAL_QUESTION")
                            result['intent_type'] = "GENERAL_QUESTION"

                        logger.info(f"Llama 4: Intent classified as {result.get('intent_type')} (confidence: {result.get('confidence')})")
                        return result
                else:
                    logger.warning("Llama 4 returned no response, using rule-based classification")

            except json.JSONDecodeError as e:
                logger.warning(f"Could not parse Llama 4 JSON response: {e}, using rule-based classification")
            except Exception as e:
                logger.error(f"Error with Llama 4 classification: {str(e)}, using rule-based classification")

        # Final fallback: GENERAL_QUESTION
        logger.info("No pattern matched, defaulting to GENERAL_QUESTION")
        return {
            "intent_type": "GENERAL_QUESTION",
            "confidence": 0.3,
            "extracted_entities": {}
        }

    def generate_conversational_response(
        self,
        intent: Dict[str, Any],
        action_results: Dict[str, Any],
        ma_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate a natural conversational response based on intent and action results

        Args:
            intent: Classified intent with entities
            action_results: Results from executed actions (patient lookup, triage, etc.)
            ma_context: MA session context (facility, specialty)

        Returns:
            Natural language response for the MA
        """
        try:
            intent_type = intent.get('intent_type')

            # Build context-aware prompt
            context_str = ""
            if ma_context:
                context_str = f"MA is working at {ma_context.get('facility_name')} in {ma_context.get('specialty_name')}.\n"

            # Build result summary
            result_summary = ""
            if action_results.get('patient'):
                patient_history = action_results['patient']
                # Extract patient data from nested structure
                patient = patient_history.get('patient', {})
                name = patient.get('name', 'Unknown')
                age = patient.get('age', 'Unknown')
                gender = patient.get('gender', 'Unknown')
                result_summary += f"Found patient: {name}, {age}yo {gender}\n"

                # Add conditions if available
                conditions = patient_history.get('conditions', [])
                if conditions:
                    condition_names = [c.get('code', 'Unknown') for c in conditions[:3]]
                    result_summary += f"Conditions: {', '.join(condition_names)}\n"

            if action_results.get('triage'):
                triage = action_results['triage']
                result_summary += f"Triage: {triage.get('priority')} priority\nReasoning: {triage.get('reasoning')}\n"

            if action_results.get('testing_status'):
                testing = action_results['testing_status']
                result_summary += f"Testing Status:\n{testing.get('formatted_message')}\n"

            if action_results.get('slots'):
                slots = action_results['slots']
                result_summary += f"Found {len(slots)} available appointment slots\n"

            if action_results.get('appointment_confirmed'):
                appt = action_results['appointment_confirmed']
                result_summary += f"Appointment confirmed: {appt.get('confirmation_number')}\n"

            response_prompt = f"""You are an AI assistant helping a Medical Assistant (MA).

Context: {context_str}

The MA's intent was: {intent_type}

Action Results:
{result_summary if result_summary else 'No specific results'}

Generate a natural, helpful response for the MA. Be concise, clear, and actionable.
- If patient was found, summarize key info
- If triage was done, explain priority and next steps
- If tests are missing, clearly list what's needed
- If slots were found, briefly mention best options
- If appointment booked, confirm details

Keep response to 2-3 sentences unless more detail is critical."""

            messages = [
                {"role": "system", "content": response_prompt},
                {"role": "user", "content": "Generate response"}
            ]

            logger.info("Generating conversational response")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=300
            )

            conversational_response = response.choices[0].message.content
            logger.info("Generated conversational response")

            return conversational_response

        except Exception as e:
            logger.error(f"Error generating conversational response: {str(e)}")
            # Return a basic fallback response
            if action_results.get('patient'):
                patient = action_results['patient'].get('patient', {})
                name = patient.get('name', 'Unknown patient')
                return f"Found patient: {name}"
            return "I've processed your request. What would you like to do next?"
