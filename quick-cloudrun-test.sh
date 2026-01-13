#!/bin/bash

# Quick Cloud Run Deployment Test
# Tests if the service is accessible and working

BASE_URL="https://fhir-chat-api-820444130598.us-east5.run.app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Quick Cloud Run Deployment Test${NC}"
echo -e "${BLUE}===========================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health Check: SUCCESS${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Health Check: FAILED (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    echo -e "\n${RED}Service may not be publicly accessible yet.${NC}"
    echo -e "${YELLOW}Please set IAM policy with:${NC}"
    echo "gcloud run services add-iam-policy-binding fhir-chat-api \\"
    echo "  --region=us-east5 \\"
    echo "  --member=allUsers \\"
    echo "  --role=roles/run.invoker"
    exit 1
fi
echo ""

# Test 2: Llama API Test
echo -e "${YELLOW}2. Testing Llama API Endpoint...${NC}"
LLAMA_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/llama/test")
HTTP_CODE=$(echo "$LLAMA_RESPONSE" | tail -n1)
BODY=$(echo "$LLAMA_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Llama API Test: SUCCESS${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Llama API Test: FAILED (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Test 3: Simple Chat with Patient 21003 (Miguel - Asthma)
echo -e "${YELLOW}3. Testing Chat Endpoint with Patient 21003 (Miguel)...${NC}"
CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21003",
    "message": "What medications am I currently taking?"
  }')
HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n1)
BODY=$(echo "$CHAT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Chat Test: SUCCESS${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Chat Test: FAILED (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi
echo ""

# Summary
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "Service URL: ${GREEN}$BASE_URL${NC}"
echo ""
echo "Next steps:"
echo "1. If all tests passed, run: ${GREEN}./test-cloudrun-deployment.sh${NC}"
echo "2. Update your frontend to use: ${GREEN}$BASE_URL${NC}"
echo "3. Test with different patient IDs from ALL_TEST_PATIENTS.md"
echo ""
echo -e "${YELLOW}Patient IDs to test:${NC}"
echo "  21003 - Miguel (Asthma, young adult)"
echo "  21006 - Sarah (Type 1 Diabetes + Hypothyroid)"
echo "  21011 - Thanh (Heart Failure, geriatric)"
echo "  21043 - Emily (Pediatric, severe cashew allergy)"
echo "  21033 - Jennifer (HIGH penicillin allergy)"
echo "  21058 - Carlos (CKD + Diabetes + HTN)"
