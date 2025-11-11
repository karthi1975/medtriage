# Medical Triage System

A comprehensive AI-powered medical triage system integrating FHIR patient data with intelligent symptom assessment to provide priority-based care recommendations.

## Overview

This system provides an end-to-end solution for medical symptom triage, combining:
- **FHIR Integration** for patient medical history
- **AI-Powered Chat** for natural symptom collection
- **Intelligent Triage** with 4-level priority system
- **Interactive UI** with real-time assessment
- **Care Recommendations** based on symptoms and patient context

## Features

### Backend (FastAPI)
- ✅ FHIR patient data retrieval (demographics, conditions, medications, allergies)
- ✅ OpenAI-powered conversational chat
- ✅ NLP-based symptom extraction with severity, duration, and location
- ✅ Hybrid triage algorithm (rule-based + AI assessment)
- ✅ Multi-level priority determination (Emergency/Urgent/Semi-Urgent/Non-Urgent)
- ✅ Comprehensive care recommendations
- ✅ RESTful API with OpenAPI documentation
- ✅ Docker containerization

### Frontend (React)
- ✅ Interactive chat interface for symptom collection
- ✅ Real-time triage assessment display
- ✅ Color-coded priority indicators
- ✅ Comprehensive results visualization
- ✅ Patient ID integration support
- ✅ Responsive design for mobile and desktop
- ✅ API connection status monitoring

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker (optional)
- OpenAI API key

### Installation

1. **Clone and navigate to project**:
```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
```

2. **Configure environment**:
```bash
# Edit .env with your OpenAI API key
echo "OPENAI_API_KEY=your-key-here" > .env
```

3. **Start Backend**:

Using Docker (recommended):
```bash
docker-compose up --build
```

Or locally:
```bash
pip install -r requirements.txt
python main.py
```

4. **Start Frontend** (new terminal):
```bash
cd frontend
npm install
npm start
```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8002
   - API Docs: http://localhost:8002/docs

## System Architecture

```
┌──────────────────────────────────────────┐
│         React Frontend (Port 3000)        │
│  ┌────────────────┐  ┌─────────────────┐ │
│  │ Chat Interface │  │ Triage Results  │ │
│  └────────────────┘  └─────────────────┘ │
└───────────────────┬──────────────────────┘
                    │ HTTP/REST API
┌───────────────────▼──────────────────────┐
│      FastAPI Backend (Port 8002)         │
│  ┌──────────┐  ┌───────────┐  ┌────────┐│
│  │  Chat    │  │  Triage   │  │ FHIR   ││
│  │ Service  │  │  Service  │  │ Client ││
│  └──────────┘  └───────────┘  └────────┘│
└──────┬────────────┬─────────────┬────────┘
       │            │             │
       ▼            ▼             ▼
  ┌────────┐  ┌─────────┐  ┌──────────┐
  │ OpenAI │  │ Medical │  │   HAPI   │
  │  API   │  │  Rules  │  │   FHIR   │
  └────────┘  └─────────┘  └──────────┘
```

## API Endpoints

### Patient Data
- `GET /api/v1/patients/{id}` - Complete patient history
- `GET /api/v1/patients/{id}/demographics` - Demographics only
- `GET /api/v1/patients/{id}/conditions` - Medical conditions
- `GET /api/v1/patients/{id}/medications` - Current medications
- `GET /api/v1/patients/{id}/allergies` - Allergies

### Chat & Symptoms
- `POST /api/v1/chat` - Conversational AI chat
  ```json
  {
    "message": "I have a headache",
    "patient_id": "optional",
    "conversation_history": []
  }
  ```

- `POST /api/v1/extract-symptoms` - Extract symptoms from text
  ```json
  {
    "text": "severe headache for 3 days",
    "patient_id": "optional"
  }
  ```

### Triage Assessment (NEW)
- `POST /api/v1/triage` - Comprehensive triage assessment
  ```json
  {
    "message": "chest pain and difficulty breathing",
    "patient_id": "optional",
    "symptoms": null
  }
  ```

  **Response**:
  ```json
  {
    "priority": "emergency|urgent|semi-urgent|non-urgent",
    "reasoning": "Detailed assessment explanation",
    "confidence": "high|medium|low",
    "red_flags": ["concerning symptoms"],
    "recommendations": {
      "immediate_action": "What to do now",
      "care_level": "Emergency Room|Urgent Care|Primary Care|Self-Care",
      "timeframe": "When to seek care",
      "warning_signs": ["Signs requiring escalation"],
      "self_care_tips": ["Self-care measures"],
      "follow_up": "Follow-up recommendations"
    },
    "extracted_symptoms": [
      {
        "symptom": "chest pain",
        "severity": "severe",
        "duration": "30 minutes",
        "location": "center of chest"
      }
    ],
    "patient_context": {}
  }
  ```

### Health
- `GET /health` - API health check

## Triage Priority Levels

The system uses a 4-level triage system:

### 🚨 EMERGENCY (Red)
- **Definition**: Life-threatening condition requiring immediate emergency care
- **Action**: Call 911 or go to ER immediately
- **Examples**: Chest pain, severe bleeding, difficulty breathing, stroke symptoms

### ⚠️ URGENT (Orange)
- **Definition**: Serious condition requiring medical attention within hours
- **Action**: Seek urgent care or ER within 2-4 hours
- **Examples**: High fever, severe pain, persistent vomiting, suspected fracture

### ⏰ SEMI-URGENT (Yellow)
- **Definition**: Condition that should be seen by a doctor within 24-48 hours
- **Action**: Schedule doctor appointment soon
- **Examples**: Moderate symptoms, persistent mild conditions

### ✓ NON-URGENT (Green)
- **Definition**: Can wait for regular appointment or self-care
- **Action**: Schedule routine appointment or try self-care
- **Examples**: Mild symptoms, minor concerns

## How It Works

### 1. Symptom Collection
The chat interface collects patient symptoms through natural conversation:
```
User: "I've been having severe headaches for 3 days"
Assistant: Analyzes the message and extracts symptoms
```

### 2. Symptom Extraction
AI extracts structured data:
```json
{
  "symptom": "headache",
  "severity": "severe",
  "duration": "3 days",
  "location": null
}
```

### 3. Patient Context (Optional)
If patient ID provided, system retrieves:
- Medical history (conditions, medications)
- Allergies
- Demographics
- Previous observations

### 4. Triage Assessment
Hybrid algorithm determines priority:

**Rule-Based Component**:
- Checks for emergency keywords
- Evaluates severity levels
- Quick initial screening

**AI Component**:
- Comprehensive analysis of all symptoms
- Considers patient context
- Evaluates red flags
- Provides detailed reasoning

### 5. Care Recommendations
System provides:
- Immediate action guidance
- Appropriate care level (ER/Urgent Care/Primary Care/Self-Care)
- Timeframe for seeking care
- Self-care tips (if applicable)
- Warning signs to monitor
- Follow-up recommendations

## Example Usage

### Scenario 1: Emergency Assessment

**User Input**:
```
"I'm experiencing severe chest pain radiating to my left arm
and I'm having difficulty breathing"
```

**System Response**:
- **Priority**: 🚨 EMERGENCY
- **Reasoning**: Symptoms consistent with possible cardiac event
- **Action**: Call 911 immediately or go to nearest ER
- **Red Flags**: Chest pain with radiation, difficulty breathing
- **Warning**: Do not drive yourself, wait for ambulance

### Scenario 2: Urgent Care

**User Input**:
```
"I've had a fever of 103°F for 2 days with severe headache
and stiff neck"
```

**System Response**:
- **Priority**: ⚠️ URGENT
- **Reasoning**: High fever with meningeal signs
- **Action**: Seek urgent care or ER within 2-4 hours
- **Care Level**: Urgent Care or Emergency Room
- **Warning Signs**: Worsening symptoms, confusion, seizure

### Scenario 3: With Patient Context

**User Input**:
```
Patient ID: example
Message: "I have a persistent cough"
```

**System Response**:
- **Priority**: Based on patient history
- **Context Considered**:
  - Existing respiratory conditions
  - Current medications
  - Known allergies
- **Recommendations**: Tailored to patient's medical history

## Project Structure

```
project/
├── Backend
│   ├── main.py                # FastAPI application
│   ├── config.py              # Configuration
│   ├── fhir_client.py        # FHIR integration
│   ├── chat_service.py       # Chat & NLP
│   ├── triage_service.py     # Triage algorithm (NEW)
│   ├── schemas.py            # Pydantic models
│   ├── requirements.txt      # Dependencies
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── test_api.py
│
├── Frontend (NEW)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.js
│   │   │   └── TriageResults.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── App.css
│   │   │   ├── ChatInterface.css
│   │   │   └── TriageResults.css
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
└── Documentation
    ├── README.md
    ├── START_HERE.md
    ├── QUICKSTART.md
    ├── DEPLOYMENT_SUMMARY.md
    └── IMPLEMENTATION_COMPLETE.md
```

## Development

### Running Tests

**Backend**:
```bash
python test_api.py
```

**Frontend**:
```bash
cd frontend
npm test
```

### Code Structure

**Backend Services**:
- `FHIRClient`: FHIR server interaction
- `ChatService`: OpenAI chat and symptom extraction
- `TriageService`: Priority determination and recommendations

**Frontend Components**:
- `App`: Main application container
- `ChatInterface`: Conversation UI
- `TriageResults`: Assessment display

### Adding Features

1. **New Backend Endpoint**: Add route in `main.py`
2. **New Triage Rule**: Update `triage_service.py`
3. **New UI Component**: Add to `frontend/src/components/`
4. **New API Call**: Update `frontend/src/services/api.js`

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-3.5-turbo
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
```

**Frontend** (`.env`):
```env
REACT_APP_API_URL=http://localhost:8002
```

## Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Considerations

Before production deployment:
1. ✅ Configure proper authentication/authorization
2. ✅ Set up HTTPS/TLS
3. ✅ Harden CORS settings
4. ✅ Implement rate limiting
5. ✅ Add comprehensive logging
6. ✅ Set up monitoring/alerting
7. ✅ Ensure HIPAA compliance (if handling PHI)
8. ✅ Conduct security audit
9. ✅ Add database for conversation persistence
10. ✅ Configure production FHIR server

## Troubleshooting

See `START_HERE.md` for common issues and solutions.

**Quick Fixes**:
- Backend not connecting: Check `.env` has valid OpenAI key
- Frontend can't reach API: Ensure backend running on port 8002
- Port conflicts: Change port in `docker-compose.yml` or use `PORT=3001 npm start`

## Limitations

- **Educational Use Only**: Not for real medical decisions
- **No HIPAA Compliance**: Not configured for protected health information
- **OpenAI Dependency**: Requires API access and incurs costs
- **No Persistence**: Conversations not stored
- **Test Data**: Uses public HAPI FHIR test server

## Safety & Disclaimers

This system:
- Is an **educational prototype**
- Should **NOT** replace professional medical advice
- Uses AI which can make errors
- Requires medical professional validation
- Is not HIPAA compliant
- Not intended for real patient care

**Always consult healthcare providers for proper diagnosis and treatment.**

## Documentation

- **Quick Start**: `START_HERE.md` - Get running in 5 minutes
- **Implementation Details**: `IMPLEMENTATION_COMPLETE.md` - Technical overview
- **Deployment**: `DEPLOYMENT_SUMMARY.md` - Deployment guide
- **Frontend**: `frontend/README.md` - Frontend-specific documentation

## Technology Credits

- **FastAPI**: Modern Python web framework
- **React**: Frontend UI framework
- **OpenAI**: GPT models for AI/NLP
- **HAPI FHIR**: Open-source FHIR server
- **Docker**: Containerization

## License

[Add your license information]

## Contributors

[Add your information]

## Support

For questions or issues:
1. Check documentation in `/docs`
2. Review API documentation at http://localhost:8002/docs
3. Check logs for error messages
4. Test with provided example scenarios

---

**Version**: 1.0.0
**Status**: Week 5 Implementation Complete
**Last Updated**: November 10, 2025
