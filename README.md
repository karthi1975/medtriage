# MediChat - FHIR Medical Triage System

An AI-powered medical triage system that integrates FHIR patient data with OpenAI-powered symptom analysis and care recommendations. The system features a conversational React frontend and a FastAPI backend with RAG (Retrieval Augmented Generation) capabilities.

## Overview

MediChat provides intelligent medical triage assessments by combining:
- **FHIR Patient Data**: Real-time retrieval of patient demographics, allergies, and conditions
- **AI-Powered Triage**: OpenAI-driven symptom extraction and priority assessment
- **RAG Integration**: Context-aware recommendations using medical knowledge base
- **Interactive UI**: React-based chat interface for symptom assessment

## Key Features

### Backend Features
- **FHIR Extension Parsing**: Extracts patient allergies and conditions from FHIR Patient extensions
- **Medical Triage System**: Determines priority levels (Emergency, Urgent, Semi-Urgent, Non-Urgent)
- **RAG-Enhanced Recommendations**: Context-aware care recommendations using medical knowledge
- **Symptom Extraction**: NLP-based automatic symptom extraction from natural language
- **Patient Context Integration**: Enriches triage decisions with patient medical history
- **Optimized API Responses**: Clean JSON responses (excludes empty arrays)

### Frontend Features
- **Interactive Chat Interface**: Conversational symptom assessment
- **Real-Time Triage Results**: Displays priority, reasoning, and recommendations
- **Patient Information Display**: Shows known allergies and conditions with color-coded styling
- **Responsive Design**: Mobile-friendly interface
- **Live Status Indicators**: Connection status and health monitoring

## Recent Updates (Sprint Week Nov 18-24, 2025)

✅ **FHIR Extension Integration**
- Implemented `_parse_patient_extensions()` to extract allergies and conditions
- Parses comma-separated values into arrays (e.g., "Penicillin, Peanuts")
- Integrated with patient history endpoint

✅ **UI Enhancement**
- Added Patient Information section to triage results
- Color-coded display: Green for conditions, Red for allergies
- Responsive card-style layout

✅ **API Optimization**
- Removed empty arrays from responses (conditions, observations, medications, allergies)
- Reduced payload size by ~30% for patients without historical data

✅ **External FHIR Server**
- Connected to: `http://3.149.33.232:8081/fhir`
- Validated with real patient data (Patient ID: 13)

## System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  React Frontend │ ◄─────► │  FastAPI Backend │ ◄─────► │   FHIR Server    │
│  (Port 3000)    │         │   (Port 8002)    │         │  (External API)  │
└─────────────────┘         └──────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   OpenAI API     │
                            │  (GPT-3.5/4)     │
                            └──────────────────┘
```

## Project Structure

```
project/
├── main.py                  # FastAPI application and routes
├── config.py                # Configuration and settings
├── fhir_client.py           # FHIR client with extension parsing
├── chat_service.py          # OpenAI chat and symptom extraction
├── triage_service.py        # Medical triage logic with RAG
├── models.py                # Pydantic request/response models
├── schemas.py               # Data schemas
├── requirements.txt         # Python dependencies
├── Dockerfile               # Backend container definition
├── docker-compose.yml       # Docker orchestration
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── components/
│   │   │   ├── ChatInterface.js      # Chat UI component
│   │   │   └── TriageResults.js      # Results display with patient info
│   │   ├── services/
│   │   │   └── api.js      # API client
│   │   └── styles/         # CSS styling
│   ├── package.json        # Node dependencies
│   └── public/             # Static assets
└── README.md               # This file
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 16+ (for frontend development)
- Python 3.11+ (for local backend development)

### Option 1: Full Docker Deployment (Recommended)

#### 1. Start Backend API

```bash
# Build and start the backend container
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f fhir-chat-api
```

The backend API will be available at: **http://localhost:8002**

#### 2. Start Frontend UI

```bash
cd frontend
npm install
npm start
```

The frontend will be available at: **http://localhost:3000**

### Option 2: Local Development

#### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the application
python main.py
```

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Environment Configuration

Create a `.env` file in the project root:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# FHIR Server Configuration
FHIR_SERVER_URL=http://3.149.33.232:8081/fhir

# RAG Configuration
USE_RAG=true
```

## API Endpoints

### Health Check

```bash
curl http://localhost:8002/health
```

### Patient Data

#### Get Patient History with Extensions
```bash
curl http://localhost:8002/api/v1/patients/13
```

**Response Example:**
```json
{
  "patient_id": "13",
  "data": {
    "patient": {
      "id": "13",
      "name": "Aarav Kumar Patel",
      "gender": "male",
      "birthDate": "1998-07-22",
      "allergies_from_extensions": ["Penicillin", "Peanuts"],
      "conditions_from_extensions": ["Asthma"]
    }
  }
}
```

### Medical Triage

#### Perform Triage Assessment
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe chest pain and shortness of breath",
    "patient_id": "13"
  }'
```

**Response Example:**
```json
{
  "priority": "emergency",
  "reasoning": "Severe chest pain with shortness of breath requires immediate evaluation...",
  "confidence": "high",
  "red_flags": [
    "Chest pain",
    "Shortness of breath"
  ],
  "recommendations": {
    "immediate_action": "Call 911 or go to emergency room immediately",
    "care_level": "Emergency Department",
    "timeframe": "Immediate - Do not delay"
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
      "name": "Aarav Kumar Patel",
      "allergies_from_extensions": ["Penicillin", "Peanuts"],
      "conditions_from_extensions": ["Asthma"]
    }
  }
}
```

### Chat Endpoint

```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a headache for 3 days",
    "patient_id": "13"
  }'
```

### Symptom Extraction

```bash
curl -X POST http://localhost:8002/api/v1/extract-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I have severe headaches for 3 days in my forehead and mild nausea",
    "patient_id": "13"
  }'
```

## Frontend Usage

### Using the Chat Interface

1. **Open the UI**: Navigate to http://localhost:3000
2. **Enter Patient ID** (optional): Type patient ID (e.g., "13") in the header field
3. **Describe Symptoms**: Type your symptoms in the chat input
4. **View Triage Results**: The right panel displays:
   - Priority level with color coding
   - Patient information (if Patient ID provided)
   - Known allergies (red background)
   - Known conditions (green background)
   - Identified symptoms
   - Care recommendations
   - Warning signs

### Example Flow

```
User Input: Patient ID: 13
User Input: "I have chest pain and difficulty breathing"

System Response:
┌─ TRIAGE ASSESSMENT ─────────────────┐
│ Priority: EMERGENCY 🚨              │
│ Confidence: HIGH                    │
├─ Patient Information ───────────────┤
│ Name: Aarav Kumar Patel            │
│ Gender: male                        │
│ Birth Date: 1998-07-22             │
│                                     │
│ ⚕️ Known Conditions                │
│ • Asthma                           │
│                                     │
│ 🚫 Known Allergies                 │
│ • Penicillin                       │
│ • Peanuts                          │
├─ Care Recommendations ──────────────┤
│ Immediate Action: Call 911         │
│ Care Level: Emergency Department   │
└─────────────────────────────────────┘
```

## FHIR Extension Format

The system parses custom FHIR Patient extensions:

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

## Testing

### API Testing

```bash
# Test patient data retrieval
curl http://localhost:8002/api/v1/patients/13

# Test triage with patient context
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "I have fever and cough", "patient_id": "13"}'

# Test symptom extraction
curl -X POST http://localhost:8002/api/v1/extract-symptoms \
  -H "Content-Type: application/json" \
  -d '{"text": "severe headache for 2 days"}'
```

### Frontend Testing

```bash
cd frontend
npm test
```

## Key Components

### 1. FHIR Client (`fhir_client.py`)

**Features:**
- Patient data retrieval from FHIR servers
- Custom extension parsing for allergies and conditions
- Comprehensive patient history aggregation
- Support for Demographics, Conditions, Observations, Medications, Allergies

**Key Method:**
```python
def _parse_patient_extensions(self, patient) -> Dict[str, Any]:
    """Parse patient extensions for allergies and conditions"""
    # Extracts data from FHIR extensions
    # Returns: {'allergies_from_extensions': [...], 'conditions_from_extensions': [...]}
```

### 2. Triage Service (`triage_service.py`)

**Features:**
- AI-powered triage priority determination
- RAG-enhanced medical recommendations
- Red flag identification
- Care level recommendations

**Priority Levels:**
- **Emergency**: Immediate life-threatening conditions
- **Urgent**: Serious conditions requiring prompt care
- **Semi-Urgent**: Conditions needing timely evaluation
- **Non-Urgent**: Minor conditions suitable for routine care

### 3. Frontend Components

**ChatInterface.js:**
- Real-time symptom input
- Patient ID field
- Message history display
- Loading states

**TriageResults.js:**
- Priority badge with color coding
- Patient information section (NEW)
- Allergies display with red styling (NEW)
- Conditions display with green styling (NEW)
- Symptom breakdown
- Care recommendations
- Warning signs

## Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f fhir-chat-api

# Stop services
docker-compose down

# Restart backend
docker-compose restart fhir-chat-api

# Check status
docker-compose ps

# Execute commands in container
docker-compose exec fhir-chat-api bash
```

## Development Workflow

### Backend Development

```bash
# Make code changes to Python files
# Docker volumes mount the code, so changes are reflected immediately

# Restart to apply changes
docker-compose restart fhir-chat-api
```

### Frontend Development

```bash
cd frontend
npm start
# Hot reload is enabled - changes reflect immediately
```

## Production Considerations

### Security
- [ ] Configure CORS properly (don't use `allow_origins=["*"]`)
- [ ] Add authentication/authorization
- [ ] Secure API keys using secrets management
- [ ] Use HTTPS with SSL certificates
- [ ] Implement rate limiting

### Performance
- [ ] Add Redis caching for FHIR data
- [ ] Implement database for conversation history
- [ ] Use production ASGI server (Gunicorn)
- [ ] Enable CDN for frontend assets

### Monitoring
- [ ] Add application performance monitoring (APM)
- [ ] Implement structured logging
- [ ] Set up health check endpoints
- [ ] Monitor OpenAI API usage and costs

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs fhir-chat-api

# Rebuild without cache
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Frontend compilation errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### FHIR connection issues
- Verify FHIR_SERVER_URL in `.env`
- Check network connectivity
- Validate patient ID exists on server

### OpenAI API errors
- Verify OPENAI_API_KEY in `.env`
- Check API rate limits
- Monitor quota usage

## API Documentation

Interactive API documentation is available when the backend is running:
- **Swagger UI**: http://localhost:8002/docs
- **ReDoc**: http://localhost:8002/redoc

## Git Repository

**GitHub Enterprise:** https://github.gatech.edu/kjeyabalan3/medichat

### Recent Commits
```
6a946d5 - Add patient allergies and conditions display to UI
a6d5e74 - Remove empty arrays from patient history API response
33e7ca7 - Add support for parsing patient allergies and conditions from FHIR extensions
```

## Contributors

**Karthikeyan Jeyabalan** (kjeyabalan3@gatech.edu)
- FHIR integration and extension parsing
- Backend API development
- Frontend UI implementation
- System architecture and deployment

## License

This project is part of CS-6440 course work at Georgia Institute of Technology.

## Disclaimer

This system is for educational and demonstration purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.

## Support & Feedback

For issues, questions, or feedback:
- Check API documentation at `/docs`
- Review application logs
- Test with provided examples
- Contact: kjeyabalan3@gatech.edu
