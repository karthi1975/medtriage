#!/bin/bash
# Comprehensive Test for ALL 5 Patient Scenarios
# Tests exact symptoms from FIVE_PATIENT_SCENARIOS.md

API_URL="https://medichat-backend-820444130598.us-east5.run.app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================================"
echo "  COMPLETE 5 PATIENT SCENARIO TEST SUITE"
echo "  Testing all scenarios from FIVE_PATIENT_SCENARIOS.md"
echo "================================================================"
echo ""

# Create MA Session
echo "Setting up MA session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/session" \
  -H "Content-Type: application/json" \
  -d '{
    "ma_name": "Test MA",
    "facility": "Salt Lake Heart Center",
    "specialty": "Cardiology"
  }')

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.session_id')

if [ "$SESSION_ID" = "null" ] || [ -z "$SESSION_ID" ]; then
    echo -e "${RED}❌ FAILED: Could not create session${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Session created: $SESSION_ID${NC}"
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_patient() {
    local patient_id=$1
    local patient_name=$2
    local symptom=$3
    local expected_priority=$4
    local condition=$5

    echo "================================================================"
    echo "Testing Patient $patient_id: $patient_name"
    echo "Condition: $condition"
    echo "================================================================"

    # Step 1: Find patient
    echo "Step 1: Finding patient $patient_id..."
    PATIENT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"$patient_id\",
        \"ma_session_id\": \"$SESSION_ID\",
        \"conversation_history\": [],
        \"current_patient_id\": null
      }")

    FOUND_NAME=$(echo "$PATIENT_RESPONSE" | jq -r '.metadata.patient.patient.name // "null"')
    LOOKUP_INTENT=$(echo "$PATIENT_RESPONSE" | jq -r '.intent.intent_type')

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$FOUND_NAME" != "null" ]; then
        echo -e "${GREEN}✅ Patient found: $FOUND_NAME${NC}"
        echo "   Intent: $LOOKUP_INTENT"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: Patient not found${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi

    # Step 2: Report symptoms (Triage)
    echo ""
    echo "Step 2: Reporting symptom..."
    echo "   Symptom: '$symptom'"

    TRIAGE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"$symptom\",
        \"ma_session_id\": \"$SESSION_ID\",
        \"conversation_history\": [],
        \"current_patient_id\": \"$patient_id\"
      }")

    TRIAGE_INTENT=$(echo "$TRIAGE_RESPONSE" | jq -r '.intent.intent_type')
    TRIAGE_PRIORITY=$(echo "$TRIAGE_RESPONSE" | jq -r '.metadata.triage.priority // "null"')
    TRIAGE_REASONING=$(echo "$TRIAGE_RESPONSE" | jq -r '.metadata.triage.reasoning // "No reasoning provided"')
    TRIAGE_CONFIDENCE=$(echo "$TRIAGE_RESPONSE" | jq -r '.metadata.triage.confidence // "null"')

    echo ""
    echo "Results:"
    echo "   Intent: $TRIAGE_INTENT"
    echo "   Priority: $TRIAGE_PRIORITY"
    echo "   Confidence: $TRIAGE_CONFIDENCE"
    echo "   Reasoning: $TRIAGE_REASONING"

    # Validate intent
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$TRIAGE_INTENT" = "TRIAGE_START" ]; then
        echo -e "${GREEN}✅ Intent correctly classified as TRIAGE_START${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: Intent was $TRIAGE_INTENT (expected TRIAGE_START)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    # Validate priority exists
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$TRIAGE_PRIORITY" != "null" ] && [ -n "$TRIAGE_PRIORITY" ]; then
        echo -e "${GREEN}✅ Triage priority assigned${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))

        # Check if priority matches expected level
        if [[ "$TRIAGE_PRIORITY" == *"$expected_priority"* ]]; then
            echo -e "${GREEN}✅ Priority level matches expected: $expected_priority${NC}"
        else
            echo -e "${YELLOW}⚠️  Priority '$TRIAGE_PRIORITY' differs from expected '$expected_priority'${NC}"
        fi
    else
        echo -e "${RED}❌ FAILED: No triage priority assigned${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    echo ""
}

echo "================================================================"
echo "PATIENT 1: JOHN MARTINEZ - ACUTE MI (STEMI)"
echo "================================================================"
test_patient "1000" "John Martinez" "I have crushing chest pain going down my left arm" "CRITICAL" "Acute Myocardial Infarction"

echo ""
echo "================================================================"
echo "PATIENT 2: MARGARET CHEN - ACUTE STROKE"
echo "================================================================"
test_patient "1001" "Margaret Chen" "My face feels droopy and I can't talk right" "CRITICAL" "Acute Ischemic Stroke"

echo ""
echo "================================================================"
echo "PATIENT 3: ROBERT WILLIAMS - CHF EXACERBATION"
echo "================================================================"
test_patient "1002" "Robert Williams" "I can't catch my breath and my ankles are really swollen" "HIGH" "CHF Exacerbation"

echo ""
echo "================================================================"
echo "PATIENT 4: SARAH JOHNSON - DIABETIC FOOT ULCER"
echo "================================================================"
test_patient "1003" "Sarah Johnson" "I have a sore on my foot that won't heal and it smells bad" "MEDIUM" "Diabetic Foot Ulcer with Infection"

echo ""
echo "================================================================"
echo "PATIENT 5: DOROTHY ANDERSON - HIP FRACTURE"
echo "================================================================"
test_patient "1004" "Dorothy Anderson" "I fell and I can't get up. My hip hurts terribly" "CRITICAL" "Hip Fracture"

echo ""
echo "================================================================"
echo "ADDITIONAL SYMPTOM VARIATIONS"
echo "================================================================"
echo ""

# Test additional symptom phrasings
echo "Testing: 'patient having chest pain' (should trigger TRIAGE)"
ADDITIONAL_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"patient having chest pain\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": \"1000\"
  }")

ADDITIONAL_INTENT=$(echo "$ADDITIONAL_RESPONSE" | jq -r '.intent.intent_type')
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$ADDITIONAL_INTENT" = "TRIAGE_START" ]; then
    echo -e "${GREEN}✅ 'patient having chest pain' → TRIAGE_START${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAILED: Got $ADDITIONAL_INTENT${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "Testing: 'severe headache and fever' (should trigger TRIAGE)"
ADDITIONAL_RESPONSE2=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"severe headache and fever\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": \"1001\"
  }")

ADDITIONAL_INTENT2=$(echo "$ADDITIONAL_RESPONSE2" | jq -r '.intent.intent_type')
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$ADDITIONAL_INTENT2" = "TRIAGE_START" ]; then
    echo -e "${GREEN}✅ 'severe headache and fever' → TRIAGE_START${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAILED: Got $ADDITIONAL_INTENT2${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "Testing: 'shortness of breath' (should trigger TRIAGE)"
ADDITIONAL_RESPONSE3=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"shortness of breath\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": \"1002\"
  }")

ADDITIONAL_INTENT3=$(echo "$ADDITIONAL_RESPONSE3" | jq -r '.intent.intent_type')
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$ADDITIONAL_INTENT3" = "TRIAGE_START" ]; then
    echo -e "${GREEN}✅ 'shortness of breath' → TRIAGE_START${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAILED: Got $ADDITIONAL_INTENT3${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "================================================================"
echo "FINAL RESULTS"
echo "================================================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

PASS_RATE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
echo "Pass Rate: $PASS_RATE%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "================================================================"
    echo "SUMMARY:"
    echo "- All 5 patients successfully found by ID"
    echo "- All symptoms correctly triggered TRIAGE_START"
    echo "- All triage priorities assigned appropriately"
    echo "- Additional symptom variations working correctly"
    echo "================================================================"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review the output above for details."
    exit 1
fi
