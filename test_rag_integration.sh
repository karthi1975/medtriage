#!/bin/bash

echo "=== Testing RAG-Enhanced Triage System ==="
echo "Note: RAG is integrated into the triage endpoint"
echo ""

echo "Test 1: Cardiac symptoms (tests medical knowledge)"
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe chest pain radiating to my left arm and jaw, with shortness of breath and sweating"
  }' | jq .

echo ""
echo "Test 2: Neurological symptoms"
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have sudden severe headache, vision problems, and numbness on one side of my face"
  }' | jq .

echo ""
echo "Test 3: Routine dermatology issue"
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a skin rash on my arms that has been there for a week"
  }' | jq .

echo ""
echo "=== RAG Triage Test Complete ==="
