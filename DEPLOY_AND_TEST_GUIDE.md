# Deploy & Test All 5 Patient Scenarios

## Current Status

### What Works Now ✅
- **Intent Classification**: "I have crushing chest pain going down my left arm" → TRIAGE_START ✅
- **Patient Lookup**: All 5 patients (1000-1004) found correctly ✅
- **Symptom Detection**: 28+ symptom keywords (pain, chest, droop, breath, sore, fell, etc.) ✅

### What's Fixed But Needs Deployment ⏳
- **Triage Execution**: Fixed patient data extraction error
- **Intelligent Triage**: Switched to Llama 4 service
- **Priority Assignment**: Will now return CRITICAL/HIGH/MEDIUM/LOW

---

## Step 1: Reauthenticate & Build

```bash
# Reauthenticate if needed
gcloud auth login

# Build with all fixes (takes ~10-12 minutes)
gcloud builds submit --config cloudbuild.yaml
```

**Expected Output:**
```
Creating temporary archive...
Uploading tarball...
starting build...
Step 1/11: FROM python:3.11-slim
...
Step 11/11: CMD ["uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
Successfully built...
PUSH
DONE
```

---

## Step 2: Deploy to Cloud Run

```bash
# Deploy (once build completes)
gcloud run deploy medichat-backend \
  --image=gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest \
  --region=us-east5
```

**Expected Output:**
```
Deploying container to Cloud Run service [medichat-backend]...
✓ Deploying new service... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
Done.
Service [medichat-backend] revision [medichat-backend-00011-xxx] has been deployed
Service URL: https://medichat-backend-820444130598.us-east5.run.app
```

---

## Step 3: Test Individual Symptom

Test the **exact symptom** you highlighted:

```bash
API_URL="https://medichat-backend-820444130598.us-east5.run.app"

# Create session
SESSION_ID=$(curl -s -X POST "$API_URL/api/v1/ma/session" \
  -H "Content-Type: application/json" \
  -d '{"ma_name": "Test MA", "facility": "Salt Lake Heart Center", "specialty": "Cardiology"}' | jq -r '.session_id')

echo "Session: $SESSION_ID"

# Find patient 1000
curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"1000\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": null}" \
  | jq -r '.content'

# Test cardiac symptom
curl -s -X POST "$API_URL/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I have crushing chest pain going down my left arm\", \"ma_session_id\": \"$SESSION_ID\", \"conversation_history\": [], \"current_patient_id\": \"1000\"}" \
  | jq '{
    intent: .intent.intent_type,
    triage_priority: .metadata.triage.priority,
    triage_reasoning: .metadata.triage.reasoning,
    recommendations: .metadata.triage.recommendations
  }'
```

**Expected Result:**
```json
{
  "intent": "TRIAGE_START",
  "triage_priority": "CRITICAL",
  "triage_reasoning": "Patient presenting with classic STEMI symptoms: crushing chest pain radiating to left arm. Given cardiac risk factors (HTN, DM, hyperlipidemia), immediate emergency intervention required.",
  "recommendations": [
    "Call 911 immediately",
    "Emergency Department transport",
    "Activate STEMI protocol",
    "Cath lab notification"
  ]
}
```

---

## Step 4: Test All 5 Patient Scenarios

Run the comprehensive test suite:

```bash
chmod +x test-all-5-patient-scenarios.sh
./test-all-5-patient-scenarios.sh
```

**Expected Results:**

```
================================================================
PATIENT 1: JOHN MARTINEZ - ACUTE MI (STEMI)
================================================================
✅ Patient found: John Robert Martinez
✅ Intent correctly classified as TRIAGE_START
✅ Triage priority assigned: CRITICAL

================================================================
PATIENT 2: MARGARET CHEN - ACUTE STROKE
================================================================
✅ Patient found: Margaret Lynn Chen
✅ Intent correctly classified as TRIAGE_START
✅ Triage priority assigned: CRITICAL

================================================================
PATIENT 3: ROBERT WILLIAMS - CHF EXACERBATION
================================================================
✅ Patient found: Robert James Williams
✅ Intent correctly classified as TRIAGE_START
✅ Triage priority assigned: HIGH

================================================================
PATIENT 4: SARAH JOHNSON - DIABETIC FOOT ULCER
================================================================
✅ Patient found: Sarah Marie Johnson
✅ Intent correctly classified as TRIAGE_START
✅ Triage priority assigned: MEDIUM

================================================================
PATIENT 5: DOROTHY ANDERSON - HIP FRACTURE
================================================================
✅ Patient found: Dorothy Mae Anderson
✅ Intent correctly classified as TRIAGE_START
✅ Triage priority assigned: CRITICAL

================================================================
FINAL RESULTS
================================================================
Total Tests: 18
Passed: 18
Failed: 0

✅ ALL TESTS PASSED!
```

---

## Step 5: Test in UI

### Frontend URL:
https://medichat-frontend-tg3weve6aq-ul.a.run.app

### Test Steps:

1. **Start MA Session**
   - MA Name: "Test MA"
   - Facility: "Salt Lake Heart Center"
   - Specialty: "Cardiology"
   - Click "Start Shift"

2. **Test Patient 1000 - Cardiac Emergency**
   - Type: `1000`
   - Expected: "Found patient: John Robert Martinez"
   - Type: `I have crushing chest pain going down my left arm`
   - Expected: Triage priority CRITICAL with cardiac emergency reasoning

3. **Test Patient 1001 - Stroke**
   - Type: `1001`
   - Type: `My face feels droopy and I can't talk right`
   - Expected: Triage priority CRITICAL with stroke alert

4. **Test Patient 1002 - CHF**
   - Type: `1002`
   - Type: `I can't catch my breath and my ankles are really swollen`
   - Expected: Triage priority HIGH with CHF exacerbation

5. **Test Patient 1003 - Diabetic Ulcer**
   - Type: `1003`
   - Type: `I have a sore on my foot that won't heal and it smells bad`
   - Expected: Triage priority MEDIUM with infection concern

6. **Test Patient 1004 - Hip Fracture**
   - Type: `1004`
   - Type: `I fell and I can't get up. My hip hurts terribly`
   - Expected: Triage priority CRITICAL with orthopedic emergency

---

## Troubleshooting

### If triage still fails:

1. **Check backend logs:**
   ```bash
   gcloud logging read \
     "resource.type=cloud_run_revision AND resource.labels.service_name=medichat-backend" \
     --limit=50 \
     --format="value(textPayload)" | grep -E "(TRIAGE|triage|error)"
   ```

2. **Verify revision:**
   ```bash
   gcloud run services describe medichat-backend --region=us-east5 \
     --format="value(status.latestReadyRevisionName)"
   ```

3. **Test health:**
   ```bash
   curl -s https://medichat-backend-820444130598.us-east5.run.app/health | jq '.'
   ```

---

## Summary of Fixes Applied

### Commit History:

1. **0219f01** - Fix triage intent detection (prioritize symptoms over patient lookup)
2. **c13cfbc** - Expand symptom keywords and switch to intelligent triage service
3. **13194a0** - Fix patient data extraction for triage

### Files Modified:

- `chat_service.py`: Expanded symptom keywords (28+ keywords)
- `main.py`: Switched to intelligent_triage_service, fixed patient data handling

### Test Scripts Created:

- `test-patient-1000-cardiac-triage.sh`: Single patient cardiac test
- `test-all-5-patient-scenarios.sh`: Complete 5-patient test suite
- `TRIAGE_TESTING_STEPS.md`: Detailed testing guide
- `TRIAGE_FIX_SUMMARY.md`: Technical summary of fixes

---

## Quick Command Reference

```bash
# 1. Reauthenticate
gcloud auth login

# 2. Build
gcloud builds submit --config cloudbuild.yaml

# 3. Wait ~10-12 minutes, then deploy
gcloud run deploy medichat-backend \
  --image=gcr.io/project-c78515e0-ee8f-4282-a3c/fhir-chat-api:latest \
  --region=us-east5

# 4. Test all scenarios
./test-all-5-patient-scenarios.sh

# 5. Or test just the cardiac symptom
./test-patient-1000-cardiac-triage.sh
```

---

**Last Updated**: 2026-01-13 05:45 AM
**Status**: Code fixed ✅ | Needs deployment ⏳
**Next Step**: Reauthenticate and deploy
