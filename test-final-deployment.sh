#!/bin/bash

echo "========================================="
echo "Final Deployment Test - After Cloud SQL Fix"
echo "========================================="
echo ""

echo "1. Frontend Health:"
curl -s https://medichat-frontend-820444130598.us-east5.run.app/health
echo ""
echo ""

echo "2. Backend Health:"
curl -s https://fhir-chat-api-820444130598.us-east5.run.app/health
echo ""
echo ""

echo "3. Testing API Performance:"
echo "   Facilities:"
curl -o /dev/null -s -w "      Response time: %{time_total}s (HTTP %{http_code})\n" https://fhir-chat-api-820444130598.us-east5.run.app/api/v1/facilities

echo "   Specialties:"
curl -o /dev/null -s -w "      Response time: %{time_total}s (HTTP %{http_code})\n" https://fhir-chat-api-820444130598.us-east5.run.app/api/v1/specialties

echo "   Llama Test:"
curl -o /dev/null -s -w "      Response time: %{time_total}s (HTTP %{http_code})\n" https://fhir-chat-api-820444130598.us-east5.run.app/llama/test

echo "   Patient Search:"
curl -o /dev/null -s -w "      Response time: %{time_total}s (HTTP %{http_code})\n" -X POST https://fhir-chat-api-820444130598.us-east5.run.app/api/v1/patients/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","search_type":"auto"}'

echo ""
echo "========================================="
echo "Test Complete!"
echo "========================================="
echo ""
echo "✅ If all response times are < 1 second, the issue is FIXED!"
echo ""
