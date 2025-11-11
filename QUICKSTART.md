# FHIR Chat API - Quick Start

## ✅ Project Status: READY

The application is fully implemented and running in Docker!

## 🚀 Start the Application (3 Simple Steps)

### Step 1: Navigate to Project Directory
```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
```

### Step 2: Start Docker Container
```bash
# Easiest method - use startup script
./start.sh

# OR use docker-compose directly
docker-compose up -d
```

### Step 3: Access the Application
- **API Base**: http://localhost:8002
- **Swagger Docs**: http://localhost:8002/docs
- **Health Check**: http://localhost:8002/health

## 🧪 Test the Application

### Quick Health Check
```bash
curl http://localhost:8002/health
```

Expected response:
```json
{"status": "healthy", "version": "1.0.0"}
```

### Test Symptom Extraction
```bash
curl -X POST http://localhost:8002/api/v1/extract-symptoms \
  -H "Content-Type: application/json" \
  -d '{"text": "I have headaches and fever"}'
```

### Run Full Test Suite
```bash
python test_api.py
```

## 📊 View Logs
```bash
# View all logs
docker-compose logs -f

# View last 50 lines
docker-compose logs --tail=50 fhir-chat-api
```

## 🛑 Stop the Application
```bash
docker-compose down
```

## 📚 Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/patients/{id}` | GET | Get patient history |
| `/api/v1/chat` | POST | Chat with AI assistant |
| `/api/v1/extract-symptoms` | POST | Extract symptoms from text |
| `/docs` | GET | Interactive API documentation |

## 🔧 Useful Commands

```bash
# Check container status
docker-compose ps

# Restart container
docker-compose restart

# View container logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up --build -d

# Stop and remove containers
docker-compose down
```

## 📁 Key Files

- `main.py` - FastAPI application with all routes
- `fhir_client.py` - FHIR data integration
- `chat_service.py` - OpenAI chat & symptom extraction
- `schemas.py` - Request/response models
- `config.py` - Configuration management
- `.env` - Environment variables (API keys)
- `docker-compose.yml` - Docker configuration
- `README.md` - Complete documentation
- `DEPLOYMENT_SUMMARY.md` - Deployment details

## ⚙️ Configuration

The application is configured via `.env` file:

```env
OPENAI_API_KEY=sk-proj-...  # Already configured
OPENAI_MODEL=gpt-3.5-turbo
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
```

## 💡 Tips

1. **Port Conflict**: If port 8002 is in use, edit `docker-compose.yml` ports section
2. **API Key**: Update OpenAI API key in `.env` if you encounter quota issues
3. **Documentation**: Visit http://localhost:8002/docs for interactive API testing
4. **Logs**: Always check logs if something isn't working: `docker-compose logs`

## 🎯 Sprint Objectives - ALL COMPLETED

- ✅ OpenAI API integration
- ✅ FHIR client wrapper
- ✅ Patient history endpoint
- ✅ Chat API routes
- ✅ Symptom extraction (NLP)
- ✅ End-to-end testing
- ✅ Docker containerization

## 🆘 Need Help?

- **Full Documentation**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT_SUMMARY.md`
- **API Docs**: http://localhost:8002/docs
- **Test Suite**: `python test_api.py`

## 🎉 Ready to Go!

Your FHIR Chat API is running and ready to use!

Open http://localhost:8002/docs in your browser to start exploring the API.
