"""
Unit tests for Triage Service
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
from triage_service import TriageService, TriagePriority
from schemas import ExtractedSymptom


class TestTriageService(unittest.TestCase):
    """Test suite for TriageService"""

    def setUp(self):
        """Set up test fixtures"""
        self.api_key = "test-api-key"
        self.service = TriageService(api_key=self.api_key)

    def test_initialization(self):
        """Test TriageService initialization"""
        self.assertIsNotNone(self.service)
        self.assertEqual(self.service.model, "gpt-3.5-turbo")

    def test_rule_based_triage_emergency_chest_pain(self):
        """Test rule-based triage identifies chest pain as emergency"""
        symptoms = [
            ExtractedSymptom(
                symptom="chest pain",
                severity="severe",
                duration="30 minutes",
                location="center"
            )
        ]

        priority = self.service._rule_based_triage(symptoms)
        self.assertEqual(priority, TriagePriority.EMERGENCY)

    def test_rule_based_triage_emergency_difficulty_breathing(self):
        """Test rule-based triage identifies difficulty breathing as emergency"""
        symptoms = [
            ExtractedSymptom(
                symptom="difficulty breathing",
                severity="severe",
                duration="1 hour",
                location=None
            )
        ]

        priority = self.service._rule_based_triage(symptoms)
        self.assertEqual(priority, TriagePriority.EMERGENCY)

    def test_rule_based_triage_urgent_high_fever(self):
        """Test rule-based triage identifies high fever as urgent"""
        symptoms = [
            ExtractedSymptom(
                symptom="high fever",
                severity="moderate",
                duration="2 days",
                location=None
            )
        ]

        priority = self.service._rule_based_triage(symptoms)
        self.assertEqual(priority, TriagePriority.URGENT)

    def test_rule_based_triage_urgent_severe_pain(self):
        """Test rule-based triage identifies severe pain as urgent"""
        symptoms = [
            ExtractedSymptom(
                symptom="abdominal pain",
                severity="severe",
                duration="4 hours",
                location="lower right"
            )
        ]

        priority = self.service._rule_based_triage(symptoms)
        self.assertEqual(priority, TriagePriority.URGENT)

    def test_rule_based_triage_non_urgent_mild_headache(self):
        """Test rule-based triage identifies mild headache as non-urgent"""
        symptoms = [
            ExtractedSymptom(
                symptom="headache",
                severity="mild",
                duration="few hours",
                location="forehead"
            )
        ]

        priority = self.service._rule_based_triage(symptoms)
        self.assertEqual(priority, TriagePriority.NON_URGENT)

    def test_rule_based_triage_empty_symptoms(self):
        """Test rule-based triage with no symptoms"""
        symptoms = []
        priority = self.service._rule_based_triage(symptoms)
        self.assertEqual(priority, TriagePriority.NON_URGENT)

    def test_rule_based_triage_multiple_severe_symptoms(self):
        """Test rule-based triage with multiple severe symptoms"""
        symptoms = [
            ExtractedSymptom(symptom="headache", severity="severe", duration=None, location=None),
            ExtractedSymptom(symptom="nausea", severity="severe", duration=None, location=None)
        ]

        priority = self.service._rule_based_triage(symptoms)
        self.assertEqual(priority, TriagePriority.URGENT)

    @patch('triage_service.OpenAI')
    def test_determine_triage_priority_with_mock_ai(self, mock_openai):
        """Test triage priority determination with mocked AI"""
        # Mock OpenAI response
        mock_client = MagicMock()
        mock_openai.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '''
        {
            "priority": "emergency",
            "reasoning": "Severe chest pain requires immediate attention",
            "confidence": "high",
            "red_flags": ["chest pain"],
            "recommendations": {
                "immediate_action": "Call 911",
                "care_level": "Emergency Room",
                "timeframe": "Immediately"
            }
        }
        '''
        mock_client.chat.completions.create.return_value = mock_response

        service = TriageService(api_key="test-key")
        service.client = mock_client

        symptoms = [
            ExtractedSymptom(
                symptom="chest pain",
                severity="severe",
                duration="30 minutes",
                location="center"
            )
        ]

        result = service.determine_triage_priority(symptoms=symptoms)

        self.assertIn('priority', result)
        self.assertIn('reasoning', result)

    def test_get_default_care_level(self):
        """Test default care level mapping"""
        self.assertEqual(
            self.service._get_default_care_level(TriagePriority.EMERGENCY),
            "Emergency Room"
        )
        self.assertEqual(
            self.service._get_default_care_level(TriagePriority.URGENT),
            "Urgent Care"
        )
        self.assertEqual(
            self.service._get_default_care_level(TriagePriority.SEMI_URGENT),
            "Primary Care"
        )
        self.assertEqual(
            self.service._get_default_care_level(TriagePriority.NON_URGENT),
            "Self-Care or Primary Care"
        )

    def test_build_triage_prompt_with_symptoms(self):
        """Test triage prompt building with symptoms"""
        symptoms = [
            ExtractedSymptom(
                symptom="headache",
                severity="moderate",
                duration="3 days",
                location="forehead"
            )
        ]

        prompt = self.service._build_triage_prompt(
            symptoms=symptoms,
            patient_context=None,
            user_message="I have a headache",
            initial_priority=TriagePriority.NON_URGENT
        )

        self.assertIn("headache", prompt)
        self.assertIn("moderate", prompt)
        self.assertIn("3 days", prompt)
        self.assertIn("forehead", prompt)

    def test_build_triage_prompt_with_patient_context(self):
        """Test triage prompt building with patient context"""
        symptoms = [ExtractedSymptom(symptom="cough", severity="mild", duration=None, location=None)]

        patient_context = {
            'patient': {'birthDate': '1980-01-01', 'gender': 'male'},
            'conditions': [{'code': 'Asthma'}],
            'medications': [{'medication': 'Albuterol'}],
            'allergies': [{'code': 'Penicillin'}]
        }

        prompt = self.service._build_triage_prompt(
            symptoms=symptoms,
            patient_context=patient_context,
            user_message="I have a cough",
            initial_priority=TriagePriority.NON_URGENT
        )

        self.assertIn("Asthma", prompt)
        self.assertIn("Albuterol", prompt)
        self.assertIn("Penicillin", prompt)


class TestTriagePriority(unittest.TestCase):
    """Test TriagePriority enum"""

    def test_priority_values(self):
        """Test priority enum values"""
        self.assertEqual(TriagePriority.EMERGENCY, "emergency")
        self.assertEqual(TriagePriority.URGENT, "urgent")
        self.assertEqual(TriagePriority.SEMI_URGENT, "semi-urgent")
        self.assertEqual(TriagePriority.NON_URGENT, "non-urgent")


if __name__ == '__main__':
    unittest.main()
