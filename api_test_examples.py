#!/usr/bin/env python3
"""
FHIR Medical Triage System - API Test Examples (Python)
Server: http://localhost:8002

This script provides example API calls using Python requests library.
Install requirements: pip install requests

Usage:
  python api_test_examples.py              # Run all tests
  python api_test_examples.py --health     # Run only health checks
  python api_test_examples.py --patient    # Run patient data tests
  python api_test_examples.py --chat       # Run chat tests
  python api_test_examples.py --triage     # Run triage tests
"""

import requests
import json
import argparse
from typing import Dict, Any, Optional, List


BASE_URL = "http://localhost:8002"


def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60 + "\n")


def print_test(test_name: str):
    """Print a formatted test name"""
    print(f"\n{test_name}")
    print("-" * 60)


def make_request(method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
    """Make HTTP request and print response"""
    url = f"{BASE_URL}{endpoint}"

    try:
        if method.upper() == "GET":
            response = requests.get(url, headers={"Content-Type": "application/json"})
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        else:
            print(f"Unsupported method: {method}")
            return None

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"Response:\n{json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Error: {response.text}")
            return None

    except requests.exceptions.ConnectionError:
        print(f"ERROR: Could not connect to {BASE_URL}")
        print("Make sure the server is running!")
        return None
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return None


def test_health_checks():
    """Test health check endpoints"""
    print_section("1. Health Check Endpoints")

    print_test("a) Root Health Check")
    make_request("GET", "/")

    print_test("b) Health Check")
    make_request("GET", "/health")


def test_patient_data(patient_id: str = "example-patient-123"):
    """Test patient data endpoints"""
    print_section("2. Patient Data Endpoints")

    print_test("a) Get Complete Patient History")
    make_request("GET", f"/api/v1/patients/{patient_id}")

    print_test("b) Get Patient Demographics")
    make_request("GET", f"/api/v1/patients/{patient_id}/demographics")

    print_test("c) Get Patient Conditions")
    make_request("GET", f"/api/v1/patients/{patient_id}/conditions")

    print_test("d) Get Patient Medications")
    make_request("GET", f"/api/v1/patients/{patient_id}/medications")

    print_test("e) Get Patient Allergies")
    make_request("GET", f"/api/v1/patients/{patient_id}/allergies")


def test_chat_endpoint():
    """Test chat endpoint"""
    print_section("3. Chat Endpoint")

    print_test("a) Simple Chat (No Patient Context)")
    make_request("POST", "/api/v1/chat", {
        "message": "I have been experiencing severe headaches for the past 3 days, along with some nausea."
    })

    print_test("b) Chat with Patient Context")
    make_request("POST", "/api/v1/chat", {
        "message": "I have a fever of 101.5°F and my throat hurts when I swallow.",
        "patient_id": "example-patient-123"
    })

    print_test("c) Chat with Conversation History")
    make_request("POST", "/api/v1/chat", {
        "message": "The pain gets worse when I cough.",
        "patient_id": "example-patient-123",
        "conversation_history": [
            {
                "role": "user",
                "content": "I have chest pain on the left side."
            },
            {
                "role": "assistant",
                "content": "I understand you are experiencing chest pain on the left side. Can you tell me more about when it started and if anything makes it worse?"
            }
        ]
    })


def test_symptom_extraction():
    """Test symptom extraction endpoint"""
    print_section("4. Symptom Extraction Endpoint")

    print_test("a) Extract Symptoms (No Patient Context)")
    make_request("POST", "/api/v1/extract-symptoms", {
        "text": "Patient reports severe abdominal pain in the lower right quadrant that started yesterday evening. Pain is sharp and constant, rated 8/10. Also experiencing nausea and loss of appetite. Temperature is slightly elevated at 99.8°F."
    })

    print_test("b) Extract Symptoms with Patient Context")
    make_request("POST", "/api/v1/extract-symptoms", {
        "text": "I have been feeling dizzy for the past week, especially when standing up. Also experiencing occasional heart palpitations.",
        "patient_id": "example-patient-123"
    })


def test_triage_endpoint():
    """Test triage endpoint"""
    print_section("5. Triage Endpoint")

    print_test("a) Emergency Triage (Chest Pain)")
    make_request("POST", "/api/v1/triage", {
        "message": "I have crushing chest pain that radiates to my left arm. I am sweating profusely and feel short of breath. The pain started 20 minutes ago."
    })

    print_test("b) Urgent Triage with Patient Context")
    make_request("POST", "/api/v1/triage", {
        "message": "High fever of 103.5°F for 2 days, severe headache, stiff neck, and sensitivity to light.",
        "patient_id": "example-patient-123"
    })

    print_test("c) Non-Urgent Triage")
    make_request("POST", "/api/v1/triage", {
        "message": "I have had a mild runny nose and occasional sneezing for the past 2 days. No fever or other symptoms."
    })

    print_test("d) Triage with Pre-extracted Symptoms")
    make_request("POST", "/api/v1/triage", {
        "message": "Patient experiencing these symptoms",
        "patient_id": "example-patient-123",
        "symptoms": [
            {
                "symptom": "fever",
                "severity": "moderate",
                "duration": "2 days",
                "location": None
            },
            {
                "symptom": "cough",
                "severity": "mild",
                "duration": "3 days",
                "location": "chest"
            }
        ]
    })


def test_additional_scenarios():
    """Test additional complex scenarios"""
    print_section("6. Additional Test Scenarios")

    print_test("a) Complex Symptom Description")
    make_request("POST", "/api/v1/triage", {
        "message": "I am a 45-year-old with diabetes. For the past 5 days, I have had increasing pain and swelling in my right foot. The skin is red and warm to touch. I also have a fever of 100.8°F and feel generally unwell."
    })

    print_test("b) Pediatric Scenario")
    make_request("POST", "/api/v1/triage", {
        "message": "My 4-year-old daughter has had diarrhea 6 times today and vomited twice. She seems lethargic and has not been drinking much. No fever."
    })

    print_test("c) Mental Health Scenario")
    make_request("POST", "/api/v1/chat", {
        "message": "I have been feeling very anxious lately, having trouble sleeping, and experiencing panic attacks about 2-3 times per week."
    })

    print_test("d) Multiple Chronic Conditions")
    make_request("POST", "/api/v1/extract-symptoms", {
        "text": "Patient with history of hypertension and COPD presents with increased shortness of breath over the past 3 days, productive cough with green sputum, and ankle swelling. Blood pressure today was 165/95."
    })


def main():
    """Main function to run tests"""
    parser = argparse.ArgumentParser(description="Test FHIR Medical Triage API")
    parser.add_argument("--health", action="store_true", help="Run health check tests")
    parser.add_argument("--patient", action="store_true", help="Run patient data tests")
    parser.add_argument("--chat", action="store_true", help="Run chat tests")
    parser.add_argument("--symptoms", action="store_true", help="Run symptom extraction tests")
    parser.add_argument("--triage", action="store_true", help="Run triage tests")
    parser.add_argument("--additional", action="store_true", help="Run additional scenario tests")
    parser.add_argument("--patient-id", type=str, default="example-patient-123",
                       help="Patient ID to use for testing")

    args = parser.parse_args()

    # If no specific test selected, run all
    run_all = not any([args.health, args.patient, args.chat, args.symptoms,
                       args.triage, args.additional])

    print("\n" + "=" * 60)
    print("  FHIR Medical Triage System - API Test Suite")
    print("=" * 60)
    print(f"  Base URL: {BASE_URL}")
    print("=" * 60)

    if run_all or args.health:
        test_health_checks()

    if run_all or args.patient:
        test_patient_data(args.patient_id)

    if run_all or args.chat:
        test_chat_endpoint()

    if run_all or args.symptoms:
        test_symptom_extraction()

    if run_all or args.triage:
        test_triage_endpoint()

    if run_all or args.additional:
        test_additional_scenarios()

    print("\n" + "=" * 60)
    print("  Test Suite Completed!")
    print("=" * 60)
    print("\nNote: Replace 'example-patient-123' with actual patient IDs")
    print("      from your FHIR server for real testing.\n")


if __name__ == "__main__":
    main()
