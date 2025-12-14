# Quick API Test Examples

Server running at: **http://localhost:8002**

## Quick Copy-Paste Tests

### 1. Health Check
```bash
curl http://localhost:8002/health
```

### 2. Emergency Triage (Chest Pain)
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have crushing chest pain radiating to my left arm. I am sweating and short of breath."
  }'
```

### 3. Symptom Extraction
```bash
curl -X POST http://localhost:8002/api/v1/extract-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I have severe headache, fever of 102F, and stiff neck for 2 days"
  }'
```

### 4. Chat Endpoint
```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been coughing for a week and now have chest pain when I breathe"
  }'
```

### 5. Non-Urgent Triage (Common Cold)
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have mild runny nose and occasional sneezing for 2 days. No fever."
  }'
```

### 6. Urgent Triage (Potential Appendicitis)
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Severe pain in my lower right abdomen that started yesterday. Pain is constant and rated 8/10. Also nauseous."
  }'
```

### 7. Pediatric Emergency
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My 2-month-old baby has a fever of 100.8F"
  }'
```

### 8. Get Patient Data (Replace PATIENT_ID)
```bash
# Replace 'example-patient-123' with actual patient ID
curl http://localhost:8002/api/v1/patients/example-patient-123
```

### 9. Triage with Patient Context
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have chest tightness and shortness of breath",
    "patient_id": "example-patient-123"
  }'
```

### 10. Complex Multi-Symptom Case
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am 65 years old with diabetes and high blood pressure. For the past 3 days I have had increasing shortness of breath, productive cough with yellow sputum, and fever of 101F."
  }'
```

---

## Complete API Endpoint Examples

### 1. GET /health - Health Check
**Description**: Check if the API server is running

```bash
curl http://localhost:8002/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### 2. GET /api/v1/patients/{patient_id} - Get Complete Patient History
**Description**: Retrieve all patient data including demographics, conditions, medications, and allergies

```bash
# Replace with actual patient ID from your FHIR server
curl http://localhost:8002/api/v1/patients/example-patient-123
```

**Expected Response**:
```json
{
  "patient_id": "example-patient-123",
  "data": {
    "patient": {
      "id": "example-patient-123",
      "name": "John Doe",
      "birthDate": "1980-01-15",
      "gender": "male"
    },
    "conditions": [...],
    "medications": [...],
    "allergies": [...]
  }
}
```

---

### 3. GET /api/v1/patients/{patient_id}/demographics - Get Patient Demographics
**Description**: Retrieve only patient demographic information

```bash
curl http://localhost:8002/api/v1/patients/example-patient-123/demographics
```

**Expected Response**:
```json
{
  "id": "example-patient-123",
  "name": [
    {
      "use": "official",
      "family": "Doe",
      "given": ["John"]
    }
  ],
  "gender": "male",
  "birthDate": "1980-01-15",
  "address": [...],
  "telecom": [...]
}
```

---

### 4. GET /api/v1/patients/{patient_id}/conditions - Get Patient Conditions
**Description**: Retrieve patient's medical conditions and diagnoses

```bash
curl http://localhost:8002/api/v1/patients/example-patient-123/conditions
```

**Expected Response**:
```json
{
  "patient_id": "example-patient-123",
  "conditions": [
    {
      "code": "44054006",
      "display": "Type 2 Diabetes Mellitus",
      "clinicalStatus": "active",
      "onsetDateTime": "2015-03-10"
    },
    {
      "code": "38341003",
      "display": "Hypertension",
      "clinicalStatus": "active",
      "onsetDateTime": "2012-06-15"
    }
  ]
}
```

---

### 5. GET /api/v1/patients/{patient_id}/medications - Get Patient Medications
**Description**: Retrieve patient's current and past medications

```bash
curl http://localhost:8002/api/v1/patients/example-patient-123/medications
```

**Expected Response**:
```json
{
  "patient_id": "example-patient-123",
  "medications": [
    {
      "medication": "Metformin 500mg",
      "status": "active",
      "dosage": "500mg twice daily"
    },
    {
      "medication": "Lisinopril 10mg",
      "status": "active",
      "dosage": "10mg once daily"
    }
  ]
}
```

---

### 6. GET /api/v1/patients/{patient_id}/allergies - Get Patient Allergies
**Description**: Retrieve patient's known allergies and intolerances

```bash
curl http://localhost:8002/api/v1/patients/example-patient-123/allergies
```

**Expected Response**:
```json
{
  "patient_id": "example-patient-123",
  "allergies": [
    {
      "substance": "Penicillin",
      "reaction": "Anaphylaxis",
      "severity": "severe",
      "criticality": "high"
    },
    {
      "substance": "Peanuts",
      "reaction": "Hives",
      "severity": "moderate",
      "criticality": "low"
    }
  ]
}
```

---

### 7. POST /api/v1/chat - Chat with Symptom Extraction
**Description**: Interactive chat that extracts symptoms from conversation

**Basic Chat (No Patient Context)**:
```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been coughing for a week and now have chest pain when I breathe"
  }'
```

**Chat with Patient Context**:
```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My throat hurts when I swallow and I have a fever",
    "patient_id": "example-patient-123"
  }'
```

**Chat with Conversation History**:
```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "The pain gets worse when I cough",
    "patient_id": "example-patient-123",
    "conversation_history": [
      {
        "role": "user",
        "content": "I have chest pain on the left side"
      },
      {
        "role": "assistant",
        "content": "I understand you are experiencing chest pain. Can you tell me more about it?"
      }
    ]
  }'
```

**Expected Response**:
```json
{
  "response": "I understand you're experiencing cough and chest pain when breathing. This could indicate a respiratory infection or pleurisy. Can you tell me if you have any fever?",
  "extracted_symptoms": [
    {
      "symptom": "cough",
      "severity": null,
      "duration": "1 week",
      "location": "chest"
    },
    {
      "symptom": "chest pain",
      "severity": null,
      "duration": null,
      "location": "chest"
    }
  ],
  "patient_context": null
}
```

---

### 8. POST /api/v1/extract-symptoms - Extract Symptoms from Text
**Description**: Extract structured symptom data from natural language text

**Basic Symptom Extraction**:
```bash
curl -X POST http://localhost:8002/api/v1/extract-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I have severe headache, fever of 102F, and stiff neck for 2 days"
  }'
```

**With Patient Context**:
```bash
curl -X POST http://localhost:8002/api/v1/extract-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Patient reports severe abdominal pain in the lower right quadrant that started yesterday evening. Pain is sharp and constant, rated 8/10. Also experiencing nausea and loss of appetite.",
    "patient_id": "example-patient-123"
  }'
```

**Expected Response**:
```json
{
  "extracted_symptoms": [
    {
      "symptom": "headache",
      "severity": "severe",
      "duration": "2 days",
      "location": "head"
    },
    {
      "symptom": "fever",
      "severity": "moderate",
      "duration": "2 days",
      "location": null
    },
    {
      "symptom": "stiff neck",
      "severity": null,
      "duration": "2 days",
      "location": "neck"
    }
  ],
  "summary": "Patient presents with severe headache, moderate fever (102°F), and neck stiffness lasting 2 days. This combination suggests possible meningitis.",
  "raw_response": "..."
}
```

---

### 9. POST /api/v1/triage - Perform Triage Assessment
**Description**: Get comprehensive triage assessment with priority, recommendations, and care guidance

**Emergency Case (Chest Pain)**:
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have crushing chest pain radiating to my left arm and jaw. I am sweating profusely and short of breath."
  }'
```

**Urgent Case (Appendicitis)**:
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Severe pain in my lower right abdomen that started yesterday. Pain is constant and rated 8/10. Also nauseous."
  }'
```

**Non-Urgent Case (Common Cold)**:
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have mild runny nose and occasional sneezing for 2 days. No fever."
  }'
```

**With Patient Context**:
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have chest tightness and shortness of breath",
    "patient_id": "example-patient-123"
  }'
```

**With Pre-extracted Symptoms**:
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Patient experiencing these symptoms",
    "patient_id": "example-patient-123",
    "symptoms": [
      {
        "symptom": "fever",
        "severity": "moderate",
        "duration": "2 days",
        "location": null
      },
      {
        "symptom": "cough",
        "severity": "mild",
        "duration": "3 days",
        "location": "chest"
      }
    ]
  }'
```

**Expected Response (Emergency)**:
```json
{
  "priority": "emergency",
  "reasoning": "Patient presents with classic signs of acute coronary syndrome (ACS). The crushing chest pain radiating to the left arm and jaw, combined with diaphoresis and shortness of breath, are red flags requiring immediate emergency care.",
  "confidence": "high",
  "red_flags": [
    "Crushing chest pain",
    "Radiation to left arm and jaw",
    "Profuse sweating (diaphoresis)",
    "Shortness of breath"
  ],
  "recommendations": {
    "immediate_action": "Call 911 immediately. Do not drive yourself to the hospital.",
    "care_level": "Emergency Department",
    "timeframe": "Immediate (within minutes)",
    "self_care_tips": null,
    "warning_signs": [
      "Increasing chest pain",
      "Difficulty breathing",
      "Loss of consciousness",
      "Severe dizziness"
    ],
    "follow_up": "Emergency medical services will transport to nearest cardiac center"
  },
  "extracted_symptoms": [
    {
      "symptom": "chest pain",
      "severity": "severe",
      "duration": "acute onset",
      "location": "chest, radiating to left arm and jaw"
    },
    {
      "symptom": "sweating",
      "severity": "severe",
      "duration": null,
      "location": null
    },
    {
      "symptom": "shortness of breath",
      "severity": "moderate",
      "duration": null,
      "location": null
    }
  ],
  "patient_context": null
}
```

**Expected Response (Non-Urgent)**:
```json
{
  "priority": "non-urgent",
  "reasoning": "Symptoms are consistent with a common cold or mild upper respiratory infection. No red flags or concerning symptoms present.",
  "confidence": "high",
  "red_flags": [],
  "recommendations": {
    "immediate_action": "Self-care at home. Rest and stay hydrated.",
    "care_level": "Self-care / Primary Care if symptoms worsen",
    "timeframe": "Schedule routine appointment if symptoms persist >7-10 days",
    "self_care_tips": [
      "Get plenty of rest",
      "Drink plenty of fluids",
      "Use over-the-counter decongestants if needed",
      "Wash hands frequently to prevent spread"
    ],
    "warning_signs": [
      "Fever >101°F",
      "Difficulty breathing",
      "Severe headache",
      "Symptoms lasting >10 days"
    ],
    "follow_up": "Contact primary care if symptoms worsen or persist"
  },
  "extracted_symptoms": [
    {
      "symptom": "runny nose",
      "severity": "mild",
      "duration": "2 days",
      "location": null
    },
    {
      "symptom": "sneezing",
      "severity": "mild",
      "duration": "2 days",
      "location": null
    }
  ],
  "patient_context": null
}
```

---

## Test With Formatted Output (using jq)

Install jq first: `brew install jq` (macOS) or `apt-get install jq` (Linux)

```bash
# Pretty formatted health check
curl http://localhost:8002/health | jq '.'

# Pretty formatted triage result
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "I have severe chest pain and difficulty breathing"}' | jq '.'
```

---

## Test Scripts Available

### Bash Script (All platforms with bash)
```bash
# Run all tests
./api_test_examples.sh

# Or run specific sections (edit the script and comment out sections you don't want)
bash api_test_examples.sh
```

### Python Script (Recommended)
```bash
# Install dependencies first
pip install requests

# Run all tests
python api_test_examples.py

# Run specific test suites
python api_test_examples.py --health      # Health checks only
python api_test_examples.py --triage      # Triage tests only
python api_test_examples.py --chat        # Chat tests only
python api_test_examples.py --patient     # Patient data tests

# Use custom patient ID
python api_test_examples.py --patient --patient-id "your-patient-id"
```

---

## Expected Response Format Examples

### Health Check Response
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Triage Response (Emergency)
```json
{
  "priority": "emergency",
  "reasoning": "Patient presents with classic signs of acute coronary syndrome...",
  "confidence": "high",
  "red_flags": [
    "Crushing chest pain",
    "Radiation to left arm",
    "Associated diaphoresis",
    "Shortness of breath"
  ],
  "recommendations": {
    "immediate_action": "Call 911 immediately",
    "care_level": "Emergency Department - Do not drive yourself",
    "timeframe": "Immediate (within minutes)",
    "warning_signs": [...]
  },
  "extracted_symptoms": [
    {
      "symptom": "chest pain",
      "severity": "severe",
      "duration": "acute onset",
      "location": "chest, radiating to left arm"
    }
  ]
}
```

### Symptom Extraction Response
```json
{
  "extracted_symptoms": [
    {
      "symptom": "headache",
      "severity": "severe",
      "duration": "2 days",
      "location": "head"
    },
    {
      "symptom": "fever",
      "severity": "moderate",
      "duration": "2 days",
      "location": null
    }
  ],
  "summary": "Patient reports severe headache and moderate fever...",
  "raw_response": "..."
}
```

---

## Testing RAG Functionality

RAG is currently **ENABLED** (USE_RAG=true in .env)

### Test RAG with Clinical Guideline Retrieval

```bash
# This should retrieve chest pain clinical guidelines
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Crushing chest pain with radiation to jaw"
  }' | jq '.reasoning'

# Check if response mentions specific guidelines like:
# - "ACS (Acute Coronary Syndrome)"
# - "American Heart Association"
# - Specific red flags from knowledge base
```

### Compare RAG vs Non-RAG

```bash
# 1. Test with RAG enabled (current setting)
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "Sudden severe headache, worst of my life"}' > with_rag.json

# 2. Disable RAG (edit .env: USE_RAG=false), restart server
# 3. Run same query again > without_rag.json
# 4. Compare responses - RAG version should have more specific clinical details
```

---

## Troubleshooting

### Server Not Responding
```bash
# Check if server is running
curl http://localhost:8002/health

# If not running, start it
docker-compose up -d backend

# Check logs
docker-compose logs backend
```

### 404 Not Found
Make sure you're using the correct endpoint paths:
- `/health` (not `/api/v1/health`)
- `/api/v1/triage`
- `/api/v1/chat`
- `/api/v1/extract-symptoms`

### 500 Internal Server Error
Check backend logs for details:
```bash
docker-compose logs backend --tail=50
```

Common issues:
- Missing OpenAI API key
- FHIR server connection issues
- Invalid patient ID

---

## Interactive API Documentation

### Swagger UI (Recommended)
Open in your browser: **http://localhost:8002/docs**

**Features**:
- Interactive testing interface
- Try endpoints directly in browser
- See request/response schemas
- Built-in validation

### ReDoc Documentation
Open in your browser: **http://localhost:8002/redoc**

**Features**:
- Clean, readable format
- Better for viewing/reading
- Organized by tags
- Export capabilities

### OpenAPI Schema
JSON Schema: **http://localhost:8002/openapi.json**

---

## All Available Endpoints

1. **GET** `/health` - Health check
2. **GET** `/api/v1/patients/{patient_id}` - Get complete patient history
3. **GET** `/api/v1/patients/{patient_id}/demographics` - Get patient demographics
4. **GET** `/api/v1/patients/{patient_id}/conditions` - Get patient conditions
5. **GET** `/api/v1/patients/{patient_id}/medications` - Get patient medications
6. **GET** `/api/v1/patients/{patient_id}/allergies` - Get patient allergies
7. **POST** `/api/v1/chat` - Chat with symptom extraction
8. **POST** `/api/v1/extract-symptoms` - Extract symptoms from text
9. **POST** `/api/v1/triage` - Perform triage assessment

---

## Files Reference

- `api_test_examples.sh` - Bash script with all test examples
- `api_test_examples.py` - Python script with all test examples
- `verify_rag.py` - RAG verification script
- `RAG_STATUS.md` - RAG system documentation
- `RAG_VERIFICATION_RESULTS.md` - RAG test results
- `TESTING_GUIDE.md` - Comprehensive testing documentation
- `main.py:61-421` - API endpoint implementations