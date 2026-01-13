# Triage Testing - Step-by-Step Guide

## Issue Fixed
**Problem**: When typing "patient having chest pain" after finding a patient, the system was detecting PATIENT_LOOKUP instead of TRIAGE_START.

**Root Cause**: Patient lookup patterns were being checked before triage patterns, and the greedy regex was matching "patient having..." as a patient lookup.

**Solution**: Prioritized triage detection when:
1. Current patient exists in context AND message contains symptom keywords
2. Message has symptom keywords (even without current patient)

---

## Testing Steps (via UI)

### Test 1: Basic Triage with Current Patient ✅

**URL**: https://medichat-frontend-tg3weve6aq-ul.a.run.app

1. **Start MA Session**
   - MA Name: `Test MA`
   - Facility: `Salt Lake Heart Center`
   - Specialty: `Cardiology`
   - Click "Start Shift"

2. **Find Patient**
   - Type: `1000`
   - Press Enter
   - **Expected**: "Found patient: John Robert Martinez"
   - **Right Panel**: Should show patient demographics

3. **Report Symptoms (Triage Trigger)**
   - Type: `patient having chest pain`
   - Press Enter
   - **Expected Response**: Should start triage workflow
   - **Expected Metadata**:
     ```json
     {
       "intent": "TRIAGE_START",
       "triage": {
         "priority": "CRITICAL" or similar,
         "reasoning": "...",
         "recommendations": [...]
       }
     }
     ```

4. **Verify Triage Output**
   - Should see triage priority level (CRITICAL, HIGH, MEDIUM, LOW)
   - Should see reasoning for the triage decision
   - Should see care recommendations
   - Should see suggested testing if applicable

---

### Test 2: Different Symptom Patterns

Try these variations (after finding patient 1000):

| User Input | Expected Intent | Expected Triage |
|------------|----------------|-----------------|
| `chest pain` | TRIAGE_START | CRITICAL (cardiac) |
| `patient has chest pain radiating to left arm` | TRIAGE_START | CRITICAL (STEMI) |
| `severe headache and fever` | TRIAGE_START | HIGH (meningitis concern) |
| `shortness of breath` | TRIAGE_START | HIGH |
| `patient is dizzy` | TRIAGE_START | MEDIUM |
| `mild headache` | TRIAGE_START | LOW-MEDIUM |
| `patient having nausea and vomiting` | TRIAGE_START | MEDIUM |

---

### Test 3: Triage WITHOUT Current Patient

1. **Start new session** (or clear current patient)
2. **Type symptom without patient**:
   - Input: `patient has chest pain`
   - **Expected**: Should prompt to select/identify patient first
   - **OR**: Should still trigger TRIAGE_START but warn about missing patient context

---

### Test 4: Patient Lookup Should Still Work

Ensure patient lookup wasn't broken:

| User Input | Expected Intent | Expected Result |
|------------|----------------|-----------------|
| `1001` | PATIENT_LOOKUP | Found patient: Margaret Lynn Chen |
| `patient 1002` | PATIENT_LOOKUP | Found patient: Robert James Williams |
| `find 1003` | PATIENT_LOOKUP | Found patient: Sarah Marie Johnson |
| `show patient 1004` | PATIENT_LOOKUP | Found patient: Dorothy Mae Anderson |

---

## Testing Steps (via API)

### Complete API Test Script

```bash
#!/bin/bash

API_URL="https://medichat-backend-820444130598.us-east5.run.app"

# Step 1: Create MA Session
echo "=== STEP 1: Create MA Session ==="
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/session" \
  -H "Content-Type: application/json" \
  -d '{
    "ma_name": "Test MA",
    "facility": "Salt Lake Heart Center",
    "specialty": "Cardiology"
  }')

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.session_id')
echo "Session ID: $SESSION_ID"
echo ""

# Step 2: Find Patient
echo "=== STEP 2: Find Patient 1000 ==="
PATIENT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"1000\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": null
  }")

echo "Response:"
echo "$PATIENT_RESPONSE" | jq '{
  content: .content,
  intent: .intent.intent_type,
  patient_found: .metadata.patient.patient.name
}'
echo ""

# Step 3: Report Symptoms (Triage)
echo "=== STEP 3: Report Chest Pain (Should Trigger Triage) ==="
TRIAGE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"patient having chest pain\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": \"1000\"
  }")

echo "Response:"
echo "$TRIAGE_RESPONSE" | jq '{
  content: .content,
  intent: .intent.intent_type,
  triage_priority: .metadata.triage.priority,
  triage_reasoning: .metadata.triage.reasoning
}'
echo ""

# Step 4: Test Different Symptoms
echo "=== STEP 4: Test 'severe headache and fever' ==="
TRIAGE2_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"severe headache and fever\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": \"1000\"
  }")

echo "$TRIAGE2_RESPONSE" | jq '{
  intent: .intent.intent_type,
  triage_priority: .metadata.triage.priority
}'
echo ""

# Step 5: Verify Patient Lookup Still Works
echo "=== STEP 5: Verify Patient Lookup Still Works (1001) ==="
LOOKUP_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"1001\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": null
  }")

echo "$LOOKUP_RESPONSE" | jq '{
  intent: .intent.intent_type,
  patient_found: .metadata.patient.patient.name
}'
echo ""

echo "=== ALL TESTS COMPLETE ==="
```

Save this as `test-triage-workflow.sh` and run:
```bash
chmod +x test-triage-workflow.sh
./test-triage-workflow.sh
```

---

## Expected Results

### ✅ Success Criteria

1. **Patient Lookup Works**
   - Typing `1000` finds "John Robert Martinez"
   - Intent: `PATIENT_LOOKUP`

2. **Triage Triggers with Current Patient**
   - After finding patient, typing `patient having chest pain` triggers triage
   - Intent: `TRIAGE_START`
   - Triage metadata includes: priority, reasoning, recommendations

3. **Symptom Keywords Work**
   - All symptom keywords trigger triage: pain, chest, fever, headache, etc.

4. **No False Positives**
   - Patient lookup doesn't trigger on symptom descriptions
   - Triage doesn't trigger on non-symptom messages

---

## Symptom Keywords Supported

The system recognizes these symptom keywords:

**Pain/Discomfort:**
- pain, hurt, ache, chest, headache

**Respiratory:**
- shortness of breath, sob, cough

**Gastrointestinal:**
- nausea, vomiting, diarrhea

**Neurological:**
- dizzy, confusion, weakness, numbness

**General:**
- fever, bleeding, swelling, rash

---

## Troubleshooting

### Problem: Still getting "I've processed your request"

**Check:**
1. Is the backend deployed with the latest code?
   ```bash
   gcloud run services describe medichat-backend --region=us-east5 --format="value(status.latestReadyRevisionName)"
   ```

2. Check backend logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=medichat-backend" --limit=50 --format="value(textPayload)" | grep -A5 "classify"
   ```

3. Verify intent classification in logs:
   - Should see: "Rule-based classification: TRIAGE_START (current patient exists + symptoms detected)"
   - NOT: "Rule-based classification: PATIENT_LOOKUP"

### Problem: Triage runs but no priority/reasoning

**Check:**
1. Is `intelligent_triage_service.py` working?
2. Check for errors in triage execution
3. Verify patient context is being passed to triage service

---

## Test Patient Scenarios (from FIVE_PATIENT_SCENARIOS.md)

### Patient 1000 - John Martinez (Cardiac)
**Symptoms to test:**
- "chest pain" → Should trigger CRITICAL triage
- "pain radiating to left arm" → CRITICAL (STEMI indicators)
- "shortness of breath" → HIGH

### Patient 1001 - Margaret Chen (Stroke)
**Symptoms to test:**
- "face drooping" → CRITICAL (stroke alert)
- "can't talk right" → CRITICAL
- "arm weakness" → CRITICAL

### Patient 1002 - Robert Williams (CHF)
**Symptoms to test:**
- "can't catch my breath" → HIGH/URGENT
- "ankle swelling" → MEDIUM/HIGH
- "orthopnea" → HIGH

---

## Backend Logs to Monitor

While testing, watch the logs:

```bash
# Real-time log streaming
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=medichat-backend" --format="value(textPayload)"
```

**Look for:**
```
INFO:main:Processing MA chat: patient having chest pain...
INFO:chat_service:Rule-based classification: TRIAGE_START (current patient exists + symptoms detected)
INFO:main:Intent classified: TRIAGE_START
INFO:intelligent_triage_service:Determining triage priority for symptoms...
```

---

## Next Steps After Testing

1. ✅ Verify patient lookup still works (1000-1004)
2. ✅ Verify triage triggers on symptom keywords
3. ✅ Check triage priority levels make sense
4. ✅ Verify recommendations are appropriate
5. Document any edge cases or issues found

---

**Last Updated**: 2026-01-13
**Fix Applied**: Triage intent prioritization
**Build Status**: Currently rebuilding backend...
