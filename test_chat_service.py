"""
Unit tests for Chat Service
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
import json
from chat_service import ChatService
from schemas import ChatMessage, ExtractedSymptom


class TestChatService(unittest.TestCase):
    """Test suite for ChatService"""

    def setUp(self):
        """Set up test fixtures"""
        self.api_key = "test-api-key"
        self.service = ChatService(api_key=self.api_key)

    def test_initialization(self):
        """Test ChatService initialization"""
        self.assertIsNotNone(self.service)
        self.assertEqual(self.service.model, "gpt-3.5-turbo")

    @patch('chat_service.OpenAI')
    def test_chat_basic(self, mock_openai):
        """Test basic chat functionality"""
        mock_client = MagicMock()
        mock_openai.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "I understand you have a headache. Can you tell me more?"
        mock_client.chat.completions.create.return_value = mock_response

        service = ChatService(api_key="test-key")
        service.client = mock_client

        response = service.chat(message="I have a headache")

        self.assertEqual(response, "I understand you have a headache. Can you tell me more?")
        mock_client.chat.completions.create.assert_called_once()

    @patch('chat_service.OpenAI')
    def test_chat_with_conversation_history(self, mock_openai):
        """Test chat with conversation history"""
        mock_client = MagicMock()
        mock_openai.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Follow-up response"
        mock_client.chat.completions.create.return_value = mock_response

        service = ChatService(api_key="test-key")
        service.client = mock_client

        history = [
            ChatMessage(role="user", content="I have a headache"),
            ChatMessage(role="assistant", content="Tell me more")
        ]

        response = service.chat(
            message="It's been 3 days",
            conversation_history=history
        )

        self.assertIsNotNone(response)
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args.kwargs['messages']
        self.assertEqual(len(messages), 4)  # system + 2 history + current

    @patch('chat_service.OpenAI')
    def test_extract_symptoms_single_symptom(self, mock_openai):
        """Test symptom extraction for single symptom"""
        mock_client = MagicMock()
        mock_openai.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "symptoms": [
                {
                    "symptom": "headache",
                    "severity": "moderate",
                    "duration": "3 days",
                    "location": "forehead"
                }
            ],
            "summary": "Patient has moderate headache for 3 days"
        })
        mock_client.chat.completions.create.return_value = mock_response

        service = ChatService(api_key="test-key")
        service.client = mock_client

        result = service.extract_symptoms(
            text="I have a moderate headache in my forehead for 3 days"
        )

        self.assertEqual(len(result.extracted_symptoms), 1)
        self.assertEqual(result.extracted_symptoms[0].symptom, "headache")
        self.assertEqual(result.extracted_symptoms[0].severity, "moderate")
        self.assertEqual(result.extracted_symptoms[0].duration, "3 days")

    @patch('chat_service.OpenAI')
    def test_extract_symptoms_multiple_symptoms(self, mock_openai):
        """Test symptom extraction for multiple symptoms"""
        mock_client = MagicMock()
        mock_openai.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "symptoms": [
                {
                    "symptom": "fever",
                    "severity": "high",
                    "duration": "2 days",
                    "location": None
                },
                {
                    "symptom": "cough",
                    "severity": "mild",
                    "duration": "1 week",
                    "location": None
                }
            ],
            "summary": "Patient has high fever and mild cough"
        })
        mock_client.chat.completions.create.return_value = mock_response

        service = ChatService(api_key="test-key")
        service.client = mock_client

        result = service.extract_symptoms(
            text="I have a high fever for 2 days and a mild cough for a week"
        )

        self.assertEqual(len(result.extracted_symptoms), 2)
        self.assertEqual(result.extracted_symptoms[0].symptom, "fever")
        self.assertEqual(result.extracted_symptoms[1].symptom, "cough")

    @patch('chat_service.OpenAI')
    def test_extract_symptoms_invalid_json(self, mock_openai):
        """Test symptom extraction with invalid JSON response"""
        mock_client = MagicMock()
        mock_openai.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is not JSON"
        mock_client.chat.completions.create.return_value = mock_response

        service = ChatService(api_key="test-key")
        service.client = mock_client

        result = service.extract_symptoms(text="I have a headache")

        # Should return empty symptoms on parse failure
        self.assertEqual(len(result.extracted_symptoms), 0)

    def test_format_patient_context_complete(self):
        """Test patient context formatting with all fields"""
        patient_context = {
            'patient': {
                'name': 'John Doe',
                'birthDate': '1980-01-01',
                'gender': 'male'
            },
            'conditions': [
                {'code': 'Hypertension'},
                {'code': 'Diabetes'}
            ],
            'medications': [
                {'medication': 'Lisinopril'},
                {'medication': 'Metformin'}
            ],
            'allergies': [
                {'code': 'Penicillin'}
            ]
        }

        formatted = self.service._format_patient_context(patient_context)

        self.assertIn('John Doe', formatted)
        self.assertIn('1980-01-01', formatted)
        self.assertIn('male', formatted)
        self.assertIn('Hypertension', formatted)
        self.assertIn('Lisinopril', formatted)
        self.assertIn('Penicillin', formatted)

    def test_format_patient_context_empty(self):
        """Test patient context formatting with no data"""
        patient_context = {}
        formatted = self.service._format_patient_context(patient_context)
        self.assertEqual(formatted, "No patient context available")

    @patch('chat_service.OpenAI')
    def test_chat_with_symptom_extraction(self, mock_openai):
        """Test combined chat and symptom extraction"""
        mock_client = MagicMock()
        mock_openai.return_value = mock_client

        # Mock chat response
        chat_mock = MagicMock()
        chat_mock.choices = [MagicMock()]
        chat_mock.choices[0].message.content = "I understand you have symptoms"

        # Mock symptom extraction response
        symptom_mock = MagicMock()
        symptom_mock.choices = [MagicMock()]
        symptom_mock.choices[0].message.content = json.dumps({
            "symptoms": [{"symptom": "fever", "severity": "high", "duration": None, "location": None}],
            "summary": "High fever"
        })

        mock_client.chat.completions.create.side_effect = [chat_mock, symptom_mock]

        service = ChatService(api_key="test-key")
        service.client = mock_client

        chat_response, extracted_symptoms = service.chat_with_symptom_extraction(
            message="I have a high fever"
        )

        self.assertIsNotNone(chat_response)
        self.assertIsNotNone(extracted_symptoms)
        self.assertEqual(len(extracted_symptoms), 1)


if __name__ == '__main__':
    unittest.main()
