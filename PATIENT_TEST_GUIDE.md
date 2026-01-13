# Patient Test Guide - Complete Testing Workflow

## Overview
This guide provides detailed testing scenarios with step-by-step instructions for triggering triage and booking appointments for all 15 synthetic patients in HAPI FHIR.

**IMPORTANT**: Patient IDs are `21003-21065` (FHIR-assigned), not the original 233-247 from the population script.

---

## Quick Reference Table

| FHIR ID | Name | Age | Facility | Category | Key Conditions | Allergies |
|---------|------|-----|----------|----------|----------------|-----------|
| 21003 | Miguel Garcia | 25M | West Valley City | Respiratory | Asthma | None |
| 21006 | Sarah Thompson | 40F | West Valley City | Endocrine | Type 1 Diabetes, Hypothyroid | **Latex** |
| 21011 | Thanh Nguyen | 83F | West Valley City | Cardiac | MI history, Heart failure | None |
| 21018 | Robert Anderson | 67M | Salt Lake Heart | Cardiac | Recent MI (2022), HTN | None |
| 21025 | Elena Martinez | 50F | Salt Lake Heart | Cardiac | A-fib, HTN, on Warfarin | None |
| 21030 | Michael Johnson | 35M | Utah Valley Ortho | Orthopedic | Knee OA | None |
| 21033 | Jennifer Peterson | 37F | Utah Valley Ortho | Orthopedic | Radius fracture | **Penicillin (HIGH)** |
| 21037 | Dorothy Williams | 77F | St. George | Respiratory | COPD, Asthma | **Latex** |
| 21042 | Christopher Davis | 30M | St. George | Healthy | None | None |
| 21043 | Emily Brown | 9F | Park City | Pediatric | Asthma | **Cashew (HIGH)** |
| 21047 | James Miller | 53M | Park City | Metabolic | Type 2 DM, HTN | None |
| 21052 | Patricia Wilson | 70F | Ogden | Rheumatology | Osteoporosis, RA | **Sulfonamide** |
| 21057 | Daniel Taylor | 27M | Ogden | Healthy | None | None |
| 21058 | Carlos Rodriguez | 62M | Murray | Nephrology | CKD, Type 2 DM, HTN | None |
| 21065 | Susan Lee | 45F | Murray | Endocrine | Hypothyroidism | **Penicillin (MOD)** |

---

## Complete Testing Workflow (Step-by-Step)

### STEP 1: Start MA Session

First, create a Medical Assistant session:

```bash
curl -X POST http://localhost:8002/api/v1/ma/session \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "21003",
    "facility_id": 1,
    "chief_complaint": "chest pain and shortness of breath",
    "ma_name": "Test MA",
    "specialty_id": 2
  }'
```

**Response**: You'll get a `session_id` - save this for next step.

### STEP 2: Run Intelligent Triage

Use the session ID and provide detailed symptom information:

```bash
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID_HERE",
    "patient_fhir_id": "21003",
    "patient_name": "Miguel Garcia",
    "patient_age": 25,
    "patient_gender": "male",
    "symptoms": ["chest pain", "shortness of breath"],
    "facility_id": 1,
    "provider_name": "Dr. Smith",
    "specialty": "Cardiology"
  }'
```

**Expected Response**:
- Protocol activation
- Risk assessment
- Immediate actions
- Test ordering plan
- Workflow creation with checkpoints
- Urgency level (emergency/urgent/semi-urgent/non-urgent)

### STEP 3: Review Workflow

Check the workflow status:

```bash
curl http://localhost:8002/api/v1/workflows/patient/21003
```

### STEP 4: Update Checkpoints (Simulate MA Actions)

Mark checkpoints as completed:

```bash
curl -X POST http://localhost:8002/api/v1/workflows/WORKFLOW_ID/checkpoints/Take%20vital%20signs/update \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "BP: 140/90, HR: 88, SpO2: 96%, Temp: 98.6F"
  }'
```

### STEP 5: Book Appointment

Once required tests are ordered/completed:

```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "21003",
    "provider_id": 1,
    "appointment_date": "2025-12-20",
    "appointment_time": "10:00:00",
    "visit_type": "new_patient",
    "urgency": "semi-urgent",
    "notes": "Follow-up for chest pain evaluation"
  }'
```

---

## Detailed Test Scenarios by Category

## 🚨 CATEGORY 1: EMERGENCY CARDIAC

### Scenario 1A: Acute Chest Pain (Geriatric)
**Patient**: 21011 - Thanh Nguyen (83F, MI history, heart failure)

**Chief Complaint**: "Severe chest pain"

**Symptoms to Trigger Protocol**:
```json
{
  "symptoms": [
    "chest pain",
    "shortness of breath",
    "left arm pain",
    "diaphoresis"
  ]
}
```

**Expected Triage Response**:
- ✅ Protocol: Chest Pain Protocol
- ✅ Risk Level: HIGH (due to age + cardiac history)
- ✅ Urgency: `urgent` or `emergency`
- ✅ Immediate Actions:
  - Vital signs (STAT)
  - 12-lead ECG (STAT)
  - Troponin test
  - Notify cardiologist
- ✅ Pre-appointment Tests:
  - BNP/NT-proBNP
  - Lipid panel
  - Echocardiogram

**API Test**:
```bash
# Step 1: Create session
curl -X POST http://localhost:8002/api/v1/ma/session \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "21011",
    "facility_id": 1,
    "chief_complaint": "severe chest pain with left arm pain",
    "ma_name": "Test MA",
    "specialty_id": 2
  }'

# Step 2: Run triage (use session_id from step 1)
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "patient_fhir_id": "21011",
    "patient_name": "Thanh Nguyen",
    "patient_age": 83,
    "patient_gender": "female",
    "symptoms": ["chest pain", "shortness of breath", "left arm pain", "diaphoresis"],
    "facility_id": 1,
    "provider_name": "Dr. Cardiology",
    "specialty": "Cardiology"
  }'
```

---

### Scenario 1B: Recent MI Patient with New Symptoms
**Patient**: 21018 - Robert Anderson (67M, MI in 2022)

**Chief Complaint**: "Chest discomfort and palpitations"

**Symptoms**:
```json
{
  "symptoms": [
    "chest pressure",
    "palpitations",
    "lightheadedness",
    "fatigue"
  ]
}
```

**Expected**:
- Protocol: Chest Pain Protocol
- Risk: HIGH (recent MI history)
- Urgency: `urgent`
- Alert: Patient has MI history - expedite evaluation

---

### Scenario 1C: Atrial Fibrillation with Stroke Risk
**Patient**: 21025 - Elena Martinez (50F, A-fib, on Warfarin)

**Chief Complaint**: "Racing heart and dizziness"

**Symptoms**:
```json
{
  "symptoms": [
    "palpitations",
    "irregular heartbeat",
    "dizziness",
    "weakness on one side"
  ]
}
```

**Expected**:
- Protocol: A-fib/Stroke Protocol
- Risk: HIGH (stroke symptoms + anticoagulation)
- Urgency: `emergency`
- Immediate: Check INR, neuro assessment
- Alert: Patient on Warfarin - bleeding/stroke risk

---

## 🫁 CATEGORY 2: RESPIRATORY EMERGENCIES

### Scenario 2A: Asthma Exacerbation (Young Adult)
**Patient**: 21003 - Miguel Garcia (25M, Asthma)

**Chief Complaint**: "Can't catch my breath"

**Symptoms**:
```json
{
  "symptoms": [
    "shortness of breath",
    "wheezing",
    "chest tightness",
    "using rescue inhaler every hour"
  ]
}
```

**Expected**:
- Protocol: Asthma Exacerbation Protocol
- Risk: MODERATE to HIGH
- Urgency: `urgent` or `semi-urgent`
- Immediate: Peak flow, SpO2, nebulizer treatment
- Tests: Chest X-ray if needed

**API Test**:
```bash
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "patient_fhir_id": "21003",
    "patient_name": "Miguel Garcia",
    "patient_age": 25,
    "patient_gender": "male",
    "symptoms": ["shortness of breath", "wheezing", "chest tightness", "using rescue inhaler frequently"],
    "facility_id": 1,
    "provider_name": "Dr. Pulmonology",
    "specialty": "Pulmonology"
  }'
```

---

### Scenario 2B: COPD Exacerbation (Geriatric)
**Patient**: 21037 - Dorothy Williams (77F, COPD + Asthma, Latex allergy)

**Chief Complaint**: "Worse breathing, can't do daily activities"

**Symptoms**:
```json
{
  "symptoms": [
    "increased shortness of breath",
    "productive cough with yellow sputum",
    "wheezing",
    "confusion"
  ]
}
```

**Expected**:
- Protocol: COPD Exacerbation
- Risk: HIGH (age + confusion = hypoxia)
- Urgency: `urgent` or `emergency`
- Alert: **LATEX ALLERGY**
- Immediate: ABG, chest X-ray, sputum culture
- Treatment: Antibiotics (check allergy!), steroids, oxygen

---

### Scenario 2C: Pediatric Asthma
**Patient**: 21043 - Emily Brown (9F, Asthma, Cashew allergy)

**Chief Complaint**: "Having trouble breathing after playing"

**Symptoms**:
```json
{
  "symptoms": [
    "difficulty breathing",
    "persistent cough",
    "wheezing",
    "retractions"
  ]
}
```

**Expected**:
- Protocol: Pediatric Asthma
- Risk: MODERATE (pediatric = higher concern)
- Urgency: `semi-urgent` or `urgent`
- Alert: **CASHEW NUT ALLERGY (HIGH)** - anaphylaxis risk
- Parent/Guardian notification required
- Pediatric dosing for medications

---

## 🦴 CATEGORY 3: ORTHOPEDIC INJURIES

### Scenario 3A: Acute Injury
**Patient**: 21033 - Jennifer Peterson (37F, Radius fracture, **Penicillin allergy HIGH**)

**Chief Complaint**: "Wrist pain after fall"

**Symptoms**:
```json
{
  "symptoms": [
    "wrist pain",
    "swelling",
    "deformity",
    "unable to move wrist"
  ]
}
```

**Expected**:
- Protocol: Orthopedic Trauma
- Risk: LOW to MODERATE
- Urgency: `semi-urgent`
- Alert: **⚠️ PENICILLIN ALLERGY (HIGH SEVERITY)** - No penicillin-based antibiotics if surgery needed
- Immediate: X-ray, splinting
- Alternative antibiotics: Cephalosporins (if no cross-reactivity) or Fluoroquinolones

**API Test**:
```bash
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "patient_fhir_id": "21033",
    "patient_name": "Jennifer Peterson",
    "patient_age": 37,
    "patient_gender": "female",
    "symptoms": ["wrist pain", "swelling", "deformity", "unable to move wrist"],
    "facility_id": 3,
    "provider_name": "Dr. Ortho",
    "specialty": "Orthopedics"
  }'
```

---

### Scenario 3B: Chronic Joint Pain
**Patient**: 21030 - Michael Johnson (35M, Knee OA)

**Chief Complaint**: "Knee pain getting worse"

**Symptoms**:
```json
{
  "symptoms": [
    "knee pain",
    "stiffness in morning",
    "difficulty walking",
    "swelling"
  ]
}
```

**Expected**:
- Protocol: Orthopedic Assessment
- Risk: LOW
- Urgency: `non-urgent`
- Tests: X-ray, possibly MRI
- Conservative management first

---

## 💉 CATEGORY 4: DIABETES/ENDOCRINE

### Scenario 4A: Type 1 Diabetes Crisis
**Patient**: 21006 - Sarah Thompson (40F, Type 1 DM, Hypothyroid, Latex allergy)

**Chief Complaint**: "Blood sugar over 400, feeling sick"

**Symptoms**:
```json
{
  "symptoms": [
    "very high blood sugar",
    "nausea and vomiting",
    "frequent urination",
    "fruity breath odor",
    "confusion"
  ]
}
```

**Expected**:
- Protocol: DKA (Diabetic Ketoacidosis) Protocol
- Risk: HIGH (DKA emergency)
- Urgency: `emergency`
- Alert: **LATEX ALLERGY** - use non-latex gloves
- Immediate: Blood glucose, ketones, BMP, IV access
- Treatment: Insulin drip, fluids, electrolyte management

**API Test**:
```bash
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "patient_fhir_id": "21006",
    "patient_name": "Sarah Thompson",
    "patient_age": 40,
    "patient_gender": "female",
    "symptoms": ["very high blood sugar", "nausea and vomiting", "fruity breath", "confusion"],
    "facility_id": 1,
    "provider_name": "Dr. Endocrinology",
    "specialty": "Endocrinology"
  }'
```

---

### Scenario 4B: Type 2 Diabetes - Uncontrolled
**Patient**: 21047 - James Miller (53M, Type 2 DM, HTN)

**Chief Complaint**: "Blood sugars running high, increased thirst"

**Symptoms**:
```json
{
  "symptoms": [
    "increased thirst",
    "frequent urination",
    "blurred vision",
    "fatigue",
    "blood glucose 250-300"
  ]
}
```

**Expected**:
- Protocol: Diabetes Management
- Risk: MODERATE
- Urgency: `semi-urgent`
- Tests: HbA1c, fasting glucose, lipid panel, CMP
- Medication adjustment likely needed

---

### Scenario 4C: Hypothyroidism Symptoms
**Patient**: 21065 - Susan Lee (45F, Hypothyroidism, Penicillin allergy)

**Chief Complaint**: "Extreme fatigue, weight gain"

**Symptoms**:
```json
{
  "symptoms": [
    "extreme fatigue",
    "weight gain",
    "cold intolerance",
    "dry skin",
    "constipation"
  ]
}
```

**Expected**:
- Protocol: Thyroid Disorder Evaluation
- Risk: LOW
- Urgency: `non-urgent`
- Alert: **PENICILLIN ALLERGY (MODERATE)**
- Tests: TSH, Free T4, Free T3
- Medication adjustment (Levothyroxine dose)

---

## 🧓 CATEGORY 5: GERIATRIC COMPLEX CASES

### Scenario 5A: Multi-System Disease
**Patient**: 21058 - Carlos Rodriguez (62M, CKD, Type 2 DM, HTN)

**Chief Complaint**: "Swelling in legs, feeling tired"

**Symptoms**:
```json
{
  "symptoms": [
    "bilateral leg swelling",
    "fatigue",
    "decreased urine output",
    "nausea",
    "shortness of breath when lying flat"
  ]
}
```

**Expected**:
- Protocol: Complex Chronic Disease / Heart Failure / CKD
- Risk: HIGH (multi-organ involvement)
- Urgency: `urgent`
- Tests: BMP, BUN/Cr, BNP, chest X-ray, urinalysis
- Consider: Volume overload, worsening renal function, heart failure

**API Test**:
```bash
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "patient_fhir_id": "21058",
    "patient_name": "Carlos Rodriguez",
    "patient_age": 62,
    "patient_gender": "male",
    "symptoms": ["bilateral leg swelling", "fatigue", "decreased urine output", "nausea", "orthopnea"],
    "facility_id": 7,
    "provider_name": "Dr. Nephrology",
    "specialty": "Nephrology"
  }'
```

---

### Scenario 5B: Rheumatology
**Patient**: 21052 - Patricia Wilson (70F, Osteoporosis, RA, Sulfa allergy)

**Chief Complaint**: "Joint pain and stiffness worse in morning"

**Symptoms**:
```json
{
  "symptoms": [
    "morning stiffness lasting over 1 hour",
    "swollen joints in hands",
    "fatigue",
    "low-grade fever"
  ]
}
```

**Expected**:
- Protocol: Rheumatoid Arthritis Flare
- Risk: MODERATE
- Urgency: `semi-urgent`
- Alert: **SULFONAMIDE ALLERGY**
- Tests: CRP, ESR, RF, anti-CCP, CBC
- Medication review (Methotrexate monitoring)

---

## ✅ CATEGORY 6: HEALTHY PATIENTS (PREVENTIVE CARE)

### Scenario 6A: Annual Physical (Young Adult)
**Patient**: 21042 - Christopher Davis (30M, No conditions)

**Chief Complaint**: "Annual checkup"

**Symptoms**:
```json
{
  "symptoms": [
    "routine physical exam"
  ]
}
```

**Expected**:
- Protocol: Preventive Care / Annual Physical
- Risk: LOW
- Urgency: `non-urgent`
- Tests: Basic labs (CBC, CMP, lipid panel), vitals
- Screening: Blood pressure, BMI, vaccinations

**API Test**:
```bash
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "patient_fhir_id": "21042",
    "patient_name": "Christopher Davis",
    "patient_age": 30,
    "patient_gender": "male",
    "symptoms": ["routine physical exam"],
    "facility_id": 4,
    "provider_name": "Dr. Primary Care",
    "specialty": "Primary Care"
  }'
```

---

### Scenario 6B: Sports Physical
**Patient**: 21057 - Daniel Taylor (27M, No conditions)

**Chief Complaint**: "Need sports physical for soccer league"

**Symptoms**:
```json
{
  "symptoms": [
    "sports physical required"
  ]
}
```

**Expected**:
- Protocol: Sports Physical
- Risk: LOW
- Urgency: `non-urgent`
- Tests: Vital signs, cardiac screening, musculoskeletal exam

---

## 🧒 CATEGORY 7: PEDIATRIC CASES

### Scenario 7A: Pediatric Emergency (Already covered in 2C)
**Patient**: 21043 - Emily Brown (9F, Asthma, Cashew allergy)

---

## Complete API Testing Script

Save this as `test_complete_flow.sh`:

```bash
#!/bin/bash

PATIENT_ID="21003"
PATIENT_NAME="Miguel Garcia"
PATIENT_AGE=25
PATIENT_GENDER="male"
FACILITY_ID=1
SPECIALTY_ID=2

# Step 1: Search for patient
echo "=== STEP 1: Search for patient ==="
curl -s -X POST http://localhost:8002/api/v1/patients/search \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$PATIENT_ID\", \"search_type\": \"id\"}" | jq .

# Step 2: Create MA session
echo -e "\n=== STEP 2: Create MA session ==="
SESSION_RESPONSE=$(curl -s -X POST http://localhost:8002/api/v1/ma/session \
  -H "Content-Type: application/json" \
  -d "{
    \"patient_fhir_id\": \"$PATIENT_ID\",
    \"facility_id\": $FACILITY_ID,
    \"chief_complaint\": \"chest pain and shortness of breath\",
    \"ma_name\": \"Test MA\",
    \"specialty_id\": $SPECIALTY_ID
  }")
echo $SESSION_RESPONSE | jq .
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.session_id')
echo "Session ID: $SESSION_ID"

# Step 3: Run intelligent triage
echo -e "\n=== STEP 3: Run intelligent triage ==="
TRIAGE_RESPONSE=$(curl -s -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"patient_fhir_id\": \"$PATIENT_ID\",
    \"patient_name\": \"$PATIENT_NAME\",
    \"patient_age\": $PATIENT_AGE,
    \"patient_gender\": \"$PATIENT_GENDER\",
    \"symptoms\": [\"chest pain\", \"shortness of breath\"],
    \"facility_id\": $FACILITY_ID,
    \"provider_name\": \"Dr. Smith\",
    \"specialty\": \"Cardiology\"
  }")
echo $TRIAGE_RESPONSE | jq .

# Extract workflow info
WORKFLOW_ID=$(echo $TRIAGE_RESPONSE | jq -r '.result.workflow.workflow_id')
URGENCY=$(echo $TRIAGE_RESPONSE | jq -r '.result.urgency')
echo "Workflow ID: $WORKFLOW_ID"
echo "Urgency: $URGENCY"

# Step 4: Check workflow status
echo -e "\n=== STEP 4: Check workflow ==="
curl -s http://localhost:8002/api/v1/workflows/$WORKFLOW_ID | jq .

# Step 5: Get test orders
echo -e "\n=== STEP 5: Get test ordering plan ==="
echo $TRIAGE_RESPONSE | jq '.result.test_ordering_plan'

echo -e "\n=== COMPLETE ==="
echo "✅ Patient searched: $PATIENT_ID"
echo "✅ Session created: $SESSION_ID"
echo "✅ Triage completed: $WORKFLOW_ID"
echo "✅ Urgency determined: $URGENCY"
echo "Next: Update checkpoints and book appointment"
```

Make it executable:
```bash
chmod +x test_complete_flow.sh
./test_complete_flow.sh
```

---

## Specialty Mapping for Sessions

Use these specialty IDs when creating sessions:

| ID | Specialty | Use For |
|----|-----------|---------|
| 1 | Primary Care | Routine, preventive care, healthy patients |
| 2 | Cardiology | Chest pain, MI, heart failure, arrhythmias |
| 3 | Orthopedics | Fractures, joint pain, arthritis |
| 4 | Neurology | Headaches, seizures, stroke symptoms |
| 5 | Gastroenterology | Abdominal pain, GI issues |
| 6 | Dermatology | Skin conditions |
| 7 | Endocrinology | Diabetes, thyroid disorders |
| 8 | Pulmonology | Asthma, COPD, respiratory issues |
| 9 | Oncology | Cancer-related symptoms |
| 10 | Urology | Urinary issues |

---

## Expected Urgency Levels by Scenario

| Scenario | Expected Urgency | Rationale |
|----------|------------------|-----------|
| Chest pain with cardiac history | `urgent` or `emergency` | High-risk cardiac event |
| Asthma exacerbation | `urgent` or `semi-urgent` | Respiratory distress |
| COPD with confusion | `emergency` | Hypoxia/respiratory failure |
| DKA symptoms | `emergency` | Life-threatening metabolic crisis |
| Fracture/acute injury | `semi-urgent` | Needs treatment but not life-threatening |
| Uncontrolled diabetes | `semi-urgent` | Needs adjustment but stable |
| Routine physical | `non-urgent` | Preventive care |
| Joint pain (chronic) | `non-urgent` | Chronic condition management |

---

## Testing Checklist

### Basic Functionality
- [ ] Patient search by FHIR ID (all 15 patients)
- [ ] Create MA session for each facility
- [ ] Run triage for each category

### Protocol Activation
- [ ] Chest Pain Protocol (21003, 21011, 21018)
- [ ] Asthma/COPD Protocol (21003, 21037, 21043)
- [ ] Orthopedic Protocol (21030, 21033)
- [ ] Diabetes/Endocrine Protocol (21006, 21047, 21065)
- [ ] Complex Disease Protocol (21058)

### Allergy Alerts
- [ ] Penicillin HIGH alert (21033)
- [ ] Penicillin MODERATE alert (21065)
- [ ] Latex alert (21006, 21037)
- [ ] Cashew nut HIGH alert (21043)
- [ ] Sulfonamide alert (21052)

### Urgency Levels (SQL Constraint Check)
- [ ] `emergency` - DKA, severe cardiac
- [ ] `urgent` - Chest pain, respiratory distress
- [ ] `semi-urgent` - Acute injury, uncontrolled chronic disease
- [ ] `non-urgent` - Routine care, stable chronic conditions

### Workflow Management
- [ ] Workflow created with checkpoints
- [ ] Test orders generated
- [ ] Timeline created
- [ ] Patient instructions provided
- [ ] Update checkpoint status
- [ ] Complete workflow

### Appointment Booking
- [ ] Book emergency appointment (same day)
- [ ] Book urgent appointment (24-48 hours)
- [ ] Book semi-urgent (within 1 week)
- [ ] Book routine (within 30 days)

---

## Quick Test Commands

### Test Emergency Cardiac
```bash
# Patient 21011 - Geriatric with MI history
curl -X POST http://localhost:8002/api/v1/ma/session -H "Content-Type: application/json" \
  -d '{"patient_fhir_id":"21011","facility_id":1,"chief_complaint":"severe chest pain","ma_name":"Test MA","specialty_id":2}'
```

### Test Pediatric Asthma
```bash
# Patient 21043 - 9yo with cashew allergy
curl -X POST http://localhost:8002/api/v1/ma/session -H "Content-Type: application/json" \
  -d '{"patient_fhir_id":"21043","facility_id":5,"chief_complaint":"difficulty breathing","ma_name":"Test MA","specialty_id":8}'
```

### Test Drug Allergy Alert
```bash
# Patient 21033 - High penicillin allergy
curl -X POST http://localhost:8002/api/v1/ma/session -H "Content-Type: application/json" \
  -d '{"patient_fhir_id":"21033","facility_id":3,"chief_complaint":"infected wound","ma_name":"Test MA","specialty_id":3}'
```

---

**System Status**: ✅ All services running
- HAPI FHIR: http://localhost:8081/fhir
- Backend API: http://localhost:8002
- PostgreSQL (Tribal): localhost:5433
- Total Test Patients: 15 (IDs: 21003-21065)

**Last Updated**: 2025-12-16
