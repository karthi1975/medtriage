# Llama 4 API Integration Guide

## Overview

This guide explains how to use the Llama 4 Maverick model integration with your medical triage application through Google Cloud's Vertex AI.

## Prerequisites

1. **Google Cloud SDK (gcloud)** - Already installed ✅
2. **Google Cloud Project** - `project-c78515e0-ee8f-4282-a3c` ✅
3. **Llama 4 API Access** - Enabled in us-east5 region ✅

## Step 1: Authentication

Run these commands in your **local terminal**:

```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Set your project
gcloud config set project project-c78515e0-ee8f-4282-a3c

# 3. Fix quota project warning (optional but recommended)
gcloud auth application-default set-quota-project project-c78515e0-ee8f-4282-a3c
```

## Step 2: Test the API (Command Line)

Test with curl to verify everything works:

```bash
# Set environment variables
export PROJECT_ID=project-c78515e0-ee8f-4282-a3c
export ENDPOINT=us-east5-aiplatform.googleapis.com
export REGION=us-east5

# Test API call
curl \
  -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://${ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/openapi/chat/completions \
  -d '{"model":"meta/llama-4-maverick-17b-128e-instruct-maas", "stream":false, "messages":[{"role": "user", "content": "Hello! Can you help with medical questions?"}]}'
```

## Step 3: Test Python Integration

Run the test script:

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
python test_llama.py
```

This will test:
- ✅ Basic chat functionality
- ✅ Medical triage analysis
- ✅ Clinical summary generation

## Step 4: Restart Your Application

To use Llama 4 in your running application:

```bash
# Install new dependencies
docker-compose down
docker-compose build fhir-chat-api
docker-compose up -d
```

Or if running locally:
```bash
pip install requests>=2.28.0
```

## API Endpoints

Once your application is running, you'll have these new endpoints:

### 1. Test Connection
```bash
curl http://localhost:8002/llama/test
```

### 2. Chat Completion
```bash
curl -X POST http://localhost:8002/llama/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are the symptoms of diabetes?"}
    ],
    "temperature": 0.7,
    "max_tokens": 512
  }'
```

### 3. Medical Triage
```bash
curl -X POST http://localhost:8002/llama/triage \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "High fever, severe headache, stiff neck",
    "patient_history": {
      "age": "45",
      "allergies": "Penicillin",
      "conditions": "Hypertension"
    }
  }'
```

### 4. Summarize Clinical Notes
```bash
curl -X POST http://localhost:8002/llama/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "clinical_notes": "Patient presents with acute chest pain radiating to left arm. BP 145/92, HR 98. ECG shows ST elevation. History of smoking and family CAD."
  }'
```

## API Documentation

View interactive API docs:
- Swagger UI: http://localhost:8002/docs
- ReDoc: http://localhost:8002/redoc

Look for the **"Llama 4"** section in the API documentation.

## Integration Examples

### Example 1: Using in Python Code

```python
from llama_service import get_llama_service

# Initialize service
llama = get_llama_service()

# Simple chat
messages = [
    {"role": "user", "content": "What is hypertension?"}
]
response = llama.chat_completion(messages)
print(response['choices'][0]['message']['content'])

# Medical triage
recommendation = llama.medical_triage(
    patient_symptoms="Chest pain, shortness of breath",
    patient_history={"age": "55", "smoking": "yes"}
)
print(recommendation)
```

### Example 2: Using in API Endpoint

```python
from fastapi import APIRouter
from llama_service import get_llama_service

router = APIRouter()

@router.post("/analyze-symptoms")
async def analyze_symptoms(symptoms: str):
    llama = get_llama_service()
    analysis = llama.medical_triage(symptoms)
    return {"analysis": analysis}
```

## Configuration

Environment variables in `.env`:

```bash
# Google Cloud AI Platform
PROJECT_ID=project-c78515e0-ee8f-4282-a3c
ENDPOINT=us-east5-aiplatform.googleapis.com
REGION=us-east5
```

## Troubleshooting

### Error: "Request is missing required authentication credential"

**Solution**: Re-authenticate with gcloud
```bash
gcloud auth login
gcloud auth application-default login
```

### Error: "Reauthentication failed"

**Solution**: Your token expired. Run:
```bash
gcloud auth login --update-adc
```

### Error: "quota project warning"

**Solution**: Update quota project:
```bash
gcloud auth application-default set-quota-project project-c78515e0-ee8f-4282-a3c
```

### Container can't access gcloud

**Solution**: Mount gcloud credentials in docker-compose.yml:
```yaml
volumes:
  - ~/.config/gcloud:/root/.config/gcloud:ro
```

## Model Information

**Model**: meta/llama-4-maverick-17b-128e-instruct-maas
- **Size**: 17 billion parameters
- **Context**: 128k tokens
- **Type**: Instruction-tuned for medical/general use
- **Region**: us-east5 (US East)

## Cost Considerations

Monitor your usage:
```bash
gcloud billing accounts describe BILLING_ACCOUNT_ID
```

Set budget alerts in Google Cloud Console to avoid unexpected costs.

## Next Steps

1. ✅ Complete authentication
2. ✅ Test with curl command
3. ✅ Run Python test script
4. ✅ Restart application with new endpoints
5. 🔜 Integrate into your medical assistant workflow
6. 🔜 Add to intelligent triage service
7. 🔜 Create UI components for Llama-powered features

## Support

For issues:
- Check logs: `docker-compose logs fhir-chat-api`
- Review test results: `python test_llama.py`
- Check gcloud status: `gcloud auth list`

## Security Notes

⚠️ **Important**:
- Never commit `.env` file with credentials
- Keep `PROJECT_ID` and authentication tokens secure
- Use service accounts in production (not personal gcloud auth)
- Monitor API usage and set quota limits

## Production Deployment

For production, use a service account instead of personal credentials:

1. Create service account in GCP Console
2. Download JSON key
3. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```
4. Update `llama_service.py` to use Application Default Credentials

---

**Version**: 1.0
**Last Updated**: January 2026
**Model**: Llama 4 Maverick 17B
