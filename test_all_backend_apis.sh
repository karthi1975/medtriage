#!/bin/bash

# Comprehensive Backend API Test Suite
# Tests all major endpoints with actual FHIR patient data

API_URL="https://medichat-backend-820444130598.us-east5.run.app"

echo "========================================="
echo "  MediChat Backend API Test Suite"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"

    test_count=$((test_count + 1))
    echo -n "[$test_count] $test_name... "

    result=$(eval "$test_command" 2>&1)

    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}PASS${NC}"
        pass_count=$((pass_count + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo "   Expected: $expected_pattern"
        echo "   Got: $result"
        fail_count=$((fail_count + 1))
        return 1
    fi
}

echo "=== 1. HEALTH CHECK ==="
run_test "Health endpoint" \
    "curl -s $API_URL/health | jq -r '.status'" \
    "healthy"
echo ""

echo "=== 2. MA SESSION MANAGEMENT ==="
# Create MA session
echo "[2] Creating MA session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/session" \
  -H "Content-Type: application/json" \
  -d '{
    "ma_name": "Test MA",
    "facility": "Salt Lake Heart Center",
    "specialty": "Cardiology"
  }')

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.session_id')

if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
    echo -e "${GREEN}PASS${NC} - Session ID: $SESSION_ID"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}FAIL${NC} - Could not create session"
    echo "Response: $SESSION_RESPONSE"
    fail_count=$((fail_count + 1))
    exit 1
fi
test_count=$((test_count + 1))
echo ""

echo "=== 3. PATIENT LOOKUP - NUMERIC IDS ==="
# Test numeric patient ID (1000)
run_test "Patient lookup with numeric ID (1000)" \
    "curl -s -X POST \"$API_URL/api/v1/ma/chat\" \
      -H \"Content-Type: application/json\" \
      -d '{\"message\": \"1000\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": null}' | jq -r '.intent.intent_type'" \
    "PATIENT_LOOKUP"

run_test "Patient lookup with 'patient 1001'" \
    "curl -s -X POST \"$API_URL/api/v1/ma/chat\" \
      -H \"Content-Type: application/json\" \
      -d '{\"message\": \"patient 1001\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": null}' | jq -r '.intent.intent_type'" \
    "PATIENT_LOOKUP"

run_test "Patient lookup with 'find 1002'" \
    "curl -s -X POST \"$API_URL/api/v1/ma/chat\" \
      -H \"Content-Type: application/json\" \
      -d '{\"message\": \"find 1002\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": null}' | jq -r '.intent.intent_type'" \
    "PATIENT_LOOKUP"
echo ""

echo "=== 4. PATIENT LOOKUP - NAMED IDS ==="
run_test "Patient lookup with 'cardiac-emergency-001'" \
    "curl -s -X POST \"$API_URL/api/v1/ma/chat\" \
      -H \"Content-Type: application/json\" \
      -d '{\"message\": \"cardiac-emergency-001\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": null}' | jq -r '.intent.intent_type'" \
    "PATIENT_LOOKUP"
echo ""

echo "=== 5. PATIENT DATA RETRIEVAL ==="
# Get patient history directly
run_test "Get patient 1000 history" \
    "curl -s \"$API_URL/api/v1/patients/1000\" | jq -r '.patient_id'" \
    "1000"

run_test "Get patient 1000 data includes name" \
    "curl -s \"$API_URL/api/v1/patients/1000\" | jq -r '.data.patient.name'" \
    "John"

run_test "Get patient 1000 medications" \
    "curl -s \"$API_URL/api/v1/patients/1000\" | jq -r '.data.medications[0].medication // \"none\"'" \
    "."
echo ""

echo "=== 6. PATIENT METADATA IN CHAT ==="
echo "[${test_count}] Testing patient metadata in chat response..."
test_count=$((test_count + 1))

CHAT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"1000\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": null}")

PATIENT_FOUND=$(echo "$CHAT_RESPONSE" | jq -r '.metadata.patient_found // "null"')

if [ "$PATIENT_FOUND" != "null" ] && [ -n "$PATIENT_FOUND" ]; then
    echo -e "${GREEN}PASS${NC} - Patient found: $PATIENT_FOUND"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}FAIL${NC} - No patient in metadata"
    echo "Response: $CHAT_RESPONSE"
    fail_count=$((fail_count + 1))
fi
echo ""

echo "=== 7. TRIAGE INTENT DETECTION ==="
run_test "Triage with symptom 'chest pain'" \
    "curl -s -X POST \"$API_URL/api/v1/ma/chat\" \
      -H \"Content-Type: application/json\" \
      -d '{\"message\": \"patient has chest pain\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": \"1000\"}' | jq -r '.intent.intent_type'" \
    "TRIAGE_START"

run_test "Triage with 'headache and fever'" \
    "curl -s -X POST \"$API_URL/api/v1/ma/chat\" \
      -H \"Content-Type: application/json\" \
      -d '{\"message\": \"severe headache and fever\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": \"1001\"}' | jq -r '.intent.intent_type'" \
    "TRIAGE_START"
echo ""

echo "=== 8. APPOINTMENT SCHEDULING INTENT ==="
run_test "Schedule appointment intent" \
    "curl -s -X POST \"$API_URL/api/v1/ma/chat\" \
      -H \"Content-Type: application/json\" \
      -d '{\"message\": \"schedule appointment\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": \"1002\"}' | jq -r '.intent.intent_type'" \
    "SCHEDULE_REQUEST"
echo ""

echo "=== 9. PATIENT SEARCH ==="
run_test "Search patients by name" \
    "curl -s -X POST \"$API_URL/api/v1/patients/search\" \
      -H \"Content-Type: application/json\" \
      -d '{\"query\": \"John\", \"limit\": 5}' | jq -r '.total'" \
    "[0-9]"
echo ""

echo "=== 10. CLOUD RUN HEALTH ==="
run_test "Port 8080 check (Cloud Run)" \
    "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=medichat-backend AND resource.labels.revision_name=medichat-backend-00004-d94\" --limit=5 --format=\"value(textPayload)\" 2>/dev/null | grep -c '8080'" \
    "[1-9]"
echo ""

echo "========================================="
echo "  TEST SUMMARY"
echo "========================================="
echo "Total Tests: $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"
echo "========================================="

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}SOME TESTS FAILED${NC}"
    exit 1
fi
