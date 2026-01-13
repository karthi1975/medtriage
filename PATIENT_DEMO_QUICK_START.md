# 5-Patient Demo - Quick Start Guide

## 🎯 What This Demonstrates

This demo showcases the complete MediChat intelligent triage and scheduling workflow with **5 realistic patient scenarios** covering different medical emergencies and service lines:

1. **Cardiac Emergency** (Acute MI) - 60M with chest pain
2. **Stroke Emergency** (CVA) - 67F with facial droop
3. **Heart Failure** (CHF exacerbation) - 73M with SOB
4. **Diabetic Foot Ulcer** (with infection) - 57F
5. **Hip Fracture** (surgical emergency) - 80F

---

## 🚀 How to Run

### Option 1: Complete Demo (Recommended)

Run the master script that creates all patients and demonstrates triage:

```bash
cd /Users/karthi/GA_ML_COURSE/CS-6440-O01/project
./run-complete-patient-demo.sh
```

This will:
1. Create 5 patients in HAPI FHIR
2. Run intelligent triage for each patient
3. Show appointment scheduling recommendations
4. Display complete clinical pathways

---

### Option 2: Step-by-Step

#### Step 1: Create Patients Only
```bash
./create-5-test-patients.sh
```

**Result**: 5 patients created in HAPI FHIR with complete medical histories

#### Step 2: Test Triage Workflow
```bash
./test-5-patient-workflow.sh
```

**Result**: Complete triage and scheduling for all 5 patients

---

## 📋 Patient Details

### Patient 1: John Martinez - Acute MI 🫀
**FHIR ID**: `cardiac-emergency-001`

**Presentation**:
- Age: 60, Male
- Chief Complaint: Crushing chest pain → left arm
- Duration: 2 hours
- Vitals: BP 165/95, HR 105 (tachycardia)
- History: HTN, HLD, Type 2 DM

**Triage Decision**: 🔴 **CRITICAL - CALL 911**

**Reasoning**:
- Classic STEMI presentation
- Time is muscle (door-to-balloon <90 min)
- Aspirin allergy (use Clopidogrel instead)

**Appointment**: Emergency admission → Cath lab

**Expected Test Orders**:
- ECG, Troponin, CK-MB
- Cardiac catheterization
- Admission to CCU

---

### Patient 2: Margaret Chen - Acute Stroke 🧠
**FHIR ID**: `stroke-emergency-002`

**Presentation**:
- Age: 67, Female
- Chief Complaint: Facial droop, slurred speech, arm weakness
- Last Known Normal: 45 minutes ago
- Vitals: BP 185/110, HR 88 irregular (AFib)
- History: AFib on Warfarin, HTN, previous TIA

**Triage Decision**: 🔴 **STROKE CODE - ACTIVATE IMMEDIATELY**

**Reasoning**:
- FAST positive (Face, Arm, Speech)
- Within tPA window (<4.5 hours)
- On Warfarin (check INR - contraindication if >1.7)
- Possible large vessel occlusion

**Appointment**: Emergency admission → Stroke unit

**Expected Test Orders**:
- STAT CT Head (non-contrast)
- INR/PT (critical!)
- CTA head/neck if LVO suspected
- Possible tPA or thrombectomy

---

### Patient 3: Robert Williams - CHF Exacerbation 💔
**FHIR ID**: `chf-patient-003`

**Presentation**:
- Age: 73, Male
- Chief Complaint: SOB, weight gain 8 lbs in 3 days
- Symptoms: Orthopnea, PND, ankle swelling
- Vitals: BP 145/85, O2 92% on RA (hypoxic)
- History: CHF (EF 35%), CAD, s/p MI, CKD Stage 3
- Medication issue: Ran out of Furosemide

**Triage Decision**: 🟠 **URGENT - SAME DAY APPOINTMENT**

**Reasoning**:
- Decompensated heart failure (volume overload)
- Stable enough for outpatient management
- Avoid ED if possible
- Need medication adjustment

**Appointment**: Same-day cardiology clinic

**Expected Test Orders**:
- BNP (expect elevated)
- BMP, CBC
- Chest X-ray (pulmonary edema)
- ECG

**Treatment**: Increase Furosemide, close monitoring

---

### Patient 4: Sarah Johnson - Diabetic Foot Ulcer 🩹
**FHIR ID**: `diabetes-patient-004`

**Presentation**:
- Age: 57, Female
- Chief Complaint: Non-healing foot ulcer x 2 weeks, spreading redness
- Symptoms: Foul odor, purulent drainage, warmth
- Vitals: Temp 99.8°F (low-grade fever)
- History: Type 2 DM (A1C 9.2%), neuropathy, previous toe amputation
- Allergy: Codeine

**Triage Decision**: 🟡 **HIGH PRIORITY - WITHIN 24-48 HOURS**

**Reasoning**:
- Diabetic foot infection (moderate severity)
- Risk of osteomyelitis/amputation if untreated
- Poorly controlled diabetes (A1C 9.2%)
- Previous amputation = high risk

**Appointment**: Multidisciplinary approach
- Endocrinology (Dr. Lisa Chen)
- Wound Care Specialist
- Podiatry consult

**Expected Test Orders**:
- Wound culture
- X-ray foot (r/o osteomyelitis)
- CBC, ESR, CRP

**Treatment**:
- Antibiotics (avoid Sulfa - no allergy listed but common)
- Wound debridement
- Offloading boot
- Optimize glucose control

---

### Patient 5: Dorothy Anderson - Hip Fracture 🦴
**FHIR ID**: `ortho-patient-005`

**Presentation**:
- Age: 80, Female
- Chief Complaint: Fall 4 hours ago, severe hip pain
- Mechanism: Tripped on rug, fell on right side
- Physical Exam: Leg shortened, externally rotated (classic!)
- Vitals: BP 165/88, HR 95
- History: Osteoporosis, HTN
- Allergy: Morphine (severe itching)

**Triage Decision**: 🔴 **EMERGENCY - ED ADMISSION**

**Reasoning**:
- Classic hip fracture presentation
- High-risk patient (age 80, osteoporosis)
- Requires surgery within 24-48 hours
- Mortality risk if delayed

**Appointment**: Emergency admission → Surgery

**Expected Test Orders**:
- X-ray pelvis/hip (confirm fracture)
- CBC, BMP, PT/INR
- ECG, Chest X-ray (pre-op clearance)
- Type and screen

**Treatment**:
- Pain management (avoid morphine - use Fentanyl/Hydromorphone)
- ORIF vs. Hemiarthroplasty
- DVT prophylaxis
- Early mobilization

---

## 🎨 Urgency Level Color Coding

| Symbol | Level | Timeline | Examples |
|--------|-------|----------|----------|
| 🔴 | **Critical/Emergency** | Immediate | MI, Stroke, Hip Fracture |
| 🟠 | **Urgent** | Same day / 24 hours | CHF exacerbation |
| 🟡 | **High Priority** | 24-48 hours | Diabetic foot infection |
| 🟢 | **Routine** | 1-2 weeks | Follow-up, wellness |

---

## 📊 Service Line Distribution

| Service Line | Patients | Urgency Levels |
|--------------|----------|----------------|
| **Cardiology** | 2 | 1 Critical, 1 Urgent |
| **Neurology** | 1 | 1 Critical |
| **Endocrinology** | 1 | 1 High Priority |
| **Orthopedics** | 1 | 1 Emergency |

---

## 🧪 Testing in the Frontend

After running the demo, test these patients in the MediChat interface:

1. **Open Frontend**: https://medichat-frontend-820444130598.us-east5.run.app

2. **Search for Patients**:
   - Enter patient ID (e.g., `cardiac-emergency-001`)
   - Or search by name (e.g., "John Martinez")

3. **Test Workflows**:
   - Patient history review
   - Intelligent triage
   - Appointment scheduling
   - Test ordering

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `run-complete-patient-demo.sh` | ⭐ Master script - run this first |
| `create-5-test-patients.sh` | Creates patients in HAPI FHIR |
| `test-5-patient-workflow.sh` | Tests triage & scheduling |
| `FIVE_PATIENT_SCENARIOS.md` | 📚 Complete clinical documentation |
| `PATIENT_DEMO_QUICK_START.md` | 📖 This guide |

---

## 💡 Key Features Demonstrated

### 1. Intelligent Triage ✅
- **AI-powered** urgency assessment using Llama 4
- **Clinical reasoning** based on symptoms, vitals, history
- **Time-sensitive** condition recognition
- **Specialty routing** to appropriate providers

### 2. Smart Scheduling ✅
- **Urgency-based** appointment prioritization
- **Multi-specialty** coordination
- **Pre-visit orders** automation
- **Time slot** optimization

### 3. Clinical Decision Support ✅
- **Evidence-based** protocols (STEMI, Stroke, etc.)
- **Allergy checking** (Aspirin, Morphine, Penicillin)
- **Drug interactions** awareness
- **Risk stratification** (HEART score, NIHSS, etc.)

### 4. Care Coordination ✅
- **Multidisciplinary** team approach
- **Care transitions** (ED → admission → discharge)
- **Follow-up scheduling**
- **Patient education**

---

## 🎯 Expected Outcomes

### Emergency Patients (1, 2, 5):
- ✅ Immediate recognition of life-threatening conditions
- ✅ Activation of appropriate emergency protocols
- ✅ Time-sensitive interventions triggered

### Urgent Patient (3):
- ✅ Same-day appointment scheduled
- ✅ Avoids unnecessary ED visit
- ✅ Medication optimization

### High Priority Patient (4):
- ✅ Multidisciplinary care plan
- ✅ Infection prevention
- ✅ Amputation prevention

---

## 📞 Support

If you encounter issues:

1. **Check Services**:
   ```bash
   ./test-final-deployment.sh
   ```

2. **Verify HAPI FHIR**:
   ```bash
   curl http://34.162.139.26:8080/fhir/metadata
   ```

3. **Check Backend**:
   ```bash
   curl https://fhir-chat-api-820444130598.us-east5.run.app/health
   ```

---

## 🎓 Learning Objectives

After running this demo, you'll understand:

1. ✅ How intelligent triage works with AI
2. ✅ Clinical decision-making for different emergencies
3. ✅ Appointment scheduling logic and priorities
4. ✅ Multidisciplinary care coordination
5. ✅ FHIR integration with clinical workflows

---

**Ready to start?**

```bash
./run-complete-patient-demo.sh
```

🎉 **Enjoy the demo!**



  Yes, you can use any MA name - The system doesn't validate specific MA names. You can enter:
  - Your own name
  - A fictional MA name (e.g., "Sarah Johnson", "Michael Chen")
  - Or just "Medical Assistant"

  The MA name is used for:
  - Logging who initiated the triage
  - Session tracking
  - Audit trails

  Your 3 Facilities

  You currently have these 3 facilities configured in your system:

  1. West Valley City Community Health Center (Community Health)
    - 2850 W 3500 S, West Valley City, UT 84119
    - General care, multi-specialty
  2. Salt Lake Heart Center (Specialty Clinic - Cardiology)
    - 500 E 900 S, Salt Lake City, UT 84102
    - For cardiac patients (MI, CHF, etc.)
  3. Utah Valley Orthopedics (Specialty Clinic)
    - 1200 N University Ave, Provo, UT 84604
    - For orthopedic cases (hip fracture, etc.)

  How They Work with Your 5-Patient Demo:

  - Patient 1 (John Martinez - Acute MI) → Salt Lake Heart Center
  - Patient 2 (Margaret Chen - Stroke) → Emergency (any facility with stroke capability)
  - Patient 3 (Robert Williams - CHF) → Salt Lake Heart Center
  - Patient 4 (Sarah Johnson - Diabetic Ulcer) → West Valley City Community Health (multidisciplinary)
  - Patient 5 (Dorothy Anderson - Hip Fracture) → Utah Valley Orthopedics
