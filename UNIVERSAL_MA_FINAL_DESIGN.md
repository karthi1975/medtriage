# Universal MA Assistant - Multi-Specialty Design

## 🎯 MA Workflow: Select Specialty → Select Location → Chat & Schedule

---

## Scene 1: MA Login - Specialty & Location Selection

### Initial Screen (First Thing MA Sees)

```
┌─────────────────────────────────────────────────────────────────┐
│  [☰] MediChat MA Assistant          [👤 Sarah Martinez, MA]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│            Welcome Back, Sarah! 👋                              │
│                                                                  │
│  Select Your Clinic for Today                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Which specialty clinic are you working in today?               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🏥 Select Specialty *                                    │  │
│  │ ┌────────────────────────────────────────────────────┐ ▼│  │
│  │ │ Cardiology                                         │  │  │
│  │ └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │ All Available Specialties:                              │  │
│  │ • Family Medicine                (1)                    │  │
│  │ • Cardiology                     (2) ← Currently Selected│  │
│  │ • Orthopedics                    (3)                    │  │
│  │ • Dermatology                    (4)                    │  │
│  │ • Mental Health                  (5)                    │  │
│  │ • Neurology                      (6)                    │  │
│  │ • Gastroenterology               (7)                    │  │
│  │ • Pulmonology                    (8)                    │  │
│  │ • Endocrinology                  (9)                    │  │
│  │ • Nephrology                     (10)                   │  │
│  │ • Oncology                       (11)                   │  │
│  │ • Rheumatology                   (12)                   │  │
│  │ • Ophthalmology                  (13)                   │  │
│  │ • ENT                            (14)                   │  │
│  │ • Urology                        (15)                   │  │
│  │ • OB/GYN                         (16)                   │  │
│  │ • Pediatrics                     (17)                   │  │
│  │ • Geriatrics                     (18)                   │  │
│  │ • Infectious Disease             (19)                   │  │
│  │ • Hematology                     (20)                   │  │
│  │ • Pain Management                (21)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📍 Select Location *                                     │  │
│  │ ┌────────────────────────────────────────────────────┐ ▼│  │
│  │ │ Salt Lake Valley                                   │  │  │
│  │ └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │ Available Regions:                                       │  │
│  │ • Cache Valley                                          │  │
│  │ • Davis/Weber                                           │  │
│  │ • Salt Lake Valley               ← Currently Selected   │  │
│  │ • Uintah Basin                                          │  │
│  │ • Washington County                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ⚙️ Optional: Set Your Session Preferences                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ☑ Remember my clinic selection for today                │  │
│  │ ☐ Set as my default clinic                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│                                                                  │
│                    [Start My Session →]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Component: ClinicSessionSelector**

**Inputs (from MA profile):**
```javascript
{
  maProfile: {
    userId: "ma-sarah-001",
    name: "Sarah Martinez",
    role: "Medical Assistant",
    certifications: ["CMA", "BLS"],
    authorizedSpecialties: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      12, 13, 14, 15, 16, 17, 18, 19, 20, 21
    ],  // All specialties (or restricted list)
    defaultSpecialty: 2,  // Cardiology
    defaultRegion: "Salt Lake Valley",
    recentSessions: [
      {
        date: "2025-12-12",
        specialty: 2,
        specialtyName: "Cardiology",
        region: "Salt Lake Valley"
      },
      {
        date: "2025-12-11",
        specialty: 2,
        specialtyName: "Cardiology",
        region: "Salt Lake Valley"
      }
    ]
  },
  availableSpecialties: [
    { id: 1, name: "Family Medicine", icon: "👨‍⚕️" },
    { id: 2, name: "Cardiology", icon: "❤️" },
    { id: 3, name: "Orthopedics", icon: "🦴" },
    { id: 4, name: "Dermatology", icon: "🧴" },
    { id: 5, name: "Mental Health", icon: "🧠" },
    { id: 6, name: "Neurology", icon: "🧠" },
    { id: 7, name: "Gastroenterology", icon: "🫃" },
    { id: 8, name: "Pulmonology", icon: "🫁" },
    { id: 9, name: "Endocrinology", icon: "⚕️" },
    { id: 10, name: "Nephrology", icon: "🫘" },
    { id: 11, name: "Oncology", icon: "🎗️" },
    { id: 12, name: "Rheumatology", icon: "🦴" },
    { id: 13, name: "Ophthalmology", icon: "👁️" },
    { id: 14, name: "ENT", icon: "👂" },
    { id: 15, name: "Urology", icon: "⚕️" },
    { id: 16, name: "OB/GYN", icon: "👶" },
    { id: 17, name: "Pediatrics", icon: "👶" },
    { id: 18, name: "Geriatrics", icon: "👴" },
    { id: 19, name: "Infectious Disease", icon: "🦠" },
    { id: 20, name: "Hematology", icon: "🩸" },
    { id: 21, name: "Pain Management", icon: "💊" }
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

**Outputs (when MA clicks "Start My Session"):**
```javascript
{
  sessionConfig: {
    sessionId: "session-2025-12-13-sarah-001",
    maUserId: "ma-sarah-001",
    selectedSpecialty: {
      id: 2,
      name: "Cardiology",
      icon: "❤️"
    },
    selectedRegion: "Salt Lake Valley",
    startTime: "2025-12-13T08:00:00Z",
    rememberSession: true,
    setAsDefault: false
  },

  // System now loads specialty-specific data
  loadedData: {
    specialtyProtocols: "cardiology_protocols.json",
    providerPreferences: "providers_cardiology_slv.json",
    clinicRules: "clinic_rules_cardiology.json",
    calendar: "calendar_cardiology_slv_20251213.json"
  }
}

// Navigate to Dashboard with specialty context
navigate('/dashboard', { state: sessionConfig })
```

---

## Scene 2: Dashboard with Specialty Context

### What MA Sees After Selecting Cardiology + Salt Lake Valley

```
┌─────────────────────────────────────────────────────────────────┐
│ [☰] Cardiology Clinic - Salt Lake Valley    [🔍]  [👤 Sarah]   │
│     Change Clinic                                                │
├────┬────────────────────────────────────────────────────────────┤
│    │ ❤️ Cardiology Dashboard - Friday, Dec 13, 2025            │
│🏠  │                                                             │
│Dash│ Today's Providers On Duty:                                 │
│    │ • Dr. Alexander Mitchell (8 AM - 5 PM) - 6 appointments    │
│📅  │ • Dr. Daniel Mendoza (9 AM - 3 PM) - 4 appointments        │
│Cal │                                                             │
│    │ Quick Stats:                                               │
│👥  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│Pat │ │Today's  │ │Walk-Ins │ │Pending  │ │Urgent   │          │
│    │ │Appts    │ │Waiting  │ │Prep     │ │Cases    │          │
│💬  │ │   10    │ │    2    │ │    3    │ │    1    │          │
│Chat│ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│    │                                                             │
│📋  │ ⚠️ Urgent Attention (1)                                    │
│Prep│ ┌──────────────────────────────────────────────────────┐  │
│    │ │ 🔴 Jane Doe (232) - Chest pain, ECG completed       │  │
│⚙️  │ │    Normal ECG + troponin. Ready to schedule.        │ →│
│Set │ └──────────────────────────────────────────────────────┘  │
│    │                                                             │
│    │ Today's Schedule (Cardiology - Salt Lake Valley)          │
│    │ ┌────┬──────────┬──────────────┬────────────────────┐    │
│    │ │Time│Provider  │Patient       │Status              │    │
│    │ ├────┼──────────┼──────────────┼────────────────────┤    │
│    │ │8:00│Mitchell  │M. Lee        │✅ Ready - Checked In│→  │
│    │ │8:30│Mitchell  │J. Brown      │⏰ Waiting - 5 min   │→  │
│    │ │9:00│Mitchell  │[Open Slot]   │💡 Available         │→  │
│    │ │9:30│Mendoza   │K. White      │⚠️ Missing Lab Results│→  │
│    │ └────┴──────────┴──────────────┴────────────────────┘    │
│    │                                                             │
│    │ [➕ New Patient] [📅 View Full Calendar] [💬 Start Chat]  │
└────┴────────────────────────────────────────────────────────────┘
```

**Component: SpecialtyDashboard**

**Inputs:**
```javascript
{
  sessionConfig: {
    specialty: { id: 2, name: "Cardiology" },
    region: "Salt Lake Valley",
    date: "2025-12-13"
  },

  // Loaded from database
  todaysProviders: [
    {
      providerId: 15,
      name: "Dr. Alexander Mitchell",
      credentials: "DO",
      schedule: {
        start: "08:00",
        end: "17:00",
        appointmentCount: 6,
        openSlots: 3
      }
    },
    {
      providerId: 18,
      name: "Dr. Daniel Mendoza",
      credentials: "MD",
      schedule: {
        start: "09:00",
        end: "15:00",
        appointmentCount: 4,
        openSlots: 2
      }
    }
  ],

  todaysSchedule: [
    {
      time: "08:00",
      provider: "Dr. Mitchell",
      patient: {
        id: "145",
        name: "M. Lee",
        status: "checked_in",
        prepComplete: true
      }
    },
    {
      time: "08:30",
      provider: "Dr. Mitchell",
      patient: {
        id: "198",
        name: "J. Brown",
        status: "waiting",
        waitTime: 5,
        prepComplete: true
      }
    },
    {
      time: "09:00",
      provider: "Dr. Mitchell",
      patient: null,  // Open slot
      available: true
    },
    {
      time: "09:30",
      provider: "Dr. Mendoza",
      patient: {
        id: "201",
        name: "K. White",
        status: "scheduled",
        prepComplete: false,
        missingItems: ["Lipid panel results"]
      }
    }
  ],

  urgentCases: [
    {
      patientId: "232",
      patientName: "Jane Doe",
      issue: "Chest pain, ECG completed",
      status: "ready_to_schedule",
      priority: "urgent",
      triageData: { /* triage results */ }
    }
  ],

  stats: {
    todaysAppointments: 10,
    walkInsWaiting: 2,
    pendingPrep: 3,
    urgentCases: 1
  }
}
```

---

## Scene 3: MA Starts Chat with Patient

**MA clicks: "💬 Start Chat" or "New Patient"**

### Chat Interface with Specialty Context

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Back to Dashboard                                           │
│                                                                  │
│ ❤️ Cardiology Clinic Chat - New Patient                        │
│ ─────────────────────────────────────────────────────────────   │
├──────────────────────────────────┬──────────────────────────────┤
│ 💬 Patient Conversation          │ 📋 Cardiology Protocols      │
│                                  │                              │
│ ┌──────────────────────────────┐ │ Active Protocol: None       │
│ │ 🤖 Assistant:                │ │                              │
│ │ Hi! I'm the Cardiology       │ │ Common Cardiology Symptoms: │
│ │ Clinic assistant.            │ │ • Chest pain               │
│ │                              │ │ • Shortness of breath      │
│ │ Are you here for:            │ │ • Palpitations             │
│ │ • New symptoms?              │ │ • Dizziness/Syncope        │
│ │ • Follow-up visit?           │ │ • Leg swelling             │
│ │ • Test results discussion?   │ │                              │
│ │                              │ │ Dr. Mitchell's Preferences: │
│ │ Or just tell me what brings  │ │ • ECG before all chest pain│
│ │ you in today.                │ │ • Recent lipid panel req'd │
│ └──────────────────────────────┘ │ • 30 min new patient appts │
│                                  │                              │
│ [Quick Templates ▼]              │ Dr. Mendoza's Preferences:  │
│ • Chest Pain Protocol            │ • Stress test review: 20 min│
│ • Follow-up Appointment          │ • Echo results: 15 min      │
│ • Post-Procedure Check           │                              │
│                                  │                              │
│ ┌────────────────────────┐      │                              │
│ │ Type message or        │      │                              │
│ │ select template...     │ [📤]│                              │
│ └────────────────────────┘      │                              │
└──────────────────────────────────┴──────────────────────────────┘
```

**MA selects or types:** "Patient has chest pain for 2 days"

**System responds instantly with Cardiology protocol:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 💬 Patient Conversation          │ 🚨 CHEST PAIN PROTOCOL       │
│                                  │                              │
│ ┌──────────────────────────────┐ │ ┌──────────────────────────┐│
│ │ 👤 You (MA):                 │ │ │ PROTOCOL ACTIVATED       ││
│ │ Patient has chest pain for   │ │ │                          ││
│ │ 2 days                       │ │ │ Immediate Actions:       ││
│ └──────────────────────────────┘ │ │ 1. ✅ Vital signs       ││
│                                  │ │ 2. ✅ 12-lead ECG       ││
│ ┌──────────────────────────────┐ │ │ 3. ⏳ Troponin (if   ││
│ │ 🤖 Assistant:                │ │ │    available)            ││
│ │                              │ │ │                          ││
│ │ ⚠️ CHEST PAIN PROTOCOL       │ │ │ Pre-Appointment:        ││
│ │ ACTIVATED                    │ │ │ • Lipid panel           ││
│ │                              │ │ │ • BNP                    ││
│ │ I need to gather critical    │ │ │ • Echocardiogram        ││
│ │ information. Please answer:  │ │ │                          ││
│ │                              │ │ │ [Execute Protocol]       ││
│ │ 1. Is the patient             │ │ └──────────────────────────┘│
│ │    experiencing chest pain    │ │                              │
│ │    RIGHT NOW? (Y/N)           │ │ Calendar View:              │
│ │                              │ │ ┌──────────────────────────┐│
│ │ 2. How severe? (1-10)         │ │ │ Today's Open Slots:     ││
│ │                              │ │ │ • 9:00 AM (Mitchell)    ││
│ │ 3. Any radiation? (arm/jaw)   │ │ │ • 11:00 AM (Mitchell)   ││
│ │                              │ │ │ • 2:00 PM (Mendoza)     ││
│ │ 4. Shortness of breath? (Y/N) │ │ │                          ││
│ │                              │ │ │ Same-Day Urgent:        ││
│ │ 5. Sweating? (Y/N)            │ │ │ Available if needed     ││
│ └──────────────────────────────┘ │ └──────────────────────────┘│
│                                  │                              │
│ [Answer Questions] [Skip to ECG]│ [View Full Calendar]         │
└──────────────────────────────────┴──────────────────────────────┘
```

**MA answers questions in chat:**

```
MA: "Yes, patient has pain now. Severity 7/10. No radiation.
     Slight SOB. No sweating."
```

**System performs AI triage + shows calendar:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 💬 Conversation                  │ 🚨 TRIAGE: URGENT            │
│                                  │                              │
│ [Previous messages...]           │ Priority: URGENT ⚠️          │
│                                  │ Confidence: HIGH             │
│ ┌──────────────────────────────┐ │                              │
│ │ 🤖 Assessment Complete:      │ │ Recommended Action:         │
│ │                              │ │ • SAME-DAY appointment      │
│ │ Based on symptoms:           │ │ • Complete ECG + troponin   │
│ │ • Active chest pain (7/10)   │ │ • If abnormal → ER          │
│ │ • Shortness of breath        │ │                              │
│ │                              │ │ ┌──────────────────────────┐│
│ │ Recommendation:              │ │ │ 📅 SMART SCHEDULING:    ││
│ │ URGENT - Same-day cardiology │ │ │                          ││
│ │ evaluation needed            │ │ │ Recommended:             ││
│ │                              │ │ │ TODAY 2:00 PM           ││
│ │ Next steps:                  │ │ │ Dr. Mendoza             ││
│ │ 1. ✅ Order STAT ECG         │ │ │ (Available slot)         ││
│ │ 2. ✅ Order troponin         │ │ │                          ││
│ │ 3. 📅 Schedule same-day appt │ │ │ Alternative:            ││
│ │                              │ │ │ TOMORROW 8:00 AM        ││
│ │ [Execute Orders & Schedule]  │ │ │ Dr. Mitchell            ││
│ └──────────────────────────────┘ │ │                          ││
│                                  │ │ [Book 2PM Today]         ││
│                                  │ │ [Book 8AM Tomorrow]      ││
│                                  │ │ [See More Slots]         ││
│                                  │ └──────────────────────────┘│
└──────────────────────────────────┴──────────────────────────────┘
```

**MA clicks: "Book 2PM Today"**

---

## Scene 4: Integrated Calendar with Smart Booking

### Calendar View with Provider Preferences Applied

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] 📅 Cardiology Calendar - Salt Lake Valley                  │
│     Week of December 13-19, 2025                                │
│ ─────────────────────────────────────────────────────────────   │
│                                                                  │
│ Provider: [Dr. Mitchell ▼] [Dr. Mendoza ▼] [All Providers]     │
│ View: [Day] [Week] [Month]    Date: [Dec 13 ▼]                 │
│                                                                  │
│        Dr. Mitchell              Dr. Mendoza                     │
│ ┌──────┬─────────────────────┬─────────────────────────┐       │
│ │ Time │ Friday 12/13        │ Friday 12/13            │       │
│ ├──────┼─────────────────────┼─────────────────────────┤       │
│ │ 8:00 │ M. Lee (232)        │ [Not in clinic]         │       │
│ │      │ ✅ Follow-up - 15min│                         │       │
│ │      │ [View] [Modify]     │                         │       │
│ ├──────┼─────────────────────┼─────────────────────────┤       │
│ │ 8:30 │ J. Brown (198)      │                         │       │
│ │      │ ⏰ Waiting now      │                         │       │
│ │      │ [Check In]          │                         │       │
│ ├──────┼─────────────────────┼─────────────────────────┤       │
│ │ 9:00 │ 💡 AVAILABLE        │ [Clinic opens at 9 AM]  │       │
│ │      │ 15 min slot         │                         │       │
│ │      │ [Book]              │                         │       │
│ ├──────┼─────────────────────┼─────────────────────────┤       │
│ │ 9:30 │ 💡 AVAILABLE        │ K. White (201)          │       │
│ │      │ 30 min slot         │ ⚠️ Missing lab results  │       │
│ │      │ [Book]              │ [Chase Labs] [Reschedule]│      │
│ ├──────┼─────────────────────┼─────────────────────────┤       │
│ │10:00 │ BLOCKED             │ 💡 AVAILABLE            │       │
│ │      │ (Dr. preference:    │ 20 min slot             │       │
│ │      │  admin time)        │ [Book]                  │       │
│ ├──────┼─────────────────────┼─────────────────────────┤       │
│ │...   │ ...                 │ ...                     │       │
│ ├──────┼─────────────────────┼─────────────────────────┤       │
│ │ 2:00 │ 💡 AVAILABLE        │ 💡 AVAILABLE ⭐         │       │
│ │      │ 30 min slot         │ 20 min slot             │       │
│ │      │ [Book]              │ [RECOMMENDED FOR URGENT]│       │
│ │      │                     │ [Book This Slot →]      │       │
│ └──────┴─────────────────────┴─────────────────────────┘       │
│                                                                  │
│ Legend:                                                         │
│ ✅ Scheduled | ⏰ Checked In | ⚠️ Issues | 💡 Available        │
│ ⭐ Recommended for current patient                              │
│                                                                  │
│ [Export Calendar] [Print Schedule] [Sync with EMR]             │
└─────────────────────────────────────────────────────────────────┘
```

**When MA clicks "Book This Slot →" at 2:00 PM with Dr. Mendoza:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Confirm Appointment Booking                                 │
│ ─────────────────────────────────────────────────────────────   │
│                                                                  │
│ ✅ Booking Appointment                                          │
│                                                                  │
│ Patient: Jane Doe (ID: 232)                                     │
│ Provider: Dr. Daniel Mendoza, MD                                │
│ Date/Time: Friday, December 13, 2025 at 2:00 PM                │
│ Duration: 20 minutes (Urgent chest pain - same day)             │
│ Specialty: Cardiology                                           │
│ Location: Cardiology Clinic - Salt Lake Valley                  │
│ Urgency: URGENT                                                 │
│                                                                  │
│ ⚠️ Pre-Appointment Requirements:                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Dr. Mendoza requires before appointment:                 │   │
│ │ ☑ ECG - Ordered (results by 1:30 PM)                    │   │
│ │ ☑ Troponin - Ordered (results by 1:30 PM)               │   │
│ │ ☐ Lipid panel - Will order for patient to do tomorrow   │   │
│ │                                                          │   │
│ │ ✅ All urgent requirements will be met before 2 PM      │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Reason for Visit:                                               │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Chest pain (7/10 severity), 2 days duration, active now │   │
│ │ with shortness of breath. URGENT evaluation needed.     │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Patient Will Receive:                                           │
│ • SMS confirmation with appointment details                      │
│ • Instructions to wait for ECG/lab results                       │
│ • What to bring to appointment                                   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ ⏰ TIMELINE:                                              │   │
│ │ Now (10:30 AM): Book appointment                         │   │
│ │ 11:00 AM: Complete ECG                                   │   │
│ │ 11:15 AM: Complete troponin draw                         │   │
│ │ 1:30 PM: Results available for review                    │   │
│ │ 2:00 PM: Appointment with Dr. Mendoza                    │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ [← Cancel]                 [✅ Confirm & Book Appointment]      │
└─────────────────────────────────────────────────────────────────┘
```

**After booking:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ APPOINTMENT BOOKED SUCCESSFULLY                               │
│                                                                  │
│ Confirmation #: CARDIO-2025-1213-001                            │
│                                                                  │
│ Patient: Jane Doe (232)                                         │
│ Provider: Dr. Mendoza                                           │
│ Time: TODAY at 2:00 PM                                          │
│                                                                  │
│ 📋 Next Actions for MA:                                         │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ ☐ Send patient to ECG room (Now)                        │   │
│ │ ☐ Order troponin at lab (11:15 AM)                      │   │
│ │ ☐ Review results when ready (1:30 PM)                   │   │
│ │ ☐ Alert Dr. Mendoza if abnormal results                 │   │
│ │ ☐ Check patient in at 1:45 PM                           │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Patient notification sent: ✓ SMS, ✓ Email                      │
│                                                                  │
│ [📄 Print Appointment Slip] [📧 Resend Confirmation]           │
│ [← Back to Dashboard] [Schedule Another Patient]               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Data Flow

### 1. Session Start
```javascript
MA Login
→ Select Specialty (e.g., Cardiology)
→ Select Region (e.g., Salt Lake Valley)
→ System loads:
  - Cardiology protocols
  - Providers in that region
  - Today's schedule
  - Provider preferences from tribal DB
  - Calendar availability
```

### 2. Patient Intake via Chat
```javascript
MA starts chat
→ Describes symptoms: "chest pain"
→ System activates Chest Pain Protocol
→ Asks clarifying questions
→ Performs AI triage
→ Determines urgency: URGENT
→ Shows recommended appointment slots
```

### 3. Smart Scheduling
```javascript
System analyzes:
  - Urgency: URGENT (same-day needed)
  - Specialty: Cardiology
  - Provider availability in Salt Lake Valley
  - Provider preferences (Dr. Mendoza: 20 min urgent slots)
  - Pre-appointment tests needed
  - Calendar: Shows 2PM slot available
→ Recommends: Book 2PM with Dr. Mendoza
→ Generates timeline with test completion
→ MA confirms
→ Appointment booked
→ Orders sent to lab/ECG
→ Patient notified
```

---

## Key Features

### Multi-Specialty Support
- MA selects specialty at session start
- Each specialty has custom protocols
- Specialty-specific quick templates
- Provider preferences per specialty

### Smart Calendar Integration
- Real-time availability
- Provider preferences applied
- Urgent slots highlighted
- Test completion deadlines shown
- Auto-booking when criteria met

### Clinical Intelligence
- Protocol activation based on symptoms
- Specialty-specific workflows
- Doctor preference integration
- Pre-appointment test ordering
- Timeline management

### Universal Workflow
```
ANY SPECIALTY:
Select Clinic → Chat with Patient → AI Triage →
Smart Calendar → Book Appointment → Order Tests →
Track Workflow → Appointment Ready
```

---

## This Works for ALL 21 Specialties!

**Same interface, specialty-aware:**
- **Cardiology**: Chest pain protocol, ECG, stress tests
- **Orthopedics**: X-rays, MRI for fractures
- **Dermatology**: Photo documentation, biopsy scheduling
- **Mental Health**: Screening questionnaires, longer appointments
- **Oncology**: Chemo appointments, lab monitoring
- **OB/GYN**: Prenatal visits, ultrasound scheduling
- **Pediatrics**: Growth charts, vaccination schedules
- etc.

**Ready to build this universal MA assistant?** 🚀
