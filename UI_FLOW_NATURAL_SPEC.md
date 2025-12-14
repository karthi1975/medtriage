# MediChat MA Interface - Natural UI Flow Specification

## 🎯 Complete User Journey: From Patient Walk-In to Confirmed Appointment

Let me walk you through exactly how an MA uses this system, step by step, with all the data flowing through each component.

---

## Scene 1: Patient Walks Into Clinic

**MA's First Action:** Open MediChat on their computer

### What They See: Dashboard (Landing Page)

```
┌─────────────────────────────────────────────────────────────┐
│  [☰] MediChat MA     [🔍 Search patients...]    [⚙️] [👤]   │
├────┬────────────────────────────────────────────────────────┤
│    │  Good morning, Sarah! 👋                               │
│🏠  │                                                         │
│Dash│  Quick Stats:                                          │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│🔍  │  │Active   │ │Pending  │ │Today's  │ │Avg Wait │    │
│Pts │  │Patients │ │Triage   │ │Appts    │ │Time     │    │
│    │  │   12    │ │    8    │ │   24    │ │  15min  │    │
│📋  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│Tri │                                                         │
│    │  Recent Activity:                                      │
│📅  │  • Jane Doe (232) - Triage completed 5 min ago        │
│App │  • John Smith (145) - Appointment scheduled           │
│    │  • Mary Johnson (198) - Checked in                    │
│⚙️  │                                                         │
│Set │  Quick Actions:                                        │
│    │  [➕ New Triage]  [📅 Schedule Appointment]           │
└────┴────────────────────────────────────────────────────────┘
```

**Component: Dashboard**

**Inputs (loads automatically):**
```javascript
{
  stats: {
    activePatients: 12,
    pendingTriage: 8,
    todaysAppointments: 24,
    averageWaitTime: "15min"
  },
  recentActivity: [
    {
      patientId: "232",
      patientName: "Jane Doe",
      action: "triage_completed",
      timestamp: "2025-12-13T10:15:00Z"
    },
    {
      patientId: "145",
      patientName: "John Smith",
      action: "appointment_scheduled",
      timestamp: "2025-12-13T10:10:00Z"
    }
  ],
  currentUser: {
    name: "Sarah",
    role: "Medical Assistant"
  }
}
```

**Outputs (what MA can do):**
- Click "New Triage" → Navigate to Patient Search
- Click "Schedule Appointment" → Navigate to Scheduling
- Click recent activity item → View details
- Search in top bar → Quick patient lookup

**MA clicks: "New Triage"**

---

## Scene 2: Finding the Patient

### What They See: Patient Search Page

```
┌─────────────────────────────────────────────────────────────┐
│  [←] Patient Lookup                                          │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Search by Patient ID or Name                                │
│  ┌───────────────────────────────────────────────┐  [Search]│
│  │ 🔍 Enter patient ID or name...                │           │
│  └───────────────────────────────────────────────┘           │
│                                                               │
│  Recent Patients                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 👤 Jane Doe                                          │   │
│  │    ID: 232 | DOB: 12/13/1966 | F | Age: 59         │→ │
│  │    Last Visit: 2 weeks ago                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 👤 John Smith                                        │   │
│  │    ID: 145 | DOB: 05/20/1980 | M | Age: 45         │→ │
│  │    Last Visit: Yesterday                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Can't find patient?                                         │
│  [➕ Register New Patient]                                   │
└───────────────────────────────────────────────────────────────┘
```

**Component: PatientSearch**

**Inputs (from MA):**
```javascript
// MA types in search box
searchQuery: "jane doe"  // or "232" for ID search

// Component fetches from API
GET /api/v1/patients/search?q=jane%20doe
```

**API Returns:**
```javascript
{
  results: [
    {
      patientId: "232",
      fhirId: "232",
      name: "Jane Doe",
      dateOfBirth: "1966-12-13",
      age: 59,
      gender: "female",
      lastVisit: "2025-11-28",
      phone: "801-555-0123",
      address: {
        street: "123 Main St",
        city: "Salt Lake City",
        state: "UT",
        zip: "84101"
      }
    }
  ],
  count: 1
}
```

**Component Displays (recent patients list):**
```javascript
recentPatients: [
  {
    patientId: "232",
    name: "Jane Doe",
    dob: "12/13/1966",
    gender: "F",
    age: 59,
    lastVisit: "2 weeks ago"
  },
  {
    patientId: "145",
    name: "John Smith",
    dob: "05/20/1980",
    gender: "M",
    age: 45,
    lastVisit: "Yesterday"
  }
]
```

**Outputs (when MA selects Jane Doe):**
```javascript
selectedPatient: {
  patientId: "232",
  fhirId: "232",
  name: "Jane Doe",
  dob: "1966-12-13",
  age: 59,
  gender: "female"
}

// Navigate to Triage page
navigate('/triage/232')
```

**MA clicks: Jane Doe's card → "Start Triage"**

---

## Scene 3: Triage Assessment - The Main Event

### What They See: Triage Page (Two Panels)

```
┌────────────────────────────────────────────────────────────────────────┐
│  [←] Triage Assessment - Jane Doe (ID: 232)                            │
├──────────────────────────────────┬─────────────────────────────────────┤
│ 💬 Chat Interface                │ 👤 Patient Information              │
│                                  │                                     │
│ ┌──────────────────────────────┐ │ ┌─────────────────────────────────┐│
│ │ 🤖 Assistant:                │ │ │ Jane Doe (232)                 ││
│ │ Hello! I'm here to help      │ │ │ Female, 59 years old           ││
│ │ assess your symptoms.        │ │ │ DOB: 12/13/1966                ││
│ │ Please describe what you're  │ │ │                                ││
│ │ experiencing today.          │ │ │ 🏥 Known Conditions:           ││
│ │                              │ │ │ • Hypertension                 ││
│ │ Sent at 10:20 AM            │ │ │ • Type 2 Diabetes              ││
│ └──────────────────────────────┘ │ │ • Hyperlipidemia               ││
│                                  │ │                                ││
│ ┌──────────────────────────────┐ │ │ 🚫 Allergies:                  ││
│ │ 👤 You (MA):                 │ │ │ • Penicillin (severe)          ││
│ │ Patient reports severe chest │ │ │ • Sulfa drugs                  ││
│ │ pain radiating to left arm,  │ │ │                                ││
│ │ started 2 hours ago, also    │ │ │ 💊 Current Medications:        ││
│ │ shortness of breath and      │ │ │ • Lisinopril 10mg daily       ││
│ │ sweating                     │ │ │ • Metformin 500mg twice daily ││
│ │                              │ │ │ • Atorvastatin 20mg daily     ││
│ │ Sent at 10:21 AM            │ │ └─────────────────────────────────┘│
│ └──────────────────────────────┘ │                                     │
│                                  │ ⏳ Analyzing symptoms...            │
│ ┌────────────────────────┐      │ [Loading indicator shown]           │
│ │ Type your message...   │ [📤]│                                     │
│ └────────────────────────┘      │                                     │
└──────────────────────────────────┴─────────────────────────────────────┘
```

**Component: TriageAssessment (Parent Container)**

**Initial Inputs (from route parameter):**
```javascript
{
  patientId: "232"  // from URL /triage/232
}
```

**Fetches Patient Data:**
```javascript
// Calls API
GET /api/v1/patients/232

// Receives
patientData: {
  patient_id: "232",
  data: {
    patient: {
      id: "232",
      name: "Jane Doe",
      gender: "female",
      birthDate: "1966-12-13",
      age: 59,
      address: [{
        street: "123 Main St",
        city: "Salt Lake City",
        state: "UT"
      }],
      telecom: [{ value: "801-555-0123" }]
    },
    conditions: [
      {
        name: "Hypertension",
        onsetDate: "2015-03-10",
        status: "active"
      },
      {
        name: "Type 2 Diabetes",
        onsetDate: "2018-07-22",
        status: "active"
      },
      {
        name: "Hyperlipidemia",
        onsetDate: "2016-11-05",
        status: "active"
      }
    ],
    medications: [
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "daily"
      },
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "twice daily"
      },
      {
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "daily"
      }
    ],
    allergies: [
      {
        substance: "Penicillin",
        severity: "severe",
        reaction: "anaphylaxis"
      },
      {
        substance: "Sulfa drugs",
        severity: "moderate",
        reaction: "rash"
      }
    ]
  }
}
```

---

### Sub-Component: ChatInterface (Left Panel)

**Inputs:**
```javascript
{
  patientId: "232",
  onTriageSubmit: function(message)  // Callback to parent
}
```

**Internal State (conversation):**
```javascript
messages: [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm here to help assess your symptoms. Please describe what you're experiencing today.",
    timestamp: "2025-12-13T10:20:00Z"
  },
  {
    id: 2,
    role: "user",
    content: "Patient reports severe chest pain radiating to left arm, started 2 hours ago, also shortness of breath and sweating",
    timestamp: "2025-12-13T10:21:00Z"
  }
]
```

**Output (when MA clicks Send):**
```javascript
// Calls parent function
onTriageSubmit({
  message: "Patient reports severe chest pain radiating to left arm...",
  patientId: "232"
})

// Which triggers API call
POST /api/v1/triage
{
  "message": "Patient reports severe chest pain radiating to left arm, started 2 hours ago, also shortness of breath and sweating",
  "patient_id": "232"
}
```

---

### Sub-Component: PatientInfoCard (Right Panel - Top)

**Inputs:**
```javascript
{
  patient: {
    id: "232",
    name: "Jane Doe",
    gender: "female",
    birthDate: "1966-12-13",
    age: 59
  },
  conditions: [
    { name: "Hypertension", status: "active" },
    { name: "Type 2 Diabetes", status: "active" },
    { name: "Hyperlipidemia", status: "active" }
  ],
  allergies: [
    { substance: "Penicillin", severity: "severe" },
    { substance: "Sulfa drugs", severity: "moderate" }
  ],
  medications: [
    { name: "Lisinopril", dosage: "10mg", frequency: "daily" },
    { name: "Metformin", dosage: "500mg", frequency: "twice daily" },
    { name: "Atorvastatin", dosage: "20mg", frequency: "daily" }
  ]
}
```

**Displays (visual representation):**
- Patient name and age prominently
- Conditions as green chips
- Allergies as red alert chips
- Medications as info chips
- All in a compact, always-visible card

**Outputs:**
- None (display-only component)

---

### What Happens Next: Triage Results Appear

```
┌────────────────────────────────────────────────────────────────────────┐
│  [←] Triage Assessment - Jane Doe (ID: 232)                            │
├──────────────────────────────────┬─────────────────────────────────────┤
│ 💬 Chat (scrolled up)            │ 🚨 TRIAGE RESULTS                   │
│                                  │                                     │
│ [Previous messages...]           │ ┌─────────────────────────────────┐│
│                                  │ │ 🚨 EMERGENCY                    ││
│                                  │ │                                 ││
│                                  │ │ This patient requires           ││
│                                  │ │ IMMEDIATE emergency care        ││
│                                  │ │                                 ││
│                                  │ │ Confidence: HIGH ⚠️             ││
│                                  │ └─────────────────────────────────┘│
│                                  │                                     │
│                                  │ 📋 Assessment:                      │
│                                  │ The combination of severe chest    │
│                                  │ pain radiating to left arm and jaw,│
│                                  │ along with shortness of breath and │
│                                  │ sweating, are classic symptoms of  │
│                                  │ a heart attack (myocardial         │
│                                  │ infarction). This is a life-       │
│                                  │ threatening condition...           │
│                                  │                                     │
│                                  │ 🔴 Red Flags:                       │
│                                  │ • Severe chest pain                │
│                                  │ • Pain radiating to left arm/jaw   │
│                                  │ • Shortness of breath              │
│                                  │ • Sweating                         │
│                                  │                                     │
│                                  │ 💡 Symptoms Identified:             │
│                                  │ • Chest pain (severe, 2 hours)     │
│                                  │ • Shortness of breath (severe)     │
│                                  │ • Diaphoresis (sweating)           │
│                                  │                                     │
│                                  │ ⚕️ IMMEDIATE ACTION REQUIRED:       │
│                                  │ ┌───────────────────────────────┐ │
│                                  │ │ 🚑 CALL 911 IMMEDIATELY       │ │
│                                  │ │                               │ │
│                                  │ │ Do NOT schedule appointment   │ │
│                                  │ │ Do NOT delay for transport    │ │
│                                  │ │                               │ │
│                                  │ │ Patient needs ER NOW          │ │
│                                  │ └───────────────────────────────┘ │
│                                  │                                     │
│                                  │ [❌ Scheduling Disabled]            │
└──────────────────────────────────┴─────────────────────────────────────┘
```

**Sub-Component: TriageResults (Right Panel - Bottom)**

**Inputs (from API response):**
```javascript
{
  priority: "emergency",
  reasoning: "The combination of severe chest pain radiating to left arm and jaw, along with shortness of breath and sweating, are classic symptoms of a heart attack (myocardial infarction). This is a life-threatening condition that requires immediate emergency care to prevent serious complications or death.",
  confidence: "high",
  red_flags: [
    "severe chest pain",
    "chest pain radiating to left arm and jaw",
    "shortness of breath",
    "sweating"
  ],
  recommendations: {
    immediate_action: "Call 911 or go to the nearest Emergency Room immediately.",
    care_level: "Emergency Room",
    timeframe: "Immediate attention is crucial to prevent further harm.",
    warning_signs: [
      "Pain spreading to the back, neck, or both arms",
      "Nausea or vomiting",
      "Dizziness or lightheadedness",
      "Unexplained fatigue"
    ]
  },
  extracted_symptoms: [
    {
      symptom: "chest pain",
      severity: "severe",
      duration: "2 hours",
      location: "radiating to left arm and jaw"
    },
    {
      symptom: "shortness of breath",
      severity: "severe",
      duration: null,
      location: null
    },
    {
      symptom: "sweating",
      severity: null,
      duration: "2 hours",
      location: null
    }
  ],
  patient_context: {
    patient: { /* patient data */ },
    conditions: [/* existing conditions */],
    medications: [/* current meds */],
    allergies: [/* allergies */]
  }
}
```

**Displays:**
- Large red EMERGENCY badge
- High confidence indicator
- Assessment reasoning (full text)
- Red flags list (bullets with icons)
- Extracted symptoms (cards with severity badges)
- Immediate action box (prominent, red background)
- Warning signs (expandable accordion)

**Outputs:**
```javascript
{
  canSchedule: false,  // Emergency cases block scheduling
  emergencyAction: "call_911",
  triageData: { /* full triage response */ }
}
```

**What MA Does Next:**
- Calls 911
- Stays with patient
- Documents in system
- Does NOT schedule appointment (button disabled)

---

## Scene 4: Non-Emergency Case - Let's Rewind

**Different Patient Scenario:** Mary Johnson with a skin rash

### MA Types Different Symptoms:

```
MA Input: "Patient reports itchy skin rash on both arms for
          the past week. No fever, no pain, just itching.
          Rash is red and slightly raised."
```

**API Call:**
```javascript
POST /api/v1/triage
{
  "message": "Patient reports itchy skin rash on both arms for the past week. No fever, no pain, just itching. Rash is red and slightly raised.",
  "patient_id": "198"
}
```

**API Response:**
```javascript
{
  priority: "non-urgent",
  reasoning: "The patient's symptoms of an itchy, red, slightly raised rash on both arms for one week, without fever or pain, suggest a non-urgent dermatological issue, possibly contact dermatitis, eczema, or an allergic reaction. While uncomfortable, this does not indicate a life-threatening condition and can be evaluated in a routine outpatient setting.",
  confidence: "high",
  red_flags: [],
  recommendations: {
    immediate_action: "No immediate action required. Patient can schedule a routine appointment with a dermatologist.",
    care_level: "Outpatient - Dermatology",
    timeframe: "Schedule appointment within 1-2 weeks",
    self_care_tips: [
      "Avoid scratching the rash",
      "Apply cool compresses to reduce itching",
      "Use over-the-counter hydrocortisone cream",
      "Avoid known irritants and allergens"
    ],
    warning_signs: [
      "Rash spreads rapidly",
      "Development of fever",
      "Severe swelling or blistering",
      "Signs of infection (pus, increasing pain)"
    ],
    follow_up: "If symptoms worsen or do not improve within a week, seek medical attention sooner."
  },
  extracted_symptoms: [
    {
      symptom: "skin rash",
      severity: "mild",
      duration: "1 week",
      location: "both arms"
    },
    {
      symptom: "itching",
      severity: "moderate",
      duration: "1 week",
      location: "both arms"
    }
  ],
  recommended_specialty: "Dermatology",
  patient_context: { /* patient data */ }
}
```

### Now the Screen Shows:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 💬 Chat (left)                   │ ✅ TRIAGE RESULTS                   │
│                                  │                                     │
│                                  │ ┌─────────────────────────────────┐│
│                                  │ │ ✅ NON-URGENT                   ││
│                                  │ │                                 ││
│                                  │ │ Routine care recommended        ││
│                                  │ │ Confidence: HIGH ✓              ││
│                                  │ └─────────────────────────────────┘│
│                                  │                                     │
│                                  │ 📋 Assessment:                      │
│                                  │ Patient's symptoms suggest a non-  │
│                                  │ urgent dermatological issue...     │
│                                  │                                     │
│                                  │ 💡 Symptoms:                        │
│                                  │ • Skin rash (mild, 1 week)         │
│                                  │ • Itching (moderate, both arms)    │
│                                  │                                     │
│                                  │ 💊 Recommended Care:                │
│                                  │ • Dermatology appointment          │
│                                  │ • Within 1-2 weeks                 │
│                                  │                                     │
│                                  │ 🏠 Self-Care Tips:                  │
│                                  │ • Avoid scratching                 │
│                                  │ • Cool compresses                  │
│                                  │ • OTC hydrocortisone cream         │
│                                  │                                     │
│                                  │ ┌───────────────────────────────┐ │
│                                  │ │ [📅 Schedule Appointment]     │ │
│                                  │ └───────────────────────────────┘ │
└──────────────────────────────────┴─────────────────────────────────────┘
```

**Output (Schedule button enabled):**
```javascript
{
  canSchedule: true,
  triageData: {
    priority: "non-urgent",
    recommendedSpecialty: "Dermatology",
    specialtyId: 4,  // Dermatology
    urgency: "non-urgent",
    patientId: "198",
    triageSessionId: "triage-2025-12-13-198-uuid"
  }
}
```

**MA clicks: "Schedule Appointment"**

---

## Scene 5: Scheduling Workflow - The 3-Step Journey

### Step 1: Select Specialty & Preferences

```
┌─────────────────────────────────────────────────────────────┐
│  [←] Schedule Appointment for Mary Johnson (198)            │
│                                                              │
│  ● Step 1: Specialty    ○ Step 2: Provider    ○ Step 3: Confirm│
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Based on triage assessment:                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 💡 Recommended: Dermatology                          │  │
│  │    (Non-urgent skin condition)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Select Specialty *                                         │
│  ┌────────────────────────────────────────────────┐  ▼     │
│  │ Dermatology                                    │        │
│  └────────────────────────────────────────────────┘        │
│  ↓ Dropdown shows all 21 specialties:                      │
│  Family Medicine, Cardiology, Orthopedics,                 │
│  Dermatology ✓, Mental Health, Neurology...                │
│                                                              │
│  Preferred Region (optional)                                │
│  ┌────────────────────────────────────────────────┐  ▼     │
│  │ Salt Lake Valley                               │        │
│  └────────────────────────────────────────────────┘        │
│  ↓ Options: Cache Valley, Davis/Weber,                     │
│    Salt Lake Valley ✓, Uintah Basin,                       │
│    Washington County                                        │
│                                                              │
│  Urgency Level (from triage)                                │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🟢 Non-Urgent (1-2 weeks)                      │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Date Preference (optional)                                 │
│  ┌─────────────────┐  to  ┌─────────────────┐             │
│  │ Dec 16, 2025  ▼│      │ Dec 30, 2025  ▼│             │
│  └─────────────────┘      └─────────────────┘             │
│                                                              │
│  [Cancel]                          [Find Providers →]      │
└─────────────────────────────────────────────────────────────┘
```

**Component: SchedulingStep1**

**Inputs (pre-filled from triage):**
```javascript
{
  triageData: {
    priority: "non-urgent",
    recommendedSpecialty: "Dermatology",
    specialtyId: 4,
    patientId: "198",
    triageSessionId: "triage-2025-12-13-198-uuid"
  },
  patientRegion: "Salt Lake Valley",  // from patient address
  availableSpecialties: [
    { id: 1, name: "Family Medicine" },
    { id: 2, name: "Cardiology" },
    { id: 3, name: "Orthopedics" },
    { id: 4, name: "Dermatology" },
    { id: 5, name: "Mental Health" },
    // ... all 21 specialties
  ],
  availableRegions: [
    "Cache Valley",
    "Davis/Weber",
    "Salt Lake Valley",
    "Uintah Basin",
    "Washington County"
  ]
}
```

**Outputs (when MA clicks "Find Providers"):**
```javascript
{
  specialtyId: 4,
  specialtyName: "Dermatology",
  region: "Salt Lake Valley",
  urgency: "non-urgent",
  dateRange: {
    start: "2025-12-16",
    end: "2025-12-30"
  },
  patientId: "198",
  triageSessionId: "triage-2025-12-13-198-uuid"
}

// Triggers API call
POST /api/v1/scheduling/recommend
{
  "specialty_id": 4,
  "triage_priority": "non-urgent",
  "patient_fhir_id": "198",
  "patient_region": "Salt Lake Valley",
  "preferred_date_range": {
    "start": "2025-12-16",
    "end": "2025-12-30"
  },
  "triage_session_id": "triage-2025-12-13-198-uuid"
}
```

---

### Step 2: Browse Providers & Select Slot

**API Returns Provider Recommendations:**
```javascript
{
  recommendations: [
    {
      provider: {
        provider_id: 39,
        npi: "6521218379",
        name: "Dr. Tina Johnson",
        credentials: "DO",
        specialty: "Dermatology",
        years_experience: 5,
        languages: ["English", "Spanish"]
      },
      facility: {
        facility_id: 2,
        name: "Murray Medical Center",
        address: "2791 Alison Spring, Murray, UT 84123",
        city: "Murray",
        region: "Salt Lake Valley",
        phone: "801-315-6443"
      },
      slot_datetime: "2025-12-16T08:00:00",
      duration_minutes: 15,
      reasoning: "Facility is in patient's region; Slot timing matches urgency level; Dr. Johnson accepts new patients and has Spanish language capability",
      match_score: 0.87,
      distance_miles: 0.0,
      available_slots: [
        "2025-12-16T08:00:00",
        "2025-12-16T10:30:00",
        "2025-12-17T09:00:00",
        "2025-12-18T14:00:00",
        "2025-12-20T08:30:00"
      ]
    },
    {
      provider: {
        provider_id: 38,
        npi: "2595404065",
        name: "Dr. Michael Lynn",
        credentials: "DO",
        specialty: "Dermatology",
        years_experience: 22,
        languages: ["English", "Spanish"]
      },
      facility: {
        facility_id: 2,
        name: "Murray Medical Center",
        address: "2791 Alison Spring, Murray, UT 84123",
        city: "Murray",
        region: "Salt Lake Valley",
        phone: "801-315-6443"
      },
      slot_datetime: "2025-12-16T09:00:00",
      duration_minutes: 15,
      reasoning: "Highly experienced provider (22 years); Same facility as top choice; Excellent patient ratings",
      match_score: 0.85,
      distance_miles: 0.0,
      available_slots: [
        "2025-12-16T09:00:00",
        "2025-12-16T11:00:00",
        "2025-12-19T10:00:00"
      ]
    },
    {
      provider: {
        provider_id: 34,
        npi: "6919044000",
        name: "Dr. Christopher Hernandez",
        credentials: "MD",
        specialty: "Dermatology",
        years_experience: 15,
        languages: ["English"]
      },
      facility: {
        facility_id: 2,
        name: "Murray Medical Center",
        address: "2791 Alison Spring, Murray, UT 84123",
        city: "Murray",
        region: "Salt Lake Valley",
        phone: "801-315-6443"
      },
      slot_datetime: "2025-12-17T08:00:00",
      duration_minutes: 15,
      reasoning: "Mid-level experience; Available soonest for urgent cases",
      match_score: 0.82,
      distance_miles: 0.0,
      available_slots: [
        "2025-12-17T08:00:00",
        "2025-12-18T13:00:00"
      ]
    }
  ],
  total_options_found: 3,
  message: "Found 3 recommended providers"
}
```

**Screen Shows:**

```
┌─────────────────────────────────────────────────────────────┐
│  [←] Schedule Appointment for Mary Johnson (198)            │
│                                                              │
│  ✓ Step 1: Specialty    ● Step 2: Provider    ○ Step 3: Confirm│
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Top Recommended Providers (3 found)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⭐ 87% Match                                         │  │
│  │ ┌─────┐  Dr. Tina Johnson, DO                       │  │
│  │ │ TJ  │  5 years experience | Dermatology            │  │
│  │ └─────┘                                               │  │
│  │          📍 Murray Medical Center                     │  │
│  │          2791 Alison Spring, Murray, UT 84123        │  │
│  │          🗣 Languages: English, Spanish               │  │
│  │          📞 801-315-6443                              │  │
│  │                                                        │  │
│  │          💡 Why recommended:                           │  │
│  │          "Facility in your region; Accepts new        │  │
│  │          patients; Spanish available"                 │  │
│  │                                                        │  │
│  │          📅 Available Slots:                           │  │
│  │          [Mon Dec 16, 8:00 AM]  [Mon Dec 16, 10:30AM]│  │
│  │          [Tue Dec 17, 9:00 AM]  [Wed Dec 18, 2:00 PM]│  │
│  │          [Fri Dec 20, 8:30 AM]  [+More...]           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⭐ 85% Match                                         │  │
│  │ ┌─────┐  Dr. Michael Lynn, DO                        │  │
│  │ │ ML  │  22 years experience | Dermatology           │  │
│  │ └─────┘  (Collapsed - click to expand)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⭐ 82% Match                                         │  │
│  │ ┌─────┐  Dr. Christopher Hernandez, MD               │  │
│  │ │ CH  │  15 years experience | Dermatology           │  │
│  │ └─────┘  (Collapsed - click to expand)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [← Back]                          [Next: Review →]        │
└─────────────────────────────────────────────────────────────┘
```

**Component: SchedulingStep2**

**Inputs:**
```javascript
{
  recommendations: [ /* API response above */ ],
  patientId: "198",
  specialtyName: "Dermatology"
}
```

**User Interaction:**
- MA clicks on a slot button, e.g., "Mon Dec 16, 8:00 AM"
- Slot highlights in blue
- "Next" button activates

**Outputs (selected slot):**
```javascript
{
  selectedSlot: {
    provider: {
      provider_id: 39,
      name: "Dr. Tina Johnson",
      credentials: "DO",
      npi: "6521218379",
      specialty: "Dermatology",
      years_experience: 5,
      languages: ["English", "Spanish"]
    },
    facility: {
      facility_id: 2,
      name: "Murray Medical Center",
      address: "2791 Alison Spring, Murray, UT 84123",
      city: "Murray",
      region: "Salt Lake Valley",
      phone: "801-315-6443"
    },
    appointmentDateTime: "2025-12-16T08:00:00",
    durationMinutes: 15,
    matchScore: 0.87
  }
}
```

**MA clicks: "Next: Review"**

---

### Step 3: Review & Confirm Booking

```
┌─────────────────────────────────────────────────────────────┐
│  [←] Schedule Appointment for Mary Johnson (198)            │
│                                                              │
│  ✓ Step 1: Specialty    ✓ Step 2: Provider    ● Step 3: Confirm│
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Review Appointment Details                                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👤 Patient Information                                │  │
│  │ ─────────────────────────────────────────────────────│  │
│  │ Name: Mary Johnson                                    │  │
│  │ Patient ID: 198                                       │  │
│  │ DOB: 03/15/1985 (Age 40)                             │  │
│  │ Phone: 801-555-0199                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👨‍⚕️ Provider & Location                               │  │
│  │ ─────────────────────────────────────────────────────│  │
│  │ Provider: Dr. Tina Johnson, DO                        │  │
│  │ Specialty: Dermatology                                │  │
│  │ Experience: 5 years                                   │  │
│  │                                                        │  │
│  │ Facility: Murray Medical Center                       │  │
│  │ Address: 2791 Alison Spring                           │  │
│  │          Murray, UT 84123                             │  │
│  │ Phone: 801-315-6443                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📅 Appointment Date & Time                            │  │
│  │ ─────────────────────────────────────────────────────│  │
│  │ Date: Monday, December 16, 2025                       │  │
│  │ Time: 8:00 AM                                         │  │
│  │ Duration: 15 minutes                                  │  │
│  │ Urgency: Non-Urgent                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Reason for Visit *                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Itchy skin rash on both arms (1 week duration)       │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  (Auto-filled from triage, editable)                        │
│                                                              │
│  Notes for Provider (optional)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Patient has tried OTC hydrocortisone cream with      │  │
│  │ minimal relief                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [← Back to Providers]              [Confirm Booking]      │
└─────────────────────────────────────────────────────────────┘
```

**Component: SchedulingStep3**

**Inputs:**
```javascript
{
  patient: {
    patientId: "198",
    name: "Mary Johnson",
    dob: "1985-03-15",
    age: 40,
    phone: "801-555-0199"
  },
  selectedSlot: {
    provider: {
      provider_id: 39,
      name: "Dr. Tina Johnson",
      credentials: "DO",
      specialty: "Dermatology",
      years_experience: 5
    },
    facility: {
      facility_id: 2,
      name: "Murray Medical Center",
      address: "2791 Alison Spring, Murray, UT 84123",
      phone: "801-315-6443"
    },
    appointmentDateTime: "2025-12-16T08:00:00",
    durationMinutes: 15
  },
  triageData: {
    priority: "non-urgent",
    extractedSymptoms: [
      { symptom: "skin rash", severity: "mild", duration: "1 week" },
      { symptom: "itching", severity: "moderate" }
    ]
  },
  specialtyId: 4
}
```

**Pre-filled Fields:**
```javascript
{
  reasonForVisit: "Itchy skin rash on both arms (1 week duration)",
  // Auto-generated from triage symptoms

  notes: ""  // Optional, MA can add
}
```

**When MA clicks "Confirm Booking":**

**API Call Made:**
```javascript
POST /api/v1/scheduling/book
{
  "provider_id": 39,
  "facility_id": 2,
  "specialty_id": 4,
  "patient_fhir_id": "198",
  "appointment_datetime": "2025-12-16T08:00:00",
  "duration_minutes": 15,
  "urgency": "non-urgent",
  "reason_for_visit": "Itchy skin rash on both arms (1 week duration)",
  "notes": "Patient has tried OTC hydrocortisone cream with minimal relief",
  "triage_session_id": "triage-2025-12-13-198-uuid"
}
```

**Loading State:**
```
┌─────────────────────────────────────────┐
│  ⏳ Booking Appointment...             │
│                                         │
│  [Circular progress spinner]            │
│                                         │
│  Please wait while we confirm your      │
│  appointment with Dr. Johnson...        │
└─────────────────────────────────────────┘
```

---

## Scene 6: Success! Appointment Booked

**API Response (Success):**
```javascript
{
  "success": true,
  "appointment_id": 1247,
  "confirmation_number": "APPT-2025-1247",
  "fhir_appointment_id": "fhir-appt-uuid-12345",
  "appointment_details": {
    "patient": "Mary Johnson (198)",
    "provider": "Dr. Tina Johnson, DO",
    "facility": "Murray Medical Center",
    "date": "2025-12-16",
    "time": "08:00 AM",
    "duration": "15 minutes"
  }
}
```

**Success Screen:**

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Appointment Confirmed!                                   │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          ✅ SUCCESS                                   │  │
│  │                                                        │  │
│  │  Appointment successfully scheduled for               │  │
│  │  Mary Johnson                                         │  │
│  │                                                        │  │
│  │  Confirmation Number: APPT-2025-1247                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📋 Appointment Summary                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Patient: Mary Johnson (ID: 198)                       │  │
│  │ Provider: Dr. Tina Johnson, DO                        │  │
│  │ Specialty: Dermatology                                │  │
│  │                                                        │  │
│  │ 📅 Date: Monday, December 16, 2025                    │  │
│  │ ⏰ Time: 8:00 AM - 8:15 AM                            │  │
│  │                                                        │  │
│  │ 📍 Location:                                          │  │
│  │ Murray Medical Center                                 │  │
│  │ 2791 Alison Spring                                    │  │
│  │ Murray, UT 84123                                      │  │
│  │ 📞 801-315-6443                                       │  │
│  │                                                        │  │
│  │ Reason: Itchy skin rash on both arms                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📝 Next Steps                                              │
│  • Patient should arrive 15 minutes early                   │
│  • Bring insurance card and ID                              │
│  • Bring list of current medications                        │
│  • Note any changes in symptoms                             │
│                                                              │
│  [📄 Print Confirmation]  [📧 Email to Patient]            │
│                                                              │
│  [← Back to Dashboard]    [Schedule Another Appointment]   │
└─────────────────────────────────────────────────────────────┘
```

**Component: BookingConfirmation**

**Inputs:**
```javascript
{
  success: true,
  appointmentId: 1247,
  confirmationNumber: "APPT-2025-1247",
  fhirAppointmentId: "fhir-appt-uuid-12345",
  appointmentDetails: {
    patient: {
      id: "198",
      name: "Mary Johnson"
    },
    provider: {
      name: "Dr. Tina Johnson",
      credentials: "DO",
      specialty: "Dermatology"
    },
    facility: {
      name: "Murray Medical Center",
      address: "2791 Alison Spring, Murray, UT 84123",
      phone: "801-315-6443"
    },
    dateTime: "2025-12-16T08:00:00",
    duration: 15,
    reason: "Itchy skin rash on both arms"
  }
}
```

**Outputs:**
```javascript
{
  onPrint: function() {
    // Generates printable confirmation
    window.print();
  },

  onEmail: function(email) {
    // Sends confirmation email
    POST /api/v1/appointments/1247/send-confirmation
    { "email": "mary.johnson@email.com" }
  },

  onBackToDashboard: function() {
    navigate('/dashboard');
  },

  onScheduleAnother: function() {
    navigate('/patient-search');
  }
}
```

---

## Scene 7: Error Handling - What if Slot is Taken?

**Scenario:** Another MA books the same slot just before you

**API Response (Conflict):**
```javascript
{
  "success": false,
  "code": 409,
  "error": "This appointment slot has already been booked by another patient. Please select a different time slot.",
  "available_alternative_slots": [
    "2025-12-16T10:30:00",
    "2025-12-17T09:00:00",
    "2025-12-18T14:00:00"
  ]
}
```

**Error Screen:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Booking Error                                            │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          ⚠️ SLOT UNAVAILABLE                          │  │
│  │                                                        │  │
│  │  Sorry, the 8:00 AM slot with Dr. Johnson has        │  │
│  │  already been booked by another patient.              │  │
│  │                                                        │  │
│  │  Please select an alternative time:                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📅 Alternative Slots with Dr. Tina Johnson:                │
│                                                              │
│  [Mon Dec 16, 10:30 AM] - Available                         │
│  [Tue Dec 17, 9:00 AM] - Available                          │
│  [Wed Dec 18, 2:00 PM] - Available                          │
│                                                              │
│  [← Back to Provider Selection]  [Select Alternative Slot] │
└─────────────────────────────────────────────────────────────┘
```

**Component Handling:**
```javascript
// In BookingConfirmation component
if (!response.success && response.code === 409) {
  setError({
    type: 'slot_conflict',
    message: response.error,
    alternativeSlots: response.available_alternative_slots
  });

  // Allow MA to select alternative without going back
}
```

---

## Complete Data Flow Summary

### Flow 1: Emergency Case
```
Patient Search → Select Patient → Triage Chat →
Enter Symptoms → Triage API → EMERGENCY Priority →
Show "Call 911" Alert → Block Scheduling →
MA Calls 911 → End
```

**Data Moving:**
```
PatientId: "232"
→ Symptoms: "chest pain radiating..."
→ Priority: "emergency"
→ Action: "call_911"
→ Scheduling: BLOCKED
```

### Flow 2: Routine Case (Complete Journey)
```
Patient Search → Select Patient → Triage Chat →
Enter Symptoms → Triage API → NON-URGENT Priority →
Enable Scheduling → Select Specialty → Find Providers →
API Returns 3 Providers → Select Slot → Review Details →
Confirm Booking → API Books Appointment →
Show Confirmation → Print/Email → End
```

**Data Moving:**
```
PatientId: "198"
→ Symptoms: "itchy rash..."
→ Priority: "non-urgent"
→ Specialty: "Dermatology" (ID: 4)
→ Region: "Salt Lake Valley"
→ API Returns: 3 providers with slots
→ Selected: Dr. Johnson, Dec 16, 8:00 AM
→ Book: POST /api/v1/scheduling/book
→ Response: {success: true, confirmationNumber: "APPT-2025-1247"}
→ Display confirmation
```

---

## All API Endpoints Used in Complete Flow

### 1. Patient Operations
```javascript
// Search patients
GET /api/v1/patients/search?q=jane%20doe

// Get patient details
GET /api/v1/patients/232

// Get patient history (full)
GET /api/v1/patients/232
```

### 2. Triage Operations
```javascript
// Perform triage
POST /api/v1/triage
{
  "message": "Patient reports...",
  "patient_id": "232"
}
```

### 3. Scheduling Operations
```javascript
// Get provider recommendations
POST /api/v1/scheduling/recommend
{
  "specialty_id": 4,
  "triage_priority": "non-urgent",
  "patient_region": "Salt Lake Valley",
  "preferred_date_range": {...}
}

// Book appointment
POST /api/v1/scheduling/book
{
  "provider_id": 39,
  "facility_id": 2,
  "patient_fhir_id": "198",
  "appointment_datetime": "2025-12-16T08:00:00",
  "urgency": "non-urgent",
  "reason_for_visit": "..."
}

// Search providers (alternative)
GET /api/v1/providers/search?specialty_id=4&region=Salt%20Lake%20Valley
```

### 4. Dashboard Operations
```javascript
// Get stats (future endpoint)
GET /api/v1/dashboard/stats

// Get recent activity (future endpoint)
GET /api/v1/dashboard/activity
```

---

## Component Relationships Diagram

```
App
├── AppShell (Layout)
│   ├── Header (AppBar)
│   ├── Sidebar (Drawer)
│   └── Footer
│
├── Router
│   ├── Dashboard
│   │   ├── StatCard × 4
│   │   ├── RecentActivityList
│   │   └── QuickActionButtons
│   │
│   ├── PatientSearch
│   │   ├── SearchBar
│   │   ├── PatientCard × N
│   │   └── RegisterPatientDialog
│   │
│   ├── TriageAssessment
│   │   ├── ChatInterface
│   │   │   ├── MessageBubble × N
│   │   │   └── InputField
│   │   │
│   │   ├── PatientInfoCard
│   │   │   ├── ConditionChip × N
│   │   │   ├── AllergyChip × N
│   │   │   └── MedicationChip × N
│   │   │
│   │   └── TriageResults
│   │       ├── PriorityBadge
│   │       ├── SymptomCard × N
│   │       ├── RedFlagsAlert
│   │       ├── RecommendationsAccordion
│   │       └── ScheduleButton
│   │
│   ├── SchedulingWorkflow
│   │   ├── Stepper
│   │   ├── Step1: SpecialtySelector
│   │   ├── Step2: ProviderSelection
│   │   │   ├── ProviderCard × N
│   │   │   │   ├── MatchScoreBadge
│   │   │   │   ├── SlotButton × N
│   │   │   │   └── ExpandButton
│   │   │   └── LoadingSpinner
│   │   │
│   │   └── Step3: BookingConfirmation
│   │       ├── SummaryTable
│   │       ├── ReasonField
│   │       └── ConfirmButton
│   │
│   ├── Appointments
│   │   ├── FilterBar
│   │   ├── AppointmentsTable
│   │   │   ├── StatusChip × N
│   │   │   └── ActionMenu × N
│   │   └── Pagination
│   │
│   └── Settings
│       ├── TabPanel × 3
│       └── PreferenceForm
│
└── Global Components
    ├── ConfirmDialog
    ├── ErrorAlert
    ├── SuccessSnackbar
    └── LoadingBackdrop
```

---

## That's the Complete Natural Flow!

Every component, every input, every output, from patient walking in to appointment booked. This is exactly how an MA interacts with the system, with all the data flowing naturally through each step.

**Want me to start building this now?** 🚀
