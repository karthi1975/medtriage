# Testing Guide - MediChat GCP Deployment

## 🧪 Available Test Files

### **Quick Tests** (Start Here)

#### 1. `test-complete-deployment.sh` ⭐ **RECOMMENDED**
**What it tests**: Complete deployment (Frontend + Backend + HAPI FHIR)

**Run it**:
```bash
./test-complete-deployment.sh
```

**Tests**:
- ✅ Frontend health and accessibility
- ✅ Backend API health
- ✅ Llama 4 AI integration
- ✅ HAPI FHIR metadata endpoint
- ✅ HAPI FHIR patient search
- ✅ End-to-end integration
- ✅ Cloud SQL database connection

**Time**: ~30 seconds

---

#### 2. `quick-cloudrun-test.sh`
**What it tests**: Cloud Run services only

**Run it**:
```bash
./quick-cloudrun-test.sh
```

**Tests**:
- Frontend and Backend Cloud Run services
- Llama API
- Basic chat endpoint

**Time**: ~15 seconds

---

### **Comprehensive Tests**

#### 3. `test-cloudrun-deployment.sh`
**What it tests**: All Cloud Run endpoints with 12 test patients

**Run it**:
```bash
./test-cloudrun-deployment.sh
```

**Tests**:
- Health checks
- Llama API
- Chat with 12 different patient scenarios
- Appointment scheduling
- Test ordering

**Time**: ~2-3 minutes

---

#### 4. `run_all_tests.sh`
**What it tests**: All Python backend tests

**Run it**:
```bash
./run_all_tests.sh
```

**Tests**:
- API endpoints (test_api.py)
- Chat service (test_chat_service.py)
- Integration (test_integration.py)
- Triage service (test_triage_service.py)

**Time**: ~1-2 minutes

---

### **Feature-Specific Tests**

#### 5. `test_intelligent_triage.sh`
**What it tests**: Intelligent triage service

**Run it**:
```bash
./test_intelligent_triage.sh
```

**Tests patient triage workflows**

---

#### 6. `test-scheduling-flow.mjs`
**What it tests**: Appointment scheduling

**Run it**:
```bash
node test-scheduling-flow.mjs
```

**Tests scheduling API and workflows**

---

#### 7. `test_llama.py`
**What it tests**: Llama 4 AI integration

**Run it**:
```bash
python test_llama.py
```

**Tests direct Llama API calls**

---

## 📋 Recommended Testing Flow

### For Quick Verification (5 minutes)
```bash
# 1. Test complete deployment
./test-complete-deployment.sh

# If all pass ✅ - you're done!
# If failures ❌ - check specific services
```

---

### For Thorough Testing (10 minutes)
```bash
# 1. Complete deployment test
./test-complete-deployment.sh

# 2. Run comprehensive Cloud Run tests
./test-cloudrun-deployment.sh

# 3. Test specific features
./test_intelligent_triage.sh
node test-scheduling-flow.mjs
```

---

### For Full QA (30 minutes)
```bash
# 1. Complete deployment
./test-complete-deployment.sh

# 2. All Cloud Run tests
./test-cloudrun-deployment.sh

# 3. All Python backend tests
./run_all_tests.sh

# 4. Feature-specific tests
./test_intelligent_triage.sh
node test-scheduling-flow.mjs
python test_llama.py
```

---

## 🎯 Manual Testing

### Test Frontend in Browser
```bash
open https://medichat-frontend-820444130598.us-east5.run.app
```

**Test scenarios**:
1. ✅ Homepage loads
2. ✅ Can navigate to different pages
3. ✅ Chat interface works
4. ✅ Can enter messages
5. ✅ Gets AI responses

---

### Test Backend API Manually
```bash
# Health check
curl https://fhir-chat-api-820444130598.us-east5.run.app/health

# Llama test
curl https://fhir-chat-api-820444130598.us-east5.run.app/llama/test

# Chat
curl -X POST https://fhir-chat-api-820444130598.us-east5.run.app/chat \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "test-123",
    "user_message": "What is my health status?"
  }'
```

---

### Test HAPI FHIR Manually
```bash
# Metadata
curl http://34.162.139.26:8080/fhir/metadata | jq .

# Search patients
curl http://34.162.139.26:8080/fhir/Patient

# Create test patient
curl -X POST http://34.162.139.26:8080/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "name": [{
      "family": "Test",
      "given": ["Demo"]
    }],
    "gender": "male",
    "birthDate": "1990-01-01"
  }'

# Get patient by ID
curl http://34.162.139.26:8080/fhir/Patient/1
```

---

## 🔍 Troubleshooting Failed Tests

### Frontend Tests Fail
```bash
# Check frontend logs
gcloud run services logs tail medichat-frontend --region=us-east5

# Check if frontend is accessible
curl -I https://medichat-frontend-820444130598.us-east5.run.app
```

---

### Backend Tests Fail
```bash
# Check backend logs
gcloud run services logs tail fhir-chat-api --region=us-east5

# Check backend health
curl https://fhir-chat-api-820444130598.us-east5.run.app/health

# Check Llama API access
curl https://fhir-chat-api-820444130598.us-east5.run.app/llama/test
```

---

### HAPI FHIR Tests Fail
```bash
# SSH into VM
gcloud compute ssh hapi-fhir-vm --zone=us-east5-a

# Check containers
docker ps

# Check HAPI logs
docker logs hapi-fhir --tail=100

# Check Cloud SQL Proxy logs
docker logs cloud-sql-proxy

# Restart services
cd /opt/hapi-fhir && docker-compose restart
```

---

## 📊 Test Results Interpretation

### All Tests Pass ✅
Your deployment is fully operational! You can:
- Access the frontend
- Use the AI chat
- Access patient data via FHIR
- All integrations working

### Some Tests Fail ❌

**Frontend fails**:
- Check Cloud Run deployment
- Verify build succeeded
- Check nginx configuration

**Backend fails**:
- Check Llama API credentials
- Verify service account has permissions
- Check FHIR_SERVER_URL environment variable

**HAPI FHIR fails**:
- Check VM is running
- Verify containers are up
- Check Cloud SQL connection
- Verify IAM permissions for VM

**Integration fails**:
- Check network connectivity between services
- Verify FHIR_SERVER_URL in backend
- Check CORS configuration

---

## 🎓 Test Patient Data

### Available Test Patients (in ALL_TEST_PATIENTS.md)

| Patient ID | Scenario | Priority |
|------------|----------|----------|
| 21033 | HIGH Penicillin Allergy | 🔴 CRITICAL |
| 21043 | Pediatric + SEVERE Cashew Allergy | 🔴 CRITICAL |
| 21003 | Emergency Cardiac Symptoms | 🟠 HIGH |
| 21011 | Complex Geriatric Cardiac | 🟠 HIGH |
| 21058 | Multi-System Disease | 🟠 HIGH |

Use these in your tests for realistic scenarios.

---

## ✅ Testing Checklist

Before going to production, verify:

- [ ] Frontend loads and is responsive
- [ ] Backend health check passes
- [ ] Llama 4 AI responds correctly
- [ ] HAPI FHIR metadata accessible
- [ ] Can create/read patient data in FHIR
- [ ] Chat functionality works end-to-end
- [ ] Triage service works
- [ ] Scheduling functionality works
- [ ] All test scripts pass
- [ ] Manual testing of key workflows successful

---

## 📞 Need Help?

If tests fail:
1. Check logs (see Troubleshooting section)
2. Review `COMPLETE_GCP_DEPLOYMENT.md`
3. Verify all services are running:
   - Frontend: `gcloud run services describe medichat-frontend --region=us-east5`
   - Backend: `gcloud run services describe fhir-chat-api --region=us-east5`
   - HAPI VM: `gcloud compute instances describe hapi-fhir-vm --zone=us-east5-a`

---

**Happy Testing!** 🧪✨
