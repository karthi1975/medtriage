# FHIR Chat API - Healthcare AI Assistant

A FastAPI-based application that integrates FHIR patient data retrieval with OpenAI-powered chat functionality and symptom extraction using NLP.

## Features

- **FHIR Integration**: Retrieve patient data from FHIR-compliant servers
- **AI Chat Assistant**: Conversational interface powered by OpenAI
- **Symptom Extraction**: Automatic NLP-based symptom extraction from text
- **Patient Context**: Chat responses enriched with patient medical history
- **RESTful API**: Well-documented API endpoints for all functionalities

## Sprint Plan Implementation Status

✅ Obtain OpenAI or Claude API keys for chat functionality
✅ Implement FHIR client wrapper class for patient data retrieval
✅ Create API endpoint for fetching patient history by ID
✅ Build chat API routes for chat and patient data retrieval
✅ Integrate OpenAI API for basic chat functionality
✅ Test end-to-end: symptom input → NLP extraction

## Project Structure

```
project/
├── main.py              # FastAPI application and routes
├── config.py            # Configuration settings
├── fhir_client.py       # FHIR client wrapper
├── chat_service.py      # OpenAI chat and symptom extraction
├── models.py            # Pydantic models for request/response
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (API keys)
├── test_api.py          # API test suite
├── Dockerfile           # Docker container definition
├── docker-compose.yml   # Docker Compose configuration
├── .dockerignore        # Docker ignore file
└── README.md           # This file
```

## Setup Instructions

### Option 1: Docker Deployment (Recommended)

Docker provides the easiest way to run the application with all dependencies pre-configured.

#### Prerequisites
- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)

#### Quick Start with Docker

**Option A: Using Startup Script (Easiest)**

```bash
# macOS/Linux
./start.sh

# Windows
start.bat
```

**Option B: Manual Docker Commands**

1. **Ensure `.env` file exists** with your OpenAI API key (already created)

2. **Build and start the container**:
```bash
docker-compose up --build
```

Or run in detached mode:
```bash
docker-compose up -d --build
```

3. **Access the API**:
   - API: http://localhost:8002
   - Swagger Docs: http://localhost:8002/docs
   - ReDoc: http://localhost:8002/redoc

   **Note**: The API runs on port 8002 by default. If you need to change the port, edit the `ports` section in `docker-compose.yml`.

4. **View logs**:
```bash
docker-compose logs -f
```

5. **Stop the container**:
```bash
docker-compose down
```

#### Docker Commands Reference

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Stop the container
docker-compose down

# View logs
docker-compose logs -f fhir-chat-api

# Restart the container
docker-compose restart

# Remove containers and volumes
docker-compose down -v

# Execute commands inside the container
docker-compose exec fhir-chat-api bash

# Check container status
docker-compose ps
```

#### Docker Environment Variables

The application uses environment variables from `.env`. You can override them in `docker-compose.yml` or pass them at runtime:

```bash
docker-compose up -e OPENAI_MODEL=gpt-4
```

### Option 2: Local Python Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

The `.env` file has already been created with your OpenAI API key. You can optionally configure additional settings:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-3.5-turbo
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
```

### 3. Run the Application

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8002`

### 4. Access API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8002/docs
- **ReDoc**: http://localhost:8002/redoc

## API Endpoints

### Health Check

```
GET /health
```

Returns API health status and version.

### Patient Data Endpoints

#### Get Complete Patient History

```
GET /api/v1/patients/{patient_id}
```

Retrieves comprehensive patient history including demographics, conditions, medications, allergies, and observations.

**Example:**
```bash
curl http://localhost:8002/api/v1/patients/example
```

#### Get Patient Demographics

```
GET /api/v1/patients/{patient_id}/demographics
```

#### Get Patient Conditions

```
GET /api/v1/patients/{patient_id}/conditions
```

#### Get Patient Medications

```
GET /api/v1/patients/{patient_id}/medications
```

#### Get Patient Allergies

```
GET /api/v1/patients/{patient_id}/allergies
```

### Chat Endpoints

#### Chat with AI Assistant

```
POST /api/v1/chat
```

**Request Body:**
```json
{
  "message": "I have been having headaches for 3 days",
  "patient_id": "optional-patient-id",
  "conversation_history": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous response"}
  ]
}
```

**Response:**
```json
{
  "response": "AI assistant response",
  "extracted_symptoms": [
    {
      "symptom": "headache",
      "severity": "moderate",
      "duration": "3 days",
      "location": "forehead"
    }
  ],
  "patient_context": {}
}
```

#### Extract Symptoms from Text

```
POST /api/v1/extract-symptoms
```

**Request Body:**
```json
{
  "text": "I have severe headaches in my forehead for 3 days and mild nausea",
  "patient_id": "optional-patient-id"
}
```

**Response:**
```json
{
  "extracted_symptoms": [
    {
      "symptom": "headache",
      "severity": "severe",
      "duration": "3 days",
      "location": "forehead"
    },
    {
      "symptom": "nausea",
      "severity": "mild",
      "duration": null,
      "location": null
    }
  ],
  "summary": "Patient experiencing severe headaches for 3 days and mild nausea",
  "raw_response": "..."
}
```

## Testing

### Run Automated Tests

**With Docker:**
```bash
# Make sure the container is running
docker-compose up -d

# Run tests from your host machine
python test_api.py

# Or run tests inside the container
docker-compose exec fhir-chat-api python test_api.py
```

**Without Docker:**
```bash
python test_api.py
```

This will run a comprehensive test suite including:
- Health check
- Symptom extraction with multiple test cases
- Chat functionality
- Conversation history management

### Manual Testing Examples

#### 1. Test Symptom Extraction

```bash
curl -X POST http://localhost:8002/api/v1/extract-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I have been experiencing severe headaches for 3 days in my forehead area, with mild nausea"
  }'
```

#### 2. Test Chat

```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a fever and sore throat. What should I do?"
  }'
```

#### 3. Test Patient Data Retrieval

```bash
curl http://localhost:8002/api/v1/patients/example
```

## FHIR Server

The application uses the public HAPI FHIR test server by default:
- Server: https://hapi.fhir.org/baseR4
- This is a public test server with sample patient data

To use a different FHIR server, update the `FHIR_SERVER_URL` in your `.env` file.

## Key Components

### 1. FHIR Client (`fhir_client.py`)

Wrapper class for interacting with FHIR servers. Provides methods for:
- Patient demographics retrieval
- Medical conditions/diagnoses
- Observations (vitals, lab results)
- Medications
- Allergies
- Comprehensive patient history

### 2. Chat Service (`chat_service.py`)

OpenAI integration for:
- Conversational AI responses
- Symptom extraction using NLP
- Patient context-aware conversations
- Conversation history management

### 3. Main Application (`main.py`)

FastAPI application with:
- RESTful API endpoints
- Error handling
- CORS configuration
- Request/response validation
- Logging

## Development

### Adding New Features

1. **New FHIR Resources**: Add methods to `fhir_client.py`
2. **New Chat Features**: Extend `chat_service.py`
3. **New Endpoints**: Add routes to `main.py`
4. **New Models**: Define in `models.py`

### Logging

All components use Python's logging module. Logs include:
- API requests and responses
- FHIR operations
- OpenAI API calls
- Errors and warnings

### Error Handling

The API includes comprehensive error handling:
- 404: Resource not found
- 500: Internal server errors
- Detailed error messages in responses

## Production Considerations

Before deploying to production:

1. **Security**:
   - Configure CORS properly (don't use `allow_origins=["*"]`)
   - Add authentication/authorization
   - Secure API keys
   - Use HTTPS

2. **FHIR Server**:
   - Use a production FHIR server
   - Configure authentication if required
   - Handle rate limiting

3. **OpenAI**:
   - Monitor API usage and costs
   - Implement rate limiting
   - Handle API timeouts

4. **Scaling**:
   - Use production ASGI server (e.g., Gunicorn with Uvicorn workers)
   - Implement caching for FHIR data
   - Add database for conversation history

## Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check container logs
docker-compose logs

# Rebuild the image
docker-compose down
docker-compose build --no-cache
docker-compose up
```

**Port 8000 already in use:**
```bash
# Find what's using the port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Either stop that process or change the port in docker-compose.yml:
ports:
  - "8001:8000"  # Map to different host port
```

**Environment variables not loading:**
```bash
# Verify .env file exists and has correct format
cat .env

# Restart container after .env changes
docker-compose down
docker-compose up
```

### API Connection Issues

If you can't connect to the API:
- **Docker**: Make sure the container is running: `docker-compose ps`
- **Local**: Make sure the application is running: `python main.py`
- Check that port 8002 (Docker) or 8000 (local) is not in use
- Verify firewall settings
- Test health endpoint: `curl http://localhost:8002/health`

### FHIR Data Issues

If patient data retrieval fails:
- Check FHIR server URL in `.env`
- Verify patient ID exists on the FHIR server
- Check network connectivity to FHIR server

### OpenAI Issues

If chat or symptom extraction fails:
- Verify OpenAI API key in `.env`
- Check OpenAI API status
- Monitor API rate limits and quotas

## Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review application logs
3. Test with the provided test suite

## License

[Add your license information here]

## Authors

[Add author information here]
