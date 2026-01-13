#!/bin/bash

echo "========================================"
echo "Testing API Performance"
echo "========================================"
echo ""

echo "Test 1: Backend Health Check"
time curl -s https://fhir-chat-api-820444130598.us-east5.run.app/health
echo ""
echo ""

echo "Test 2: Facilities Endpoint"
time curl -s https://fhir-chat-api-820444130598.us-east5.run.app/api/v1/facilities | head -5
echo ""
echo ""

echo "Test 3: Specialties Endpoint"
time curl -s https://fhir-chat-api-820444130598.us-east5.run.app/api/v1/specialties | head -5
echo ""
echo ""

echo "Test 4: Patient Search"
time curl -s -X POST https://fhir-chat-api-820444130598.us-east5.run.app/api/v1/patients/search \
  -H "Content-Type: application/json" \
  -d '{"query":"21003","search_type":"auto"}' | head -10
echo ""
echo ""

echo "Test 5: Llama Test"
time curl -s https://fhir-chat-api-820444130598.us-east5.run.app/llama/test | head -5
echo ""
echo ""

echo "========================================"
echo "Tests Complete"
echo "========================================"
