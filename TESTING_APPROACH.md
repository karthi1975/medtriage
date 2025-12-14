# MediChat Enhanced System - Testing Approach

## Overview

This document provides a comprehensive testing strategy for the MediChat Enhanced System, covering all components from database to UI.

---

## Testing Levels

### 1. Unit Testing
- Individual components and functions
- Database queries
- API endpoints

### 2. Integration Testing
- FHIR server integration
- Database connections
- RAG system
- Tribal knowledge matching

### 3. End-to-End Testing
- Complete user workflows
- Triage to scheduling flow
- Multi-system interactions

### 4. Performance Testing
- Response times
- Concurrent users
- Database query performance

---

## Test Environment Setup

### Prerequisites
```bash
# Ensure all services are running
docker-compose ps

# Expected: All 5 services UP
# - postgres-fhir-db
# - postgres-tribal-db
# - hapi-fhir-server
# - fhir-chat-api
# - fhir-chat-frontend
```

### Test Data Verification
```bash
# Verify FHIR data
curl "http://localhost:8081/fhir/Patient?_summary=count"
# Expected: ~1,407 patients

# Verify Tribal DB
docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge \
  -c "SELECT COUNT(*) FROM providers;"
# Expected: 210 providers

docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge \
  -c "SELECT COUNT(*) FROM schedules;"
# Expected: ~1,476 schedules
```

---

## 1. Backend API Testing

### A. Health Check
```bash
curl http://localhost:8002/health
```
**Expected Response:**
```json
{"status":"healthy","version":"2.0.0"}
```

### B. Test Patient Lookup
```bash
# Get a real patient ID first
curl "http://localhost:8081/fhir/Patient?_count=1" | jq -r '.entry[0].resource.id'

# Use that ID to test patient endpoint
PATIENT_ID="<your_patient_id>"
curl "http://localhost:8002/api/patient/${PATIENT_ID}/history"
```

**Expected Response:**
```json
{
  "patient_id": "...",
  "name": "...",
  "age": 45,
  "conditions": [...],
  "medications": [...],
  "allergies": [...]
}
```

### C. Test Triage Endpoint
```bash
curl -X POST http://localhost:8002/api/triage \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "test-patient-123",
    "symptoms": "I have a severe headache and fever for 3 days",
    "duration": "3 days",
    "severity": "moderate"
  }'
```

**Expected Response:**
```json
{
  "urgency": "urgent",
  "recommended_specialty": "Neurology",
  "confidence": 0.85,
  "reasoning": "...",
  "recommendations": [...]
}
```

### D. Test Provider Search
```bash
curl "http://localhost:8002/api/providers/search?specialty=Cardiology&city=Salt%20Lake%20City"
```

**Expected Response:**
```json
{
  "providers": [
    {
      "provider_id": "...",
      "name": "Dr. ...",
      "specialty": "Cardiology",
      "facility": "...",
      "available_slots": [...]
    }
  ]
}
```

### E. Test RAG System
```bash
curl -X POST http://localhost:8002/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the symptoms of diabetes?",
    "context": "patient triage"
  }'
```

**Expected Response:**
```json
{
  "answer": "...",
  "sources": [...],
  "confidence": 0.9
}
```

---

## 2. Frontend UI Testing

### A. Manual UI Test Cases

#### Test Case 1: Basic Chat Interface
1. Open http://localhost:80
2. Verify chat interface loads
3. Type: "Hello"
4. **Expected:** Bot responds with greeting

#### Test Case 2: Symptom Triage
1. Enter: "I have chest pain and shortness of breath"
2. **Expected:**
   - System asks clarifying questions
   - Urgency level displayed
   - Specialty recommendation shown
   - Option to schedule appointment

#### Test Case 3: Patient History Display
1. Enter a valid patient ID
2. Request: "Show my medical history"
3. **Expected:**
   - Conditions displayed
   - Medications listed
   - Allergies shown
   - Formatted clearly

#### Test Case 4: Appointment Scheduling
1. Complete triage (Test Case 2)
2. Click "Schedule Appointment"
3. Select specialty: "Cardiology"
4. Select city: "Salt Lake City"
5. **Expected:**
   - Available providers listed
   - Available time slots shown
   - Can select and confirm appointment

#### Test Case 5: Multi-Specialty Search
1. Request: "I need to see a dermatologist"
2. **Expected:**
   - Dermatology providers listed
   - Multiple facilities shown
   - Available times displayed

### B. Browser Console Testing

Open Developer Tools (F12) and check:
```javascript
// Test API connectivity
fetch('http://localhost:8002/health')
  .then(r => r.json())
  .then(console.log)

// Test patient data fetch
fetch('http://localhost:8002/api/patient/test-patient-123/history')
  .then(r => r.json())
  .then(console.log)
```

### C. Responsive Design Testing
- Test on desktop (1920x1080)
- Test on tablet (768x1024)
- Test on mobile (375x667)
- Verify all UI elements are accessible

---

## 3. Database Testing

### A. PostgreSQL Tribal DB Tests
```bash
# Connect to tribal DB
docker exec -it postgres-tribal-db psql -U tribaluser -d tribal_knowledge

-- Test 1: Verify all specialties loaded
SELECT specialty_id, name, COUNT(*) as provider_count
FROM specialties s
LEFT JOIN providers p ON s.specialty_id = p.specialty_id
GROUP BY specialty_id, name
ORDER BY name;
-- Expected: 21 specialties, each with ~10 providers

-- Test 2: Verify schedules
SELECT
  p.name as provider_name,
  s.day_of_week,
  s.start_time,
  s.end_time,
  s.max_patients
FROM schedules s
JOIN providers p ON s.provider_id = p.provider_id
LIMIT 10;
-- Expected: Valid schedule data

-- Test 3: Verify provider preferences
SELECT
  p.name as provider_name,
  pp.preference_type,
  pp.preference_value,
  pp.priority
FROM provider_preferences pp
JOIN providers p ON pp.provider_id = p.provider_id
LIMIT 10;
-- Expected: Tribal knowledge preferences

-- Test 4: Verify facilities by region
SELECT
  region,
  COUNT(*) as facility_count,
  STRING_AGG(DISTINCT city, ', ') as cities
FROM facilities
GROUP BY region
ORDER BY region;
-- Expected: 7 Utah regions

\q
```

### B. PostgreSQL FHIR DB Tests
```bash
docker exec -it postgres-fhir-db psql -U hapiuser -d hapi

-- Check FHIR resource counts
SELECT res_type, COUNT(*)
FROM hfj_resource
GROUP BY res_type
ORDER BY res_type;

\q
```

### C. HAPI FHIR Server Tests
```bash
# Test 1: Patient count
curl "http://localhost:8081/fhir/Patient?_summary=count"

# Test 2: Search patients by name
curl "http://localhost:8081/fhir/Patient?name=Smith"

# Test 3: Get specific patient
curl "http://localhost:8081/fhir/Patient/<patient_id>"

# Test 4: Search practitioners
curl "http://localhost:8081/fhir/Practitioner?_count=10"

# Test 5: Search organizations
curl "http://localhost:8081/fhir/Organization?_count=10"
```

---

## 4. Integration Testing

### Test Scenario 1: Complete Triage Flow
```bash
# Create test script
cat > test_complete_flow.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Testing Complete Triage Flow ==="

# Step 1: Health check
echo "1. Health check..."
curl -s http://localhost:8002/health | jq .

# Step 2: Get a real patient
echo "2. Getting patient data..."
PATIENT_ID=$(curl -s "http://localhost:8081/fhir/Patient?_count=1" | jq -r '.entry[0].resource.id')
echo "Patient ID: $PATIENT_ID"

# Step 3: Get patient history
echo "3. Fetching patient history..."
curl -s "http://localhost:8002/api/patient/${PATIENT_ID}/history" | jq .

# Step 4: Perform triage
echo "4. Performing triage..."
curl -s -X POST http://localhost:8002/api/triage \
  -H "Content-Type: application/json" \
  -d "{
    \"patient_id\": \"${PATIENT_ID}\",
    \"symptoms\": \"chest pain and shortness of breath\",
    \"duration\": \"2 hours\",
    \"severity\": \"severe\"
  }" | jq .

# Step 5: Search providers
echo "5. Searching for cardiologists..."
curl -s "http://localhost:8002/api/providers/search?specialty=Cardiology&city=Salt%20Lake%20City" | jq .

echo "=== Test Complete ==="
EOF

chmod +x test_complete_flow.sh
./test_complete_flow.sh
```

### Test Scenario 2: RAG System Integration
```bash
cat > test_rag_integration.sh << 'EOF'
#!/bin/bash

echo "=== Testing RAG System ==="

# Test medical knowledge queries
curl -X POST http://localhost:8002/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the warning signs of a heart attack?",
    "context": "emergency triage"
  }' | jq .

curl -X POST http://localhost:8002/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "When should I see a cardiologist?",
    "context": "specialty referral"
  }' | jq .

echo "=== RAG Test Complete ==="
EOF

chmod +x test_rag_integration.sh
./test_rag_integration.sh
```

### Test Scenario 3: Appointment Scheduling
```bash
cat > test_scheduling.sh << 'EOF'
#!/bin/bash

echo "=== Testing Appointment Scheduling ==="

# Step 1: Get available slots
echo "1. Getting available slots for Cardiology..."
curl -s "http://localhost:8002/api/appointments/available-slots?specialty=Cardiology&date=2025-12-15&city=Salt%20Lake%20City" | jq .

# Step 2: Get provider recommendations
echo "2. Getting provider recommendations..."
curl -s -X POST http://localhost:8002/api/appointments/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty": "Cardiology",
    "urgency": "urgent",
    "patient_preferences": {
      "preferred_time": "morning",
      "preferred_city": "Salt Lake City"
    }
  }' | jq .

echo "=== Scheduling Test Complete ==="
EOF

chmod +x test_scheduling.sh
./test_scheduling.sh
```

---

## 5. Performance Testing

### A. Response Time Tests
```bash
# Test API response times
for i in {1..10}; do
  time curl -s http://localhost:8002/health > /dev/null
done

# Expected: < 100ms per request
```

### B. Concurrent User Simulation
```bash
# Install Apache Bench if needed
# brew install apache-bench (macOS)

# Test concurrent requests
ab -n 100 -c 10 http://localhost:8002/health

# Expected:
# - 100% success rate
# - Mean response time < 500ms
```

### C. Database Query Performance
```sql
-- In tribal DB, test query performance
docker exec -it postgres-tribal-db psql -U tribaluser -d tribal_knowledge

EXPLAIN ANALYZE
SELECT p.*, f.name as facility_name, s.name as specialty_name
FROM providers p
JOIN facilities f ON p.facility_id = f.facility_id
JOIN specialties s ON p.specialty_id = s.specialty_id
WHERE s.name = 'Cardiology'
  AND f.city = 'Salt Lake City';
-- Expected: Execution time < 10ms
```

---

## 6. Error Handling Tests

### Test Invalid Patient ID
```bash
curl "http://localhost:8002/api/patient/invalid-id-12345/history"
# Expected: 404 or appropriate error message
```

### Test Invalid Specialty
```bash
curl "http://localhost:8002/api/providers/search?specialty=InvalidSpecialty"
# Expected: Empty results or validation error
```

### Test Malformed Request
```bash
curl -X POST http://localhost:8002/api/triage \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# Expected: 400 Bad Request with error details
```

---

## 7. Security Testing

### A. CORS Testing
```bash
# Test cross-origin requests
curl -X OPTIONS http://localhost:8002/api/triage \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST"
# Expected: Appropriate CORS headers
```

### B. Input Validation
```bash
# Test SQL injection attempt
curl "http://localhost:8002/api/providers/search?specialty='; DROP TABLE providers; --"
# Expected: Input sanitized, no SQL injection

# Test XSS attempt
curl -X POST http://localhost:8002/api/triage \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "test",
    "symptoms": "<script>alert(\"XSS\")</script>"
  }'
# Expected: Script tags escaped/sanitized
```

---

## 8. Regression Testing Checklist

Run this checklist after any code changes:

- [ ] All Docker services start successfully
- [ ] Health endpoint returns healthy
- [ ] FHIR server accessible
- [ ] Database connections working
- [ ] Patient data retrieval working
- [ ] Triage endpoint functional
- [ ] Provider search working
- [ ] Appointment scheduling functional
- [ ] RAG system responding
- [ ] Frontend loads without errors
- [ ] Chat interface functional
- [ ] No console errors in browser

---

## 9. Automated Test Suite

### Create Master Test Script
```bash
cat > run_all_tests.sh << 'EOF'
#!/bin/bash
set -e

echo "=================================="
echo "MediChat Enhanced - Full Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

run_test() {
  test_count=$((test_count + 1))
  echo -e "\n${YELLOW}Test $test_count: $1${NC}"
  if eval "$2"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    pass_count=$((pass_count + 1))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC}"
    fail_count=$((fail_count + 1))
    return 1
  fi
}

# Test 1: Docker Services
run_test "Docker Services Running" \
  "docker-compose ps | grep -q 'Up'"

# Test 2: Health Endpoint
run_test "Backend Health Check" \
  "curl -s http://localhost:8002/health | grep -q 'healthy'"

# Test 3: FHIR Server
run_test "FHIR Server Accessible" \
  "curl -s http://localhost:8081/fhir/metadata | grep -q 'CapabilityStatement'"

# Test 4: Tribal DB Connection
run_test "Tribal Database Connection" \
  "docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -c 'SELECT 1;' | grep -q '1 row'"

# Test 5: FHIR DB Connection
run_test "FHIR Database Connection" \
  "docker exec postgres-fhir-db psql -U admin -d hapi -c 'SELECT 1;' | grep -q '1 row'"

# Test 6: Provider Count
run_test "Provider Data Loaded" \
  "docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -t -c 'SELECT COUNT(*) FROM providers;' | grep -q '210'"

# Test 7: Specialty Count
run_test "Specialty Data Loaded" \
  "docker exec postgres-tribal-db psql -U tribaluser -d tribal_knowledge -t -c 'SELECT COUNT(*) FROM specialties;' | grep -q '21'"

# Test 8: Frontend Accessible
run_test "Frontend Accessible" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:80 | grep -q '200'"

# Test 9: API Docs Accessible
run_test "API Documentation Accessible" \
  "curl -s http://localhost:8002/docs | grep -q 'Swagger'"

# Test 10: Patient Endpoint
run_test "Patient API Endpoint" \
  "curl -s http://localhost:8002/api/patient/test-patient-123/history | grep -q 'patient_id'"

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo "=================================="

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi
EOF

chmod +x run_all_tests.sh
```

---

## 10. Test Execution Schedule

### Daily Testing (Continuous Integration)
- Run automated test suite: `./run_all_tests.sh`
- Check Docker container health
- Verify database backups

### Weekly Testing
- Full integration test scenarios
- Performance benchmarks
- Security scans
- UI/UX testing across browsers

### Pre-Deployment Testing
- Complete regression test suite
- Load testing with concurrent users
- End-to-end workflow validation
- Database migration testing
- Backup and restore testing

---

## Test Data

### Sample Patient IDs for Testing
```bash
# Get list of real patient IDs
curl -s "http://localhost:8081/fhir/Patient?_count=10" | \
  jq -r '.entry[].resource.id' > patient_test_ids.txt

# Use these IDs in your tests
cat patient_test_ids.txt
```

### Sample Test Symptoms
- "I have chest pain and shortness of breath" (Cardiology - Urgent)
- "Severe headache with vision problems" (Neurology - Urgent)
- "Persistent cough for 2 weeks" (Pulmonology - Routine)
- "Joint pain and swelling in hands" (Rheumatology - Semi-urgent)
- "Skin rash that won't go away" (Dermatology - Routine)

---

## Troubleshooting Tests

### If Tests Fail

1. **Check Docker Services**
   ```bash
   docker-compose ps
   docker-compose logs fhir-chat-api
   ```

2. **Check Database Connectivity**
   ```bash
   docker exec postgres-tribal-db pg_isready
   docker exec postgres-fhir-db pg_isready
   ```

3. **Check Port Availability**
   ```bash
   lsof -i :80
   lsof -i :8002
   lsof -i :8081
   ```

4. **Restart Services**
   ```bash
   docker-compose restart fhir-chat-api
   docker-compose restart fhir-chat-frontend
   ```

5. **Check Logs for Errors**
   ```bash
   docker-compose logs --tail=100 fhir-chat-api
   ```

---

## Success Criteria

### All Tests Must Pass:
- ✅ All Docker containers healthy
- ✅ All API endpoints return 200/201 responses
- ✅ Database queries execute in < 100ms
- ✅ Frontend loads without JavaScript errors
- ✅ Patient data retrieves successfully
- ✅ Triage provides recommendations
- ✅ Provider search returns results
- ✅ RAG system provides answers
- ✅ Appointment scheduling works end-to-end

---

## Next Steps

1. Run the automated test suite: `./run_all_tests.sh`
2. Execute integration test scenarios
3. Perform manual UI testing
4. Document any issues found
5. Create test reports

**Happy Testing!**
