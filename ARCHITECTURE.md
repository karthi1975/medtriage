# MediChat System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MediChat System                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│  React Frontend  │◄───────►│  FastAPI Backend │◄───────►│   FHIR Server    │
│                  │  HTTP   │                  │  FHIR   │                  │
│  Port: 3000      │  REST   │  Port: 8002      │  API    │  External API    │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
                                      │
                                      │ OpenAI API
                                      ▼
                             ┌──────────────────┐
                             │   OpenAI GPT     │
                             │  (Chat & RAG)    │
                             └──────────────────┘
```

## Detailed Component Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                     │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐          ┌─────────────────┐                           │
│  │  ChatInterface  │          │  TriageResults  │                           │
│  ├─────────────────┤          ├─────────────────┤                           │
│  │ - User Input    │          │ - Priority      │                           │
│  │ - Patient ID    │          │ - Patient Info  │                           │
│  │ - Messages      │          │ - Allergies     │                           │
│  │ - Loading State │          │ - Conditions    │                           │
│  └─────────────────┘          │ - Symptoms      │                           │
│           │                   │ - Recommendations│                           │
│           └──────────┬────────┴─────────────────┘                           │
│                      │                                                       │
│              ┌───────▼────────┐                                             │
│              │   API Service  │                                             │
│              │  (axios)       │                                             │
│              └───────┬────────┘                                             │
└──────────────────────┼───────────────────────────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼───────────────────────────────────────────────────────┐
│                           BACKEND LAYER                                       │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        FastAPI Application                             │ │
│  │                           (main.py)                                    │ │
│  └────────┬─────────────────┬─────────────────┬──────────────────────────┘ │
│           │                 │                 │                             │
│  ┌────────▼────────┐ ┌──────▼───────┐ ┌──────▼──────────┐                 │
│  │  FHIR Client    │ │ Chat Service │ │ Triage Service  │                 │
│  ├─────────────────┤ ├──────────────┤ ├─────────────────┤                 │
│  │ - Get Patient   │ │ - Symptom    │ │ - Priority      │                 │
│  │ - Parse Ext.    │ │   Extraction │ │   Assessment    │                 │
│  │ - History API   │ │ - Chat       │ │ - RAG Context   │                 │
│  │ - Demographics  │ │ - Context    │ │ - Red Flags     │                 │
│  │ - Conditions    │ │   Enrichment │ │ - Care Rec.     │                 │
│  │ - Allergies     │ │              │ │                 │                 │
│  └────────┬────────┘ └──────┬───────┘ └─────────┬───────┘                 │
│           │                 │                   │                           │
└───────────┼─────────────────┼───────────────────┼───────────────────────────┘
            │                 │                   │
            │                 │                   │
┌───────────▼─────────────────▼───────────────────▼───────────────────────────┐
│                        EXTERNAL SERVICES                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐              ┌──────────────────────┐             │
│  │   FHIR Server       │              │    OpenAI API        │             │
│  ├─────────────────────┤              ├──────────────────────┤             │
│  │ - Patient Data      │              │ - GPT-3.5-Turbo/4    │             │
│  │ - Extensions        │              │ - Chat Completion    │             │
│  │ - Demographics      │              │ - Embeddings         │             │
│  │ - Observations      │              │ - Semantic Search    │             │
│  │ - Medications       │              │                      │             │
│  │ - Allergies         │              │                      │             │
│  │                     │              │                      │             │
│  │ URL: http://3.149   │              │                      │             │
│  │      .33.232:8081   │              │                      │             │
│  └─────────────────────┘              └──────────────────────┘             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Triage Request Flow

```
User → Frontend → Backend → FHIR → OpenAI → Response
  ↓       ↓         ↓        ↓       ↓         ↓
  1       2         3        4       5         6
```

**Step-by-Step:**

```
1. User Action
   └─ User enters Patient ID: "13"
   └─ User types symptoms: "I have chest pain and shortness of breath"

2. Frontend Processing
   └─ ChatInterface captures input
   └─ API Service sends POST /api/v1/triage
   └─ Payload: { message, patient_id }

3. Backend Processing
   └─ main.py receives request
   └─ Validates request schema

4. FHIR Data Retrieval
   └─ fhir_client.get_patient_history(patient_id)
   └─ Fetches Patient resource from FHIR server
   └─ Parses extensions:
       ├─ allergies_from_extensions: ["Penicillin", "Peanuts"]
       └─ conditions_from_extensions: ["Asthma"]

5. AI Processing
   ├─ chat_service.extract_symptoms()
   │  └─ Sends to OpenAI: "Extract symptoms from text"
   │  └─ Returns: [{"symptom": "chest pain", "severity": "severe"}]
   │
   └─ triage_service.determine_triage_priority()
      ├─ Builds context with patient allergies & conditions
      ├─ Sends to OpenAI with RAG context
      └─ Returns priority, reasoning, recommendations

6. Response to User
   └─ Backend constructs TriageResponse
   └─ Frontend displays in TriageResults
       ├─ Priority: EMERGENCY (red badge)
       ├─ Patient Info with allergies/conditions
       ├─ Extracted symptoms
       └─ Care recommendations
```

## Component Details

### Frontend Components

```
src/
├── App.js                    # Main application container
│   ├── State Management
│   ├── API Status Check
│   └── Layout Structure
│
├── components/
│   ├── ChatInterface.js      # Chat UI
│   │   ├── Message History
│   │   ├── User Input
│   │   ├── Patient ID Field
│   │   └── Loading State
│   │
│   └── TriageResults.js      # Results Display
│       ├── Priority Badge
│       ├── Patient Information (NEW)
│       │   ├── Demographics
│       │   ├── Allergies (Red)
│       │   └── Conditions (Green)
│       ├── Extracted Symptoms
│       ├── Red Flags
│       └── Recommendations
│
├── services/
│   └── api.js                # API Client
│       ├── performTriage()
│       ├── getPatientHistory()
│       ├── extractSymptoms()
│       └── sendChatMessage()
│
└── styles/
    ├── App.css
    ├── ChatInterface.css
    └── TriageResults.css      # Patient info styles (NEW)
```

### Backend Services

```
backend/
├── main.py                   # FastAPI Application
│   ├── Health Check
│   ├── CORS Configuration
│   └── API Endpoints:
│       ├── POST /api/v1/triage
│       ├── POST /api/v1/chat
│       ├── POST /api/v1/extract-symptoms
│       └── GET /api/v1/patients/{id}
│
├── fhir_client.py            # FHIR Integration
│   ├── get_patient()
│   ├── _parse_patient_extensions()  # NEW
│   ├── get_patient_history()
│   ├── get_patient_conditions()
│   ├── get_patient_medications()
│   └── get_patient_allergies()
│
├── chat_service.py           # OpenAI Chat
│   ├── extract_symptoms()
│   ├── chat_with_symptom_extraction()
│   └── _enrich_with_patient_context()
│
└── triage_service.py         # Medical Triage
    ├── determine_triage_priority()
    ├── get_care_recommendations()
    ├── _build_rag_context()      # RAG Integration
    └── _identify_red_flags()
```

## API Request/Response Schema

### Triage Request

```json
POST /api/v1/triage
{
  "message": "I have severe chest pain and shortness of breath",
  "patient_id": "13"
}
```

### Triage Response

```json
{
  "priority": "emergency",
  "reasoning": "Severe chest pain with respiratory symptoms...",
  "confidence": "high",
  "red_flags": ["Chest pain", "Shortness of breath"],
  "recommendations": {
    "immediate_action": "Call 911 or go to ER immediately",
    "care_level": "Emergency Department",
    "timeframe": "Immediate"
  },
  "extracted_symptoms": [
    {
      "symptom": "chest pain",
      "severity": "severe",
      "duration": null,
      "location": "chest"
    }
  ],
  "patient_context": {
    "patient": {
      "id": "13",
      "name": "Aarav Kumar Patel",
      "allergies_from_extensions": ["Penicillin", "Peanuts"],
      "conditions_from_extensions": ["Asthma"]
    }
  }
}
```

## FHIR Extension Parsing

### Input (FHIR Patient Resource)

```json
{
  "resourceType": "Patient",
  "id": "13",
  "extension": [
    {
      "url": "http://hl7.org/fhir/StructureDefinition/patient-condition",
      "valueString": "Asthma"
    },
    {
      "url": "http://hl7.org/fhir/StructureDefinition/patient-allergy",
      "valueString": "Penicillin, Peanuts"
    }
  ]
}
```

### Output (Parsed Extensions)

```python
{
  "allergies_from_extensions": ["Penicillin", "Peanuts"],
  "conditions_from_extensions": ["Asthma"]
}
```

## Technology Stack

```
Frontend:
  ├─ React 18.2.0
  ├─ Axios (API client)
  ├─ CSS3 (Responsive design)
  └─ Node.js 16+

Backend:
  ├─ Python 3.11
  ├─ FastAPI 0.104.1
  ├─ Uvicorn (ASGI server)
  ├─ Pydantic (Data validation)
  └─ fhirclient 4.1.0

AI/ML:
  ├─ OpenAI API
  ├─ GPT-3.5-Turbo/GPT-4
  └─ RAG (Retrieval Augmented Generation)

Infrastructure:
  ├─ Docker & Docker Compose
  ├─ Port 3000 (Frontend)
  └─ Port 8002 (Backend)

External Services:
  ├─ FHIR Server: http://3.149.33.232:8081/fhir
  └─ OpenAI API
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Environment                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Docker Container: fhir-chat-api                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Image: project-fhir-chat-api                        │  │
│  │  Ports: 8002:8000                                    │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Python 3.11-slim                              │  │  │
│  │  │  ├─ FastAPI Application                        │  │  │
│  │  │  ├─ FHIR Client                                 │  │  │
│  │  │  ├─ Chat Service                                │  │  │
│  │  │  └─ Triage Service                              │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  Environment:                                         │  │
│  │  ├─ OPENAI_API_KEY                                   │  │
│  │  ├─ FHIR_SERVER_URL                                  │  │
│  │  └─ USE_RAG=true                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Network: project_fhir-network                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Local Development (Frontend)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Node.js Development Server                                │
│  ├─ Port: 3000                                             │
│  ├─ Proxy: http://localhost:8002                           │
│  ├─ Hot Reload: Enabled                                    │
│  └─ React Development Build                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
┌────────────────────────────────────────────────────────┐
│                   Security Layers                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│  1. API Security                                       │
│     ├─ CORS Configuration (currently: allow all)      │
│     ├─ Request Validation (Pydantic)                  │
│     └─ Error Handling (no sensitive data leakage)     │
│                                                        │
│  2. Data Security                                      │
│     ├─ Environment Variables (.env)                   │
│     ├─ API Keys (OpenAI)                              │
│     └─ FHIR Authentication (if required)              │
│                                                        │
│  3. Network Security                                   │
│     ├─ Docker Network Isolation                       │
│     ├─ Port Exposure Control                          │
│     └─ HTTPS (production)                             │
│                                                        │
│  4. Application Security                               │
│     ├─ Input Sanitization                             │
│     ├─ Rate Limiting (recommended)                    │
│     └─ Logging (no PII/PHI)                           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
Current:
  ├─ Synchronous FHIR calls
  ├─ No caching
  └─ Direct OpenAI API calls

Recommended:
  ├─ Async FHIR operations
  ├─ Redis caching for patient data
  ├─ Response caching for common queries
  ├─ Connection pooling
  └─ CDN for frontend assets
```

## Monitoring & Logging

```
Backend Logging:
  ├─ API Request/Response
  ├─ FHIR Operations
  ├─ OpenAI API Calls
  ├─ Error Stack Traces
  └─ Performance Metrics

Frontend Logging:
  ├─ User Interactions
  ├─ API Call Status
  ├─ Errors (Console)
  └─ Performance (React DevTools)
```

---

## Document Version

**Version:** 1.0
**Last Updated:** November 24, 2025
**Author:** Karthikeyan Jeyabalan (kjeyabalan3@gatech.edu)
