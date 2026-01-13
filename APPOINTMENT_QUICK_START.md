# MediChat Appointment System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
All services should be running:
```bash
docker-compose ps
# Should show: postgres-tribal-db, postgres-fhir-db, hapi-fhir-server, fhir-chat-api, fhir-chat-frontend
```

---

## 📱 Frontend Navigation (UI)

### Access the Application
- **URL**: http://localhost (port 80)

### Page Navigation

#### 1. **Start Here: MA Context Selection** (`/`)

**Material-UI Card Design:**
```
┌────────────────────────────────────────┐
│      MediChat MA Assistant             │
│         Start Your Shift               │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ Your Name                      │   │
│  │ [e.g., Sarah Johnson_____]     │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ Facility                    ▼  │   │
│  │ [Intermountain Healthcare...] │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ Specialty                   ▼  │   │
│  │ [Cardiology________________]   │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌────────────────────────────────┐   │
│  │      START SHIFT               │   │
│  └────────────────────────────────┘   │
└────────────────────────────────────────┘
```

**Fields**:
- **Name** (TextField): MA's name - e.g., "Sarah Johnson"
- **Facility** (Select): Choose from available facilities
  - Intermountain Healthcare - Murray
  - Primary Health Center
  - University Hospital
- **Specialty** (Select): Choose specialty
  - Cardiology
  - Family Medicine
  - Endocrinology
  - Emergency Medicine

**Purpose**: Set your working context
**Technology**: Material-UI (MUI) components
**Next**: Redirects to `/chat` after clicking "Start Shift"

#### 2. **Main Workspace: Chat View** (`/chat`)

**Material-UI AppBar + Split Panel:**
```
┌──────────────────────────────────────────────────────────┐
│ ⬛ MediChat MA Assistant            Sarah Johnson     🚪 │
│                          Intermountain • Cardiology      │
├──────────────────────┬───────────────────────────────────┤
│  CHAT PANEL (60%)    │   PATIENT SUMMARY (40%)           │
│                      │                                   │
│  💬 Messages         │   👤 No Patient Selected          │
│  ┌─────────────────┐│   ┌─────────────────────────────┐ │
│  │ MA: Patient     ││   │ Start a conversation to     │ │
│  │ with chest pain ││   │ look up a patient or        │ │
│  └─────────────────┘│   │ describe symptoms           │ │
│                      │   └─────────────────────────────┘ │
│  ┌─────────────────┐│                                   │
│  │ AI: I'll help   ││   When patient identified:        │
│  │ assess. Tell me ││   ┌─────────────────────────────┐ │
│  │ more...         ││   │ • Patient Name & MRN        │ │
│  └─────────────────┘│   │ • Date of Birth             │ │
│                      │   │ • Contact Info              │ │
│  ┌─────────────────┐│   │ • Medical History           │ │
│  │ [Type message]  ││   │ • Allergies                 │ │
│  │ 🎤 🔄 📎        ││   │ • Conditions                │ │
│  └─────────────────┘│   │ • Medications               │ │
│                      │   └─────────────────────────────┘ │
└──────────────────────┴───────────────────────────────────┘
```

**Components**:
- **AppBar** (Material-UI): Top bar with MA name, facility, specialty, logout
- **Chat Panel** (Left 60%):
  - `ChatMessages`: Conversation history
  - `ChatInput`: Message input with voice, refresh, attachment icons
- **Patient Summary Panel** (Right 40%):
  - Shows "No Patient Selected" initially
  - Displays full patient details when identified
  - `PatientSummaryPanel` component with cards

**Purpose**: Triage and book appointments with AI assistance
**Technology**: Material-UI AppBar, Box, Typography components
**Features**:
- AI-powered symptom assessment
- Automatic provider matching
- Real-time patient information
- One-click appointment booking
- Logout button (End Shift)

#### 3. **Dashboard: Appointments Page** (`/appointments`)

**Material-UI Cards with Filters:**
```
┌──────────────────────────────────────────────────────────┐
│  Appointments Management            🔄 📅 🔍            │
├──────────────────────────────────────────────────────────┤
│  STATISTICS CARDS (Grid)                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Total   │ │Schedule │ │Complete │ │Emergency│       │
│  │   156   │ │   89    │ │   45    │ │    8    │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├──────────────────────────────────────────────────────────┤
│  FILTERS (Show/Hide Toggle)                              │
│  Status:  [All ▼] [Scheduled] [Confirmed] [Completed]   │
│  Date:    [All ▼] [Today] [This Week] [Upcoming]        │
│  Urgency: [All ▼] [Emergency] [Urgent] [Routine]        │
├──────────────────────────────────────────────────────────┤
│  APPOINTMENT CARDS                                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📅 [Today]          🔴 EMERGENCY                   │ │
│  │ 10:00 AM                                           │ │
│  │ Dec 20, 2025 • 30 min                              │ │
│  │                                                     │ │
│  │ 👤 John Smith (MRN: 45678)                         │ │
│  │ 👨‍⚕️ Dr. Sarah Martinez • Cardiology                │ │
│  │ 📍 Intermountain Healthcare - Murray               │ │
│  │ 📋 Chest pain evaluation                           │ │
│  │                                                     │ │
│  │ Confirmation: APT-20251220-1001                    │ │
│  │ Status: [Scheduled ℹ️]                              │ │
│  └────────────────────────────────────────────────────┘ │
│  [Click card to view full details in modal]            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📅 [Today]          🟡 ROUTINE                     │ │
│  │ 10:30 AM                                           │ │
│  │ Dec 20, 2025 • 30 min                              │ │
│  │                                                     │ │
│  │ 👤 Jane Doe (MRN: 78901)                           │ │
│  │ 👨‍⚕️ Dr. Michael Chen • Family Medicine            │ │
│  │ 📍 Primary Health Center                           │ │
│  │ 📋 Annual physical                                 │ │
│  │                                                     │ │
│  │ Confirmation: APT-20251220-1002                    │ │
│  │ Status: [Confirmed ✓]                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Showing 1-20 of 156              [◀ Previous] [Next ▶] │
└──────────────────────────────────────────────────────────┘
```

**Material-UI Components**:
- **Cards**: Each appointment in a Material-UI `Card` with hover effects
- **Chips**: Status badges (info, primary, warning, success, error colors)
- **Icons**: From `@mui/icons-material` (TodayIcon, PersonIcon, LocationIcon, etc.)
- **Buttons**: IconButton for Refresh, filters
- **Grid**: Responsive layout for stats cards

**Status Colors**:
- 🔵 Scheduled (info)
- 🔷 Confirmed (primary)
- 🟡 Checked In (warning)
- 🟢 Completed (success)
- 🔴 Cancelled (error)
- ⚪ No Show (default)

**Urgency Indicators** (Left border color):
- 🔴 Emergency (red, Priority 1)
- 🟡 Urgent (orange, Priority 2)
- 🔵 Semi-Urgent (blue, Priority 3)
- ⚪ Routine (gray, Priority 4)

**Purpose**: View and manage all appointments
**Technology**: Material-UI Cards, Chips, Grid, Icons
**Features**:
- Click card to open `AppointmentDetailModal`
- Filter by status, date, urgency
- Real-time statistics
- Responsive grid layout

---

## 🔌 API Quick Reference

### Base URL
```
http://localhost:8002/api/v1
```

### Most Common Endpoints

#### 1. **Book an Appointment**
```bash
POST /scheduling/book

curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "233",
    "provider_id": 1,
    "facility_id": 2,
    "specialty_id": 1,
    "appointment_datetime": "2025-12-20T10:00:00",
    "duration_minutes": 30,
    "urgency": "urgent",
    "reason_for_visit": "Chest pain evaluation"
  }'
```

**Response**:
```json
{
  "success": true,
  "appointment_id": 1001,
  "confirmation_number": "APT-20251220-1001",
  "scheduled_datetime": "2025-12-20T10:00:00",
  "provider_name": "Dr. Sarah Martinez",
  "facility_name": "Intermountain Healthcare",
  "facility_address": "5169 Cottonwood St, Murray, UT"
}
```

#### 2. **Get Appointment by ID**
```bash
GET /appointments/{appointment_id}

curl http://localhost:8002/api/v1/appointments/1001
```

#### 3. **List Appointments with Filters**
```bash
GET /appointments

# Get patient's appointments
curl "http://localhost:8002/api/v1/appointments?patient_fhir_id=233"

# Get today's appointments for a facility
TODAY=$(date -I)
curl "http://localhost:8002/api/v1/appointments?facility_id=2&start_date=${TODAY}T00:00:00&end_date=${TODAY}T23:59:59"

# Get urgent appointments
curl "http://localhost:8002/api/v1/appointments?urgency=urgent&limit=20"
```

#### 4. **Create FHIR Appointment**
```bash
POST /fhir/appointments/create

curl -X POST "http://localhost:8002/api/v1/fhir/appointments/create?patient_fhir_id=233&provider_id=1&facility_id=2&start_datetime=2025-12-20T10:00:00&duration_minutes=30&reason=Follow-up&urgency=routine"
```

#### 5. **Search Patients**
```bash
GET /patients/search

curl "http://localhost:8002/api/v1/patients/search?first_name=John&last_name=Smith"
curl "http://localhost:8002/api/v1/patients/search?phone=801-555-0199"
curl "http://localhost:8002/api/v1/patients/search?mrn=MRN-45678"
```

---

## 💡 Common Use Cases

### Use Case 1: Emergency Walk-In Patient

**Scenario**: Patient arrives with chest pain, needs immediate cardiology appointment

**Steps**:
1. **Open Chat Interface** (`/chat`)
2. **AI Triage**:
   - MA: "Patient with chest pain, 7/10 severity, radiating to left arm"
   - AI assesses urgency → EMERGENCY
3. **AI Suggests Providers**:
   - Shows available cardiologists
   - MA clicks "Book with Dr. Martinez at 10:00 AM"
4. **Confirmation**:
   - System shows booking details
   - MA prints or emails confirmation
   - Patient receives: `APT-20251220-1001`

**Time**: ~2 minutes

---

### Use Case 2: Phone Scheduling

**Scenario**: Patient calls to schedule routine follow-up

**API Flow**:
```bash
# Step 1: Find patient
curl "http://localhost:8002/api/v1/patients/search?phone=801-555-0199"
# → Get patient_fhir_id: "456"

# Step 2: Check availability (next 7 days)
START_DATE=$(date -I)
END_DATE=$(date -I -d '+7 days')
curl "http://localhost:8002/api/v1/scheduling/availability?specialty_id=1&facility_id=2&start_date=$START_DATE&end_date=$END_DATE"
# → See available slots

# Step 3: Book appointment
curl -X POST http://localhost:8002/api/v1/scheduling/book \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "456",
    "provider_id": 3,
    "facility_id": 1,
    "specialty_id": 1,
    "appointment_datetime": "2025-12-25T09:30:00",
    "duration_minutes": 30,
    "urgency": "non-urgent",
    "reason_for_visit": "Routine follow-up"
  }'
# → Get confirmation number
```

---

### Use Case 3: Daily Schedule Review

**Scenario**: Clinic manager reviews today's appointments

**Navigation**:
1. Go to **Appointments Page** (`/appointments`)
2. Click **[Today]** filter button
3. View statistics:
   - Total appointments
   - By status (scheduled, confirmed, completed)
   - By urgency
4. Click any appointment to see details
5. Check in patients as they arrive

**API Alternative**:
```bash
# Get today's list
curl "http://localhost:8002/api/v1/appointments/today/list?facility_id=2"

# Get today's stats
TODAY=$(date -I)
curl "http://localhost:8002/api/v1/appointments/stats?facility_id=2&start_date=${TODAY}T00:00:00&end_date=${TODAY}T23:59:59"
```

---

## 🎯 Quick Tips

### For Medical Assistants (UI Users)
✅ **DO**:
- Always set facility and specialty at the start of your shift
- Use the chat interface for urgent bookings (faster AI triage)
- Check the appointments dashboard at start of day
- Read back confirmation details to patients

❌ **DON'T**:
- Switch facility mid-shift without re-logging
- Book without confirming patient identity
- Skip urgency assessment

### For Developers (API Users)
✅ **DO**:
- Always use FHIR patient IDs (not MRN or name)
- Check availability before booking
- Handle 409 Conflict errors (slot taken)
- Verify FHIR sync completed

❌ **DON'T**:
- Book without checking conflicts
- Assume slots are free
- Ignore error responses

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend UI** | http://localhost | Main application |
| **API Docs** | http://localhost:8002/docs | Interactive API documentation |
| **FHIR Server** | http://localhost:8081/fhir | HAPI FHIR server |
| **FHIR Metadata** | http://localhost:8081/fhir/metadata | FHIR capabilities |

---

## 📊 Data Reference

### Appointment Status Values
- `scheduled` - Appointment booked
- `confirmed` - Patient confirmed
- `checked-in` - Patient arrived
- `completed` - Visit completed
- `cancelled` - Cancelled
- `no-show` - Patient didn't arrive

### Urgency Levels
- `emergency` - Immediate (Priority 1)
- `urgent` - Same day (Priority 3)
- `semi-urgent` - 24-48 hours (Priority 4)
- `non-urgent` - Routine (Priority 5)

### Sample IDs (For Testing)
```bash
# Facilities
1 - Primary Health Center
2 - Intermountain Healthcare - Murray

# Specialties
1 - Cardiology
2 - Family Medicine
3 - Endocrinology

# Providers
1 - Dr. Sarah Martinez (Cardiology, Facility 2)
2 - Dr. Michael Chen (Family Medicine, Facility 1)

# Patients (FHIR IDs)
233, 234, 235, 236, 237...
```

---

## 🆘 Troubleshooting

### Issue: "Slot not available" error
**Solution**: Another MA booked the slot. Refresh availability and choose another time.

### Issue: Patient not found
**Solution**:
- Use FHIR ID (numbers like "233"), not name
- Use search endpoint first: `/api/v1/patients/search`

### Issue: FHIR appointment not created
**Solution**:
- Check FHIR server is running: `docker-compose ps hapi-fhir-server`
- Sync manually: `curl -X POST http://localhost:8002/api/v1/fhir/sync/all`

### Issue: No providers available
**Solution**:
- Check date is in future
- Try different date or facility
- Verify provider schedules exist in database

---

## 📚 More Documentation

- **Use Cases & Scenarios**: `APPOINTMENT_USE_CASES_AND_NAVIGATION.md`
- **Visual Navigation**: `APPOINTMENT_NAVIGATION_DIAGRAM.md`
- **Implementation Details**: `APPOINTMENT_SCHEDULING_GUIDE.md`
- **API Reference**: http://localhost:8002/docs

---

## ✅ Quick Verification

**Test the system is working**:
```bash
# 1. Check services
docker-compose ps

# 2. Test API
curl http://localhost:8002/health

# 3. Test FHIR
curl "http://localhost:8081/fhir/metadata" -H "Accept: application/fhir+json"

# 4. Book test appointment
curl -X POST http://localhost:8002/api/v1/fhir/appointments/create?patient_fhir_id=233&provider_id=1&facility_id=2&start_datetime=2025-12-25T10:00:00&duration_minutes=30&reason=Test&urgency=routine

# 5. Verify in FHIR
curl "http://localhost:8081/fhir/Appointment?_count=1&_sort=-_lastUpdated" -H "Accept: application/fhir+json"
```

If all commands succeed, your system is ready! 🎉
