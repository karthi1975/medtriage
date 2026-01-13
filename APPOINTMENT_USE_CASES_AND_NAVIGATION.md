# MediChat Appointment System - Use Cases and Navigation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [User Personas](#user-personas)
3. [Use Case Scenarios](#use-case-scenarios)
4. [API Navigation Guide](#api-navigation-guide)
5. [Frontend Navigation](#frontend-navigation)
6. [FHIR Integration](#fhir-integration)
7. [Complete Workflows](#complete-workflows)

---

## System Overview

MediChat provides a comprehensive appointment scheduling and management system with:
- **Tribal Database**: Local appointment records with provider/facility data
- **HAPI FHIR Server**: EHR-compliant appointment resources (Schedule, Slot, Appointment, AppointmentResponse)
- **AI-Powered Triage**: Intelligent urgency assessment and provider matching
- **Real-time Availability**: Provider schedule queries with conflict detection

---

## User Personas

### 1. **Sarah - Medical Assistant (MA)**
- **Role**: Front desk, patient intake, appointment booking
- **Goals**: Efficiently schedule patients, manage daily appointments, minimize no-shows
- **Tools**: MA Chat Interface, Appointments Dashboard

### 2. **John - Patient**
- **Role**: Seeking medical care
- **Goals**: Get scheduled quickly, understand appointment details, receive reminders
- **Needs**: Clear confirmation, directions to facility, preparation instructions

### 3. **Dr. Martinez - Provider**
- **Role**: Cardiologist at Intermountain Healthcare
- **Goals**: Optimized schedule, patient information before visits, minimize gaps
- **Tools**: Appointment dashboard, patient history

### 4. **Lisa - Clinic Administrator**
- **Role**: Operations manager
- **Goals**: Track statistics, optimize utilization, manage no-shows
- **Tools**: Statistics API, appointment reports

---

## Use Case Scenarios

### Scenario 1: Emergency Chest Pain - High Priority Scheduling

**Context**: Patient calls with chest pain, needs urgent cardiology appointment

**Actors**: Sarah (MA), John (Patient, 45M), Dr. Martinez (Cardiologist)

**Flow**:
1. **MA Login** (Sarah)
   - Selects facility: "Intermountain Healthcare - Murray"
   - Selects specialty: "Cardiology"
   - System initializes MA session

2. **Patient Identification**
   ```bash
   # MA searches for patient
   curl http://localhost:8002/api/v1/patients/search?first_name=John&last_name=Smith

   # Gets patient details
   curl http://localhost:8002/api/v1/patients/233
   ```

3. **AI-Powered Triage Chat**
   - MA: "Patient John Smith, 45, calling with chest pain"
   - AI: "Starting triage for chest pain symptoms..."
   - AI asks: Onset, severity, radiation, associated symptoms
   - Patient responds: "Started 2 hours ago, 7/10 pain, left arm radiation"
   - **AI Assessment**: `urgency: "emergency"`, `recommended_specialty: "Cardiology"`

4. **Check Provider Availability**
   ```bash
   # Get cardiologists available today
   curl "http://localhost:8002/api/v1/scheduling/availability?specialty_id=1&facility_id=2&date=2025-12-16&urgency=emergency"

   Response:
   {
     "available_slots": [
       {
         "provider_id": 1,
         "provider_name": "Dr. Sarah Martinez",
         "available_times": ["10:00", "10:30", "14:00"],
         "specialty": "Cardiology",
         "facility": "Intermountain Healthcare - Murray"
       }
     ]
   }
   ```

5. **Book Appointment**
   ```bash
   curl -X POST http://localhost:8002/api/v1/scheduling/book \
     -H "Content-Type: application/json" \
     -d '{
       "patient_fhir_id": "233",
       "provider_id": 1,
       "facility_id": 2,
       "specialty_id": 1,
       "appointment_datetime": "2025-12-16T10:00:00",
       "duration_minutes": 30,
       "urgency": "emergency",
       "reason_for_visit": "Chest pain with left arm radiation - urgent evaluation needed",
       "triage_session_id": "triage_abc123"
     }'

   Response:
   {
     "success": true,
     "appointment_id": 1001,
     "confirmation_number": "APT-20251216-1001",
     "scheduled_datetime": "2025-12-16T10:00:00",
     "provider_name": "Dr. Sarah Martinez",
     "facility_name": "Intermountain Healthcare - Murray",
     "facility_address": "5169 Cottonwood St, Murray, UT 84107"
   }
   ```

6. **FHIR Synchronization** (Automatic)
   - Creates FHIR Appointment resource on HAPI server
   - Links Patient, Practitioner, and Location resources
   - Sets priority to 1 (emergency)

7. **Patient Notification**
   - Confirmation number: `APT-20251216-1001`
   - Instructions: "Arrive 15 minutes early, bring insurance card, list current medications"
   - Emergency protocol: "If symptoms worsen, call 911 immediately"

---

### Scenario 2: Routine Follow-up - Standard Scheduling

**Context**: Patient needs diabetes follow-up with endocrinologist

**Actors**: Sarah (MA), Maria (Patient, 62F), Dr. Patel (Endocrinologist)

**Flow**:
1. **Patient Search**
   ```bash
   curl http://localhost:8002/api/v1/patients/search?phone=801-555-0123
   ```

2. **AI Chat Triage**
   - MA: "Maria needs a diabetes follow-up"
   - AI: "How long since last visit?"
   - MA: "3 months, A1C check needed"
   - **AI Assessment**: `urgency: "non-urgent"`, `specialty: "Endocrinology"`

3. **Flexible Availability Check**
   ```bash
   # Check next 7 days
   curl "http://localhost:8002/api/v1/scheduling/availability?specialty_id=3&facility_id=1&start_date=2025-12-16&end_date=2025-12-23"

   Response:
   {
     "available_slots": [
       {
         "provider_id": 5,
         "provider_name": "Dr. Raj Patel",
         "date": "2025-12-18",
         "available_times": ["09:00", "09:30", "10:00", "14:00", "14:30"]
       }
     ]
   }
   ```

4. **Book Appointment**
   ```bash
   curl -X POST http://localhost:8002/api/v1/scheduling/book \
     -H "Content-Type: application/json" \
     -d '{
       "patient_fhir_id": "456",
       "provider_id": 5,
       "facility_id": 1,
       "specialty_id": 3,
       "appointment_datetime": "2025-12-18T09:00:00",
       "duration_minutes": 30,
       "urgency": "non-urgent",
       "reason_for_visit": "Diabetes follow-up, A1C check"
     }'
   ```

---

### Scenario 3: Same-Day Scheduling Conflict

**Context**: Two MAs try to book the same slot simultaneously

**Flow**:
1. **MA #1 and MA #2** both see 10:00 AM slot available for Dr. Chen

2. **Concurrent Booking Attempts**
   ```bash
   # MA #1 books (arrives first)
   curl -X POST http://localhost:8002/api/v1/scheduling/book \
     -d '{"provider_id": 3, "appointment_datetime": "2025-12-16T10:00:00", ...}'

   Response: {"success": true, "appointment_id": 1002}

   # MA #2 books (arrives 50ms later)
   curl -X POST http://localhost:8002/api/v1/scheduling/book \
     -d '{"provider_id": 3, "appointment_datetime": "2025-12-16T10:00:00", ...}'

   Response: {
     "detail": "Time slot no longer available. Please check updated availability."
   }
   HTTP 409 CONFLICT
   ```

3. **MA #2 Recovery**
   - Refreshes availability
   - Sees next available slot at 10:30 AM
   - Books successfully

---

### Scenario 4: Managing Daily Appointments

**Context**: Clinic administrator reviewing today's schedule

**Flow**:
1. **Today's Appointments**
   ```bash
   curl "http://localhost:8002/api/v1/appointments/today/list?facility_id=2"

   Response:
   {
     "date": "2025-12-16",
     "total": 24,
     "appointments": [
       {
         "appointment_id": 1001,
         "time": "10:00",
         "patient_name": "John Smith",
         "provider_name": "Dr. Martinez",
         "status": "scheduled",
         "urgency": "emergency",
         "reason": "Chest pain evaluation"
       },
       {
         "appointment_id": 1002,
         "time": "10:30",
         "patient_name": "Jane Doe",
         "provider_name": "Dr. Chen",
         "status": "confirmed",
         "urgency": "non-urgent"
       }
     ]
   }
   ```

2. **View Specific Appointment**
   ```bash
   curl http://localhost:8002/api/v1/appointments/1001

   Response:
   {
     "appointment_id": 1001,
     "patient": {
       "fhir_id": "233",
       "name": "John Smith",
       "mrn": "MRN-45678",
       "dob": "1978-03-15",
       "phone": "801-555-0199"
     },
     "provider": {
       "name": "Dr. Sarah Martinez",
       "specialty": "Cardiology",
       "npi": "1234567890"
     },
     "facility": {
       "name": "Intermountain Healthcare - Murray",
       "address": "5169 Cottonwood St, Murray, UT 84107"
     },
     "appointment_datetime": "2025-12-16T10:00:00",
     "status": "scheduled",
     "urgency": "emergency",
     "confirmation_number": "APT-20251216-1001",
     "fhir_appointment_id": "20902"
   }
   ```

3. **Get Statistics**
   ```bash
   curl "http://localhost:8002/api/v1/appointments/stats?facility_id=2&start_date=2025-12-16&end_date=2025-12-16"

   Response:
   {
     "total_appointments": 24,
     "by_status": {
       "scheduled": 15,
       "confirmed": 6,
       "completed": 2,
       "no-show": 1
     },
     "by_urgency": {
       "emergency": 2,
       "urgent": 5,
       "semi-urgent": 8,
       "non-urgent": 9
     },
     "by_specialty": {
       "Cardiology": 8,
       "Endocrinology": 6,
       "Family Medicine": 10
     }
   }
   ```

---

## API Navigation Guide

### Base URL
```
http://localhost:8002/api/v1
```

### 1. Availability & Scheduling

#### Check Provider Availability
```bash
GET /scheduling/availability

Query Parameters:
- specialty_id (required): Specialty ID
- facility_id (required): Facility ID
- date (optional): Specific date (YYYY-MM-DD)
- start_date (optional): Range start
- end_date (optional): Range end
- urgency (optional): Filter by urgency level

Example:
curl "http://localhost:8002/api/v1/scheduling/availability?specialty_id=1&facility_id=2&date=2025-12-20&urgency=urgent"
```

#### Book Appointment
```bash
POST /scheduling/book

Body (JSON):
{
  "patient_fhir_id": "string",
  "provider_id": number,
  "facility_id": number,
  "specialty_id": number,
  "appointment_datetime": "ISO-8601",
  "duration_minutes": number,
  "urgency": "emergency|urgent|semi-urgent|non-urgent",
  "reason_for_visit": "string",
  "triage_session_id": "string (optional)"
}

Example:
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d @booking_request.json
```

---

### 2. Appointment Management

#### Get Appointments (with filters)
```bash
GET /appointments

Query Parameters:
- facility_id: Filter by facility
- specialty_id: Filter by specialty
- provider_id: Filter by provider
- patient_fhir_id: Filter by patient
- status: scheduled|confirmed|completed|cancelled|no-show
- start_date: ISO-8601 datetime
- end_date: ISO-8601 datetime
- limit: Results per page (default 50)
- offset: Pagination offset

Example - Get all cardiology appointments:
curl "http://localhost:8002/api/v1/appointments?specialty_id=1&limit=100"

Example - Get patient's appointments:
curl "http://localhost:8002/api/v1/appointments?patient_fhir_id=233"

Example - Get this week's appointments:
curl "http://localhost:8002/api/v1/appointments?start_date=2025-12-16T00:00:00&end_date=2025-12-22T23:59:59"
```

#### Get Single Appointment
```bash
GET /appointments/{appointment_id}

Example:
curl http://localhost:8002/api/v1/appointments/1001
```

#### Get Today's Appointments
```bash
GET /appointments/today/list

Query Parameters:
- facility_id (optional): Filter by facility
- provider_id (optional): Filter by provider

Example:
curl "http://localhost:8002/api/v1/appointments/today/list?facility_id=2"
```

#### Get Appointment Statistics
```bash
GET /appointments/stats

Query Parameters:
- facility_id (optional): Filter by facility
- start_date (optional): Stats start date
- end_date (optional): Stats end date

Example:
curl "http://localhost:8002/api/v1/appointments/stats?facility_id=2&start_date=2025-12-01&end_date=2025-12-31"
```

---

### 3. FHIR Integration

#### Create FHIR Appointment
```bash
POST /fhir/appointments/create

Query Parameters (all required):
- patient_fhir_id: FHIR Patient ID
- provider_id: Local provider ID (will be mapped to FHIR Practitioner)
- facility_id: Local facility ID (will be mapped to FHIR Location)
- start_datetime: ISO-8601 datetime
- duration_minutes: Duration
- reason: Reason for visit
- urgency (optional): routine|urgent|asap|stat
- confirmation_number (optional): Custom confirmation number

Example:
curl -X POST "http://localhost:8002/api/v1/fhir/appointments/create?patient_fhir_id=233&provider_id=1&facility_id=2&start_datetime=2025-12-20T10:00:00&duration_minutes=30&reason=Follow-up&urgency=routine"
```

#### Search FHIR Appointments
```bash
GET /fhir/appointments/search

Query Parameters:
- patient_id: FHIR Patient ID
- practitioner_id: FHIR Practitioner ID
- location_id: FHIR Location ID
- status: FHIR appointment status
- date_start: Start date
- date_end: End date

Example:
curl "http://localhost:8002/api/v1/fhir/appointments/search?patient_id=233&status=booked"
```

#### Sync All Data to FHIR
```bash
POST /fhir/sync/all

Example:
curl -X POST http://localhost:8002/api/v1/fhir/sync/all
```

---

### 4. Patient Lookup

#### Search Patients
```bash
GET /patients/search

Query Parameters:
- first_name, last_name, phone, email, mrn

Example:
curl "http://localhost:8002/api/v1/patients/search?first_name=John&last_name=Smith"
```

#### Get Patient Details
```bash
GET /patients/{fhir_id}

Example:
curl http://localhost:8002/api/v1/patients/233
```

---

## Frontend Navigation

### Pages and Routes

#### 1. **MA Context Selection** (`/`)
- **Purpose**: MA login and context setup
- **Features**:
  - Select facility
  - Select specialty
  - Establishes session

#### 2. **Chat View** (`/chat`)
- **Purpose**: Main MA interface for triage and booking
- **Features**:
  - AI-powered chat for symptom assessment
  - Real-time patient summary panel
  - Automatic appointment booking suggestions
  - Patient history display

**Components**:
- `ChatMessages`: Conversation thread
- `ChatInput`: Message input with voice support
- `PatientSummaryPanel`: Right sidebar with patient info
- `AppointmentConfirmation`: Booking success modal

#### 3. **Appointments Dashboard** (`/appointments`)
- **Purpose**: View and manage all appointments
- **Features**:
  - Filterable appointment list
  - Status badges (scheduled, confirmed, completed, etc.)
  - Urgency indicators
  - Quick filters (Today, This Week, This Month)
  - Search by patient/provider
  - Appointment detail modal

**Components**:
- `AppointmentDetailModal`: Full appointment details popup
- Status filters, date filters, urgency filters
- Statistics cards (total, by status, by urgency)

---

## FHIR Integration

### FHIR Resources Created

#### 1. **Patient**
```json
{
  "resourceType": "Patient",
  "id": "233",
  "name": [{"family": "Smith", "given": ["John"]}],
  "birthDate": "1978-03-15",
  "telecom": [{"system": "phone", "value": "801-555-0199"}]
}
```

#### 2. **Practitioner**
```json
{
  "resourceType": "Practitioner",
  "id": "20844",
  "name": [{"family": "Martinez", "given": ["Sarah"], "prefix": ["Dr."]}],
  "identifier": [{"system": "NPI", "value": "1234567890"}]
}
```

#### 3. **Location**
```json
{
  "resourceType": "Location",
  "id": "20823",
  "name": "Intermountain Healthcare - Murray",
  "address": {"line": ["5169 Cottonwood St"], "city": "Murray", "state": "UT"}
}
```

#### 4. **Appointment**
```json
{
  "resourceType": "Appointment",
  "id": "20902",
  "status": "booked",
  "priority": 5,
  "start": "2025-12-20T10:00:00",
  "end": "2025-12-20T10:30:00",
  "minutesDuration": 30,
  "participant": [
    {"actor": {"reference": "Patient/233"}, "status": "accepted"},
    {"actor": {"reference": "Practitioner/20844"}, "status": "accepted"},
    {"actor": {"reference": "Location/20823"}, "status": "accepted"}
  ],
  "description": "Follow-up consultation"
}
```

### Access FHIR Server Directly

```bash
# HAPI FHIR Server: http://localhost:8081/fhir

# Get all appointments
curl "http://localhost:8081/fhir/Appointment?_count=10" -H "Accept: application/fhir+json"

# Get specific appointment
curl "http://localhost:8081/fhir/Appointment/20902" -H "Accept: application/fhir+json"

# Search by patient
curl "http://localhost:8081/fhir/Appointment?patient=Patient/233" -H "Accept: application/fhir+json"

# Search by date range
curl "http://localhost:8081/fhir/Appointment?date=ge2025-12-16&date=le2025-12-20" -H "Accept: application/fhir+json"
```

---

## Complete Workflows

### Workflow 1: Emergency Appointment Booking (End-to-End)

```bash
# Step 1: Search patient
PATIENT_RESULT=$(curl -s "http://localhost:8002/api/v1/patients/search?first_name=John&last_name=Smith")
PATIENT_ID=$(echo $PATIENT_RESULT | jq -r '.patients[0].fhir_id')

echo "Found Patient ID: $PATIENT_ID"

# Step 2: Check emergency cardiology availability
AVAILABILITY=$(curl -s "http://localhost:8002/api/v1/scheduling/availability?specialty_id=1&facility_id=2&date=2025-12-16&urgency=emergency")

echo "Available Slots:"
echo $AVAILABILITY | jq '.available_slots[] | {provider: .provider_name, times: .available_times}'

# Step 3: Book first available slot
BOOKING_RESULT=$(curl -s -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d "{
    \"patient_fhir_id\": \"$PATIENT_ID\",
    \"provider_id\": 1,
    \"facility_id\": 2,
    \"specialty_id\": 1,
    \"appointment_datetime\": \"2025-12-16T10:00:00\",
    \"duration_minutes\": 30,
    \"urgency\": \"emergency\",
    \"reason_for_visit\": \"Chest pain - urgent evaluation\"
  }")

CONFIRMATION=$(echo $BOOKING_RESULT | jq -r '.confirmation_number')
APPT_ID=$(echo $BOOKING_RESULT | jq -r '.appointment_id')

echo "Booking Successful!"
echo "Confirmation: $CONFIRMATION"
echo "Appointment ID: $APPT_ID"

# Step 4: Verify in FHIR
FHIR_APPT=$(curl -s "http://localhost:8081/fhir/Appointment?identifier=$CONFIRMATION" -H "Accept: application/fhir+json")

echo "FHIR Appointment Created:"
echo $FHIR_APPT | jq '.entry[0].resource | {id, status, start, priority}'
```

### Workflow 2: Daily Dashboard Review

```bash
#!/bin/bash
# Daily appointment dashboard script

FACILITY_ID=2
DATE=$(date +%Y-%m-%d)

echo "=== Daily Appointment Dashboard ==="
echo "Facility: Intermountain Healthcare"
echo "Date: $DATE"
echo

# Get today's appointments
echo "Today's Schedule:"
curl -s "http://localhost:8002/api/v1/appointments/today/list?facility_id=$FACILITY_ID" | \
  jq -r '.appointments[] | "\(.time) - \(.patient_name) with \(.provider_name) (\(.urgency))"'

echo
echo "=== Statistics ==="

# Get stats
STATS=$(curl -s "http://localhost:8002/api/v1/appointments/stats?facility_id=$FACILITY_ID&start_date=${DATE}T00:00:00&end_date=${DATE}T23:59:59")

echo "Total Appointments: $(echo $STATS | jq -r '.total_appointments')"
echo
echo "By Status:"
echo $STATS | jq -r '.by_status | to_entries[] | "  \(.key): \(.value)"'
echo
echo "By Urgency:"
echo $STATS | jq -r '.by_urgency | to_entries[] | "  \(.key): \(.value)"'
```

---

## Quick Reference

### Common Queries

```bash
# Find patient by phone
curl "http://localhost:8002/api/v1/patients/search?phone=801-555-0199"

# Today's urgent appointments
curl "http://localhost:8002/api/v1/appointments?start_date=$(date -I)T00:00:00&end_date=$(date -I)T23:59:59&urgency=urgent"

# Provider's schedule for tomorrow
curl "http://localhost:8002/api/v1/appointments?provider_id=1&start_date=$(date -I -d tomorrow)T00:00:00"

# All cancelled appointments this month
curl "http://localhost:8002/api/v1/appointments?status=cancelled&start_date=2025-12-01T00:00:00&end_date=2025-12-31T23:59:59"
```

### Status Values
- `scheduled` - Appointment booked
- `confirmed` - Patient confirmed attendance
- `checked-in` - Patient arrived
- `completed` - Visit finished
- `cancelled` - Appointment cancelled
- `no-show` - Patient did not arrive

### Urgency Levels
- `emergency` - Immediate attention needed (Priority 1)
- `urgent` - Same-day preferred (Priority 3)
- `semi-urgent` - Within 48 hours (Priority 4)
- `non-urgent` - Routine scheduling (Priority 5)

---

## Support

For issues or questions:
- Check logs: `docker-compose logs fhir-chat-api`
- Verify FHIR server: http://localhost:8081/fhir/metadata
- API documentation: http://localhost:8002/docs
