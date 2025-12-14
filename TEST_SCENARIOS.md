# MediChat API Testing Scenarios & Test Data

## 🌐 Service URLs

### Backend API
- **Base URL:** `http://localhost:8002`
- **Swagger UI:** `http://localhost:8002/docs`
- **Health Check:** `http://localhost:8002/health`

### HAPI FHIR Server
- **Base URL:** `http://localhost:8081/fhir`
- **Metadata:** `http://localhost:8081/fhir/metadata`

### Frontend
- **Application:** `http://localhost:3000`

### Databases
- **Tribal DB:** `postgresql://tribaluser:tribalpassword@localhost:5433/tribal_knowledge`
- **FHIR DB:** `postgresql://fhiruser:fhirpassword@localhost:5434/hapi_fhir`

### Admin Tools
- **PgAdmin:** `http://localhost:5050` (dev profile only)
  - Email: admin@example.com
  - Password: admin123

---

## 📊 Test Data Reference

### Patient IDs (500 generated)
```
PT-00001 through PT-00500
```

**Sample Patient IDs for Testing:**
- `PT-00001` - First patient
- `PT-00050` - Mid-range patient
- `PT-00100` - Round number for easy testing
- `PT-00250` - Another mid-point
- `PT-00500` - Last patient

### Provider IDs (50 providers)
```
1 through 50
```

**Providers by Specialty:**
- **Family Medicine:** Provider IDs 1-10
- **Cardiology:** Provider IDs 11-20
- **Orthopedics:** Provider IDs 21-30
- **Dermatology:** Provider IDs 31-40
- **Mental Health:** Provider IDs 41-50

### Facility IDs (21 facilities)
```
1 through 21
```

**Facilities by Region:**
- **Salt Lake Valley:** Facility IDs 1-3
- **Utah County:** Facility IDs 4-6
- **Davis/Weber:** Facility IDs 7-9
- **Cache Valley:** Facility IDs 10-12
- **Washington County:** Facility IDs 13-15
- **Central Utah:** Facility IDs 16-18
- **Uintah Basin:** Facility IDs 19-21

### Specialty IDs
- `1` - Family Medicine
- `2` - Cardiology
- `3` - Orthopedics
- `4` - Dermatology
- `5` - Mental Health

### Utah Regions
- `Salt Lake Valley`
- `Utah County`
- `Davis/Weber`
- `Cache Valley`
- `Washington County`
- `Central Utah`
- `Uintah Basin`

---

## 🧪 Test Scenarios

### Scenario 1: Emergency - Chest Pain (Cardiology)

**Step 1: Perform Triage**
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Patient has severe chest pain radiating to left arm, started 30 minutes ago. Also experiencing shortness of breath, sweating, and nausea.",
    "patient_id": "PT-00001"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "priority": "emergency",
  "reasoning": "Severe chest pain with radiation suggests acute coronary syndrome requiring immediate evaluation",
  "confidence": "high",
  "red_flags": [
    "Chest pain radiating to arm",
    "Shortness of breath",
    "Nausea with chest pain"
  ],
  "recommendations": {
    "immediate_action": "Call 911 immediately",
    "care_level": "Emergency Department",
    "timeframe": "Immediate",
    "warning_signs": ["Worsening pain", "Loss of consciousness"]
  }
}
```

**Step 2: Verify Emergency Warning**
> Emergency cases should NOT proceed to scheduling - system should show warning

---

### Scenario 2: Urgent - High Fever (Family Medicine)

**Step 1: Perform Triage**
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "103.5°F fever for 6 hours, severe chills, body aches. Patient is diabetic.",
    "patient_id": "PT-00050"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "priority": "urgent",
  "confidence": "high"
}
```

**Step 2: Get Slot Recommendations**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 1,
    "triage_priority": "urgent",
    "patient_fhir_id": "PT-00050",
    "patient_region": "Salt Lake Valley",
    "preferred_date_range": {
      "start": "2025-12-13",
      "end": "2025-12-15"
    }
  }' | jq '.'
```

**Expected Response:**
```json
{
  "recommendations": [
    {
      "provider": {
        "provider_id": 1,
        "name": "Dr. [First] [Last]",
        "specialty": "Family Medicine",
        "years_experience": 12
      },
      "facility": {
        "facility_id": 1,
        "name": "[City] Medical Center",
        "region": "Salt Lake Valley"
      },
      "slot_datetime": "2025-12-13T10:00:00",
      "duration_minutes": 15,
      "match_score": 0.85
    }
  ],
  "total_options_found": 3
}
```

**Step 3: Book Appointment**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 1,
    "facility_id": 1,
    "specialty_id": 1,
    "patient_fhir_id": "PT-00050",
    "appointment_datetime": "2025-12-13T10:00:00",
    "duration_minutes": 15,
    "urgency": "urgent",
    "reason_for_visit": "High fever evaluation - diabetic patient"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "appointment_id": 1,
  "confirmation_number": "ABC12345",
  "fhir_appointment_id": "APPT-ABC123456789"
}
```

---

### Scenario 3: Semi-Urgent - Ankle Injury (Orthopedics)

**Step 1: Perform Triage**
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Twisted ankle yesterday playing basketball. Swollen and painful but can bear some weight. No visible deformity.",
    "patient_id": "PT-00100"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "priority": "semi-urgent",
  "confidence": "medium"
}
```

**Step 2: Get Slot Recommendations**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 3,
    "triage_priority": "semi-urgent",
    "patient_fhir_id": "PT-00100",
    "patient_region": "Utah County"
  }' | jq '.'
```

**Step 3: Book Appointment**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 21,
    "facility_id": 4,
    "specialty_id": 3,
    "patient_fhir_id": "PT-00100",
    "appointment_datetime": "2025-12-15T14:00:00",
    "duration_minutes": 15,
    "urgency": "semi-urgent",
    "reason_for_visit": "Ankle injury evaluation"
  }' | jq '.'
```

---

### Scenario 4: Non-Urgent - Skin Rash (Dermatology)

**Step 1: Perform Triage**
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mild itchy rash on arms for 3 days. No pain, fever, or spreading. Possibly from new detergent.",
    "patient_id": "PT-00250"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "priority": "non-urgent",
  "confidence": "high"
}
```

**Step 2: Get Slot Recommendations (Extended Date Range)**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 4,
    "triage_priority": "non-urgent",
    "patient_fhir_id": "PT-00250",
    "patient_region": "Salt Lake Valley",
    "preferred_date_range": {
      "start": "2025-12-20",
      "end": "2025-12-31"
    }
  }' | jq '.'
```

**Step 3: Book Appointment**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 31,
    "facility_id": 1,
    "specialty_id": 4,
    "patient_fhir_id": "PT-00250",
    "appointment_datetime": "2025-12-23T09:00:00",
    "duration_minutes": 15,
    "urgency": "non-urgent",
    "reason_for_visit": "Skin rash evaluation"
  }' | jq '.'
```

---

### Scenario 5: Mental Health - Anxiety

**Step 1: Perform Triage**
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Increased anxiety and panic attacks over past 2 weeks. Difficulty sleeping. No suicidal thoughts.",
    "patient_id": "PT-00500"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "priority": "urgent",
  "confidence": "medium"
}
```

**Step 2: Get Slot Recommendations**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 5,
    "triage_priority": "urgent",
    "patient_fhir_id": "PT-00500",
    "patient_region": "Cache Valley"
  }' | jq '.'
```

---

### Scenario 6: Search Providers

**Search by Specialty Only:**
```bash
curl "http://localhost:8002/api/v1/providers/search?specialty_id=1" | jq '.'
```

**Search by Specialty and Region:**
```bash
curl "http://localhost:8002/api/v1/providers/search?specialty_id=2&region=Salt%20Lake%20Valley" | jq '.'
```

**Expected Response:**
```json
{
  "providers": [
    {
      "provider_id": 11,
      "npi": "1234567890",
      "name": "Dr. [First] [Last]",
      "credentials": "MD",
      "specialty": "Cardiology",
      "years_experience": 15,
      "languages": ["English", "Spanish"]
    }
  ],
  "count": 10
}
```

---

### Scenario 7: Get Patient History

```bash
curl -X GET "http://localhost:8002/api/v1/patients/PT-00001" | jq '.'
```

**Expected Response:**
```json
{
  "patient_id": "PT-00001",
  "data": {
    "patient": {
      "id": "PT-00001",
      "gender": "male",
      "birthDate": "1985-03-15"
    },
    "conditions": [],
    "medications": [],
    "observations": [],
    "allergies": []
  }
}
```

---

### Scenario 8: Double Booking Prevention (Race Condition Test)

**First Booking (Should Succeed):**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 5,
    "facility_id": 2,
    "specialty_id": 1,
    "patient_fhir_id": "PT-00001",
    "appointment_datetime": "2025-12-14T10:00:00",
    "duration_minutes": 15,
    "urgency": "urgent",
    "reason_for_visit": "First booking"
  }' | jq '.'
```

**Expected:** `{"success": true, "appointment_id": X, "confirmation_number": "..."}`

**Second Booking (Should Fail with 409):**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 5,
    "facility_id": 2,
    "specialty_id": 1,
    "patient_fhir_id": "PT-00002",
    "appointment_datetime": "2025-12-14T10:00:00",
    "duration_minutes": 15,
    "urgency": "urgent",
    "reason_for_visit": "Second booking - same slot"
  }' | jq '.'
```

**Expected:** `{"detail": "Slot no longer available"}` with HTTP 409

---

## 🔍 Verification Queries

### Check Data in Tribal DB

```bash
# Connect to tribal DB
docker exec -it postgres-tribal-db psql -U tribaluser -d tribal_knowledge

# Count data
SELECT 'specialties' as table_name, COUNT(*) FROM specialties
UNION ALL SELECT 'providers', COUNT(*) FROM providers
UNION ALL SELECT 'facilities', COUNT(*) FROM facilities
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'provider_availability', COUNT(*) FROM provider_availability
UNION ALL SELECT 'provider_preferences', COUNT(*) FROM provider_preferences
UNION ALL SELECT 'clinic_rules', COUNT(*) FROM clinic_rules;

# View providers
SELECT provider_id, first_name, last_name, npi, specialty_id, facility_id
FROM providers
LIMIT 10;

# View appointments
SELECT appointment_id, patient_fhir_id, provider_id, appointment_datetime, urgency, status
FROM appointments
ORDER BY created_at DESC
LIMIT 10;
```

### Check Data in FHIR Server

```bash
# Count patients
curl "http://localhost:8081/fhir/Patient?_summary=count" | jq '.total'

# Get first patient
curl "http://localhost:8081/fhir/Patient/PT-00001" | jq '.'

# Count practitioners
curl "http://localhost:8081/fhir/Practitioner?_summary=count" | jq '.total'

# Count organizations
curl "http://localhost:8081/fhir/Organization?_summary=count" | jq '.total'
```

---

## 📝 Complete Test Script

Save as `run_all_tests.sh`:

```bash
#!/bin/bash

API_BASE="http://localhost:8002"

echo "====================================="
echo "MediChat API Test Suite"
echo "====================================="

# Test 1: Health Check
echo -e "\n[Test 1] Health Check"
curl -s "${API_BASE}/health" | jq '.'

# Test 2: Emergency Triage (should NOT schedule)
echo -e "\n[Test 2] Emergency Triage"
curl -s -X POST "${API_BASE}/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{"message": "Severe chest pain radiating to left arm", "patient_id": "PT-00001"}' | jq '.priority'

# Test 3: Urgent Triage + Schedule + Book
echo -e "\n[Test 3] Urgent Case - Full Workflow"
TRIAGE_RESULT=$(curl -s -X POST "${API_BASE}/api/v1/triage" \
  -H "Content-Type: application/json" \
  -d '{"message": "103.5F fever for 6 hours, diabetic patient", "patient_id": "PT-00050"}')

echo "Triage Priority: $(echo $TRIAGE_RESULT | jq -r '.priority')"

echo "Getting slot recommendations..."
SLOTS=$(curl -s -X POST "${API_BASE}/api/v1/scheduling/recommend" \
  -H "Content-Type: application/json" \
  -d '{"specialty_id": 1, "triage_priority": "urgent", "patient_fhir_id": "PT-00050", "patient_region": "Salt Lake Valley"}')

echo "Found $(echo $SLOTS | jq -r '.total_options_found') slots"

echo "Booking appointment..."
BOOKING=$(curl -s -X POST "${API_BASE}/api/v1/scheduling/book" \
  -H "Content-Type: application/json" \
  -d '{"provider_id": 1, "facility_id": 1, "specialty_id": 1, "patient_fhir_id": "PT-00050", "appointment_datetime": "2025-12-13T10:00:00", "duration_minutes": 15, "urgency": "urgent", "reason_for_visit": "Fever evaluation"}')

echo "Confirmation Number: $(echo $BOOKING | jq -r '.confirmation_number')"

# Test 4: Provider Search
echo -e "\n[Test 4] Provider Search"
curl -s "${API_BASE}/api/v1/providers/search?specialty_id=2&region=Salt%20Lake%20Valley" | jq '.count'

echo -e "\n====================================="
echo "All Tests Complete!"
echo "====================================="
```

**Run:**
```bash
chmod +x run_all_tests.sh
./run_all_tests.sh
```

---

## 🎯 Success Criteria

- ✅ **Health Check:** Returns `{"status": "healthy"}`
- ✅ **Triage:** Returns priority level (emergency/urgent/semi-urgent/non-urgent)
- ✅ **Recommendations:** Returns 1-3 slot recommendations
- ✅ **Booking:** Returns confirmation number
- ✅ **Provider Search:** Returns list of providers
- ✅ **Double Booking:** Second attempt returns 409 Conflict
- ✅ **Response Time:** API responses <500ms (p95)

---

## 📊 Expected Data Counts

After successful data generation:

| Resource | Count |
|----------|-------|
| Specialties | 5 |
| Providers | 50 |
| Facilities | 21 |
| Patients | 500 |
| Conditions | ~1,500 |
| Observations | ~2,500 |
| Medications | ~1,200 |
| Allergies | ~300 |
| Provider Availability | ~350 |
| Provider Preferences | 150 |
| Clinic Rules | 63 |

---

## 🚀 Quick Start Testing

**1. Verify Services Running:**
```bash
docker ps
```

**2. Test Backend Health:**
```bash
curl http://localhost:8002/health
```

**3. Test FHIR Server:**
```bash
curl http://localhost:8081/fhir/metadata | jq '.fhirVersion'
```

**4. Run Simple Triage Test:**
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "Headache for 2 days", "patient_id": "PT-00100"}' | jq '.priority'
```

**5. Get Slot Recommendations:**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{"specialty_id": 1, "triage_priority": "non-urgent", "patient_region": "Salt Lake Valley"}' | jq '.total_options_found'
```

---

**Ready to test!** 🎉

All URLs, test data, and scenarios are documented above. Data generation is running in background and should complete within 5-10 minutes.
