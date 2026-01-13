#!/bin/bash

# Test script for Cloud Run deployed FHIR Chat API
# Cloud Run URL: https://fhir-chat-api-820444130598.us-east5.run.app

BASE_URL="https://fhir-chat-api-820444130598.us-east5.run.app"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing FHIR Chat API - Cloud Run${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
echo "GET $BASE_URL/health"
curl -s "$BASE_URL/health" | jq .
echo -e "\n"

# Test 2: Llama API Test
echo -e "${YELLOW}Test 2: Llama API Test Endpoint${NC}"
echo "GET $BASE_URL/llama/test"
curl -s "$BASE_URL/llama/test" | jq .
echo -e "\n"

# Test 3: Simple Chat - Young Asthma Patient (Miguel)
echo -e "${YELLOW}Test 3: Chat with Young Asthma Patient (Miguel - ID: 21003)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21003",
    "message": "I am having chest pain and shortness of breath. What should I do?"
  }' | jq .
echo -e "\n"

# Test 4: Diabetic Patient with Multiple Conditions (Sarah)
echo -e "${YELLOW}Test 4: Chat with Type 1 Diabetic Patient (Sarah - ID: 21006)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21006",
    "message": "I have been feeling very tired and my blood sugar has been high. What are my medications?"
  }' | jq .
echo -e "\n"

# Test 5: Geriatric Complex Patient (Thanh - Heart Failure)
echo -e "${YELLOW}Test 5: Chat with Complex Cardiac Patient (Thanh - ID: 21011)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21011",
    "message": "I am experiencing swelling in my legs and difficulty breathing. Can you review my heart medications?"
  }' | jq .
echo -e "\n"

# Test 6: Recent MI Patient (Robert)
echo -e "${YELLOW}Test 6: Chat with Recent MI Patient (Robert - ID: 21018)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21018",
    "message": "What medications am I taking for my heart attack? Should I be concerned about any side effects?"
  }' | jq .
echo -e "\n"

# Test 7: Pediatric Patient with Severe Allergy (Emily)
echo -e "${YELLOW}Test 7: Chat with Pediatric Patient - HIGH Cashew Allergy (Emily - ID: 21043)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21043",
    "message": "I am having trouble breathing and wheezing. What should my mom do?"
  }' | jq .
echo -e "\n"

# Test 8: Patient with HIGH Severity Penicillin Allergy (Jennifer)
echo -e "${YELLOW}Test 8: Chat with HIGH Penicillin Allergy Patient (Jennifer - ID: 21033)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21033",
    "message": "My arm fracture wound looks infected. What antibiotics can I safely take?"
  }' | jq .
echo -e "\n"

# Test 9: Complex CKD + Diabetes + HTN Patient (Carlos)
echo -e "${YELLOW}Test 9: Chat with CKD + Diabetes + HTN Patient (Carlos - ID: 21058)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21058",
    "message": "I am feeling very fatigued and have swelling. Can you explain all my conditions and medications?"
  }' | jq .
echo -e "\n"

# Test 10: Healthy Patient Baseline (Christopher)
echo -e "${YELLOW}Test 10: Chat with Healthy Patient (Christopher - ID: 21042)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21042",
    "message": "I am here for my annual checkup. What preventive care should I consider?"
  }' | jq .
echo -e "\n"

# Test 11: A-fib Patient on Anticoagulation (Elena)
echo -e "${YELLOW}Test 11: Chat with A-fib Patient on Warfarin (Elena - ID: 21025)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21025",
    "message": "I am on blood thinners. What foods should I avoid and what are the risks?"
  }' | jq .
echo -e "\n"

# Test 12: COPD + Asthma Patient (Dorothy)
echo -e "${YELLOW}Test 12: Chat with COPD + Asthma Patient (Dorothy - ID: 21037)${NC}"
echo "POST $BASE_URL/api/v1/chat"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21037",
    "message": "I am having increased difficulty breathing and coughing. What inhalers am I using?"
  }' | jq .
echo -e "\n"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All Tests Completed!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Test Summary:${NC}"
echo "1. Health Check - System Status"
echo "2. Llama API Test - Authentication & LLM Access"
echo "3. Young Asthma Patient - Emergency Symptoms"
echo "4. Type 1 Diabetic - Multiple Conditions"
echo "5. Complex Cardiac Patient - Geriatric, Heart Failure"
echo "6. Recent MI Patient - Cardiac Rehabilitation"
echo "7. Pediatric Patient - Severe Food Allergy"
echo "8. HIGH Penicillin Allergy - Drug Safety"
echo "9. Complex Multi-System Patient - CKD+DM+HTN"
echo "10. Healthy Patient - Preventive Care"
echo "11. A-fib Patient - Anticoagulation Management"
echo "12. COPD + Asthma - Pulmonary Disease"
echo -e "\n"

echo -e "${BLUE}Key Test Coverage:${NC}"
echo "✓ Pediatric (1 patient)"
echo "✓ Geriatric (2 patients)"
echo "✓ Drug Allergies - HIGH severity (1 patient)"
echo "✓ Food Allergies - HIGH severity (1 patient)"
echo "✓ Simple Cases (1 patient)"
echo "✓ Complex Cases (3 patients)"
echo "✓ Cardiology (3 patients)"
echo "✓ Pulmonology (2 patients)"
echo "✓ Endocrinology (2 patients)"
echo "✓ Nephrology (1 patient)"
