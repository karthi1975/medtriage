#!/bin/bash

# FHIR Medical Triage System - API Test Examples
# Server: http://localhost:8002
#
# Usage: You can run individual commands by copying them or execute this entire script
# Make sure the server is running before executing these tests

BASE_URL="http://localhost:8002"

echo "=================================================="
echo "FHIR Medical Triage System - API Test Examples"
echo "=================================================="
echo ""

# ================================================
# 1. HEALTH CHECK ENDPOINTS
# ================================================

echo "1. Testing Health Check Endpoints"
echo "--------------------------------------------------"

# Root endpoint
echo "a) Root Health Check:"
curl -X GET "${BASE_URL}/" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Health endpoint
echo "b) Health Check:"
curl -X GET "${BASE_URL}/health" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n\n"

# ================================================
# 2. PATIENT DATA ENDPOINTS
# ================================================

echo "2. Testing Patient Data Endpoints"
echo "--------------------------------------------------"

# Example patient ID - replace with actual patient ID from your FHIR server
PATIENT_ID="example-patient-123"

# Get complete patient history
echo "a) Get Complete Patient History:"
curl -X GET "${BASE_URL}/api/v1/patients/${PATIENT_ID}" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Get patient demographics only
echo "b) Get Patient Demographics:"
curl -X GET "${BASE_URL}/api/v1/patients/${PATIENT_ID}/demographics" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Get patient conditions
echo "c) Get Patient Conditions:"
curl -X GET "${BASE_URL}/api/v1/patients/${PATIENT_ID}/conditions" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Get patient medications
echo "d) Get Patient Medications:"
curl -X GET "${BASE_URL}/api/v1/patients/${PATIENT_ID}/medications" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Get patient allergies
echo "e) Get Patient Allergies:"
curl -X GET "${BASE_URL}/api/v1/patients/${PATIENT_ID}/allergies" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n\n"

# ================================================
# 3. CHAT ENDPOINT
# ================================================

echo "3. Testing Chat Endpoint"
echo "--------------------------------------------------"

# Simple chat without patient context
echo "a) Simple Chat (No Patient Context):"
curl -X POST "${BASE_URL}/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been experiencing severe headaches for the past 3 days, along with some nausea."
  }' | jq '.'
echo -e "\n"

# Chat with patient context
echo "b) Chat with Patient Context:"
curl -X POST "${BASE_URL}/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a fever of 101.5°F and my throat hurts when I swallow.",
    "patient_id": "example-patient-123"
  }' | jq '.'
echo -e "\n"

# Chat with conversation history
echo "c) Chat with Conversation History:"
curl -X POST "${BASE_URL}/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
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
  }' | jq '.'
echo -e "\n\n"

# ================================================
# 4. SYMPTOM EXTRACTION ENDPOINT
# ================================================

echo "4. Testing Symptom Extraction Endpoint"
echo "--------------------------------------------------"

# Extract symptoms from text without patient context
echo "a) Extract Symptoms (No Patient Context):"
curl -X POST "${BASE_URL}/api/v1/extract-symptoms" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Patient reports severe abdominal pain in the lower right quadrant that started yesterday evening. Pain is sharp and constant, rated 8/10. Also experiencing nausea and loss of appetite. Temperature is slightly elevated at 99.8°F."
  }' | jq '.'
echo -e "\n"

# Extract symptoms with patient context
echo "b) Extract Symptoms with Patient Context:"
curl -X POST "${BASE_URL}/api/v1/extract-symptoms" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I have been feeling dizzy for the past week, especially when standing up. Also experiencing occasional heart palpitations.",
    "patient_id": "example-patient-123"
  }' | jq '.'
echo -e "\n\n"

# ================================================
# 5. TRIAGE ENDPOINT
# ================================================

echo "5. Testing Triage Endpoint"
echo "--------------------------------------------------"

# Emergency scenario
echo "a) Emergency Triage (Chest Pain):"
curl -X POST "${BASE_URL}/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have crushing chest pain that radiates to my left arm. I am sweating profusely and feel short of breath. The pain started 20 minutes ago."
  }' | jq '.'
echo -e "\n"

# Urgent scenario with patient context
echo "b) Urgent Triage with Patient Context:"
curl -X POST "${BASE_URL}/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "High fever of 103.5°F for 2 days, severe headache, stiff neck, and sensitivity to light.",
    "patient_id": "example-patient-123"
  }' | jq '.'
echo -e "\n"

# Non-urgent scenario
echo "c) Non-Urgent Triage:"
curl -X POST "${BASE_URL}/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have had a mild runny nose and occasional sneezing for the past 2 days. No fever or other symptoms."
  }' | jq '.'
echo -e "\n"

# Triage with pre-extracted symptoms
echo "d) Triage with Pre-extracted Symptoms:"
curl -X POST "${BASE_URL}/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Patient experiencing these symptoms",
    "patient_id": "example-patient-123",
    "symptoms": [
      {
        "symptom": "fever",
        "severity": "moderate",
        "duration": "2 days",
        "location": null
      },
      {
        "symptom": "cough",
        "severity": "mild",
        "duration": "3 days",
        "location": "chest"
      }
    ]
  }' | jq '.'
echo -e "\n\n"

# ================================================
# 6. ADDITIONAL TEST SCENARIOS
# ================================================

echo "6. Additional Test Scenarios"
echo "--------------------------------------------------"

# Complex symptom description
echo "a) Complex Symptom Description:"
curl -X POST "${BASE_URL}/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am a 45-year-old with diabetes. For the past 5 days, I have had increasing pain and swelling in my right foot. The skin is red and warm to touch. I also have a fever of 100.8°F and feel generally unwell."
  }' | jq '.'
echo -e "\n"

# Pediatric scenario
echo "b) Pediatric Scenario:"
curl -X POST "${BASE_URL}/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My 4-year-old daughter has had diarrhea 6 times today and vomited twice. She seems lethargic and has not been drinking much. No fever."
  }' | jq '.'
echo -e "\n"

# Mental health scenario
echo "c) Mental Health Scenario:"
curl -X POST "${BASE_URL}/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been feeling very anxious lately, having trouble sleeping, and experiencing panic attacks about 2-3 times per week."
  }' | jq '.'
echo -e "\n"

# Multiple conditions
echo "d) Multiple Chronic Conditions:"
curl -X POST "${BASE_URL}/api/v1/extract-symptoms" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Patient with history of hypertension and COPD presents with increased shortness of breath over the past 3 days, productive cough with green sputum, and ankle swelling. Blood pressure today was 165/95."
  }' | jq '.'
echo -e "\n\n"

echo "=================================================="
echo "Test Examples Completed!"
echo "=================================================="
echo ""
echo "Note: Replace 'example-patient-123' with actual patient IDs from your FHIR server"
echo "Install 'jq' for formatted JSON output: brew install jq (macOS) or apt-get install jq (Linux)"
echo ""
