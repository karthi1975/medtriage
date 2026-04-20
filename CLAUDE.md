# CLAUDE.md

**Template Version:** 1.2
**CxMS:** Agent Context Management System
**Project:** SynaptixScheduling - Intelligent Healthcare Triage & Appointment System

---

## MANDATORY REQUIREMENTS

### Session Start Requirements

Before ANY work, you MUST:
1. Read this file completely
2. Read `SynaptixScheduling_Session.md` completely
3. Read `SynaptixScheduling_Tasks.md` completely
4. Provide verification summary to user

**After reading, you MUST provide:**
- Current active task (from Tasks.md)
- Last session date (from Session.md)
- What was done last session (from Session.md)
- Recommended next action

**If you cannot provide this summary, you have not read the required files.**

### Session End Requirements

Before ending OR when context compacts, you MUST:
1. Update `SynaptixScheduling_Session.md` with all changes
2. Update `SynaptixScheduling_Tasks.md` if task status changed
3. Log any significant decisions in `SynaptixScheduling_Decision_Log.md`
4. Update deployment status in `SynaptixScheduling_Deployment.md`
5. Confirm update completion to user

```
┌────────────────────────────────────────────────────────┐
│  BEFORE ENDING ANY SESSION OR COMPACTING:              │
│                                                        │
│  You MUST update SynaptixScheduling_Session.md         │
│                                                        │
│  FAILURE TO DO THIS = LOST WORK                        │
└────────────────────────────────────────────────────────┘
```

### These requirements are NON-NEGOTIABLE
Failure to follow them results in lost work and wasted time.

---

## Output Preferences

- Be concise and professional
- Show code only when explicitly asked or when critical
- Use emojis only when requested
- Prefer editing existing files over creating new ones
- Never create markdown documentation files unless explicitly requested

---

## Overview

This is **SynaptixScheduling**, an intelligent triage and appointment booking system for multi-specialty healthcare facilities. The system performs specialty-specific patient triage using keyword-based protocols and automatically fetches FHIR-compliant appointment slots based on patient symptoms and urgency.

**Core Capabilities:**
- Specialty-specific triage (5 service lines)
- Automatic FHIR R4 slot fetching
- Order requirements tracking
- Real-time appointment scheduling
- Priority-based provider recommendations

---

## Project Structure

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `/` (root) | Backend (FastAPI) | `main.py`, `chat_service.py`, `fhir_scheduling_service.py` |
| `frontend-new/` | Frontend (React + TypeScript) | `ChatView.tsx`, `DetailsPanel.tsx`, `SlotRecommendations.tsx` |
| `config/` | Configuration | `testing_requirements.py`, `__init__.py` |
| `.cxms-templates/` | CxMS templates | Context management templates |

---

## Tech Stack

### Backend
- **Language**: Python 3.11
- **Framework**: FastAPI
- **LLM**: Vertex AI Llama 4 (OpenAPI-compatible endpoint in us-east5).
  Requires `roles/aiplatform.user` on the Cloud Run service account
  `820444130598-compute@developer.gserviceaccount.com`.
  (Earlier docs mentioned Anthropic Claude — the code in `llama_service.py` is
  the authoritative truth.)
- **FHIR Server**: HAPI FHIR R4 on Compute Engine VM `hapi-fhir-vm`
  (zone `us-east5-a`). **Ephemeral external IP — changes on every restart.**
  Current: `http://34.186.254.226:8080/fhir` (2026-04-20).
  Backend env var: `FHIR_SERVER_URL`. Reserve a static IP to stop this drift.
- **Deployment**: Google Cloud Run (serverless containers)
- **Region**: us-east5
- **Backend URL**: https://medichat-backend-820444130598.us-east5.run.app

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI)
- **State**: React Context API
- **Build**: Vite
- **Deployment**: Google Cloud Run
- **Frontend URL**: https://medichat-frontend-820444130598.us-east5.run.app

### Database/Data
- **FHIR Resources**: Patient, Slot, Schedule, Practitioner, Appointment
- **Session Storage**: In-memory dict (backend)
- **No persistent DB**: System is stateless, relies on FHIR server

---

## Key Files

### Backend Core Files
| File | Purpose | Lines |
|------|---------|-------|
| `main.py` | FastAPI app, intent routing, triage logic | ~1700 lines |
| `main.py:22-83` | SPECIALTY_MAPPING - central config for 5 specialties | Critical |
| `main.py:481-650` | TRIAGE_START intent handler | Core logic |
| `chat_service.py` | Intent classification, response generation | ~900 lines |
| `chat_service.py:428-451` | Symptom keywords for triage | Expanded |
| `fhir_scheduling_service.py` | FHIR slot search, appointment creation | ~600 lines |
| `simple_triage_protocols.py` | Keyword-based triage rules | NEW file |
| `testing_service.py` | Order requirements checking | ~200 lines |
| `config/testing_requirements.py` | Specialty-specific test rules | ~800 lines |

### Frontend Core Files
| File | Purpose |
|------|---------|
| `frontend-new/src/pages/ChatView.tsx` | Main chat interface, header (line 121: "SynaptixScheduling") |
| `frontend-new/src/pages/MAContextSelection.tsx` | Login page (line 103: "SynaptixScheduling") |
| `frontend-new/src/components/panels/DetailsPanel.tsx` | Right panel: triage, orders, appointments |
| `frontend-new/src/components/SlotRecommendations.tsx` | Appointment card UI with medals/rankings |
| `frontend-new/src/components/chat/ChatMessages.tsx` | Left panel: chat messages, simple appointment notification |

### Documentation
| File | Purpose |
|------|---------|
| `PROJECT_STATUS.md` | Complete system status, deployment history | Primary reference |
| `TEST_APPROVAL_WORKFLOW.md` | Order requirements workflow | Feature spec |
| `FINAL_UI_DESIGN.md` | UI/UX specification | Design doc |
| `AGENTIC_AI_ARCHITECTURE.md` | Future AI agent architecture | Roadmap |

---

## Configured Specialties (5 Total)

**SPECIALTY_MAPPING** (main.py lines 22-83) is the SINGLE SOURCE OF TRUTH:

| ID | Specialty | Provider | Facility | Schedule ID | Slots |
|----|-----------|----------|----------|-------------|-------|
| 1 | Cardiology | Dr. John Smith (MD, FACC) | Salt Lake Heart Center | cardiology-smith-schedule | 9 |
| 2 | Primary Care | Dr. Sarah Davis (MD) | West Valley City CHC | primary-care-davis-schedule | 47 |
| 3 | Orthopedics | Dr. Michael Brown (MD) | Utah Valley Orthopedics | ortho-brown-schedule | 15 |
| 4 | Pulmonology | Dr. Lisa Nguyen (MD) | Intermountain Lung Center | pulm-nguyen-schedule | 15 |
| 5 | Endocrinology | Dr. James Wilson (MD) | West Valley City CHC | endo-wilson-schedule | 14 |

**Total Available Slots**: 100 slots across all specialties

---

## Test Patients

Source of truth: the 5 scenarios in `Medichat_Triage.pdf` and the live HAPI FHIR
server. Names shown below are as they appear in FHIR `Patient.name`.

| ID | Name | Specialty | Facility | Provider | Typical Priority |
|----|------|-----------|----------|----------|------------------|
| 1002 | Robert James Williams (73M) | Cardiology | Salt Lake Heart Center | Dr. John Smith | MEDIUM (SOB / swollen ankles) |
| 1005 | Emily Rose Thompson (45F) | Primary Care | West Valley City CHC | Dr. Sarah Davis | MEDIUM (diabetes follow-up) |
| 1006 | Thomas David Martinez (62M) | Orthopedics | Utah Valley Orthopedics | Dr. Michael Brown | MEDIUM (knee pain) |
| 1007 | Linda Marie Garcia (58F) | Pulmonology | Intermountain Lung Center | Dr. Lisa Nguyen | CRITICAL (acute SOB, cough) |
| 1003 | Sarah Marie Johnson (57F) | Endocrinology | West Valley City CHC | Dr. James Wilson | MEDIUM (non-healing foot wound) |

---

## Development Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally (not typically done - uses Cloud Run)
uvicorn main:app --reload --port 8000

# Deploy to Cloud Run
gcloud run deploy medichat-backend --source . --region us-east5 --allow-unauthenticated

# Check logs
gcloud run logs read medichat-backend --region us-east5 --limit 50
```

### Frontend
```bash
cd frontend-new/

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloud Run
gcloud run deploy medichat-frontend --source . --region us-east5 --allow-unauthenticated
```

---

## Development Preferences

### Code Style
- **Never use emojis** unless explicitly requested
- **Edit existing files** instead of creating new ones
- **No markdown docs** unless explicitly asked
- **Concise responses** - don't show code unless critical
- **Test before committing** - verify functionality works

### Architecture Patterns
- **Single source of truth**: SPECIALTY_MAPPING in main.py
- **Keyword-based triage**: simple_triage_protocols.py (NOT complex AI)
- **FHIR-first**: Always use FHIR resources for data
- **Stateless backend**: No persistent storage, session in-memory only
- **Component-based frontend**: React functional components with hooks

### Naming Conventions
- **Backend files**: snake_case (e.g., `fhir_scheduling_service.py`)
- **Frontend files**: PascalCase for components (e.g., `DetailsPanel.tsx`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `SPECIALTY_MAPPING`)
- **Functions**: camelCase for frontend, snake_case for backend

### When Making Changes
1. **Read existing code first** - never propose changes to unread code
2. **Understand current patterns** - follow established conventions
3. **Test after changes** - always verify functionality
4. **Update documentation** - keep PROJECT_STATUS.md current
5. **Deploy carefully** - backend changes affect production immediately

---

## Critical Design Decisions

### Why Keyword-Based Triage?
- Previous complex AI triage was unreliable (returned None, wrong protocols)
- Simple keyword matching in `simple_triage_protocols.py` is 100% deterministic
- Each specialty has URGENT/MODERATE/ROUTINE/GENERAL triage levels
- Keywords like "chest pain" → CRITICAL, "diabetes follow-up" → MEDIUM

### Why No Appointment Lock?
- User requested removal of conditional booking based on order completion
- Order requirements are informational, not blocking
- MAs can schedule appointments immediately regardless of test status
- Orders are tracked with checkboxes for visual confirmation only

### Why Right Panel Only for Appointments?
- User wanted consistent UI across all specialties
- Left panel shows simple notification: "3 slots found → view in right panel"
- Right panel shows rich SlotRecommendations cards with full details
- Reduces clutter in chat, centralizes booking workflow

### Why Distinctive Order Colors?
- Each order type (ECG, Troponin, BNP, X-Ray, etc.) has unique color
- Visual distinction helps MAs quickly identify order types
- Colors: Red (ECG), Purple (Troponin), Blue (BNP), Orange (X-Ray), etc.
- 4px colored left border + matching URGENT chip + checkbox color

---

## Current Deployment Status

**Last Deployment**: 2026-04-20

| Component | Revision | Status | URL |
|-----------|----------|--------|-----|
| Backend | 00053-cdb | ✅ LIVE | https://medichat-backend-820444130598.us-east5.run.app |
| Frontend | 00019-btz | ✅ LIVE | https://medichat-frontend-820444130598.us-east5.run.app |

### Infrastructure changes 2026-04-20
- Granted `roles/aiplatform.user` to backend SA to unblock Vertex AI Llama calls
- Repointed `FHIR_SERVER_URL` to new VM IP `34.186.254.226` after VM restart
- Frontend now supports opt-in Material 3 theme via `?theme=m3` (phased rollout
  in progress; see `src/theme/m3.ts`, `src/components/md3/`, `/design-system` route)

**Key Features Operational**:
- ✅ All 5 specialties configured
- ✅ Specialty-specific triage
- ✅ Auto-fetch appointment slots after triage
- ✅ Order requirements display (renamed from "Testing Requirements")
- ✅ Distinctive order styling (colored borders, chips, checkboxes)
- ✅ Unrestricted appointment booking (no locks)
- ✅ SynaptixScheduling branding
- ✅ Consistent appointment UI in right panel

---

## Document Reading Order

For full context, read in this order:
1. This file (`CLAUDE.md`) - Project overview
2. `SynaptixScheduling_Session.md` - Current session state
3. `SynaptixScheduling_Tasks.md` - Active tasks
4. `PROJECT_STATUS.md` - Complete system status (comprehensive reference)

For specific activities:
- **Planning**: Read `AGENTIC_AI_ARCHITECTURE.md` (future roadmap)
- **UI Work**: Read `FINAL_UI_DESIGN.md` (design spec)
- **Testing**: Read `TEST_ALL_5_SPECIALTIES.md` (test scenarios)
- **Deployment**: Read `SynaptixScheduling_Deployment.md` (environment tracking)

---

## Documentation Index

### Core CxMS Files (Required)
| File | Purpose | Update Frequency |
|------|---------|------------------|
| `CLAUDE.md` | Project overview (this file) | Rarely |
| `SynaptixScheduling_Context.md` | Documentation index | When docs change |
| `SynaptixScheduling_Session.md` | Current state | **Every session** |
| `SynaptixScheduling_Tasks.md` | Task tracker | As tasks change |
| `SynaptixScheduling_Prompt_History.md` | Audit trail | Each significant prompt |

### Project Documentation
| File | Purpose | Status |
|------|---------|--------|
| `PROJECT_STATUS.md` | Complete system overview | ✅ Current |
| `TEST_APPROVAL_WORKFLOW.md` | Order requirements feature | ✅ Current |
| `FINAL_UI_DESIGN.md` | UI/UX specification | ✅ Current |
| `AGENTIC_AI_ARCHITECTURE.md` | Future AI agent design | ✅ Current |
| `TEST_ALL_5_SPECIALTIES.md` | Test scenarios for all specialties | ✅ Current |

### Log Files
| File | Purpose | Status |
|------|---------|--------|
| `SynaptixScheduling_Deployment.md` | Deployment tracking | 🔄 To create |
| `SynaptixScheduling_Decision_Log.md` | Why decisions were made | 🔄 To create |
| `SynaptixScheduling_Activity_Log.md` | What was done | 🔄 To create |

---

## Environment Details

- **Project ID**: project-c78515e0-ee8f-4282-a3c
- **Region**: us-east5
- **FHIR Server**: http://34.162.139.26:8080/fhir
- **Git Branch**: main
- **Git Repo**: (local)

---

## Document Version Control

| Document | Version | Last Updated | Last Verified |
|----------|---------|--------------|---------------|
| CLAUDE.md | 1.0 | 2026-01-15 | 2026-01-15 |
| Session.md | - | [dynamic] | [dynamic] |
| Tasks.md | - | [dynamic] | [dynamic] |

**Verification means:** AI read file and confirmed contents match project state

---

## Quick Reference: Common Tasks

**Start Session:**
```
"Read CLAUDE.md and SynaptixScheduling_Session.md,
summarize current status, then await instructions."
```

**End Session:**
- Update SynaptixScheduling_Session.md with all changes
- Update SynaptixScheduling_Tasks.md if tasks completed
- Log decisions in SynaptixScheduling_Decision_Log.md
- Confirm completion to user

**Deploy Backend:**
```bash
gcloud run deploy medichat-backend --source . --region us-east5 --allow-unauthenticated
```

**Deploy Frontend:**
```bash
cd frontend-new && gcloud run deploy medichat-frontend --source . --region us-east5 --allow-unauthenticated
```

**Test Patient 1002 (Cardiology CRITICAL):**
1. Login: Salt Lake Heart Center, Cardiology
2. Patient: 1002
3. Symptoms: "severe chest pain"
4. Expect: CRITICAL priority, 3 urgent orders (ECG, Troponin, BNP), 3 appointment slots

---

**🎯 Remember**: Before ending ANY session, update SynaptixScheduling_Session.md!
