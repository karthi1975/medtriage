#!/bin/bash
# Test Patient 1000 (John Martinez) Cardiac Triage
# Using the exact symptom from FIVE_PATIENT_SCENARIOS.md

API_URL="https://medichat-backend-820444130598.us-east5.run.app"

echo "==========================================="
echo "Patient 1000 Cardiac Emergency Triage Test"
echo "==========================================="
echo ""

# Step 1: Create MA Session
echo "Step 1: Creating MA session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/session" \
  -H "Content-Type: application/json" \
  -d '{
    "ma_name": "Test MA",
    "facility": "Salt Lake Heart Center",
    "specialty": "Cardiology"
  }')

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.session_id')

if [ "$SESSION_ID" = "null" ] || [ -z "$SESSION_ID" ]; then
    echo "❌ FAILED: Could not create session"
    echo "$SESSION_RESPONSE" | jq '.'
    exit 1
fi

echo "✅ Session created: $SESSION_ID"
echo ""

# Step 2: Find Patient 1000
echo "Step 2: Finding patient 1000 (John Martinez)..."
PATIENT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"1000\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": null
  }")

PATIENT_NAME=$(echo "$PATIENT_RESPONSE" | jq -r '.metadata.patient.patient.name // "null"')
INTENT=$(echo "$PATIENT_RESPONSE" | jq -r '.intent.intent_type')

if [ "$PATIENT_NAME" != "null" ] && [ -n "$PATIENT_NAME" ]; then
    echo "✅ Patient found: $PATIENT_NAME"
    echo "   Intent: $INTENT"
else
    echo "❌ FAILED: Could not find patient"
    echo "$PATIENT_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Step 3: Test Triage with EXACT symptom from FIVE_PATIENT_SCENARIOS.md
echo "Step 3: Reporting symptom (EXACT from scenario document)..."
echo "   Symptom: 'I have crushing chest pain going down my left arm'"
echo ""

TRIAGE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"I have crushing chest pain going down my left arm\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": \"1000\"
  }")

echo "Response:"
echo "$TRIAGE_RESPONSE" | jq '{
  content: .content,
  intent: .intent.intent_type,
  confidence: .intent.confidence,
  triage: {
    priority: .metadata.triage.priority,
    reasoning: .metadata.triage.reasoning,
    confidence: .metadata.triage.confidence
  },
  actions_taken: .actions_taken
}'
echo ""

# Validate response
TRIAGE_INTENT=$(echo "$TRIAGE_RESPONSE" | jq -r '.intent.intent_type')
TRIAGE_PRIORITY=$(echo "$TRIAGE_RESPONSE" | jq -r '.metadata.triage.priority // "null"')

echo "==========================================="
echo "VALIDATION"
echo "==========================================="

if [ "$TRIAGE_INTENT" = "TRIAGE_START" ]; then
    echo "✅ Intent correctly classified as TRIAGE_START"
else
    echo "❌ FAILED: Intent was $TRIAGE_INTENT (expected TRIAGE_START)"
fi

if [ "$TRIAGE_PRIORITY" != "null" ] && [ -n "$TRIAGE_PRIORITY" ]; then
    echo "✅ Triage priority assigned: $TRIAGE_PRIORITY"

    # For cardiac emergency, we expect CRITICAL or HIGH
    if [[ "$TRIAGE_PRIORITY" == *"CRITICAL"* ]] || [[ "$TRIAGE_PRIORITY" == *"EMERGENCY"* ]] || [[ "$TRIAGE_PRIORITY" == *"HIGH"* ]]; then
        echo "✅ Priority level appropriate for cardiac symptoms"
    else
        echo "⚠️  Warning: Priority might be too low for cardiac emergency (got: $TRIAGE_PRIORITY)"
    fi
else
    echo "❌ FAILED: No triage priority assigned"
fi

echo ""
echo "==========================================="
echo "ADDITIONAL TEST VARIATIONS"
echo "==========================================="
echo ""

# Test 4: Variation - "patient having chest pain"
echo "Test 4: Testing variation 'patient having chest pain'..."
TRIAGE2_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"patient having chest pain\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": \"1000\"
  }")

INTENT2=$(echo "$TRIAGE2_RESPONSE" | jq -r '.intent.intent_type')
PRIORITY2=$(echo "$TRIAGE2_RESPONSE" | jq -r '.metadata.triage.priority // "null"')

echo "   Intent: $INTENT2"
echo "   Priority: $PRIORITY2"

if [ "$INTENT2" = "TRIAGE_START" ]; then
    echo "   ✅ Correctly classified"
else
    echo "   ❌ FAILED: Got $INTENT2"
fi
echo ""

# Test 5: Variation - "chest pain radiating to left arm"
echo "Test 5: Testing 'chest pain radiating to left arm'..."
TRIAGE3_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"chest pain radiating to left arm\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": \"1000\"
  }")

INTENT3=$(echo "$TRIAGE3_RESPONSE" | jq -r '.intent.intent_type')
PRIORITY3=$(echo "$TRIAGE3_RESPONSE" | jq -r '.metadata.triage.priority // "null"')

echo "   Intent: $INTENT3"
echo "   Priority: $PRIORITY3"

if [ "$INTENT3" = "TRIAGE_START" ]; then
    echo "   ✅ Correctly classified"
else
    echo "   ❌ FAILED: Got $INTENT3"
fi
echo ""

echo "==========================================="
echo "TEST COMPLETE"
echo "==========================================="

# Summary
TOTAL_TESTS=3
PASSED=0

[ "$TRIAGE_INTENT" = "TRIAGE_START" ] && PASSED=$((PASSED + 1))
[ "$INTENT2" = "TRIAGE_START" ] && PASSED=$((PASSED + 1))
[ "$INTENT3" = "TRIAGE_START" ] && PASSED=$((PASSED + 1))

echo "Passed: $PASSED/$TOTAL_TESTS triage intent classifications"

if [ $PASSED -eq $TOTAL_TESTS ]; then
    echo "✅ ALL TESTS PASSED"
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    exit 1
fi
