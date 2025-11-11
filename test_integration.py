"""
Integration tests for the Medical Triage System API
Tests the complete flow from API endpoints through services
"""
import unittest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json

from main import app
from schemas import ExtractedSymptom


class TestAPIIntegration(unittest.TestCase):
    """Integration tests for API endpoints"""

    def setUp(self):
        """Set up test client"""
        self.client = TestClient(app)

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertEqual(data["status"], "healthy")

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)

    @patch('main.chat_service.extract_symptoms')
    def test_extract_symptoms_endpoint(self, mock_extract):
        """Test symptom extraction endpoint"""
        from schemas import SymptomExtractionResponse, ExtractedSymptom

        mock_extract.return_value = SymptomExtractionResponse(
            extracted_symptoms=[
                ExtractedSymptom(
                    symptom="headache",
                    severity="moderate",
                    duration="3 days",
                    location="forehead"
                )
            ],
            summary="Moderate headache for 3 days",
            raw_response="AI response"
        )

        response = self.client.post(
            "/api/v1/extract-symptoms",
            json={
                "text": "I have a moderate headache in my forehead for 3 days"
            }
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("extracted_symptoms", data)
        self.assertEqual(len(data["extracted_symptoms"]), 1)
        self.assertEqual(data["extracted_symptoms"][0]["symptom"], "headache")

    @patch('main.chat_service.chat_with_symptom_extraction')
    def test_chat_endpoint(self, mock_chat):
        """Test chat endpoint"""
        mock_chat.return_value = (
            "I understand you have a headache. Can you tell me more?",
            [ExtractedSymptom(symptom="headache", severity="mild", duration=None, location=None)]
        )

        response = self.client.post(
            "/api/v1/chat",
            json={
                "message": "I have a headache",
                "conversation_history": []
            }
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("response", data)
        self.assertIn("extracted_symptoms", data)

    @patch('main.triage_service.determine_triage_priority')
    @patch('main.triage_service.get_care_recommendations')
    @patch('main.chat_service.extract_symptoms')
    def test_triage_endpoint(self, mock_extract, mock_recommendations, mock_triage):
        """Test triage assessment endpoint"""
        from schemas import SymptomExtractionResponse

        # Mock symptom extraction
        mock_extract.return_value = SymptomExtractionResponse(
            extracted_symptoms=[
                ExtractedSymptom(
                    symptom="chest pain",
                    severity="severe",
                    duration="30 minutes",
                    location="center"
                )
            ],
            summary="Severe chest pain",
            raw_response="AI response"
        )

        # Mock triage assessment
        mock_triage.return_value = {
            'priority': 'emergency',
            'reasoning': 'Severe chest pain requires immediate attention',
            'confidence': 'high',
            'red_flags': ['chest pain', 'severe pain']
        }

        # Mock recommendations
        mock_recommendations.return_value = {
            'immediate_action': 'Call 911',
            'care_level': 'Emergency Room',
            'timeframe': 'Immediately',
            'warning_signs': ['Worsening pain', 'Difficulty breathing']
        }

        response = self.client.post(
            "/api/v1/triage",
            json={
                "message": "I have severe chest pain for 30 minutes"
            }
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("priority", data)
        self.assertEqual(data["priority"], "emergency")
        self.assertIn("recommendations", data)
        self.assertIn("extracted_symptoms", data)

    @patch('main.triage_service.determine_triage_priority')
    @patch('main.triage_service.get_care_recommendations')
    def test_triage_endpoint_with_presupplied_symptoms(self, mock_recommendations, mock_triage):
        """Test triage endpoint with pre-supplied symptoms"""
        mock_triage.return_value = {
            'priority': 'urgent',
            'reasoning': 'High fever requires medical attention',
            'confidence': 'medium'
        }

        mock_recommendations.return_value = {
            'immediate_action': 'Seek urgent care',
            'care_level': 'Urgent Care',
            'timeframe': 'Within 4 hours'
        }

        response = self.client.post(
            "/api/v1/triage",
            json={
                "message": "I have a high fever",
                "symptoms": [
                    {
                        "symptom": "fever",
                        "severity": "high",
                        "duration": "2 days",
                        "location": None
                    }
                ]
            }
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["priority"], "urgent")

    def test_triage_endpoint_missing_message(self):
        """Test triage endpoint with missing message"""
        response = self.client.post(
            "/api/v1/triage",
            json={}
        )
        self.assertEqual(response.status_code, 422)  # Validation error

    @patch('main.chat_service.extract_symptoms')
    def test_chat_endpoint_error_handling(self, mock_extract):
        """Test chat endpoint error handling"""
        mock_extract.side_effect = Exception("API error")

        response = self.client.post(
            "/api/v1/chat",
            json={"message": "test"}
        )

        self.assertEqual(response.status_code, 500)
        data = response.json()
        self.assertIn("detail", data)


class TestEndToEndFlow(unittest.TestCase):
    """End-to-end workflow tests"""

    def setUp(self):
        """Set up test client"""
        self.client = TestClient(app)

    @patch('main.triage_service.determine_triage_priority')
    @patch('main.triage_service.get_care_recommendations')
    @patch('main.chat_service.extract_symptoms')
    def test_complete_triage_workflow(self, mock_extract, mock_recommendations, mock_triage):
        """Test complete triage workflow from start to finish"""
        from schemas import SymptomExtractionResponse

        # Step 1: Extract symptoms
        mock_extract.return_value = SymptomExtractionResponse(
            extracted_symptoms=[
                ExtractedSymptom(
                    symptom="headache",
                    severity="severe",
                    duration="3 days",
                    location="forehead"
                )
            ],
            summary="Severe headache for 3 days",
            raw_response="AI response"
        )

        # Step 2: Determine triage priority
        mock_triage.return_value = {
            'priority': 'urgent',
            'reasoning': 'Severe persistent headache requires evaluation',
            'confidence': 'high',
            'red_flags': ['severe pain', 'persistent symptoms']
        }

        # Step 3: Get recommendations
        mock_recommendations.return_value = {
            'immediate_action': 'Seek medical attention today',
            'care_level': 'Urgent Care or Primary Care',
            'timeframe': 'Within 6 hours',
            'self_care_tips': ['Rest in dark room', 'Stay hydrated'],
            'warning_signs': ['Worsening pain', 'Vision changes', 'Confusion']
        }

        # Make triage request
        response = self.client.post(
            "/api/v1/triage",
            json={
                "message": "I have a severe headache in my forehead for 3 days"
            }
        )

        # Verify response
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check all required fields
        self.assertEqual(data["priority"], "urgent")
        self.assertIn("reasoning", data)
        self.assertIn("confidence", data)
        self.assertIn("recommendations", data)
        self.assertIn("extracted_symptoms", data)

        # Verify symptoms were extracted
        self.assertEqual(len(data["extracted_symptoms"]), 1)
        self.assertEqual(data["extracted_symptoms"][0]["symptom"], "headache")

        # Verify recommendations
        recommendations = data["recommendations"]
        self.assertIn("immediate_action", recommendations)
        self.assertIn("care_level", recommendations)


class TestAPIValidation(unittest.TestCase):
    """Test API request validation"""

    def setUp(self):
        """Set up test client"""
        self.client = TestClient(app)

    def test_chat_request_validation(self):
        """Test chat request validation"""
        # Missing message
        response = self.client.post("/api/v1/chat", json={})
        self.assertEqual(response.status_code, 422)

        # Invalid conversation history
        response = self.client.post(
            "/api/v1/chat",
            json={
                "message": "test",
                "conversation_history": "not a list"
            }
        )
        self.assertEqual(response.status_code, 422)

    def test_symptom_extraction_validation(self):
        """Test symptom extraction validation"""
        # Missing text
        response = self.client.post("/api/v1/extract-symptoms", json={})
        self.assertEqual(response.status_code, 422)

    def test_triage_request_validation(self):
        """Test triage request validation"""
        # Missing message
        response = self.client.post("/api/v1/triage", json={})
        self.assertEqual(response.status_code, 422)


if __name__ == '__main__':
    unittest.main()
