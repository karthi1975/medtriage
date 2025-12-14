#!/bin/bash
set -e

echo "=== Testing Complete Triage Flow ==="

# Step 1: Health check
echo "1. Health check..."
curl -s http://localhost:8002/health | jq .

# Step 2: Get a real patient
echo "2. Getting patient data..."
PATIENT_ID=$(curl -s "http://localhost:8081/fhir/Patient?_count=1" | jq -r '.entry[0].resource.id')
echo "Patient ID: $PATIENT_ID"

# Step 3: Get patient history
echo "3. Fetching patient history..."
curl -s "http://localhost:8002/api/v1/patients/${PATIENT_ID}" | jq .

# Step 4: Perform triage
echo "4. Performing triage..."
curl -s -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"I have chest pain and shortness of breath for 2 hours. It's very severe.\",
    \"patient_id\": \"${PATIENT_ID}\"
  }" | jq .

# Step 5: Search providers (Cardiology = specialty_id 2)
echo "5. Searching for cardiologists in Salt Lake Valley..."
curl -s "http://localhost:8002/api/v1/providers/search?specialty_id=2&region=Salt%20Lake%20Valley" | jq .

echo "=== Test Complete ==="
