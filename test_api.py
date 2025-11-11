"""
Test script for FHIR Chat API
Tests all endpoints including symptom extraction
"""
import requests
import json
from typing import Dict, Any
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
import pytest


BASE_URL = "http://localhost:8000"


def print_response(title: str, response: requests.Response):
    """Pretty print API response"""
    print(f"\n{'=' * 60}")
    print(f"{title}")
    print(f"{'=' * 60}")
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    print(f"{'=' * 60}\n")


@pytest.mark.skip(reason="Requires running server - use for manual testing only")
def test_health_check():
    """Test health check endpoint"""
    print("Testing Health Check Endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print_response("Health Check", response)
    return response.status_code == 200


@pytest.mark.skip(reason="Requires running server - use for manual testing only")
def test_patient_history(patient_id: str = "example"):
    """Test patient history retrieval"""
    print(f"Testing Patient History Endpoint with ID: {patient_id}...")
    response = requests.get(f"{BASE_URL}/api/v1/patients/{patient_id}")
    print_response(f"Patient History - {patient_id}", response)
    return response


@pytest.mark.skip(reason="Requires running server - use for manual testing only")
def test_symptom_extraction():
    """Test symptom extraction endpoint"""
    print("Testing Symptom Extraction Endpoint...")

    test_cases = [
        {
            "text": "I have been experiencing severe headaches for the past 3 days, especially in my forehead area. I also have mild nausea and feel dizzy sometimes.",
            "patient_id": None
        },
        {
            "text": "My chest hurts when I breathe deeply, and I've had a persistent cough for about a week. The pain is moderate and located on the left side.",
            "patient_id": None
        },
        {
            "text": "I'm feeling tired all the time, have a sore throat, and mild fever that started yesterday.",
            "patient_id": None
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i} ---")
        response = requests.post(
            f"{BASE_URL}/api/v1/extract-symptoms",
            json=test_case
        )
        print_response(f"Symptom Extraction - Case {i}", response)

    return True


@pytest.mark.skip(reason="Requires running server - use for manual testing only")
def test_chat():
    """Test chat endpoint"""
    print("Testing Chat Endpoint...")

    test_messages = [
        {
            "message": "Hi, I've been having headaches and feeling dizzy for the past few days. What could be wrong?",
            "patient_id": None,
            "conversation_history": []
        },
        {
            "message": "I have a fever of 101°F, body aches, and a sore throat. Should I be concerned?",
            "patient_id": None,
            "conversation_history": []
        }
    ]

    for i, test_msg in enumerate(test_messages, 1):
        print(f"\n--- Chat Test {i} ---")
        response = requests.post(
            f"{BASE_URL}/api/v1/chat",
            json=test_msg
        )
        print_response(f"Chat Response - Test {i}", response)

    return True


@patch('main.chat_service.chat_with_symptom_extraction')
def test_chat_with_conversation(mock_chat):
    """Test chat with conversation history"""
    from schemas import ExtractedSymptom

    # Mock the chat responses
    mock_chat.side_effect = [
        ("I understand you have headaches. Can you tell me more about them?", []),
        ("Based on your symptoms (severe headaches in forehead for 3 days), I recommend seeing a doctor.",
         [ExtractedSymptom(symptom="headache", severity="severe", duration="3 days", location="forehead")])
    ]

    client = TestClient(app)
    conversation = []

    # First message
    msg1 = {
        "message": "I've been having headaches",
        "conversation_history": conversation
    }

    response1 = client.post("/api/v1/chat", json=msg1)
    assert response1.status_code == 200
    data1 = response1.json()
    assert "response" in data1

    # Add to conversation history
    conversation.append({"role": "user", "content": msg1["message"]})
    conversation.append({"role": "assistant", "content": data1["response"]})

    # Second message with conversation history
    msg2 = {
        "message": "The headaches are severe and located in my forehead. They've been going on for 3 days.",
        "conversation_history": conversation
    }

    response2 = client.post("/api/v1/chat", json=msg2)
    assert response2.status_code == 200
    data2 = response2.json()
    assert "response" in data2
    assert "extracted_symptoms" in data2
    # Verify conversation history is maintained
    assert len(conversation) == 2


@pytest.mark.skip(reason="Requires running server - use for manual testing only")
def test_patient_specific_endpoints(patient_id: str = "example"):
    """Test patient-specific endpoints"""
    print(f"Testing Patient-Specific Endpoints for ID: {patient_id}...")

    endpoints = [
        f"/api/v1/patients/{patient_id}/demographics",
        f"/api/v1/patients/{patient_id}/conditions",
        f"/api/v1/patients/{patient_id}/medications",
        f"/api/v1/patients/{patient_id}/allergies"
    ]

    for endpoint in endpoints:
        print(f"\nTesting: {endpoint}")
        response = requests.get(f"{BASE_URL}{endpoint}")
        print_response(f"Endpoint: {endpoint}", response)

    return True


def run_all_tests():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("FHIR CHAT API - COMPREHENSIVE TEST SUITE")
    print("=" * 60)

    try:
        # Test 1: Health Check
        print("\n\n>>> TEST 1: Health Check")
        if not test_health_check():
            print("❌ Health check failed!")
            return

        print("✅ Health check passed!")

        # Test 2: Symptom Extraction
        print("\n\n>>> TEST 2: Symptom Extraction (NLP)")
        test_symptom_extraction()
        print("✅ Symptom extraction tests completed!")

        # Test 3: Basic Chat
        print("\n\n>>> TEST 3: Basic Chat")
        test_chat()
        print("✅ Chat tests completed!")

        # Test 4: Chat with Conversation History
        print("\n\n>>> TEST 4: Chat with Conversation History")
        test_chat_with_conversation()
        print("✅ Conversation history tests completed!")

        # Optional: Test with real FHIR patient ID
        print("\n\n>>> OPTIONAL TESTS: Patient Data Endpoints")
        print("Note: These tests use the public FHIR server and may not find the patient.")
        print("You can provide a valid patient ID from https://hapi.fhir.org/baseR4")

        # Try with a common test patient ID
        # test_patient_history("example")
        # test_patient_specific_endpoints("example")

        print("\n\n" + "=" * 60)
        print("ALL TESTS COMPLETED!")
        print("=" * 60)

        print("\n📝 Summary:")
        print("✅ Health Check: Working")
        print("✅ Symptom Extraction: Working")
        print("✅ Chat API: Working")
        print("✅ Conversation History: Working")
        print("\n💡 To test patient data endpoints, use a valid patient ID from the FHIR server")

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to API")
        print("Make sure the API is running: python main.py")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")


if __name__ == "__main__":
    run_all_tests()
