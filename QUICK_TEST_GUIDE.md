# MediChat - Quick Test Guide

## Run All Tests (Recommended First Step)

```bash
./run_all_tests.sh
```

This automated suite runs 10 comprehensive tests covering:
- Docker services health
- Backend API health
- FHIR server connectivity
- Database connections
- Data verification (210 providers, 21 specialties)
- Frontend accessibility
- API documentation

**Expected Result:** All 10 tests should PASS

---

## Quick Manual Tests

### 1. Test Frontend (Open in Browser)
```
http://localhost:80
```
- Chat interface should load
- Type "Hello" - bot should respond
- Try: "I have chest pain" - should get triage recommendations

### 2. Test Backend API (Swagger UI)
```
http://localhost:8002/docs
```
- Interactive API documentation
- Test endpoints directly from browser

### 3. Test FHIR Server
```bash
curl "http://localhost:8081/fhir/Patient?_summary=count"
```
**Expected:** ~1,407 patients

---

## Integration Tests

### Test Complete Triage Flow
```bash
./test_complete_flow.sh
```

This tests the entire workflow:
1. Health check
2. Get patient data
3. Perform triage
4. Search providers
5. Show recommendations

### Test RAG System
```bash
./test_rag_integration.sh
```

Tests AI-powered medical knowledge queries.

### Test Appointment Scheduling
```bash
./test_scheduling.sh
```

Tests provider recommendations and slot availability.

---

## Database Quick Checks

### Check Provider Data
```bash
docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge \
  -c "SELECT COUNT(*) as total_providers FROM providers;"
```
**Expected:** 210

### Check Specialties
```bash
docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge \
  -c "SELECT name FROM specialties ORDER BY name;"
```
**Expected:** 21 specialties listed

### Check FHIR Patients
```bash
curl -s "http://localhost:8081/fhir/Patient?_summary=count" | jq .
```
**Expected:** 1,407 patients

---

## Quick API Tests (curl)

### Health Check
```bash
curl http://localhost:8002/health
```

### Get Patient History
```bash
# First get a patient ID
PATIENT_ID=$(curl -s "http://localhost:8081/fhir/Patient?_count=1" | jq -r '.entry[0].resource.id')

# Then get their history
curl "http://localhost:8002/api/patient/${PATIENT_ID}/history" | jq .
```

### Search Providers
```bash
curl "http://localhost:8002/api/providers/search?specialty=Cardiology&city=Salt%20Lake%20City" | jq .
```

### Test Triage
```bash
curl -X POST http://localhost:8002/api/triage \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "test-123",
    "symptoms": "chest pain and shortness of breath",
    "duration": "2 hours",
    "severity": "severe"
  }' | jq .
```

---

## Performance Check

### Response Time Test
```bash
time curl -s http://localhost:8002/health
```
**Expected:** < 100ms

### Database Query Performance
```bash
docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge \
  -c "EXPLAIN ANALYZE SELECT * FROM providers WHERE specialty_id = 1;"
```
**Expected:** < 10ms execution time

---

## Troubleshooting

### If Tests Fail

1. **Check all services are running:**
   ```bash
   docker-compose ps
   ```

2. **Check logs:**
   ```bash
   docker-compose logs fhir-chat-api --tail=50
   docker-compose logs fhir-chat-frontend --tail=50
   ```

3. **Restart services:**
   ```bash
   docker-compose restart fhir-chat-api fhir-chat-frontend
   ```

4. **Full restart:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Check Port Availability
```bash
lsof -i :80      # Frontend
lsof -i :8002    # Backend
lsof -i :8081    # FHIR
lsof -i :5433    # Tribal DB
lsof -i :5434    # FHIR DB
```

---

## Test Scenarios to Try Manually

### Scenario 1: Emergency Triage
**Input:** "I have severe chest pain radiating to my left arm"
**Expected:**
- Urgency: URGENT/EMERGENCY
- Specialty: Cardiology
- Immediate appointment recommendation

### Scenario 2: Routine Care
**Input:** "I have a skin rash that won't go away"
**Expected:**
- Urgency: ROUTINE
- Specialty: Dermatology
- Appointment options within days

### Scenario 3: Specialist Referral
**Input:** "I need to see a neurologist for recurring headaches"
**Expected:**
- List of neurologists
- Available appointments
- Multiple location options

### Scenario 4: Multi-City Search
**Input:** "Show me cardiologists in Provo and Salt Lake City"
**Expected:**
- Providers from both cities
- Sorted by availability
- Tribal knowledge preferences applied

---

## Success Criteria

All of these should work:

- [ ] Automated test suite passes (10/10 tests)
- [ ] Frontend loads at http://localhost:80
- [ ] API docs accessible at http://localhost:8002/docs
- [ ] Chat responds to messages
- [ ] Triage provides recommendations
- [ ] Provider search returns results
- [ ] Patient history displays correctly
- [ ] Database queries execute quickly (< 100ms)
- [ ] No errors in browser console
- [ ] No errors in Docker logs

---

## For More Details

See full testing documentation:
- **TESTING_APPROACH.md** - Comprehensive testing strategy
- **run_all_tests.sh** - Automated test suite
- **test_complete_flow.sh** - End-to-end workflow test
- **test_rag_integration.sh** - RAG system tests
- **test_scheduling.sh** - Appointment scheduling tests

---

## Quick Commands Reference

```bash
# Run all tests
./run_all_tests.sh

# Run integration tests
./test_complete_flow.sh
./test_rag_integration.sh
./test_scheduling.sh

# Check services
docker-compose ps

# View logs
docker-compose logs -f fhir-chat-api

# Restart service
docker-compose restart fhir-chat-api

# Access URLs
open http://localhost:80              # Frontend
open http://localhost:8002/docs       # API Docs
open http://localhost:8081/fhir       # FHIR Server
```

**Happy Testing!**
