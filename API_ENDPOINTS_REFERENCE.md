# MediChat API Endpoints Reference

## Base URL
```
Local: http://localhost:8002
```

## API Version
All endpoints use the `/api/v1/` prefix.

---

## Endpoints

### Health & Status

#### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "version": "2.0.0"
}
```

**Example:**
```bash
curl http://localhost:8002/health
```

---

### Patient Data

#### GET /api/v1/patients/{patient_id}
Get comprehensive patient history

**Parameters:**
- `patient_id` (path) - FHIR Patient ID

**Response:**
```json
{
  "patient_id": "232",
  "data": {
    "patient": {
      "id": "232",
      "name": "...",
      "gender": "female",
      "birthDate": "1966-12-13",
      "address": "...",
      "telecom": "..."
    },
    "conditions": [...],
    "medications": [...],
    "allergies": [...]
  }
}
```

**Example:**
```bash
curl http://localhost:8002/api/v1/patients/232
```

---

#### GET /api/v1/patients/{patient_id}/demographics
Get only patient demographics

**Example:**
```bash
curl http://localhost:8002/api/v1/patients/232/demographics
```

---

#### GET /api/v1/patients/{patient_id}/conditions
Get patient conditions/diagnoses

**Example:**
```bash
curl http://localhost:8002/api/v1/patients/232/conditions
```

---

#### GET /api/v1/patients/{patient_id}/medications
Get patient medications

**Example:**
```bash
curl http://localhost:8002/api/v1/patients/232/medications
```

---

#### GET /api/v1/patients/{patient_id}/allergies
Get patient allergies

**Example:**
```bash
curl http://localhost:8002/api/v1/patients/232/allergies
```

---

### Triage

#### POST /api/v1/triage
Perform medical triage assessment

**Request Body:**
```json
{
  "message": "I have severe chest pain and shortness of breath",
  "patient_id": "232",  // optional
  "symptoms": []  // optional - will be extracted if not provided
}
```

**Response:**
```json
{
  "priority": "emergency",
  "reasoning": "Symptoms indicate potential heart attack...",
  "confidence": "high",
  "red_flags": [
    "severe chest pain",
    "shortness of breath"
  ],
  "recommendations": {
    "immediate_action": "Call 911 immediately",
    "care_level": "Emergency Room",
    "timeframe": "Immediate",
    "warning_signs": [...]
  },
  "extracted_symptoms": [...],
  "patient_context": {...}
}
```

**Priority Levels:**
- `emergency` - Life-threatening, immediate care needed
- `urgent` - Serious, care within hours
- `semi-urgent` - Care within 24-48 hours
- `non-urgent` - Routine care, days/weeks

**Example:**
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe chest pain and shortness of breath for 2 hours",
    "patient_id": "232"
  }'
```

---

### Chat

#### POST /api/v1/chat
Interactive chat with symptom extraction

**Request Body:**
```json
{
  "message": "I have a headache",
  "patient_id": "232",  // optional
  "conversation_history": []  // optional
}
```

**Response:**
```json
{
  "response": "I understand you have a headache. Can you tell me...",
  "extracted_symptoms": [...],
  "patient_context": {...}
}
```

**Example:**
```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a headache and fever",
    "patient_id": "232"
  }'
```

---

#### POST /api/v1/extract-symptoms
Extract symptoms from text using NLP

**Request Body:**
```json
{
  "text": "I have chest pain that started 2 hours ago",
  "patient_id": "232"  // optional
}
```

**Example:**
```bash
curl -X POST http://localhost:8002/api/v1/extract-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I have chest pain and difficulty breathing"
  }'
```

---

### Provider Search & Scheduling

#### GET /api/v1/providers/search
Search for providers by specialty and region

**Query Parameters:**
- `specialty_id` (required) - Medical specialty ID (1-21)
- `region` (optional) - Utah region name
- `accepts_new_patients` (optional) - Default: true

**Response:**
```json
{
  "providers": [
    {
      "provider_id": 15,
      "npi": "1258837673",
      "name": "Dr. Alexander Mitchell",
      "credentials": "DO",
      "specialty": "Cardiology",
      "years_experience": 17,
      "languages": ["English", "Spanish", "Mandarin"]
    }
  ],
  "count": 2
}
```

**Example:**
```bash
# Search for cardiologists in Salt Lake Valley
curl "http://localhost:8002/api/v1/providers/search?specialty_id=2&region=Salt%20Lake%20Valley"
```

---

#### POST /api/v1/scheduling/recommend
Get intelligent appointment slot recommendations

**Request Body:**
```json
{
  "specialty_id": 2,
  "triage_priority": "urgent",
  "patient_fhir_id": "232",  // optional
  "patient_region": "Salt Lake Valley",  // optional
  "preferred_date_range": {  // optional
    "start": "2025-12-13",
    "end": "2025-12-20"
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "provider": {...},
      "facility": {...},
      "slot_datetime": "2025-12-15T08:00:00",
      "duration_minutes": 15,
      "reasoning": "Blake Miller has 20 years experience",
      "match_score": 0.52,
      "distance_miles": 20.0
    }
  ],
  "total_options_found": 3,
  "message": "Found 3 recommended slots"
}
```

**Example:**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 2,
    "triage_priority": "urgent",
    "patient_region": "Salt Lake Valley",
    "preferred_date_range": {
      "start": "2025-12-13",
      "end": "2025-12-20"
    }
  }'
```

---

#### POST /api/v1/scheduling/book
Book an appointment slot

**Request Body:**
```json
{
  "provider_id": 15,
  "facility_id": 2,
  "specialty_id": 2,
  "patient_fhir_id": "232",
  "appointment_datetime": "2025-12-15T08:00:00",
  "duration_minutes": 15,
  "urgency": "urgent",
  "reason_for_visit": "chest pain evaluation",  // optional
  "triage_session_id": "abc123"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "appointment_id": 123,
  "confirmation_number": "APPT-2025-123",
  "fhir_appointment_id": "fhir-123"
}
```

**Example:**
```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 15,
    "facility_id": 2,
    "specialty_id": 2,
    "patient_fhir_id": "232",
    "appointment_datetime": "2025-12-15T08:00:00",
    "duration_minutes": 15,
    "urgency": "urgent",
    "reason_for_visit": "chest pain evaluation"
  }'
```

---

## Specialty IDs Reference

| ID | Specialty Name |
|----|----------------|
| 1 | Family Medicine |
| 2 | Cardiology |
| 3 | Orthopedics |
| 4 | Dermatology |
| 5 | Mental Health |
| 6 | Neurology |
| 7 | Gastroenterology |
| 8 | Pulmonology |
| 9 | Endocrinology |
| 10 | Nephrology |
| 11 | Oncology |
| 12 | Rheumatology |
| 13 | Ophthalmology |
| 14 | ENT |
| 15 | Urology |
| 16 | OB/GYN |
| 17 | Pediatrics |
| 18 | Geriatrics |
| 19 | Infectious Disease |
| 20 | Hematology |
| 21 | Pain Management |

---

## Utah Regions Reference

Available regions for provider search:
- Cache Valley
- Davis/Weber
- Salt Lake Valley
- Uintah Basin
- Washington County

### Provider Distribution by Region

**Cardiology (specialty_id=2):**
- Cache Valley: 1 provider
- Davis/Weber: 3 providers
- Salt Lake Valley: 3 providers (recommended for testing)
- Uintah Basin: 1 provider
- Washington County: 2 providers

---

## Error Responses

### 404 Not Found
```json
{
  "detail": "Patient with ID 999 not found"
}
```

### 400 Bad Request
```json
{
  "detail": "Invalid specialty_id"
}
```

### 409 Conflict (Appointment Booking)
```json
{
  "success": false,
  "code": 409,
  "error": "Slot already booked by another patient"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to perform triage assessment: <error details>"
}
```

---

## Testing Tips

### 1. Get a Real Patient ID
```bash
PATIENT_ID=$(curl -s "http://localhost:8081/fhir/Patient?_count=1" | jq -r '.entry[0].resource.id')
echo $PATIENT_ID
```

### 2. Test Complete Triage Flow
```bash
# 1. Get patient
# 2. Triage
# 3. Get recommendations
# 4. Search providers
# 5. Book appointment

See: test_complete_flow.sh
```

### 3. Test Different Urgency Levels
```bash
# Emergency
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "severe chest pain radiating to arm"}'

# Routine
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "skin rash for a week"}'
```

---

## Interactive API Documentation

Access Swagger UI for interactive testing:
```
http://localhost:8002/docs
```

Access ReDoc for detailed documentation:
```
http://localhost:8002/redoc
```

---

## Rate Limiting

Currently no rate limiting implemented (suitable for development/testing).

For production deployment, implement rate limiting at the API gateway or middleware level.

---

## Authentication

Currently no authentication required (development mode).

For production deployment, implement JWT or OAuth2 authentication.
