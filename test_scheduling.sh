#!/bin/bash

echo "=== Testing Appointment Scheduling ==="

# Step 1: Search providers for Cardiology (specialty_id = 2)
echo "1. Searching cardiologists in Salt Lake Valley..."
curl -s "http://localhost:8002/api/v1/providers/search?specialty_id=2&region=Salt%20Lake%20Valley&accepts_new_patients=true" | jq .

echo ""
echo "2. Getting smart appointment recommendations for urgent cardiology..."
curl -s -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 2,
    "triage_priority": "urgent",
    "patient_region": "Salt Lake Valley",
    "preferred_date_range": {
      "start": "2025-12-13",
      "end": "2025-12-20"
    }
  }' | jq .

echo ""
echo "3. Getting recommendations for routine dermatology (specialty_id = 4)..."
curl -s -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 4,
    "triage_priority": "non-urgent",
    "patient_region": "Salt Lake Valley"
  }' | jq .

echo ""
echo "=== Scheduling Test Complete ==="
