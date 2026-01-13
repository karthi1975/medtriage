# Medical Assistant (MA) Triage & Appointment Scheduling System

A comprehensive healthcare application that combines AI-powered intelligent triage with smart appointment scheduling for medical assistants.

## 🎯 System Overview

This system enables Medical Assistants to:
- Manage patient data through conversational interface
- Perform intelligent protocol-based triage
- Order and track diagnostic tests
- Schedule appointments with optimal provider matching
- Track patient workflows end-to-end

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript + Material-UI v7
- **Backend**: FastAPI (Python)
- **AI Models**:
  - OpenAI GPT-4 (conversational AI, intent classification)
  - Google Llama 4 Maverick (triage assessment, clinical summarization)
- **Data**:
  - HAPI FHIR Server (patient data)
  - PostgreSQL (tribal knowledge, appointments)

### Key Components
```
frontend-new/          → React TypeScript UI
main.py                → FastAPI application
chat_service.py        → Conversational AI
intelligent_triage_service.py → Protocol-based triage
scheduling_service.py  → Appointment scheduling
workflow_service.py    → MA workflow tracking
llama_service.py       → Llama 4 integration
database/              → PostgreSQL models
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- Google Cloud CLI (for Llama 4)

### 1. Start Backend Services
```bash
# Start all services
docker-compose up -d

# Verify services
docker-compose ps
```

### 2. Authenticate Llama 4 (One-time)
```bash
gcloud auth application-default login
```

### 3. Start Frontend
```bash
cd frontend-new
npm install
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8002/docs
- **FHIR Server**: http://localhost:8081/fhir

## 📖 User Guide

### Medical Assistant Workflow

**Step 1: Start Shift**
- Enter MA name
- Select facility (e.g., "Salt Lake Heart Center")
- Select specialty (e.g., "Cardiology")

**Step 2: Patient Lookup**
- Type: "Patient [Name]" or use patient ID
- System loads complete medical history from FHIR

**Step 3: Intelligent Triage**
- Describe symptoms in chat
- System automatically:
  - Activates clinical protocol
  - Assesses risk level
  - Generates immediate action plan
  - Creates test ordering timeline

**Step 4: Test Management**
- Schedule tests from timeline
- Mark tests complete as they're done
- System tracks requirements

**Step 5: Appointment Scheduling**
- System automatically suggests optimal slots
- Book appointment with one click
- Receive confirmation number

**Step 6: View Dashboard**
- See all appointments
- Filter by status, date, urgency
- View detailed appointment information

## 🧪 Test Patients

Use these patient IDs for testing:

| ID | Name | Age | Conditions | Allergies | Scenario |
|----|------|-----|------------|-----------|----------|
| 1000 | Miguel Garcia | 25M | Asthma | None | Respiratory |
| 1003 | Sarah Thompson | 40F | Type 1 DM, Hypothyroid | Latex | Endocrine |
| 1008 | Thanh Nguyen | 83F | MI History, Heart Failure | None | Cardiac Emergency |
| 1015 | Robert Anderson | 67M | Recent MI, HTN | None | Post-MI Follow-up |
| 1022 | Elena Martinez | 50F | A-fib, HTN | None | Anticoagulation |
| 1030 | Jennifer Peterson | 37F | Radius Fracture | **Penicillin (HIGH)** | Critical Allergy |
| 1040 | Emily Brown | 9F | Asthma | **Cashew (HIGH)** | Pediatric |
| 1055 | Carlos Rodriguez | 62M | CKD, Type 2 DM, HTN | None | Complex Chronic |

## 🔌 API Overview

### Key Endpoints

**Session Management**
```bash
POST /api/v1/ma/session          # Create MA shift session
```

**Patient Operations**
```bash
POST /api/v1/patients/search     # Search patients
GET  /api/v1/patients/{id}       # Get patient history
```

**Conversational AI**
```bash
POST /api/v1/ma/chat             # Intent-based chat (main endpoint)
```

**Intelligent Triage**
```bash
POST /api/v1/ma/intelligent-triage  # Protocol-based triage
```

**Scheduling**
```bash
POST /api/v1/scheduling/recommend   # Get slot recommendations
POST /api/v1/scheduling/book        # Book appointment
GET  /api/v1/appointments           # List appointments
```

**Llama 4 AI**
```bash
GET  /llama/test                 # Test connection
POST /llama/triage               # Triage assessment
POST /llama/summarize            # Clinical note summarization
POST /llama/chat                 # General chat
```

**Workflows**
```bash
GET  /api/v1/workflows/patient/{id}     # Get patient workflows
POST /api/v1/workflows/{id}/checkpoints/{name}/update  # Update checkpoint
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# OpenAI
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4

# Google Cloud (Llama 4)
PROJECT_ID=your-project-id
ENDPOINT=us-east5-aiplatform.googleapis.com
REGION=us-east5
GOOGLE_CLOUD_PROJECT=your-project-id

# FHIR Server
FHIR_SERVER_URL=http://hapi-fhir:8080/fhir

# Database
DATABASE_URL=postgresql://tribaluser:tribalpass@postgres-tribal:5432/tribal_knowledge
```

### Docker Services
```yaml
services:
  - postgres-fhir      # FHIR database
  - postgres-tribal    # Tribal knowledge
  - hapi-fhir          # HAPI FHIR server
  - fhir-chat-api      # FastAPI backend
  - frontend (dev mode via npm)
```

## 📊 Features

### ✅ Implemented
- [x] MA session management
- [x] FHIR patient data integration
- [x] Conversational AI with intent classification
- [x] Protocol-based intelligent triage
- [x] Risk assessment engine
- [x] Test ordering timeline
- [x] Smart appointment scheduling
- [x] Workflow tracking with checkpoints
- [x] Llama 4 AI integration
- [x] Appointment management dashboard
- [x] Multi-facility support
- [x] Specialty-based routing

### 🎯 Key Capabilities
- **6 Intent Types**: Patient lookup, triage, testing, scheduling, confirmation, questions
- **Protocol Engine**: Automatic clinical protocol activation
- **Risk Assessment**: Age + condition + symptom analysis
- **Smart Scheduling**: Region-based, urgency-prioritized slot matching
- **Dual AI**: OpenAI GPT-4 + Google Llama 4
- **FHIR Compliant**: Standard healthcare data format

## 🧰 Development

### Project Structure
```
project/
├── frontend-new/           # React TypeScript frontend
│   ├── src/
│   │   ├── pages/         # MA Context, Chat, Appointments
│   │   ├── components/    # Triage panels, timeline, scheduling
│   │   ├── services/      # API service layer
│   │   ├── context/       # React context (MA session, workflow)
│   │   └── theme/         # Material-UI theme
├── main.py                # FastAPI entry point
├── *_service.py           # Business logic services
├── *_api.py               # API route handlers
├── database/              # SQLAlchemy models
├── config/                # Configuration
└── docker-compose.yml     # Service orchestration
```

### Running Tests
```bash
# Backend health check
curl http://localhost:8002/health

# Test Llama 4
curl http://localhost:8002/llama/test

# Search patient
curl -X POST http://localhost:8002/api/v1/patients/search \
  -H "Content-Type: application/json" \
  -d '{"query": "1000", "search_type": "id"}'
```

### Logs
```bash
# Backend logs
docker-compose logs -f fhir-chat-api

# FHIR server logs
docker-compose logs -f hapi-fhir

# Database logs
docker-compose logs -f postgres-tribal
```

## 📝 Documentation

- **END_TO_END_WORKING_GUIDE.md** - Complete API reference and demo script
- **APPOINTMENT_QUICK_START.md** - Appointment system guide
- **APPOINTMENT_USE_CASES_AND_NAVIGATION.md** - Detailed use cases
- **PATIENT_TEST_GUIDE.md** - Testing workflow
- **ALL_TEST_PATIENTS.md** - Patient database reference

## 🐛 Troubleshooting

### Frontend not loading?
```bash
lsof -i :5173
cd frontend-new && npm run dev
```

### Backend errors?
```bash
docker-compose restart fhir-chat-api
docker-compose logs --tail=50 fhir-chat-api
```

### Llama 4 not working?
```bash
gcloud auth application-default print-access-token
# If expired:
gcloud auth application-default login
docker-compose restart fhir-chat-api
```

### Patient not found?
Use IDs: 1000, 1003, 1008, 1015, 1022, 1027, 1030, 1034, 1039, 1040, 1044, 1049, 1054, 1055, 1062

## 🔒 Security Notes

- Application Default Credentials (ADC) for GCP
- No service account keys stored
- CORS configured for development (update for production)
- Database credentials in environment variables
- Session storage in-memory (use Redis for production)

## 📦 Deployment

### Production Checklist
- [ ] Update CORS settings in main.py
- [ ] Use Redis for session storage
- [ ] Configure proper database connection pooling
- [ ] Set up environment-specific .env files
- [ ] Enable HTTPS
- [ ] Configure GCP service account attachment
- [ ] Set up monitoring and logging
- [ ] Review and update API rate limits

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify services: `docker-compose ps`
3. Check documentation in project directory
4. Review API docs: http://localhost:8002/docs

## 📄 License

Educational project for CS-6440-O01

---

**Version**: 2.0.0
**Last Updated**: 2026-01-09
**Status**: Production Ready ✅
