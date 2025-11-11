"""
Triage Service for Medical Symptom Assessment
Determines triage priority and provides care recommendations
"""
import logging
from typing import List, Dict, Any, Optional
from enum import Enum
from openai import OpenAI
import json

from schemas import ExtractedSymptom

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TriagePriority(str, Enum):
    """Triage priority levels"""
    EMERGENCY = "emergency"
    URGENT = "urgent"
    SEMI_URGENT = "semi-urgent"
    NON_URGENT = "non-urgent"


class TriageService:
    """Service for medical triage and care recommendations"""

    # Emergency symptoms that require immediate attention
    EMERGENCY_SYMPTOMS = [
        "chest pain", "difficulty breathing", "severe bleeding", "loss of consciousness",
        "stroke symptoms", "severe allergic reaction", "seizure", "severe burn",
        "severe head injury", "poisoning", "suicidal thoughts", "severe abdominal pain",
        "difficulty speaking", "confusion", "severe trauma", "heart attack"
    ]

    # Urgent symptoms requiring care within hours
    URGENT_SYMPTOMS = [
        "high fever", "persistent vomiting", "dehydration", "severe pain",
        "deep cut", "suspected fracture", "severe headache", "difficulty swallowing",
        "severe diarrhea", "severe rash", "eye injury", "severe cough"
    ]

    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo", use_rag: bool = False):
        """
        Initialize TriageService

        Args:
            api_key: OpenAI API key for AI-powered triage
            model: OpenAI model to use
            use_rag: Whether to use RAG (Retrieval Augmented Generation)
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.use_rag = use_rag

        # Initialize RAG service if enabled
        self.rag_service = None
        if use_rag:
            try:
                from rag_service import get_rag_service
                self.rag_service = get_rag_service()
                logger.info("TriageService initialized with RAG enabled")
            except Exception as e:
                logger.error(f"Failed to initialize RAG service: {str(e)}")
                logger.info("Falling back to non-RAG mode")
                self.use_rag = False
        else:
            logger.info("TriageService initialized (RAG disabled)")

    def determine_triage_priority(
        self,
        symptoms: List[ExtractedSymptom],
        patient_context: Optional[Dict[str, Any]] = None,
        user_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Determine triage priority based on symptoms and patient context

        Args:
            symptoms: List of extracted symptoms
            patient_context: Optional patient medical history
            user_message: Original user message for context

        Returns:
            Dictionary containing triage priority and reasoning
        """
        try:
            # Rule-based initial assessment
            rule_based_priority = self._rule_based_triage(symptoms)

            # AI-powered comprehensive assessment
            ai_assessment = self._ai_triage_assessment(
                symptoms=symptoms,
                patient_context=patient_context,
                user_message=user_message,
                initial_priority=rule_based_priority
            )

            return ai_assessment

        except Exception as e:
            logger.error(f"Error in triage determination: {str(e)}")
            # Return conservative assessment on error
            return {
                "priority": TriagePriority.URGENT,
                "reasoning": "Unable to complete full assessment. Recommend seeking medical attention.",
                "confidence": "low"
            }

    def _rule_based_triage(self, symptoms: List[ExtractedSymptom]) -> TriagePriority:
        """
        Rule-based triage using symptom keywords

        Args:
            symptoms: List of extracted symptoms

        Returns:
            Initial triage priority
        """
        if not symptoms:
            return TriagePriority.NON_URGENT

        # Check for emergency symptoms
        for symptom in symptoms:
            symptom_text = symptom.symptom.lower()

            # Emergency check
            for emergency_keyword in self.EMERGENCY_SYMPTOMS:
                if emergency_keyword in symptom_text:
                    return TriagePriority.EMERGENCY

            # Check severity
            if symptom.severity and symptom.severity.lower() == "severe":
                for urgent_keyword in self.URGENT_SYMPTOMS:
                    if urgent_keyword in symptom_text:
                        return TriagePriority.EMERGENCY

        # Check for urgent symptoms
        for symptom in symptoms:
            symptom_text = symptom.symptom.lower()
            for urgent_keyword in self.URGENT_SYMPTOMS:
                if urgent_keyword in symptom_text:
                    return TriagePriority.URGENT

        # Check severity levels
        severe_count = sum(1 for s in symptoms if s.severity and s.severity.lower() == "severe")
        if severe_count > 0:
            return TriagePriority.URGENT

        moderate_count = sum(1 for s in symptoms if s.severity and s.severity.lower() == "moderate")
        if moderate_count >= 2:
            return TriagePriority.SEMI_URGENT

        return TriagePriority.NON_URGENT

    def _ai_triage_assessment(
        self,
        symptoms: List[ExtractedSymptom],
        patient_context: Optional[Dict[str, Any]],
        user_message: Optional[str],
        initial_priority: TriagePriority
    ) -> Dict[str, Any]:
        """
        AI-powered triage assessment using OpenAI

        Args:
            symptoms: Extracted symptoms
            patient_context: Patient medical history
            user_message: Original message
            initial_priority: Rule-based priority

        Returns:
            Comprehensive triage assessment
        """
        try:
            # Build comprehensive prompt
            assessment_prompt = self._build_triage_prompt(
                symptoms=symptoms,
                patient_context=patient_context,
                user_message=user_message,
                initial_priority=initial_priority
            )

            messages = [
                {"role": "system", "content": assessment_prompt},
                {"role": "user", "content": "Provide a comprehensive triage assessment."}
            ]

            logger.info("Requesting AI triage assessment")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=1000
            )

            raw_response = response.choices[0].message.content

            # Parse JSON response
            try:
                json_start = raw_response.find('{')
                json_end = raw_response.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = raw_response[json_start:json_end]
                    result = json.loads(json_str)
                    return result
                else:
                    raise ValueError("No JSON found in response")
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Could not parse AI response as JSON: {str(e)}")
                # Return structured fallback
                return {
                    "priority": initial_priority,
                    "reasoning": raw_response,
                    "confidence": "medium"
                }

        except Exception as e:
            logger.error(f"Error in AI triage assessment: {str(e)}")
            return {
                "priority": initial_priority,
                "reasoning": f"Using rule-based assessment: {initial_priority}",
                "confidence": "medium"
            }

    def _build_triage_prompt(
        self,
        symptoms: List[ExtractedSymptom],
        patient_context: Optional[Dict[str, Any]],
        user_message: Optional[str],
        initial_priority: TriagePriority
    ) -> str:
        """Build comprehensive prompt for AI triage"""

        base_prompt = """You are a medical triage AI assistant. Assess the urgency of the patient's condition and provide a triage recommendation.

Triage Priority Levels:
- EMERGENCY: Life-threatening, requires immediate emergency care (call 911/go to ER)
- URGENT: Serious condition, needs medical attention within hours
- SEMI_URGENT: Should see a doctor within 24-48 hours
- NON_URGENT: Can wait for regular appointment or self-care

Provide your assessment in the following JSON format:
{
  "priority": "emergency|urgent|semi-urgent|non-urgent",
  "reasoning": "Detailed explanation of the assessment",
  "confidence": "high|medium|low",
  "red_flags": ["list of concerning symptoms"],
  "recommendations": {
    "immediate_action": "What to do right now",
    "care_level": "Emergency Room|Urgent Care|Primary Care|Self-Care",
    "timeframe": "When to seek care",
    "warning_signs": ["Signs that would require escalation"]
  }
}

"""

        # Build main assessment prompt
        assessment_details = ""

        # Add symptoms
        if symptoms:
            assessment_details += "\n\nReported Symptoms:\n"
            for symptom in symptoms:
                symptom_desc = f"- {symptom.symptom}"
                if symptom.severity:
                    symptom_desc += f" (severity: {symptom.severity})"
                if symptom.duration:
                    symptom_desc += f" (duration: {symptom.duration})"
                if symptom.location:
                    symptom_desc += f" (location: {symptom.location})"
                assessment_details += symptom_desc + "\n"

        # Add user message context
        if user_message:
            assessment_details += f"\n\nPatient's Description:\n{user_message}\n"

        # Add patient context
        if patient_context:
            assessment_details += "\n\nPatient Medical History:\n"

            patient = patient_context.get('patient', {})
            if patient:
                assessment_details += f"Age/DOB: {patient.get('birthDate', 'Unknown')}\n"
                assessment_details += f"Gender: {patient.get('gender', 'Unknown')}\n"

            conditions = patient_context.get('conditions', [])
            if conditions:
                assessment_details += "Existing Conditions: "
                assessment_details += ", ".join([c.get('code', 'Unknown') for c in conditions[:5]])
                assessment_details += "\n"

            medications = patient_context.get('medications', [])
            if medications:
                assessment_details += "Current Medications: "
                assessment_details += ", ".join([m.get('medication', 'Unknown') for m in medications[:5]])
                assessment_details += "\n"

            allergies = patient_context.get('allergies', [])
            if allergies:
                assessment_details += "Allergies: "
                assessment_details += ", ".join([a.get('code', 'Unknown') for a in allergies[:5]])
                assessment_details += "\n"

        assessment_details += f"\n\nInitial Rule-based Assessment: {initial_priority}\n"
        assessment_details += "\nProvide a comprehensive triage assessment considering all factors."

        # Combine base prompt with assessment details
        full_prompt = base_prompt + assessment_details

        # Apply RAG if enabled
        if self.use_rag and self.rag_service and user_message:
            logger.info("Augmenting prompt with RAG-retrieved medical knowledge")
            full_prompt = self.rag_service.augment_prompt_with_knowledge(
                base_prompt=full_prompt,
                query=user_message,
                n_results=2
            )

        return full_prompt

    def get_care_recommendations(
        self,
        triage_result: Dict[str, Any],
        symptoms: List[ExtractedSymptom],
        patient_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate detailed care recommendations based on triage result

        Args:
            triage_result: Result from triage assessment
            symptoms: List of symptoms
            patient_context: Patient context

        Returns:
            Detailed care recommendations
        """
        try:
            priority = triage_result.get('priority', TriagePriority.NON_URGENT)

            # Get AI-powered recommendations if not already in triage result
            if 'recommendations' not in triage_result:
                recommendations_prompt = self._build_recommendations_prompt(
                    priority=priority,
                    symptoms=symptoms,
                    patient_context=patient_context
                )

                messages = [
                    {"role": "system", "content": recommendations_prompt},
                    {"role": "user", "content": "Provide detailed care recommendations."}
                ]

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.4,
                    max_tokens=1000
                )

                raw_response = response.choices[0].message.content

                # Try to parse JSON
                try:
                    json_start = raw_response.find('{')
                    json_end = raw_response.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        json_str = raw_response[json_start:json_end]
                        recommendations = json.loads(json_str)
                        return recommendations
                except (json.JSONDecodeError, ValueError):
                    pass

                # Return structured text if JSON parsing fails
                return {
                    "care_level": self._get_default_care_level(priority),
                    "recommendations": raw_response
                }
            else:
                return triage_result['recommendations']

        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return {
                "care_level": self._get_default_care_level(triage_result.get('priority')),
                "recommendations": "Please consult with a healthcare professional."
            }

    def _build_recommendations_prompt(
        self,
        priority: str,
        symptoms: List[ExtractedSymptom],
        patient_context: Optional[Dict[str, Any]]
    ) -> str:
        """Build prompt for care recommendations"""

        prompt = f"""You are a medical care advisor. Based on the triage priority of {priority}, provide detailed care recommendations.

Provide recommendations in JSON format:
{{
  "immediate_action": "What the patient should do immediately",
  "care_level": "Emergency Room|Urgent Care|Primary Care|Self-Care|Telemedicine",
  "timeframe": "When to seek care (e.g., 'immediately', 'within 4 hours', 'within 24 hours', 'within a week')",
  "self_care_tips": ["List of self-care measures"],
  "warning_signs": ["Signs that would require escalation to emergency care"],
  "follow_up": "Follow-up care recommendations"
}}

"""

        if symptoms:
            prompt += "\n\nSymptoms:\n"
            for symptom in symptoms:
                prompt += f"- {symptom.symptom}"
                if symptom.severity:
                    prompt += f" ({symptom.severity})"
                prompt += "\n"

        if patient_context:
            prompt += "\n\nConsider patient's medical history when making recommendations.\n"

        return prompt

    def _get_default_care_level(self, priority: str) -> str:
        """Get default care level based on priority"""
        priority_to_care = {
            TriagePriority.EMERGENCY: "Emergency Room",
            TriagePriority.URGENT: "Urgent Care",
            TriagePriority.SEMI_URGENT: "Primary Care",
            TriagePriority.NON_URGENT: "Self-Care or Primary Care"
        }
        return priority_to_care.get(priority, "Primary Care")
