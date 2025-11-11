# Medical Triage System - Testing Guide

## ✅ System Architecture Verification

### Backend (FastAPI)
- **Port**: 8002
- **Host**: 0.0.0.0
- **CORS**: Enabled for all origins
- **OpenAI**: Configured with API key
- **FHIR Server**: https://hapi.fhir.org/baseR4

### Frontend (React)
- **Port**: 3000 (default React)
- **Backend Proxy**: http://localhost:8002
- **API Base URL**: http://localhost:8002

### All Endpoints Wired:

#### Backend API Endpoints:
1. ✅ `GET /` - Root health check
2. ✅ `GET /health` - Health check endpoint
3. ✅ `GET /api/v1/patients/{patient_id}` - Get patient history
4. ✅ `POST /api/v1/chat` - Chat with AI assistant
5. ✅ `POST /api/v1/extract-symptoms` - Extract symptoms from text
6. ✅ `GET /api/v1/patients/{patient_id}/demographics` - Patient demographics
7. ✅ `GET /api/v1/patients/{patient_id}/conditions` - Patient conditions
8. ✅ `GET /api/v1/patients/{patient_id}/medications` - Patient medications
9. ✅ `GET /api/v1/patients/{patient_id}/allergies` - Patient allergies
10. ✅ `POST /api/v1/triage` - Perform triage assessment

#### Frontend API Calls:
1. ✅ `healthCheck()` → `GET /health`
2. ✅ `performTriage()` → `POST /api/v1/triage`
3. ✅ `sendChatMessage()` → `POST /api/v1/chat`
4. ✅ `extractSymptoms()` → `POST /api/v1/extract-symptoms`
5. ✅ `getPatientHistory()` → `GET /api/v1/patients/{id}`

### Service Integrations:
- ✅ **ChatService** - Integrated with OpenAI GPT-3.5-turbo
- ✅ **TriageService** - Rule-based + AI triage logic
- ✅ **FHIRClient** - Connected to HAPI FHIR server
- ✅ **CORS** - Frontend can communicate with backend

---

## 🚀 How to Start and Test

### Terminal 1: Start Backend API

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
source venv/bin/activate
python main.py
```

**Expected Output:**
```
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8002 (Press CTRL+C to quit)
```

### Terminal 2: Start Frontend

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project/frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view fhir-triage-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## 🧪 Testing URLs

### 1. Frontend Application
**URL**: http://localhost:3000

**What to Test:**
- ✅ Page loads with "Medical Triage System" header
- ✅ API Status shows "Connected to API" (green dot)
- ✅ Chat interface is visible on the left
- ✅ Empty results panel on the right shows "No Assessment Yet"
- ✅ Disclaimer at the bottom

### 2. Backend API Health Check
**URL**: http://localhost:8002/health

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "FHIR Chat API is running"
}
```

### 3. Backend API Documentation (Swagger)
**URL**: http://localhost:8002/docs

**What You'll See:**
- Interactive API documentation
- All 10 endpoints listed
- Try out functionality for each endpoint

### 4. Backend API Alternative Docs (ReDoc)
**URL**: http://localhost:8002/redoc

**What You'll See:**
- Alternative documentation view
- Better for reading/understanding API structure

---

## 🎯 Full Integration Test Flow

### Test 1: Simple Symptom Assessment

1. Go to http://localhost:3000
2. In the chat interface, type: **"I have a headache and fever"**
3. Click "Send" or press Enter
4. Watch for:
   - ✅ Message appears in chat
   - ✅ Loading indicator shows
   - ✅ Triage results appear on the right panel
   - ✅ Priority level is assigned (Non-Urgent/Urgent/Emergency)
   - ✅ Care recommendations are shown
   - ✅ Extracted symptoms are listed

### Test 2: Emergency Symptom

1. Reset or refresh the page
2. Type: **"I'm having severe chest pain and difficulty breathing"**
3. Expected Results:
   - ✅ Priority: **EMERGENCY**
   - ✅ Care Level: **Emergency Department - Immediate**
   - ✅ Red/urgent styling
   - ✅ Symptoms extracted: chest pain (severe), breathing difficulty

### Test 3: Mild Symptom

1. Reset or refresh the page
2. Type: **"I have a mild headache"**
3. Expected Results:
   - ✅ Priority: **NON_URGENT**
   - ✅ Care Level: Lower priority care
   - ✅ Green/low-priority styling

### Test 4: API Direct Test

Open browser console and test API directly:

```javascript
// Test health check
fetch('http://localhost:8002/health')
  .then(r => r.json())
  .then(console.log);

// Test triage endpoint
fetch('http://localhost:8002/api/v1/triage', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: "I have fever and cough",
    patient_id: null,
    symptoms: null
  })
})
  .then(r => r.json())
  .then(console.log);
```

---

## 📊 Test Coverage Summary

### Backend Tests: 35 Passing ✅
- Chat Service: 9 tests
- Triage Service: 14 tests
- API Integration: 11 tests
- API Endpoints: 1 test
- Code Coverage: 68%

### Frontend Tests: 4 Passing ✅
- Component rendering tests
- UI element presence tests

**Total**: 39 automated tests passing

---

## 🔍 Troubleshooting

### Backend won't start?
```bash
# Check if port 8002 is in use
lsof -i :8002

# If it is, kill the process
kill -9 <PID>

# Or use a different port by editing main.py line 417
```

### Frontend shows "API Disconnected"?
1. Ensure backend is running on port 8002
2. Check backend logs for errors
3. Test http://localhost:8002/health directly
4. Check browser console for CORS errors

### OpenAI API errors?
- Verify `.env` file has valid `OPENAI_API_KEY`
- Check OpenAI account has credits
- Backend will log OpenAI errors

### FHIR Server errors?
- Public HAPI FHIR server may be slow/unavailable
- Most features work without FHIR (patient_id is optional)

---

## 🎉 Success Criteria

Your system is fully wired and working when:

- ✅ Backend starts without errors on port 8002
- ✅ Frontend starts and shows "Connected to API"
- ✅ You can submit symptoms and receive triage results
- ✅ Symptoms are correctly extracted and displayed
- ✅ Priority levels match symptom severity
- ✅ Care recommendations are appropriate
- ✅ All tests pass (run `pytest` and `npm test`)
- ✅ Swagger docs accessible at http://localhost:8002/docs

---

## 📝 Quick Reference

| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:8002 | REST API server |
| **Health Check** | http://localhost:8002/health | API status |
| **Swagger Docs** | http://localhost:8002/docs | Interactive API docs |
| **ReDoc** | http://localhost:8002/redoc | Alternative API docs |

---

**System Status**: ✅ All components wired and tested
**Last Verified**: 2025-11-10
