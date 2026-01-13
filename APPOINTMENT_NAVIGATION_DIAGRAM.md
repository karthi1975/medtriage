# MediChat Appointment System - Visual Navigation Map

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MEDICHAT APPOINTMENT SYSTEM                   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   FRONTEND UI    │◄────►│   BACKEND API    │◄────►│  HAPI FHIR       │
│  (React/MUI)     │      │  (FastAPI)       │      │  Server          │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                          │                          │
        │                          ▼                          │
        │                 ┌──────────────────┐                │
        │                 │ PostgreSQL DB    │                │
        │                 │ (Tribal Data)    │                │
        │                 └──────────────────┘                │
        │                          │                          │
        └──────────────────────────┴──────────────────────────┘
```

---

## Material-UI Component Stack

**Technology**: React + TypeScript + Material-UI (MUI) v5

**Key Libraries**:
```
@mui/material - Core components (Card, Button, TextField, Select, AppBar, etc.)
@mui/icons-material - Icons (TodayIcon, PersonIcon, LocationIcon, etc.)
react-router-dom - Navigation
```

**Component Structure**:
```
src/
├── pages/
│   ├── MAContextSelection.tsx (Material-UI Card + Form)
│   ├── ChatView.tsx (AppBar + Split Panels)
│   └── AppointmentsPage.tsx (Grid + Cards + Chips)
├── components/
│   ├── chat/
│   │   ├── ChatMessages.tsx
│   │   └── ChatInput.tsx
│   ├── panels/
│   │   └── PatientSummaryPanel.tsx
│   └── appointments/
│       └── AppointmentDetailModal.tsx
└── context/
    ├── MASessionContext.tsx
    └── ChatContext.tsx
```

---

## Frontend Page Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER NAVIGATION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌──────────────────────────────┐
│  MA Context Selection (/)    │
│  Material-UI Card            │
│  ─────────────────────────   │
│  • Enter Name (TextField)    │
│  • Select Facility (Select)  │
│  • Select Specialty (Select) │
│  • Start Shift (Button)      │
│  • Initialize Session        │
└──────────────────────────────┘
  │
  │ [Login/Start Shift]
  ▼
┌──────────────────────────────┐
│  Chat View (/chat)           │◄──────────────────┐
│  Material-UI AppBar + Panels │                   │
│  ──────────────────────       │                   │
│  TOP BAR (AppBar):           │                   │
│  • MA Name & Context         │                   │
│  • Logout Icon (End Shift)   │                   │
│                              │                   │
│  LEFT PANEL (60%):           │                   │
│  • ChatMessages Component    │                   │
│  • ChatInput Component       │                   │
│  • AI Triage Assistant       │                   │
│                              │                   │
│  RIGHT PANEL (40%):          │                   │
│  • PatientSummaryPanel       │                   │
│  • Medical History Cards     │                   │
│  • Allergies & Conditions    │                   │
│  • Appointment Booking       │                   │
└──────────────────────────────┘                   │
  │                                                 │
  │ [View Appointments]                            │
  ▼                                                 │
┌──────────────────────────────┐                   │
│ Appointments (/appointments) │                   │
│ Material-UI Cards & Chips    │                   │
│ ──────────────────────────   │                   │
│  • Stats Cards (Grid)        │                   │
│  • Filters (Select/Buttons)  │                   │
│  • Appointment Cards         │                   │
│    - Colored border          │                   │
│    - Status Chips            │                   │
│    - Material Icons          │                   │
│  • Detail Modal (onClick)    │                   │
│  • Pagination                │                   │
└──────────────────────────────┘                   │
  │                                                 │
  └─────────────[Back to Chat]────────────────────┘
```

---

## API Endpoint Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS (PORT 8002)                     │
└─────────────────────────────────────────────────────────────────────┘

/api/v1/
  │
  ├─ scheduling/
  │   │
  │   ├─ GET  /availability                 [Check provider slots]
  │   │       ?specialty_id, facility_id, date, urgency
  │   │       → Returns available time slots by provider
  │   │
  │   └─ POST /book                         [Book appointment]
  │           Body: patient_fhir_id, provider_id, facility_id,
  │                 appointment_datetime, urgency, reason
  │           → Returns confirmation number & details
  │
  ├─ appointments/
  │   │
  │   ├─ GET  /                             [List appointments]
  │   │       ?facility_id, provider_id, patient_fhir_id,
  │   │        status, start_date, end_date, limit, offset
  │   │       → Returns paginated appointment list
  │   │
  │   ├─ GET  /{appointment_id}             [Get single appointment]
  │   │       → Returns full appointment details
  │   │
  │   ├─ GET  /today/list                   [Today's appointments]
  │   │       ?facility_id, provider_id
  │   │       → Returns today's schedule
  │   │
  │   └─ GET  /stats                        [Statistics]
  │           ?facility_id, start_date, end_date
  │           → Returns aggregated stats
  │
  ├─ fhir/
  │   │
  │   ├─ POST /sync/all                     [Sync to FHIR]
  │   │       → Syncs all patients/providers/facilities
  │   │
  │   ├─ appointments/
  │   │   │
  │   │   ├─ POST /create                   [Create FHIR appointment]
  │   │   │       ?patient_fhir_id, provider_id, facility_id,
  │   │   │        start_datetime, duration_minutes, reason
  │   │   │       → Creates FHIR Appointment resource
  │   │   │
  │   │   └─ GET  /search                   [Search FHIR appointments]
  │   │           ?patient_id, practitioner_id, status
  │   │           → Returns FHIR appointment resources
  │   │
  │   └─ ... [Other FHIR endpoints]
  │
  └─ patients/
      │
      ├─ GET  /search                       [Search patients]
      │       ?first_name, last_name, phone, email, mrn
      │       → Returns matching patients
      │
      └─ GET  /{fhir_id}                    [Get patient details]
              → Returns patient info + history
```

---

## User Journey: Booking Emergency Appointment

```
┌─────────────────────────────────────────────────────────────────────┐
│              EMERGENCY BOOKING - COMPLETE USER JOURNEY               │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: MA LOGIN
┌──────────────────────────┐
│ Page: / (Context Select) │
│                          │
│ MA Actions:              │
│ 1. Select Facility       │
│ 2. Select Specialty      │
│ 3. Click "Start Shift"   │
└──────────────────────────┘
  │
  │ Navigate to /chat
  ▼
STEP 2: PATIENT IDENTIFICATION
┌──────────────────────────┐
│ Page: /chat              │
│                          │
│ MA Types:                │
│ "Patient calling with    │
│  chest pain"             │
│                          │
│ System:                  │
│ - Prompts for patient    │
│   identification         │
│ - MA provides name/DOB   │
│                          │
│ API Call:                │
│ GET /patients/search     │
└──────────────────────────┘
  │
  ▼
STEP 3: AI TRIAGE
┌──────────────────────────┐
│ Chat Interface           │
│                          │
│ AI: "Tell me about the   │
│      chest pain..."      │
│                          │
│ MA: Relays symptoms:     │
│ - Onset: 2 hours ago     │
│ - Severity: 7/10         │
│ - Radiation: Left arm    │
│                          │
│ AI Assessment:           │
│ ✓ Urgency: EMERGENCY     │
│ ✓ Specialty: Cardiology  │
│ ✓ Priority: High         │
└──────────────────────────┘
  │
  ▼
STEP 4: CHECK AVAILABILITY
┌──────────────────────────┐
│ Automated Background     │
│                          │
│ API Call:                │
│ GET /scheduling/         │
│     availability         │
│ ?specialty_id=1          │
│ &urgency=emergency       │
│ &date=today              │
│                          │
│ Response:                │
│ • Dr. Martinez           │
│   10:00 AM (Available)   │
│ • Dr. Chen               │
│   11:30 AM (Available)   │
└──────────────────────────┘
  │
  ▼
STEP 5: PRESENT OPTIONS
┌──────────────────────────┐
│ Chat Interface           │
│                          │
│ AI: "I found these       │
│      emergency slots:    │
│                          │
│ [Button] 10:00 AM        │
│ Dr. Martinez, Cardiology │
│ Intermountain Healthcare │
│                          │
│ [Button] 11:30 AM        │
│ Dr. Chen, Cardiology     │
│ University Hospital      │
│                          │
│ Would you like to book?" │
└──────────────────────────┘
  │
  │ MA clicks first option
  ▼
STEP 6: BOOK APPOINTMENT
┌──────────────────────────┐
│ API Call:                │
│ POST /scheduling/book    │
│                          │
│ Body:                    │
│ {                        │
│   patient_fhir_id: "233" │
│   provider_id: 1         │
│   facility_id: 2         │
│   appointment_datetime:  │
│     "2025-12-16T10:00"   │
│   urgency: "emergency"   │
│   reason: "Chest pain"   │
│ }                        │
│                          │
│ Response:                │
│ ✓ Confirmation Number    │
│ ✓ Appointment ID         │
│ ✓ Provider/Facility Info │
└──────────────────────────┘
  │
  ▼
STEP 7: FHIR SYNC (Auto)
┌──────────────────────────┐
│ Backend Process          │
│                          │
│ Creates FHIR Resources:  │
│ • Appointment            │
│   - Patient/233          │
│   - Practitioner/20844   │
│   - Location/20823       │
│   - Priority: 1          │
│   - Status: booked       │
│                          │
│ Stored on HAPI Server    │
│ Port 8081                │
└──────────────────────────┘
  │
  ▼
STEP 8: CONFIRMATION DISPLAY
┌──────────────────────────┐
│ Modal / Chat Message     │
│                          │
│ ✓ APPOINTMENT CONFIRMED  │
│                          │
│ Confirmation:            │
│ APT-20251216-1001        │
│                          │
│ Date/Time:               │
│ Dec 16, 2025 at 10:00 AM │
│                          │
│ Provider:                │
│ Dr. Sarah Martinez       │
│ Cardiology               │
│                          │
│ Location:                │
│ Intermountain Healthcare │
│ 5169 Cottonwood St       │
│ Murray, UT 84107         │
│                          │
│ Instructions:            │
│ • Arrive 15 min early    │
│ • Bring insurance card   │
│ • List current meds      │
│ • If worse, call 911     │
│                          │
│ [Print] [Email Patient]  │
└──────────────────────────┘
  │
  ▼
COMPLETE
```

---

## Appointment Detail View Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APPOINTMENTS PAGE (/appointments)                 │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  HEADER                                                            │
│  ───────────────────────────────────────────────────────────────   │
│  Appointments Management         [Refresh] [Today] [This Week]    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  STATISTICS CARDS                                                  │
│  ────────────────────────────────────────────────────────────────  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Total   │  │Scheduled │  │ Completed│  │ Emergency│          │
│  │   156    │  │    89    │  │    45    │  │     8    │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  FILTERS                                         [🔽 Show Filters] │
│  ────────────────────────────────────────────────────────────────  │
│  Status:  [All ▼] [Scheduled] [Confirmed] [Completed]             │
│  Date:    [All ▼] [Today] [This Week] [This Month]                │
│  Urgency: [All ▼] [Emergency] [Urgent] [Routine]                  │
│  Search:  [_________________________] 🔍                           │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  APPOINTMENT LIST                                                  │
│  ────────────────────────────────────────────────────────────────  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 10:00 AM • Dec 16, 2025                     [EMERGENCY]      │ │
│  │                                                               │ │
│  │ 👤 John Smith (MRN: 45678)                                   │ │
│  │ 👨‍⚕️ Dr. Sarah Martinez • Cardiology                          │ │
│  │ 📍 Intermountain Healthcare - Murray                         │ │
│  │ 📋 Chest pain evaluation                                     │ │
│  │                                                               │ │
│  │ Confirmation: APT-20251216-1001        Status: [Scheduled ▼] │ │
│  │                                                               │ │
│  │ [View Details] [Check In] [Cancel]                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 10:30 AM • Dec 16, 2025                     [ROUTINE]        │ │
│  │                                                               │ │
│  │ 👤 Jane Doe (MRN: 78901)                                     │ │
│  │ 👨‍⚕️ Dr. Michael Chen • Family Medicine                       │ │
│  │ 📍 University Hospital                                        │ │
│  │ 📋 Annual physical examination                               │ │
│  │                                                               │ │
│  │ Confirmation: APT-20251216-1002        Status: [Confirmed ▼] │ │
│  │                                                               │ │
│  │ [View Details] [Check In] [Reschedule]                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ... [More appointments]                                           │
│                                                                    │
│  Showing 1-20 of 156                          [◀ Previous] [Next ▶]│
└────────────────────────────────────────────────────────────────────┘
```

### Click "View Details" → Opens Modal

```
┌────────────────────────────────────────────────────────────────────┐
│  APPOINTMENT DETAIL MODAL                                     [✕]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Appointment Details                                               │
│  ══════════════════════════════════════════════════════════════   │
│                                                                    │
│  📅 Date & Time                                                    │
│  ────────────────                                                  │
│  December 16, 2025 at 10:00 AM - 10:30 AM (30 minutes)            │
│                                                                    │
│  👤 Patient Information                                            │
│  ────────────────────────                                          │
│  Name:           John Smith                                        │
│  MRN:            45678                                             │
│  Date of Birth:  March 15, 1978 (47 years old)                    │
│  Phone:          (801) 555-0199                                    │
│  Email:          john.smith@email.com                              │
│                                                                    │
│  👨‍⚕️ Provider Information                                         │
│  ──────────────────────────                                        │
│  Name:           Dr. Sarah Martinez                                │
│  Specialty:      Cardiology                                        │
│  NPI:            1234567890                                        │
│                                                                    │
│  📍 Facility Information                                           │
│  ────────────────────────                                          │
│  Name:           Intermountain Healthcare - Murray                 │
│  Address:        5169 Cottonwood St                                │
│                  Murray, UT 84107                                  │
│  Phone:          (801) 507-7000                                    │
│                                                                    │
│  📋 Appointment Details                                            │
│  ────────────────────────────                                      │
│  Status:         Scheduled                                         │
│  Urgency:        Emergency ⚠️                                       │
│  Confirmation:   APT-20251216-1001                                 │
│  Reason:         Chest pain with left arm radiation               │
│  FHIR ID:        20902                                             │
│                                                                    │
│  📝 Clinical Notes                                                 │
│  ───────────────────                                               │
│  • Patient reports chest pain starting 2 hours ago                 │
│  • Pain rated 7/10, radiating to left arm                         │
│  • Emergency triage completed                                      │
│  • Requires immediate cardiology evaluation                        │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                        ACTIONS                              │   │
│  │                                                             │   │
│  │  [Check In Patient]  [Reschedule]  [Cancel Appointment]   │   │
│  │                                                             │   │
│  │  [Print Details]     [Email Patient]  [View in FHIR]      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     APPOINTMENT BOOKING DATA FLOW                    │
└─────────────────────────────────────────────────────────────────────┘

USER INTERFACE (React)
  │
  │ 1. Book Appointment Request
  │    {patient, provider, datetime, urgency}
  ▼
API ENDPOINT (/scheduling/book)
  │
  │ 2. Validate Request
  │    - Check patient exists
  │    - Check provider exists
  │    - Check facility exists
  ▼
SCHEDULING SERVICE
  │
  ├─ 3a. Check Availability
  │      - Query provider schedule
  │      - Check for conflicts
  │      - Validate time slot
  │
  ├─ 3b. Race Condition Check
  │      - Database-level locking
  │      - Verify slot still free
  │
  └─ 3c. Create Local Appointment
         - Insert into tribal DB
         - Generate confirmation #
         │
         ▼
  ┌─────────────────────────┐
  │ PostgreSQL (Tribal DB)  │
  │                         │
  │ appointments table      │
  │ - appointment_id        │
  │ - patient_fhir_id       │
  │ - provider_id           │
  │ - facility_id           │
  │ - appointment_datetime  │
  │ - status                │
  │ - urgency               │
  │ - confirmation_number   │
  └─────────────────────────┘
         │
         │ 4. Sync to FHIR (Async)
         ▼
FHIR SCHEDULING SERVICE
  │
  ├─ 5a. Get FHIR IDs
  │      - Map local provider_id → FHIR Practitioner ID
  │      - Map local facility_id → FHIR Location ID
  │      - Patient already has FHIR ID
  │
  └─ 5b. Create FHIR Appointment
         - Build Appointment resource
         - Add participants (Patient, Practitioner, Location)
         - Set priority (emergency=1, routine=5)
         - POST to HAPI FHIR server
         │
         ▼
  ┌─────────────────────────┐
  │ HAPI FHIR Server        │
  │                         │
  │ Appointment resource    │
  │ - id                    │
  │ - status: "booked"      │
  │ - priority: 1           │
  │ - start/end datetime    │
  │ - participant[]         │
  │   - Patient/233         │
  │   - Practitioner/20844  │
  │   - Location/20823      │
  │ - identifier (conf #)   │
  └─────────────────────────┘
         │
         │ 6. Return Success
         ▼
API RESPONSE
  │
  │ {
  │   success: true,
  │   appointment_id: 1001,
  │   confirmation_number: "APT-20251216-1001",
  │   fhir_appointment_id: "20902",
  │   provider_name: "Dr. Martinez",
  │   facility_name: "Intermountain Healthcare",
  │   ...
  │ }
  ▼
FRONTEND UPDATE
  │
  ├─ Display confirmation modal
  ├─ Update appointment list
  ├─ Show success message
  └─ Ready for next patient
```

---

## Quick Access Reference

### Frontend Routes
| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/` | MA Login | Facility/specialty selection |
| `/chat` | Main interface | AI triage, patient summary, booking |
| `/appointments` | Dashboard | List, filter, stats, detail view |

### API Endpoints Summary
| Category | Endpoints | Count |
|----------|-----------|-------|
| Scheduling | `/scheduling/availability`, `/scheduling/book` | 2 |
| Appointments | `/appointments`, `/appointments/{id}`, `/appointments/today/list`, `/appointments/stats` | 4 |
| FHIR | `/fhir/sync/all`, `/fhir/appointments/create`, `/fhir/appointments/search` | 3 |
| Patients | `/patients/search`, `/patients/{id}` | 2 |

### Database Tables (Tribal)
- `appointments` - Local appointment records
- `providers` - Provider information
- `facilities` - Facility/clinic information
- `specialties` - Medical specialties
- `provider_schedules` - Availability blocks
- `patient_tribal` - Patient records

### FHIR Resources (HAPI)
- `Patient` - Patient demographics
- `Practitioner` - Provider information
- `Location` - Facility locations
- `Appointment` - Appointment bookings
- `Schedule` - Provider availability patterns (future use)
- `Slot` - Individual bookable slots (future use)
- `AppointmentResponse` - Acceptance/decline (future use)

---

## Material-UI Components Reference

### Page 1: MA Context Selection (`/`)

**Material-UI Components Used**:
```tsx
import {
  Container,     // Centered layout wrapper
  Card,          // Main card container
  CardContent,   // Card content wrapper
  Typography,    // Headings and text
  TextField,     // Name input field
  FormControl,   // Form wrapper
  InputLabel,    // Dropdown labels
  Select,        // Facility & Specialty dropdowns
  MenuItem,      // Dropdown options
  Button,        // Start Shift button
  Alert,         // Error messages
  CircularProgress, // Loading spinner
  Box            // Layout container
} from '@mui/material';
```

**Key Props**:
- `TextField`: `fullWidth`, `required`, `autoFocus`, `placeholder`
- `Select`: `disabled`, `label`
- `Button`: `type="submit"`, `variant="contained"`, `size="large"`

**Layout**:
- Container: `maxWidth="sm"`, centered with `mt: 8`
- Card: Elevated with padding

---

### Page 2: Chat View (`/chat`)

**Material-UI Components Used**:
```tsx
import {
  Box,           // Layout containers (flex, grid)
  AppBar,        // Top navigation bar
  Toolbar,       // AppBar content
  Typography,    // Text elements
  IconButton,    // Logout button
} from '@mui/material';
import {
  LogoutIcon     // End Shift icon
} from '@mui/icons-material';
```

**Layout Structure**:
```tsx
<Box display="flex" flexDirection="column" height="100vh">
  <AppBar position="static">
    <Toolbar>
      // MA name, facility, specialty, logout
    </Toolbar>
  </AppBar>

  <Box display="flex" flex={1}>
    <Box flex={3}> // 60% - Chat panel
      <ChatMessages />
      <ChatInput />
    </Box>

    <Box flex={2}> // 40% - Patient panel
      <PatientSummaryPanel />
    </Box>
  </Box>
</Box>
```

**Key Features**:
- Split panel layout with flex ratios (3:2)
- AppBar with session context
- Vertical divider between panels

---

### Page 3: Appointments (`/appointments`)

**Material-UI Components Used**:
```tsx
import {
  Container,
  Typography,
  Card,             // Appointment cards
  CardContent,      // Card content
  Grid,             // Stats layout
  Stack,            // Vertical stacking
  Chip,             // Status & date badges
  Button,           // Quick filter buttons
  TextField,        // Search input
  FormControl,
  InputLabel,
  Select,           // Filter dropdowns
  MenuItem,
  CircularProgress, // Loading state
  Alert,            // Error messages
  IconButton,       // Action buttons
  Tooltip,          // Hover hints
  Paper,            // Elevation
  Divider,          // Section separators
  Badge,            // Notification counts
} from '@mui/material';

import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
```

**Status Chip Configuration**:
```tsx
const STATUS_CONFIG = {
  scheduled: { color: 'info', label: 'Scheduled' },
  confirmed: { color: 'primary', label: 'Confirmed' },
  'checked-in': { color: 'warning', label: 'Checked In' },
  completed: { color: 'success', label: 'Completed' },
  cancelled: { color: 'error', label: 'Cancelled' },
  'no-show': { color: 'default', label: 'No Show' },
};
```

**Urgency Configuration**:
```tsx
const URGENCY_CONFIG = {
  emergency: { color: 'error', label: 'Emergency', priority: 1 },
  urgent: { color: 'warning', label: 'Urgent', priority: 2 },
  'semi-urgent': { color: 'info', label: 'Semi-Urgent', priority: 3 },
  'non-urgent': { color: 'default', label: 'Routine', priority: 4 },
};
```

**Card Styling**:
```tsx
<Card
  sx={{
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      boxShadow: 4,
      transform: 'translateY(-2px)',
    },
    borderLeft: `4px solid`,
    borderLeftColor: `${urgencyConfig.color}.main`,
  }}
  onClick={() => setSelectedAppointment(appointment.appointment_id)}
>
```

**Key Features**:
- Responsive Grid for stats cards
- Color-coded left border by urgency
- Hover effects with transform and shadow
- Clickable cards opening modal
- Filter dropdowns with controlled state
- Icon integration for visual clarity

---

## Navigation Best Practices

### For Medical Assistants
1. **Start with Context**: Always set facility and specialty first
2. **Use Chat for Booking**: Let AI guide triage and suggest providers
3. **Check Dashboard Daily**: Review upcoming appointments at shift start
4. **Verify Confirmations**: Always read back appointment details to patient

### For Developers
1. **Check Availability First**: Always query before booking
2. **Handle 409 Conflicts**: Refresh availability on booking failure
3. **Use FHIR IDs**: Patient FHIR IDs are required for all bookings
4. **Monitor Sync Status**: Verify FHIR synchronization completed

### For Administrators
1. **Daily Stats Review**: Check `/appointments/stats` each morning
2. **Monitor No-Shows**: Track patterns by provider/facility
3. **Capacity Planning**: Use availability queries to identify gaps
4. **FHIR Compliance**: Regularly verify HAPI sync status
