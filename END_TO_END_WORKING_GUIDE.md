# End-to-End Application Guide - READY FOR DEMO! 🎉

## ✅ System Status: ALL SERVICES RUNNING

### Running Services:
- **Frontend**: http://localhost:5173 (React + TypeScript + Material-UI)
- **Backend API**: http://localhost:8002 (FastAPI)
- **API Docs**: http://localhost:8002/docs
- **FHIR Server**: http://localhost:8081/fhir (HAPI FHIR)
- **Llama 4 AI**: ✅ Connected via Google Cloud Vertex AI
- **Databases**: PostgreSQL (Tribal Knowledge + FHIR)

---

## 🎯 Complete Backend API Reference

### 1. MA Session Management
```bash
# Create MA shift session
curl -X POST http://localhost:8002/api/v1/ma/session \
  -H "Content-Type: application/json" \
  -d '{
    "ma_name": "Sarah Johnson",
    "facility_id": 1,
    "specialty_id": 2
  }'

# Response: {"session_id": "uuid", "ma_name": "Sarah Johnson", "facility_name": "...", ...}
```

**Available Facilities (7 total)**:
1. West Valley City Community Health Center
2. Salt Lake Heart Center
3. Utah Valley Orthopedics
4. St. George Regional Medical Center
5. Park City Family Medicine
6. Ogden Clinic
7. Intermountain Healthcare - Murray

**Available Specialties (22 total)**:
1. Primary Care
2. Cardiology
3. Orthopedics
4. Neurology
5. Gastroenterology
6. Dermatology
7. Endocrinology
8. Pulmonology
9. Oncology
10. Urology
... and 12 more

---

### 2. Patient Search & Data

#### Search Patients
```bash
# Search by FHIR ID
curl -X POST http://localhost:8002/api/v1/patients/search \
  -H "Content-Type: application/json" \
  -d '{"query": "1000", "search_type": "id"}' | jq '.'

# Response:
# {
#   "results": [{
#     "patient_id": "1000",
#     "name": "Miguel Antonio Garcia",
#     "birth_date": "2000-12-12",
#     "gender": "male",
#     "address": "2850 W 3500 S, West Valley City, UT, 84119",
#     "phone": "801-555-0233"
#   }],
#   "total": 1
# }
```

#### Get Patient Complete History
```bash
curl http://localhost:8002/api/v1/patients/1000 | jq '.'

# Returns:
# - Demographics
# - Conditions (with onset dates)
# - Medications (with dosages)
# - Allergies (with severity)
# - Age calculation
```

---

### 3. MA Conversational Chat (Intent-Based)

This is the **main endpoint** that powers the frontend chat interface.

```bash
# Patient Lookup Intent
curl -X POST http://localhost:8002/api/v1/ma/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Patient Miguel Garcia",
    "ma_session_id": "YOUR_SESSION_ID",
    "conversation_history": [],
    "current_patient_id": null
  }' | jq '.'

# AI automatically:
# 1. Classifies intent as "PATIENT_LOOKUP"
# 2. Extracts patient ID "1000"
# 3. Fetches patient from FHIR
# 4. Returns patient in metadata
# 5. Generates conversational response

# Response includes:
# {
#   "content": "I found Miguel Garcia...",
#   "intent": {"intent_type": "PATIENT_LOOKUP", ...},
#   "metadata": {
#     "patient": {
#       "patient": {...full patient data...},
#       "conditions": [...],
#       "medications": [...],
#       "allergies": [...]
#     }
#   }
# }
```

**Supported Intents**:
- `PATIENT_LOOKUP` - Find and load patient
- `TRIAGE_START` - Begin triage assessment
- `TESTING_CHECK` - Check required tests
- `SCHEDULE_REQUEST` - Find appointment slots
- `APPOINTMENT_CONFIRM` - Book appointment
- `GENERAL_QUESTION` - Answer questions

---

### 4. Intelligent Triage (Protocol-Based)

```bash
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "1000",
    "patient_name": "Miguel Garcia",
    "patient_age": 25,
    "patient_gender": "male",
    "patient_conditions": ["Asthma"],
    "symptoms": ["chest pain", "shortness of breath"],
    "symptom_details": {
      "reported_text": "Patient reports chest pain and difficulty breathing",
      "onset": "recent",
      "severity": "moderate"
    },
    "provider_name": "Dr. Martinez",
    "specialty": "Cardiology"
  }' | jq '.'

# Returns:
# {
#   "success": true,
#   "result": {
#     "protocol": "Chest Pain Protocol",
#     "risk_level": "HIGH",
#     "urgency": "urgent",
#     "immediate_actions": ["Take vital signs", "12-lead ECG", ...],
#     "test_ordering_plan": {
#       "immediate_tests": [...],
#       "pre_appointment_labs": [...],
#       "imaging": [...]
#     },
#     "workflow": {
#       "workflow_id": "uuid",
#       "checkpoints": [...]
#     }
#   }
# }
```

---

### 5. Appointment Scheduling

#### Get Recommended Slots
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 2,
    "triage_priority": "urgent",
    "patient_region": "Salt Lake"
  }' | jq '.'

# Returns top 3 slots:
# {
#   "recommendations": [
#     {
#       "provider": {"provider_id": 1, "name": "Dr. Sarah Martinez", ...},
#       "facility": {"facility_id": 2, "name": "Salt Lake Heart Center", ...},
#       "slot_datetime": "2025-12-20T10:00:00",
#       "duration_minutes": 30,
#       "urgency_match": "urgent"
#     },
#     ...
#   ]
# }
```

#### Book Appointment
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "1000",
    "provider_id": 1,
    "facility_id": 2,
    "specialty_id": 2,
    "appointment_datetime": "2025-12-20T10:00:00",
    "duration_minutes": 30,
    "urgency": "urgent",
    "reason_for_visit": "Chest pain evaluation",
    "triage_session_id": null
  }' | jq '.'

# Returns:
# {
#   "success": true,
#   "appointment_id": 123,
#   "confirmation_number": "APT-20251220-0001",
#   "scheduled_datetime": "2025-12-20T10:00:00",
#   "provider_name": "Dr. Sarah Martinez",
#   "facility_name": "Salt Lake Heart Center",
#   "facility_address": "324 10th Ave, Salt Lake City, UT"
# }
```

---

### 6. Appointments Management

#### List Appointments
```bash
# All appointments
curl "http://localhost:8002/api/v1/appointments?limit=10" | jq '.'

# Patient's appointments
curl "http://localhost:8002/api/v1/appointments?patient_fhir_id=1000" | jq '.'

# Today's appointments
curl "http://localhost:8002/api/v1/appointments/today/list?facility_id=2" | jq '.'

# Get appointment stats
curl "http://localhost:8002/api/v1/appointments/stats?facility_id=2" | jq '.'
```

#### Get Appointment Details
```bash
curl http://localhost:8002/api/v1/appointments/123 | jq '.'
```

---

### 7. Workflows (Triage Follow-up)

```bash
# Get active workflows
curl http://localhost:8002/api/v1/workflows/active | jq '.'

# Get patient's workflows
curl http://localhost:8002/api/v1/workflows/patient/1000 | jq '.'

# Get specific workflow
curl http://localhost:8002/api/v1/workflows/{workflow_id} | jq '.'

# Update checkpoint
curl -X POST http://localhost:8002/api/v1/workflows/{workflow_id}/checkpoints/Take%20vital%20signs/update \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoint_status": "completed",
    "details": "BP: 120/80, HR: 75, SpO2: 98%"
  }' | jq '.'

# Complete workflow
curl -X POST http://localhost:8002/api/v1/workflows/{workflow_id}/complete | jq '.'
```

---

### 8. Llama 4 AI Integration

#### Test Connection
```bash
curl http://localhost:8002/llama/test | jq '.'

# Response:
# {
#   "success": true,
#   "message": "Successfully connected to Llama 4 API",
#   "test_response": {...}
# }
```

#### Medical Triage with Llama 4
```bash
curl -X POST http://localhost:8002/llama/triage \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "severe chest pain radiating to left arm",
    "patient_history": {
      "age": "67",
      "gender": "male",
      "conditions": ["Hypertension", "MI history"]
    }
  }' | jq '.'

# Returns Llama 4 triage assessment
```

#### Summarize Clinical Notes
```bash
curl -X POST http://localhost:8002/llama/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "clinical_notes": "Patient presents with 3-day history of productive cough, fever up to 101F..."
  }' | jq '.'
```

#### General Chat
```bash
curl -X POST http://localhost:8002/llama/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are the symptoms of pneumonia?"}
    ],
    "max_tokens": 200,
    "temperature": 0.7
  }' | jq '.'
```

---

## 🎬 Complete End-to-End Demo Flow

### Frontend Flow (http://localhost:5173)

**Step 1: MA Context Selection**
1. Open http://localhost:5173
2. Enter MA name: "Sarah Johnson"
3. Select Facility: "Salt Lake Heart Center"
4. Select Specialty: "Cardiology"
5. Click "Start Shift"

**Step 2: Patient Lookup via Chat**
1. In chat, type: "Patient Miguel Garcia"
2. System automatically:
   - Searches FHIR
   - Loads patient 1000
   - Shows patient summary in right panel
   - Displays: Demographics, Conditions (Asthma), Medications, NO Allergies

**Step 3: Triage Symptoms**
1. Type: "Patient has chest pain and shortness of breath"
2. System automatically triggers intelligent triage
3. **Protocol Card** appears showing:
   - Protocol: Chest Pain Protocol
   - Risk Level: MODERATE (young, has asthma)
   - Immediate Actions: Vital signs, ECG, Pulse oximetry
   - Specialty: Cardiology

**Step 4: Test Ordering Timeline**
1. **Timeline Panel** appears with:
   - **Immediate Tests** (Today): Vital signs, ECG, Pulse ox
   - **Pre-Appointment Labs** (Tomorrow): Troponin, BNP, CBC, CMP
   - **Imaging** (Within 48h): Chest X-ray
2. MA clicks "Schedule Test" for each
3. MA clicks "Mark Complete" as tests finish

**Step 5: Appointment Scheduling**
1. When all required tests complete, **Appointment Panel** appears
2. Shows 3 recommended slots:
   - Dr. Sarah Martinez - Today 2:00 PM (Emergency slot)
   - Dr. Michael Chen - Tomorrow 9:00 AM
   - Dr. Lisa Wong - Tomorrow 2:00 PM
3. MA clicks "Book Appointment" on preferred slot
4. Confirmation shown: APT-20251220-0001

**Step 6: View Appointments**
1. Navigate to `/appointments` page
2. See all booked appointments
3. Filter by date, status, urgency
4. Click appointment card for full details

---

## 📋 Test Patient Database

### Available Test Patients (Use these IDs):

| FHIR ID | Name | Age | Conditions | Allergies | Test Scenarios |
|---------|------|-----|------------|-----------|----------------|
| **1000** | Miguel Garcia | 25M | Asthma | None | Respiratory, Young Adult |
| **1003** | Sarah Thompson | 40F | Type 1 DM, Hypothyroid | **Latex** | Endocrine, Drug Allergy |
| **1008** | Thanh Nguyen | 83F | MI History, Heart Failure | None | Geriatric, Cardiac Emergency |
| **1015** | Robert Anderson | 67M | Recent MI, HTN | None | Cardiac, Post-MI Follow-up |
| **1022** | Elena Martinez | 50F | A-fib, HTN | None | Anticoagulation, Stroke Risk |
| **1027** | Michael Johnson | 35M | Knee OA | None | Orthopedic |
| **1030** | Jennifer Peterson | 37F | Radius Fracture | **Penicillin (HIGH)** | Orthopedic, Critical Allergy |
| **1034** | Dorothy Williams | 77F | COPD, Asthma | **Latex** | Geriatric, Respiratory |
| **1039** | Christopher Davis | 30M | None | None | Healthy, Preventive Care |
| **1040** | Emily Brown | 9F | Asthma | **Cashew (HIGH)** | Pediatric, Anaphylaxis Risk |
| **1044** | James Miller | 53M | Type 2 DM, HTN | None | Metabolic Syndrome |
| **1049** | Patricia Wilson | 70F | Osteoporosis, RA | **Sulfonamide** | Rheumatology |
| **1054** | Daniel Taylor | 27M | None | None | Healthy, Sports Physical |
| **1055** | Carlos Rodriguez | 62M | CKD, Type 2 DM, HTN | None | Complex Chronic Disease |
| **1062** | Susan Lee | 45F | Hypothyroidism | **Penicillin (MOD)** | Endocrine |

### Alternative Patient IDs (also available):
- P232, P233, P234, P235, P236, P237 (simplified test patients)

---

## 🧪 Quick Test Commands

### Test Complete MA Workflow
```bash
# 1. Create session
SESSION_RESPONSE=$(curl -s -X POST http://localhost:8002/api/v1/ma/session \
  -H "Content-Type: application/json" \
  -d '{"ma_name":"Test MA","facility_id":2,"specialty_id":2}')
echo $SESSION_RESPONSE | jq '.'
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.session_id')

# 2. Search patient (via chat)
curl -X POST http://localhost:8002/api/v1/ma/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Patient Miguel Garcia\",
    \"ma_session_id\": \"$SESSION_ID\",
    \"conversation_history\": [],
    \"current_patient_id\": null
  }" | jq '.metadata.patient.patient.name'

# 3. Perform triage
curl -X POST http://localhost:8002/api/v1/ma/intelligent-triage \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "1000",
    "patient_name": "Miguel Garcia",
    "patient_age": 25,
    "patient_gender": "male",
    "patient_conditions": ["Asthma"],
    "symptoms": ["chest pain", "shortness of breath"],
    "specialty": "Cardiology",
    "provider_name": "Dr. Martinez"
  }' | jq '.result.urgency'

# 4. Find slots
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 2,
    "triage_priority": "urgent",
    "patient_region": "Salt Lake"
  }' | jq '.recommendations | length'

# 5. Book appointment
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "1000",
    "provider_id": 1,
    "facility_id": 2,
    "specialty_id": 2,
    "appointment_datetime": "2025-12-20T14:00:00",
    "duration_minutes": 30,
    "urgency": "urgent",
    "reason_for_visit": "Chest pain evaluation"
  }' | jq '.confirmation_number'
```

---

## 🎯 Investor Demo Script

**Opening (30 seconds)**:
"This is our Medical Assistant Triage & Scheduling System. It combines AI-powered triage with intelligent appointment scheduling."

**Demo (3 minutes)**:
1. **Show MA Login** (10s)
   - "MA starts their shift, selects facility and specialty"

2. **Patient Lookup** (20s)
   - Type: "Patient Miguel Garcia"
   - "System finds patient in FHIR, shows complete medical history"

3. **Intelligent Triage** (45s)
   - Type: "Patient has chest pain and shortness of breath"
   - **HIGHLIGHT**: Protocol card activates automatically
   - "System identifies Chest Pain Protocol, assesses risk, generates action plan"
   - Show test ordering timeline

4. **AI Integration** (30s)
   - "We integrate both OpenAI GPT-4 AND Google's new Llama 4 model"
   - Show Llama test: http://localhost:8002/llama/test

5. **Appointment Booking** (45s)
   - Show appointment slots
   - Book appointment
   - Show confirmation
   - Navigate to appointments page

**Closing (30 seconds)**:
"System handles: Patient lookup, AI triage, protocol activation, test ordering, and appointment scheduling - all in one seamless workflow."

---

## 🔧 Troubleshooting

### Frontend not loading?
```bash
# Check if running
lsof -i :5173

# If not, restart
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project/frontend-new
npm run dev
```

### Backend errors?
```bash
# Check logs
docker-compose logs --tail=50 fhir-chat-api

# Restart
docker-compose restart fhir-chat-api
```

### Patient not found?
Use IDs: 1000, 1003, 1008, 1015, 1022, 1027, 1030, 1034, 1039, 1040, 1044, 1049, 1054, 1055, 1062
Or: P232, P233, P234, P235, P236, P237

### Llama 4 not working?
```bash
# Check credentials
gcloud auth application-default print-access-token

# If expired, refresh
gcloud auth application-default login

# Restart backend
docker-compose restart fhir-chat-api
```

---

## ✅ Pre-Demo Checklist

- [ ] Backend healthy: `curl http://localhost:8002/health`
- [ ] Frontend accessible: http://localhost:5173
- [ ] Llama 4 connected: `curl http://localhost:8002/llama/test`
- [ ] Facilities loaded: `curl http://localhost:8002/api/v1/facilities | jq 'length'` (should be 7)
- [ ] Specialties loaded: `curl http://localhost:8002/api/v1/specialties | jq 'length'` (should be 22)
- [ ] Patients in FHIR: `curl "http://localhost:8081/fhir/Patient?_count=1" | jq '.entry | length'` (should be >= 1)
- [ ] Test patient search: Search for "Miguel Garcia" or ID "1000"

---

**SYSTEM IS READY FOR DEMO! 🚀**

Last verified: 2026-01-09
