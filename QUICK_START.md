# MediChat Enhanced - Quick Start Guide

Get the enhanced MediChat system running in **under 15 minutes**.

---

## Prerequisites

- Docker & Docker Compose installed
- Python 3.9+ installed
- 8GB RAM minimum (HAPI FHIR requires ~2GB)
- 10GB free disk space

---

## Step 1: Start Infrastructure (2 minutes)

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project

# Start all Docker services
docker-compose up -d

# Verify all containers are running
docker-compose ps
```

**Expected Output:**
```
NAME                    STATUS          PORTS
hapi-fhir              running         0.0.0.0:8081->8080/tcp
postgres-fhir          running         0.0.0.0:5434->5432/tcp
postgres-tribal        running         0.0.0.0:5433->5432/tcp
pgadmin                running         0.0.0.0:5050->80/tcp (dev only)
```

**Wait 60-90 seconds** for HAPI FHIR to fully start (JVM warm-up).

Test HAPI FHIR:
```bash
curl http://localhost:8081/fhir/metadata | jq '.fhirVersion'
# Should return: "4.0.1"
```

---

## Step 2: Generate Synthetic Data (5-10 minutes)

```bash
cd data_generation

# Install Python dependencies
pip install -r requirements.txt

# Run data generation pipeline
python main.py
```

**What happens:**
- Generates 500 patients across 7 Utah regions
- Generates 50 providers (10 per specialty)
- Generates 21 facilities (3 per region)
- Generates ~5,200 clinical resources (conditions, labs, medications, allergies)
- Loads all data to HAPI FHIR server
- Loads tribal knowledge to PostgreSQL

**Progress indicators:**
```
Generating 500 patients...
✓ Generated 500 patients
Generating 50 providers...
✓ Generated 50 providers across 5 specialties
Generating 21 facilities...
✓ Generated 21 facilities across 7 regions
Generating clinical data...
✓ Generated 1,500 conditions
✓ Generated 2,500 observations
✓ Generated 1,200 medications
✓ Generated 300 allergies
Loading to HAPI FHIR (batches of 50)...
✓ Loaded 500 patients
✓ Loaded 5,200 clinical resources
Loading to Tribal DB...
✓ Loaded 50 providers
✓ Loaded 150 provider preferences
✓ Loaded 63 clinic rules
```

**Verification:**
```bash
# Check FHIR patient count
curl http://localhost:8081/fhir/Patient?_summary=count | jq '.total'
# Should return: 500

# Check tribal DB provider count
docker exec postgres-tribal psql -U tribaluser -d tribal_knowledge -c "SELECT COUNT(*) FROM providers;"
# Should return: 50
```

---

## Step 3: Start Backend API (1 minute)

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project

# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application initialized successfully (RAG: enabled)
INFO:     Uvicorn running on http://0.0.0.0:8002
```

**Test backend:**
```bash
curl http://localhost:8002/health | jq '.'
# Should return: {"status": "healthy", "version": "1.0.0"}
```

---

## Step 4: Test Scheduling Endpoints (2 minutes)

### Get Slot Recommendations

```bash
curl -X POST http://localhost:8002/api/v1/scheduling/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "specialty_id": 1,
    "triage_priority": "urgent",
    "patient_region": "Salt Lake Valley",
    "preferred_date_range": {
      "start": "2025-12-13",
      "end": "2025-12-15"
    }
  }' | jq '.'
```

**Expected Response:**
```json
{
  "recommendations": [
    {
      "provider": {
        "provider_id": 1,
        "npi": "1234567890",
        "name": "Dr. John Smith",
        "credentials": "MD",
        "specialty": "Family Medicine",
        "years_experience": 12,
        "languages": ["English", "Spanish"]
      },
      "facility": {
        "facility_id": 1,
        "name": "Salt Lake Valley Family Clinic",
        "address": "123 Main St, Salt Lake City, UT 84101",
        "city": "Salt Lake City",
        "region": "Salt Lake Valley",
        "phone": "(801) 555-0100"
      },
      "slot_datetime": "2025-12-13T10:00:00",
      "duration_minutes": 15,
      "reasoning": "Slot timing matches urgency level; Facility is in patient's region; John Smith has 12 years experience",
      "match_score": 0.92,
      "distance_miles": 0
    }
  ],
  "total_options_found": 3,
  "message": "Found 3 recommended slots"
}
```

### Book an Appointment

```bash
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 1,
    "facility_id": 1,
    "specialty_id": 1,
    "patient_fhir_id": "PT-00001",
    "appointment_datetime": "2025-12-13T10:00:00",
    "duration_minutes": 15,
    "urgency": "urgent",
    "reason_for_visit": "Follow-up for chest pain"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "appointment_id": 1,
  "confirmation_number": "A1B2C3D4",
  "fhir_appointment_id": "APPT-A1B2C3D4E5F6"
}
```

### Search Providers

```bash
curl "http://localhost:8002/api/v1/providers/search?specialty_id=1&region=Salt%20Lake%20Valley" | jq '.'
```

**Expected Response:**
```json
{
  "providers": [
    {
      "provider_id": 1,
      "npi": "1234567890",
      "name": "Dr. John Smith",
      "credentials": "MD",
      "specialty": "Family Medicine",
      "years_experience": 12,
      "languages": ["English", "Spanish"]
    }
  ],
  "count": 10
}
```

---

## Step 5: Test Triage Flow (Optional)

```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Patient reports severe chest pain radiating to left arm, started 2 hours ago. Also experiencing shortness of breath and nausea.",
    "patient_id": "PT-00001"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "priority": "emergency",
  "reasoning": "Severe chest pain with radiation and associated symptoms strongly suggests acute coronary syndrome requiring immediate evaluation",
  "confidence": "high",
  "red_flags": [
    "Chest pain radiating to arm",
    "Shortness of breath",
    "Nausea with chest pain"
  ],
  "recommendations": [
    "Call 911 immediately",
    "Do not drive - wait for ambulance",
    "Have patient chew aspirin if not allergic",
    "Monitor vital signs"
  ]
}
```

---

## Common Issues & Solutions

### Issue: HAPI FHIR not responding

**Symptoms:** `curl: (7) Failed to connect to localhost port 8081`

**Solution:**
```bash
# Check container status
docker logs hapi-fhir

# Wait 90 seconds for JVM startup, then retry
sleep 90
curl http://localhost:8081/fhir/metadata
```

### Issue: Port conflict (5433 already in use)

**Symptoms:** `Bind for 0.0.0.0:5433 failed: port is already allocated`

**Solution:**
```bash
# Find and stop conflicting service
lsof -i :5433
kill -9 <PID>

# Or change port in docker-compose.yml
# postgres-tribal:
#   ports: ["5435:5432"]  # Use 5435 instead
```

### Issue: Data generation fails with FHIR server error

**Symptoms:** `requests.exceptions.ConnectionError: ('Connection aborted.', RemoteDisconnected('Remote end closed connection without response'))`

**Solution:**
```bash
# Increase FHIR server timeout or reduce batch size
# Edit data_generation/loaders/fhir_loader.py:
# batch_size = 25  # Reduce from 50 to 25
```

### Issue: No recommendations returned from scheduling

**Symptoms:** `"recommendations": [], "message": "No available slots found"`

**Possible causes:**
1. Data generation not completed → Run `python data_generation/main.py`
2. No providers for specialty → Check `SELECT * FROM providers WHERE specialty_id = 1;`
3. All slots booked → Try different date range or specialty

---

## Quick Reference

### Service URLs
- **HAPI FHIR**: http://localhost:8081/fhir
- **Backend API**: http://localhost:8002
- **Backend API Docs**: http://localhost:8002/docs (Swagger UI)
- **PgAdmin**: http://localhost:5050 (dev only, admin@example.com / admin123)

### Database Connections
```bash
# Tribal DB
docker exec -it postgres-tribal psql -U tribaluser -d tribal_knowledge

# FHIR DB
docker exec -it postgres-fhir psql -U fhiruser -d hapi_fhir
```

### Useful Queries
```sql
-- List all specialties
SELECT * FROM specialties;

-- Count providers by specialty
SELECT s.name, COUNT(p.provider_id)
FROM specialties s
LEFT JOIN providers p ON s.specialty_id = p.specialty_id
GROUP BY s.name;

-- View provider schedules
SELECT p.first_name, p.last_name, pa.day_of_week, pa.start_time, pa.end_time
FROM providers p
JOIN provider_availability pa ON p.provider_id = pa.provider_id
LIMIT 10;

-- Count appointments by urgency
SELECT urgency, COUNT(*)
FROM appointments
GROUP BY urgency;
```

### Stop Services
```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (DELETES ALL DATA)
docker-compose down -v
```

---

## Next Steps

1. **Explore PgAdmin**: http://localhost:5050 to browse tribal knowledge database
2. **Test Frontend**: (Not yet implemented - Phase 2)
3. **Review API Docs**: http://localhost:8002/docs for interactive Swagger UI
4. **Read Full Docs**: See `IMPLEMENTATION_SUMMARY.md` for complete architecture
5. **Run Tests**: See `API_TESTING_GUIDE.md` for comprehensive test scenarios

---

## Architecture at a Glance

```
┌─────────────┐
│   MA Chat   │ (Future: React Frontend)
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────────────────────────────────┐
│  Backend API (FastAPI - port 8002)      │
│  - Triage Service (OpenAI + RAG)        │
│  - Scheduling Service (Multi-factor)    │
│  - FHIR Client                          │
└─┬────────┬──────────┬────────────────────┘
  │        │          │
  ▼        ▼          ▼
┌───────┐ ┌─────────┐ ┌──────────┐
│ HAPI  │ │Tribal DB│ │ChromaDB  │
│ FHIR  │ │(PgSQL)  │ │(RAG)     │
│:8081  │ │:5433    │ │          │
└───────┘ └─────────┘ └──────────┘
```

---

**Estimated Setup Time:** 10-15 minutes
**System Ready:** ✅ Backend fully functional, ready for frontend integration
