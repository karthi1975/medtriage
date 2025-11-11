#!/bin/bash

echo "==============================================="
echo "RAG Testing Script"
echo "==============================================="
echo ""

# Test 1: Thunderclap Headache
echo "TEST 1: Thunderclap Headache (should retrieve Headache protocol)"
echo "-----------------------------------------------"
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have the worst headache of my life. It came on suddenly, like a thunderclap, and reached maximum intensity within seconds. I am also feeling nauseous and have a stiff neck.",
    "patient_id": "47936371"
  }' | jq .

echo ""
echo ""

# Test 2: Chest Pain (ACS)
echo "TEST 2: Chest Pain with ACS Red Flags (should retrieve Chest Pain protocol)"
echo "-----------------------------------------------"
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am having crushing chest pain that is radiating to my left arm and jaw. I am sweating profusely and feel nauseous. I am 55 years old with diabetes and high blood pressure.",
    "patient_id": "47936371"
  }' | jq .

echo ""
echo ""

# Test 3: FAST Stroke Symptoms
echo "TEST 3: FAST Stroke Symptoms (should retrieve Stroke protocol)"
echo "-----------------------------------------------"
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My wife face is drooping on one side, her arm is weak when she tries to lift it, and she is having trouble speaking clearly. This started about 30 minutes ago."
  }' | jq .

echo ""
echo ""

# Test 4: Pediatric Fever
echo "TEST 4: Pediatric Fever (should retrieve Fever + Pediatric protocols)"
echo "-----------------------------------------------"
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My 2-month-old baby has a fever of 100.5°F. She seems a bit fussy but is still feeding."
  }' | jq .

echo ""
echo ""

# Test 5: Abdominal Pain
echo "TEST 5: Appendicitis Red Flags (should retrieve Abdominal Pain protocol)"
echo "-----------------------------------------------"
curl -X POST "http://localhost:8002/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe abdominal pain that started around my belly button and moved to my lower right side. I have had nausea, cannot eat, and have a low-grade fever."
  }' | jq .

echo ""
echo "==============================================="
echo "All tests complete!"
echo "Check backend.log for RAG retrieval details"
echo "==============================================="
