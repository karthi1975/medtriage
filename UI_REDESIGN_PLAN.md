# MediChat MA Scheduling UI - Google Material Design Implementation Plan

## Executive Summary

**Objective:** Rebuild the Medical Assistant (MA) appointment scheduling interface using Google-style Material UI design principles with TypeScript, React, and MUI v5.

**Current State:**
- Basic React app with custom CSS
- Chat interface for symptom triage
- Simple scheduling panel
- No Material UI components

**Target State:**
- Professional Google-style Material UI interface
- TypeScript for type safety
- Complete MA workflow from patient intake → triage → scheduling → confirmation
- Responsive design (desktop, tablet, mobile)
- High accessibility standards (WCAG 2.1 AA)

---

## Part 1: Technical Architecture

### Tech Stack
```
Frontend Framework: React 18.2 + TypeScript
UI Library: Material UI (MUI) v5
Routing: React Router v6
State Management: React Context API + useState/useReducer
HTTP Client: Axios (existing)
Build Tool: Vite (migrate from Create React App for better performance)
```

### Project Structure
```
frontend-new/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme/
│   │   ├── index.ts                 # MUI theme configuration
│   │   └── components.ts            # Component overrides
│   ├── layout/
│   │   ├── AppShell.tsx             # Main layout with AppBar + Drawer
│   │   ├── Header.tsx               # Top app bar
│   │   ├── Sidebar.tsx              # Left navigation drawer
│   │   └── Footer.tsx               # Footer with disclaimer
│   ├── pages/
│   │   ├── Dashboard.tsx            # MA dashboard (overview)
│   │   ├── PatientIntake.tsx        # New patient / search patient
│   │   ├── TriageAssessment.tsx     # Symptom collection + triage
│   │   ├── SchedulingWorkflow.tsx   # Multi-step scheduling
│   │   ├── Appointments.tsx         # View/manage appointments
│   │   └── Settings.tsx             # System settings
│   ├── components/
│   │   ├── triage/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── TriageResults.tsx
│   │   │   └── SymptomCard.tsx
│   │   ├── scheduling/
│   │   │   ├── ProviderSearch.tsx
│   │   │   ├── SlotSelector.tsx
│   │   │   ├── AppointmentCard.tsx
│   │   │   └── BookingConfirmation.tsx
│   │   ├── patient/
│   │   │   ├── PatientSearch.tsx
│   │   │   ├── PatientInfoCard.tsx
│   │   │   └── PatientHistory.tsx
│   │   ├── common/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── tables/
│   │       └── AppointmentsTable.tsx
│   ├── services/
│   │   ├── api.ts                   # API client (updated)
│   │   └── types.ts                 # TypeScript types
│   ├── hooks/
│   │   ├── usePatient.ts
│   │   ├── useTriage.ts
│   │   └── useScheduling.ts
│   ├── context/
│   │   └── WorkflowContext.tsx      # MA workflow state
│   └── utils/
│       ├── formatters.ts
│       └── validators.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## Part 2: Google Material Design Specification

### Color Palette (Healthcare-Optimized)
```typescript
Primary: #1A73E8       // Google Blue (trust, professionalism)
Secondary: #34A853     // Medical Green (health, safety)
Error: #EA4335         // Red for emergencies
Warning: #FBBC04       // Amber for urgent cases
Success: #34A853       // Green for confirmations
Info: #4285F4          // Light blue for info

Background: #F8FAFD    // Soft off-white
Surface: #FFFFFF       // Pure white for cards
Divider: rgba(60,64,67,0.12)

Priority Colors:
- Emergency: #DC3545
- Urgent: #FD7E14
- Semi-urgent: #FFC107
- Non-urgent: #28A745
```

### Typography Scale
```typescript
h4: 32px/40px  // Page titles
h5: 24px/32px  // Section headers
h6: 20px/28px  // Card titles
subtitle1: 16px/24px (500 weight)  // Subsections
body1: 16px/24px  // Main content
body2: 14px/20px  // Secondary text
caption: 12px/16px  // Helper text
button: 14px uppercase: none  // Buttons
```

### Spacing System (8px grid)
```typescript
spacing(1) = 8px
spacing(2) = 16px
spacing(3) = 24px   // Default page padding
spacing(4) = 32px
spacing(6) = 48px   // Section gaps
```

### Component Styling Rules
```typescript
Buttons:
- Primary: Pill shape (borderRadius: 999px), elevation 0
- Secondary: Outlined, rounded corners (8px)
- Text: No background, subtle hover

Cards:
- borderRadius: 12px
- elevation: 0 or 1 max
- border: 1px solid divider
- padding: spacing(3)

Inputs:
- borderRadius: 8px
- Subtle border, strong focus ring
- Helper text below

AppBar:
- White background
- No shadow
- Bottom border only (1px divider)
- Height: 64px

Drawer:
- Width: 264px
- White background
- Selected item: primary.main with 8% opacity background
```

---

## Part 3: MA Workflow Pages (Detailed Specs)

### Page 1: Dashboard (Home)
**Route:** `/`
**Purpose:** MA landing page with overview and quick actions

**Layout:**
```
┌─────────────────────────────────────────────┐
│  App Bar: MediChat MA | Search | Avatar     │
├────┬────────────────────────────────────────┤
│Nav │  Dashboard                             │
│    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│    │  │Active││Pending││Today's││Wait  │ │
│    │  │Pts:12││Triage││Appts │ │Time  │ │
│Dra-│  │      ││  8   ││  24  ││15min │ │
│wer │  └──────┘ └──────┘ └──────┘ └──────┘ │
│    │                                        │
│    │  Recent Activity                       │
│    │  ┌────────────────────────────────┐   │
│    │  │ Patient 232 - Triage Complete  │   │
│    │  │ Patient 145 - Appt Scheduled   │   │
│    │  └────────────────────────────────┘   │
│    │                                        │
│    │  Quick Actions                         │
│    │  [+ New Triage] [📅 Schedule Appt]   │
└────┴────────────────────────────────────────┘
```

**Components:**
1. **StatCards** (4 cards)
   - Active Patients count
   - Pending Triage count
   - Today's Appointments count
   - Average Wait Time

2. **Recent Activity List** (MUI List)
   - Last 5 triage assessments
   - Last 5 appointments scheduled
   - Clickable to view details

3. **Quick Action Buttons**
   - "New Triage" → Opens patient search dialog
   - "Schedule Appointment" → Direct to scheduling

**Data Displayed:**
- Real-time stats from backend
- Activity feed (mock data initially)

---

### Page 2: Patient Intake & Search
**Route:** `/patient-search`
**Purpose:** Find or register patient before triage

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Patient Lookup                              │
│  ────────────────────────────────────────    │
│                                               │
│  Search by Patient ID or Name                │
│  ┌──────────────────────────────────┐  [Go] │
│  │ 🔍 Enter patient ID or name...   │        │
│  └──────────────────────────────────┘        │
│                                               │
│  Recent Patients                              │
│  ┌─────────────────────────────────────┐    │
│  │ ID: 232 | Jane Doe | DOB: 1966-12-13│ →  │
│  │ ID: 145 | John Smith | DOB: 1980-... │ →  │
│  └─────────────────────────────────────┘    │
│                                               │
│  [+ Register New Patient]                    │
└──────────────────────────────────────────────┘
```

**Components:**
1. **SearchBar**
   - MUI TextField with search icon
   - Autocomplete suggestions
   - Debounced search (300ms)

2. **PatientCard** (in list)
   - Patient ID, Name, DOB, Gender
   - Quick view button
   - Select button → Start Triage

3. **RegisterPatientDialog**
   - Modal form for new patient registration
   - Fields: Name, DOB, Gender, Contact
   - Validates required fields

**Workflow:**
1. MA searches for patient
2. Select existing patient OR register new
3. Click "Start Triage" → Navigate to Triage page

---

### Page 3: Triage Assessment
**Route:** `/triage/:patientId`
**Purpose:** Symptom collection and AI triage assessment

**Layout (Two-Column):**
```
┌───────────────────┬──────────────────────────┐
│  Chat Interface   │  Patient Info            │
│                   │  ┌──────────────────────┐│
│  ┌──────────────┐│  │ Jane Doe (232)       ││
│  │Assistant: Hi!││  │ F, 59 years old      ││
│  │How can I...  ││  │                      ││
│  └──────────────┘│  │ Known Conditions:    ││
│                   │  │ • Hypertension       ││
│  ┌──────────────┐│  │ • Diabetes Type 2    ││
│  │You: I have   ││  │                      ││
│  │chest pain... ││  │ Allergies:           ││
│  └──────────────┘│  │ • Penicillin         ││
│                   │  └──────────────────────┘│
│  ┌─────────────┐ │                          │
│  │Type message │ │  Triage Results          │
│  └─────────────┘ │  (appears after submit)  │
│  [Send] [Clear]  │                          │
├───────────────────┴──────────────────────────┤
│  [← Back] [Schedule Appointment →]          │
└──────────────────────────────────────────────┘
```

**Components:**
1. **ChatInterface** (Left Panel)
   - MUI Paper with messages
   - Scrollable message list
   - User/Assistant message bubbles (different colors)
   - Input field at bottom (MUI TextField + IconButton)
   - Loading indicator during triage

2. **PatientInfoCard** (Right Panel - Top)
   - MUI Card with patient demographics
   - Known conditions (MUI Chip array)
   - Known allergies (warning color chips)
   - Compact, always visible

3. **TriageResults** (Right Panel - Bottom)
   - Only appears after triage assessment
   - Priority badge (large, color-coded)
   - Confidence meter (MUI LinearProgress styled)
   - Symptoms list (MUI List with icons)
   - Red flags (Alert component, error color)
   - Recommendations (Accordion component)
   - Warning signs (Expandable section)

**Workflow:**
1. MA enters patient symptoms in chat
2. AI responds with clarifying questions (optional)
3. MA submits for triage
4. Results appear in right panel
5. "Schedule Appointment" button appears if priority ≠ emergency
6. Emergency: Shows "Call 911" banner, blocks scheduling

---

### Page 4: Scheduling Workflow (Multi-Step)
**Route:** `/scheduling/:patientId/:triageId`
**Purpose:** Find providers and schedule appointment

**Multi-Step Form (MUI Stepper):**

**Step 1: Select Specialty & Region**
```
┌──────────────────────────────────────────────┐
│  Schedule Appointment                        │
│  ● Select Specialty  ○ Choose Provider ...  │
│  ────────────────────────────────────────    │
│                                               │
│  Based on triage: Cardiology (recommended)   │
│                                               │
│  Specialty *                                  │
│  ┌──────────────────────────────────┐       │
│  │ Cardiology                     ▼│        │
│  └──────────────────────────────────┘       │
│                                               │
│  Preferred Region                             │
│  ┌──────────────────────────────────┐       │
│  │ Salt Lake Valley               ▼│        │
│  └──────────────────────────────────┘       │
│                                               │
│  Urgency: Urgent (from triage)               │
│                                               │
│  [Cancel] [Next →]                           │
└──────────────────────────────────────────────┘
```

**Step 2: Provider & Slot Selection**
```
┌──────────────────────────────────────────────┐
│  Schedule Appointment                        │
│  ✓ Select Specialty  ● Choose Provider ...  │
│  ────────────────────────────────────────    │
│                                               │
│  Top Recommended Providers                   │
│                                               │
│  ┌────────────────────────────────────────┐ │
│  │ ⭐ Dr. Alexander Mitchell, DO          │ │
│  │ 17 years experience | Cardiology        │ │
│  │ Murray Medical Center                   │ │
│  │ 📍 Salt Lake Valley | 🗣 EN, ES, ZH    │ │
│  │                                         │ │
│  │ Available Slots:                        │ │
│  │ [Dec 15, 8:00 AM] [Dec 15, 10:30 AM]  │ │
│  │ [Dec 16, 9:00 AM] ...                  │ │
│  └────────────────────────────────────────┘ │
│                                               │
│  ┌────────────────────────────────────────┐ │
│  │ Dr. Daniel Mendoza, MD                 │ │
│  │ 25 years experience | Cardiology        │ │
│  │ ...                                     │ │
│  └────────────────────────────────────────┘ │
│                                               │
│  [← Back] [Next →]                           │
└──────────────────────────────────────────────┘
```

**Step 3: Confirmation & Booking**
```
┌──────────────────────────────────────────────┐
│  Schedule Appointment                        │
│  ✓ Select Specialty  ✓ Choose Provider ...  │
│  ────────────────────────────────────────    │
│                                               │
│  Review & Confirm                            │
│                                               │
│  Patient: Jane Doe (ID: 232)                 │
│  Provider: Dr. Alexander Mitchell, DO        │
│  Specialty: Cardiology                        │
│  Date & Time: Dec 15, 2025 at 8:00 AM       │
│  Location: Murray Medical Center             │
│  Address: 2791 Alison Spring, Murray, UT    │
│                                               │
│  Reason for Visit:                           │
│  ┌──────────────────────────────────────┐   │
│  │ Chest pain evaluation (urgent)       │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  [← Back] [Confirm Booking]                  │
└──────────────────────────────────────────────┘
```

**Components:**
1. **MUI Stepper** (top)
   - 3 steps with labels
   - Shows progress

2. **SpecialtySelector** (Step 1)
   - MUI Select dropdown
   - Pre-filled from triage
   - All 21 specialties available

3. **RegionSelector** (Step 1)
   - MUI Select dropdown
   - 5 Utah regions

4. **ProviderCard** (Step 2)
   - MUI Card for each provider
   - Match score badge (circular progress)
   - Experience chips
   - Languages chips
   - Slot buttons (MUI Chip clickable)
   - Expandable for more slots

5. **BookingConfirmation** (Step 3)
   - Summary table (MUI Table or List)
   - Editable reason field
   - Loading state during booking
   - Success/Error feedback

**Workflow:**
1. Step 1: Select specialty & region → Load recommendations
2. Step 2: Browse providers → Select slot → Highlight selection
3. Step 3: Review details → Confirm → Book appointment
4. Success: Show confirmation number, option to print/email
5. Error: Show error message, retry button

---

### Page 5: Appointments Management
**Route:** `/appointments`
**Purpose:** View and manage scheduled appointments

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Appointments                [+ New Appt]    │
│  ────────────────────────────────────────    │
│                                               │
│  Filters: [Today] [This Week] [All]          │
│  Search: [🔍 Patient name or ID...]          │
│                                               │
│  ┌────────────────────────────────────────┐ │
│  │ Time     Patient   Provider   Status   │ │
│  ├────────────────────────────────────────┤ │
│  │ 8:00 AM  Jane Doe  Dr. Mitchell ✓ Conf││ │
│  │ 10:30AM  John Doe  Dr. Sanchez  ⏱ Pend││ │
│  │ 2:00 PM  Mary Lee  Dr. Chen     ⏱ Pend││ │
│  └────────────────────────────────────────┘ │
│                                               │
│  Pagination: [< 1 2 3 >]                     │
└──────────────────────────────────────────────┘
```

**Components:**
1. **AppointmentsTable**
   - MUI DataGrid or Table with sticky header
   - Sortable columns
   - Row actions menu (View, Reschedule, Cancel)
   - Status chips (color-coded)
   - Pagination

2. **FilterBar**
   - MUI ToggleButtonGroup for quick filters
   - Date range picker (MUI DatePicker)

3. **AppointmentDetailsDialog**
   - Modal with full appointment details
   - Print button, Cancel button

---

### Page 6: Settings
**Route:** `/settings`
**Purpose:** System configuration

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Settings                                    │
│  ────────────────────────────────────────    │
│                                               │
│  Tabs: [General] [Preferences] [About]       │
│                                               │
│  Default Region                               │
│  ┌──────────────────────────────────┐       │
│  │ Salt Lake Valley               ▼│        │
│  └──────────────────────────────────┘       │
│                                               │
│  Theme                                        │
│  ○ Light  ○ Dark  ● Auto                    │
│                                               │
│  [Save Changes]                              │
└──────────────────────────────────────────────┘
```

---

## Part 4: Navigation Structure

### App Bar (Top)
```
┌─────────────────────────────────────────────────┐
│ ☰ MediChat MA        🔍 Search...  ⚙️ 👤 Admin│
└─────────────────────────────────────────────────┘
```

**Left:**
- Hamburger menu (mobile drawer toggle)
- App logo + name

**Center:**
- Global search bar (search patients)

**Right:**
- Help icon (links to docs)
- Settings icon
- User avatar menu (logout, profile)

### Sidebar Navigation (Desktop Permanent, Mobile Temporary)
```
┌─────────────────┐
│ 🏠 Dashboard    │
│ 🔍 Patients     │
│ 📋 Triage       │
│ 📅 Appointments │
│ ⚙️ Settings     │
│                 │
│ ─────────────   │
│ API Status: ✓   │
└─────────────────┘
```

**Navigation Items:**
1. Dashboard (/)
2. Patient Search (/patient-search)
3. New Triage (/triage/new)
4. Appointments (/appointments)
5. Settings (/settings)

**Bottom Section:**
- API connection status
- Current user info

---

## Part 5: Responsive Design Breakpoints

```typescript
Mobile: 0-599px
  - Temporary drawer (hamburger)
  - Single column layouts
  - Full-width cards
  - Stacked chat interface

Tablet: 600-959px
  - Temporary drawer
  - 2-column grids
  - Side-by-side chat (portrait) or stacked (landscape)

Desktop: 960px+
  - Permanent drawer (264px)
  - 3-4 column grids for stat cards
  - Side-by-side chat + results
  - Max content width: 1200px
```

---

## Part 6: Accessibility Requirements

**Keyboard Navigation:**
- All interactive elements tab-accessible
- Drawer items: Tab → Enter to select
- Dialogs: Escape to close, Tab to navigate
- Forms: Tab order logical

**Screen Reader:**
- All IconButtons have aria-label
- Status changes announced
- Form validation errors read aloud
- Loading states announced

**Color Contrast:**
- WCAG AA compliant (4.5:1 text, 3:1 UI)
- Don't rely on color alone (use icons + text)
- Priority badges have icons + text

**Focus Indicators:**
- Visible focus ring on all interactive elements
- Focus trap in dialogs
- Skip to main content link

---

## Part 7: Implementation Phases

### Phase 1: Foundation (Week 1)
**Deliverables:**
- [ ] Migrate to Vite + TypeScript
- [ ] Install MUI v5 dependencies
- [ ] Create theme configuration (theme/index.ts)
- [ ] Build AppShell layout (Header + Drawer + Footer)
- [ ] Set up routing (react-router-dom v6)
- [ ] Create base page templates

**Files to Create:**
- package.json (updated)
- tsconfig.json
- vite.config.ts
- src/theme/index.ts
- src/layout/AppShell.tsx
- src/App.tsx

---

### Phase 2: Dashboard & Patient Search (Week 2)
**Deliverables:**
- [ ] Dashboard page with stat cards
- [ ] Patient search page
- [ ] Patient info card component
- [ ] Search bar component
- [ ] Recent activity list

**Components:**
- Dashboard.tsx
- PatientSearch.tsx
- StatCard.tsx
- SearchBar.tsx
- PatientInfoCard.tsx

---

### Phase 3: Triage Interface (Week 3)
**Deliverables:**
- [ ] Chat interface with MUI styling
- [ ] Patient context card (right panel)
- [ ] Triage results display
- [ ] Priority badges
- [ ] Symptom cards
- [ ] Red flags alerts

**Components:**
- TriageAssessment.tsx
- ChatInterface.tsx
- TriageResults.tsx
- SymptomCard.tsx
- PriorityBadge.tsx

---

### Phase 4: Scheduling Workflow (Week 4)
**Deliverables:**
- [ ] Multi-step stepper
- [ ] Specialty selector
- [ ] Provider cards with slot selection
- [ ] Booking confirmation
- [ ] Success/error handling

**Components:**
- SchedulingWorkflow.tsx
- ProviderCard.tsx
- SlotSelector.tsx
- BookingConfirmation.tsx
- ConfirmDialog.tsx

---

### Phase 5: Appointments & Settings (Week 5)
**Deliverables:**
- [ ] Appointments table with filters
- [ ] Appointment details dialog
- [ ] Settings page
- [ ] User preferences

**Components:**
- Appointments.tsx
- AppointmentsTable.tsx
- AppointmentDetailsDialog.tsx
- Settings.tsx

---

### Phase 6: Testing & Polish (Week 6)
**Deliverables:**
- [ ] Accessibility audit
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Error handling review
- [ ] User acceptance testing

---

## Part 8: Dependencies to Install

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@mui/material": "^5.14.20",
    "@mui/icons-material": "^5.14.19",
    "@mui/x-date-pickers": "^6.18.5",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/node": "^20.10.4",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

---

## Part 9: Success Criteria

### Functional Requirements ✓
- [ ] MA can search and select patients
- [ ] MA can perform triage assessments via chat
- [ ] System displays AI triage results with priority
- [ ] MA can schedule appointments based on triage
- [ ] System shows provider recommendations with tribal knowledge
- [ ] MA can view and manage appointments
- [ ] Emergency cases block scheduling and show warning

### UX Requirements ✓
- [ ] Google Material Design look and feel
- [ ] Intuitive navigation (≤3 clicks to any page)
- [ ] Fast page loads (<2 seconds)
- [ ] Smooth transitions and animations
- [ ] Clear error messages with recovery actions
- [ ] Loading states for all async operations

### Technical Requirements ✓
- [ ] TypeScript with no 'any' types
- [ ] MUI components only (no custom CSS except theme)
- [ ] Responsive: works on mobile, tablet, desktop
- [ ] Accessible: WCAG 2.1 AA compliant
- [ ] Clean code: ESLint passing, no console errors
- [ ] Production build: <500KB initial bundle

---

## Part 10: Risk Mitigation

**Risk 1: Migration Complexity**
- Mitigation: Keep old frontend running, build new in parallel
- Cutover: Use feature flag or separate deployment

**Risk 2: Learning Curve (TypeScript + MUI)**
- Mitigation: Start with simple components, iterate
- Resource: MUI documentation, TypeScript handbook

**Risk 3: API Integration Changes**
- Mitigation: Maintain backward compatibility
- Strategy: Update API types, add error handling

**Risk 4: Performance with Large Data**
- Mitigation: Implement pagination, virtualization
- Tool: React Virtualized for large lists

---

## Part 11: Quick Start Commands

```bash
# Create new frontend directory
mkdir frontend-new
cd frontend-new

# Initialize Vite project
npm create vite@latest . -- --template react-ts

# Install MUI and dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @mui/x-date-pickers
npm install react-router-dom axios date-fns

# Install dev dependencies
npm install -D @types/node

# Start development server
npm run dev
```

---

## Questions for Approval

Before I begin implementation, please confirm:

1. **Scope:** Do you want me to rebuild the entire frontend, or just specific pages first?
   - Option A: Full rebuild (all 6 pages) - Recommended
   - Option B: Phased approach (start with Dashboard + Triage only)

2. **Tech Stack:** Approve migration to Vite + TypeScript?
   - Vite is faster than Create React App
   - TypeScript adds type safety

3. **Design Customization:** Any specific branding requirements?
   - Colors: Use healthcare green/blue or different palette?
   - Logo: Do you have a logo to include?

4. **Features Priority:** Most important workflow to get right?
   - A: Triage assessment
   - B: Appointment scheduling
   - C: Patient search

5. **Timeline:** What's your target completion date?
   - Full implementation: ~6 weeks
   - MVP (Dashboard + Triage + Scheduling): ~3 weeks

6. **Deployment:** Keep old frontend running during development?
   - Yes (recommended) - deploy new frontend to different path
   - No - replace immediately

---

## Next Steps After Approval

1. I'll create the project structure
2. Set up MUI theme with Google colors
3. Build AppShell layout
4. Implement pages one by one (Dashboard → Triage → Scheduling)
5. Test responsiveness and accessibility
6. Deploy and cutover

**Ready to proceed? Please review and approve this plan, or let me know what adjustments you'd like.**
