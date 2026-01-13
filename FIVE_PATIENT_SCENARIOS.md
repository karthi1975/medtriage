# 5 Comprehensive Patient Scenarios
## Complete Triage & Scheduling Workflows

This document outlines 5 realistic patient scenarios covering different service lines, urgency levels, and clinical pathways.

## Quick Reference - Patient IDs

| Patient ID | Name | Age | Condition | Urgency |
|------------|------|-----|-----------|---------|
| **1000** | John Martinez | 60M | Acute MI (STEMI) | 🔴 Critical |
| **1001** | Margaret Chen | 67F | Acute Ischemic Stroke | 🔴 Critical |
| **1002** | Robert Williams | 73M | CHF Exacerbation | 🟠 Urgent |
| **1003** | Sarah Johnson | 57F | Diabetic Foot Ulcer | 🟡 High Priority |
| **1004** | Dorothy Anderson | 80F | Hip Fracture | 🔴 Emergency |

**How to Test:**
```bash
# Test patient lookup with numeric IDs
curl -X POST "https://medichat-backend-820444130598.us-east5.run.app/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "1000", "ma_session_id": "YOUR_SESSION_ID", "conversation_history": [], "current_patient_id": null}'

# Or simply type in the UI: 1000, 1001, 1002, 1003, or 1004
```

---

## Patient 1: John Martinez - Acute Myocardial Infarction (CARDIAC EMERGENCY)

### Patient Demographics
- **Age**: 60 years old
- **Gender**: Male
- **FHIR ID**: `1000`

### Clinical Presentation
**Chief Complaint**: "I have crushing chest pain going down my left arm"

**History of Present Illness**:
- Onset: 2 hours ago while mowing lawn
- Character: Crushing, pressure-like pain
- Location: Substernal, radiating to left arm and jaw
- Severity: 9/10
- Associated symptoms:
  - Shortness of breath
  - Diaphoresis (profuse sweating)
  - Nausea
  - Feeling of impending doom

**Past Medical History**:
- Hypertension (10 years)
- Hyperlipidemia
- Type 2 Diabetes Mellitus
- Family history: Father died of MI at age 62

**Current Medications**:
- Lisinopril 10mg daily (ACE inhibitor)
- Atorvastatin 40mg daily (statin)
- Metformin 1000mg BID

**Allergies**:
- Aspirin → Mild rash (important for STEMI protocol!)

**Vital Signs**:
- BP: 165/95 mmHg
- HR: 105 bpm (tachycardia)
- RR: 22 breaths/min (tachypnea)
- O2 Sat: 96% on room air
- Temp: 98.6°F

### Intelligent Triage Decision

**Urgency Level**: 🔴 **CRITICAL/LIFE-THREATENING**

**Reasoning**:
1. **Cardiac Risk Stratification** (HEART Score ~6-7):
   - History: Highly suspicious for ACS
   - ECG: Would show ST elevations (STEMI)
   - Age: 60 (moderate risk)
   - Risk factors: HTN, HLD, DM, family history
   - Troponin: Would be elevated

2. **Time-Sensitive Condition**:
   - "Time is muscle" - every minute of delay = more myocardial damage
   - Door-to-balloon time goal: <90 minutes
   - tPA contraindicated due to aspirin allergy

3. **Red Flags**:
   - Radiation to arm/jaw (classic pattern)
   - Diaphoresis + nausea (autonomic symptoms)
   - Prolonged duration (>20 minutes)

**Recommended Specialty**: **Emergency Cardiology / Interventional Cardiology**

**Triage Decision**: **CALL 911 / EMERGENCY DEPARTMENT**

### Clinical Pathway

**Immediate Actions** (Pre-hospital):
```
1. Call 911 immediately
2. EMS to administer:
   - Oxygen (if O2 < 94%)
   - Nitroglycerin SL (if BP > 90 systolic)
   - CANNOT give Aspirin (allergy) - substitute Clopidogrel
3. 12-lead ECG in ambulance
4. Alert receiving hospital: "STEMI alert"
```

**ED Protocol**:
```
1. STAT Labs:
   - Troponin I (repeat q3h x2)
   - CK-MB
   - CBC, BMP, Mg
   - Lipid panel
   - PT/INR

2. Imaging:
   - Chest X-ray (portable)
   - Bedside echo (if available)

3. Medications:
   - Morphine 2-4mg IV for pain
   - Nitroglycerin drip
   - Clopidogrel 600mg load (instead of aspirin)
   - Ticagrelor 180mg (P2Y12 inhibitor)
   - Heparin bolus + drip

4. Cath Lab Activation:
   - Target: Door-to-balloon < 90 minutes
   - Interventional cardiologist on standby
```

**Appointment Scheduling**: N/A (Emergency admission)

**Expected Outcome**:
- Admission to CCU post-PCI
- 3-5 day hospital stay
- Cardiac rehab referral
- Follow-up with cardiologist in 1 week

**Cost Estimate**: $75,000-150,000 (cardiac cath, stent, admission)

---

## Patient 2: Margaret Chen - Acute Ischemic Stroke (NEURO EMERGENCY)

### Patient Demographics
- **Age**: 67 years old
- **Gender**: Female
- **FHIR ID**: `1001`

### Clinical Presentation
**Chief Complaint**: "My face feels droopy and I can't talk right"

**History of Present Illness**:
- Onset: Sudden, 45 minutes ago
- Last Known Normal: 45 minutes ago (critical for tPA window)
- Symptoms:
  - Right facial droop
  - Slurred speech (dysarthria)
  - Right arm weakness (unable to lift)
  - Possible right leg weakness

**FAST Assessment**:
- **F**ace: ✓ Right facial droop
- **A**rm: ✓ Right arm drift/weakness
- **S**peech: ✓ Slurred speech
- **T**ime: 45 minutes from LKN

**Past Medical History**:
- Atrial Fibrillation (on anticoagulation)
- Hypertension
- Previous TIA (2020)
- CHA2DS2-VASc Score: 5 (high stroke risk)

**Current Medications**:
- Warfarin 5mg daily (INR target 2-3)
- Metoprolol 50mg BID
- Amlodipine 10mg daily

**Allergies**:
- Penicillin → Anaphylaxis
- Sulfa drugs → Severe rash

**Vital Signs**:
- BP: 185/110 mmHg (hypertensive - common in stroke)
- HR: 88 bpm irregular (AFib)
- RR: 18 breaths/min
- O2 Sat: 98%

### Intelligent Triage Decision

**Urgency Level**: 🔴 **CRITICAL - STROKE CODE**

**Reasoning**:
1. **NIHSS Score** (estimated ~6-8):
   - Facial palsy: 2 points
   - Motor arm: 2 points
   - Dysarthria: 1 point
   - Moderate stroke severity

2. **Time Window Analysis**:
   - Within tPA window (< 4.5 hours)
   - Within thrombectomy window (< 24 hours)
   - Every 15 minutes = 4% less chance of good outcome

3. **Complications**:
   - On Warfarin (need INR immediately)
   - If INR > 1.7, cannot give tPA without reversal
   - May need FFP, Vitamin K, or PCC

**Recommended Specialty**: **Stroke Neurology / Neurointerventional**

**Triage Decision**: **STROKE CODE - ACTIVATE STROKE TEAM**

### Clinical Pathway

**Pre-hospital** (EMS):
```
1. Stroke alert to receiving hospital
2. Last Known Normal time documented
3. Blood glucose check (rule out hypoglycemia)
4. Cincinnati Stroke Scale assessment
5. RACE scale (for large vessel occlusion)
```

**ED Protocol** (Door-to-Needle < 60 min):
```
Minute 0-10:
- Triage as ESI Level 1
- Activate stroke team
- BP monitoring (maintain < 185/110 for tPA eligibility)

Minute 10-25:
- STAT non-contrast CT Head (r/o hemorrhage)
- STAT Labs:
  - INR/PT (critical - on Warfarin)
  - Glucose
  - CBC, BMP
  - Troponin

Minute 25-45:
- CT interpretation
- Review tPA checklist:
  ✗ INR likely >1.7 (on Warfarin) - CONTRAINDICATION
  ✓ No hemorrhage on CT
  ✓ Within time window
  ✓ No recent surgery

- Decision: Cannot give tPA due to INR
- Alternative: Thrombectomy if LVO

Minute 45-60:
- CTA Head/Neck (evaluate for LVO)
- If LVO present → Neurointerventional for thrombectomy
- If no LVO → Admit for stroke management
```

**Treatment Options**:
```
Option 1: If INR < 1.7 after reversal
- tPA 0.9 mg/kg (max 90mg)
- 10% bolus, 90% over 1 hour

Option 2: If Large Vessel Occlusion
- Mechanical thrombectomy
- Target: Door-to-groin < 90 minutes

Option 3: If neither option
- Admit to stroke unit
- Aspirin 325mg (after 24 hours if tPA given)
- Resume anticoagulation after imaging r/o hemorrhage
```

**Appointment Scheduling**: N/A (Emergency admission)

**Expected Outcome**:
- Stroke unit admission
- Early PT/OT/Speech therapy
- Telemetry monitoring (AFib)
- Follow-up with stroke neurologist

**Cost Estimate**: $50,000-200,000 (depending on intervention)

---

## Patient 3: Robert Williams - CHF Exacerbation (URGENT CARDIOLOGY)

### Patient Demographics
- **Age**: 73 years old
- **Gender**: Male
- **FHIR ID**: `1002`

### Clinical Presentation
**Chief Complaint**: "I can't catch my breath and my ankles are really swollen"

**History of Present Illness**:
- Gradual onset over 3 days
- Progressive dyspnea on exertion → now dyspnea at rest
- Orthopnea (sleeps on 2 pillows, usually 1)
- Paroxysmal nocturnal dyspnea (PND)
- Weight gain: 8 lbs in 3 days
- Bilateral ankle edema (pitting)
- Non-compliant with low-salt diet (ate pizza 3 days ago)
- Ran out of Furosemide 2 days ago (insurance issue)

**Past Medical History**:
- Heart Failure with reduced EF (35%) - ischemic cardiomyopathy
- Coronary Artery Disease
- s/p Myocardial Infarction (2019)
- Hypertension
- Chronic Kidney Disease Stage 3 (baseline Cr 1.6)
- ICD placement (2020)

**Current Medications**:
- Furosemide 40mg BID (ran out!)
- Carvedilol 25mg BID
- Enalapril 10mg daily
- Spironolactone 25mg daily

**Vital Signs**:
- BP: 145/85 mmHg
- HR: 92 bpm
- RR: 24 breaths/min (tachypneic)
- O2 Sat: 92% on room air (hypoxic)
- Weight: 198 lbs (baseline 190 lbs)

**Physical Exam**:
- JVP elevated (12 cm)
- Crackles bilateral lung bases
- S3 gallop
- 2+ pitting edema to mid-shin bilaterally

### Intelligent Triage Decision

**Urgency Level**: 🟠 **HIGH URGENCY**

**Reasoning**:
1. **Decompensated Heart Failure** - Signs of volume overload
2. **Not immediately life-threatening** but needs prompt treatment
3. **Risk of deterioration** if left untreated

**Key Decision Points**:
```
ED vs. Urgent Clinic?
- Hypoxia (O2 92%) → Consider ED
- No chest pain → Can be clinic
- Stable vital signs → Clinic appropriate
- Good social support → Clinic OK
Decision: URGENT SAME-DAY CLINIC VISIT
```

**Recommended Specialty**: **Cardiology**

**Triage Decision**: **Same-day or Next-day Appointment**

### Clinical Pathway

**Pre-visit Orders** (before appointment):
```
Labs:
- BNP (expect elevated >500)
- BMP (check K+ with diuretic adjustment, Cr for renal function)
- CBC
- Mg

Imaging:
- Chest X-ray (expect pulmonary edema, cardiomegaly)
- ECG (check for ischemia, arrhythmia)
```

**Cardiology Appointment**:
```
Time Slot: Same day, 2:00 PM
Provider: Dr. John Smith, Cardiologist
Location: Salt Lake Heart Center
Duration: 30 minutes
```

**Treatment Plan**:
```
1. Medication Adjustment:
   - Increase Furosemide 40mg BID → 80mg BID
   - Continue Carvedilol, Enalapril, Spironolactone
   - Add Metolazone 5mg if inadequate response

2. Close Monitoring:
   - Daily weights (call if >3 lbs in 1 day or >5 lbs in 1 week)
   - Strict I/O documentation
   - Fluid restriction (1.5-2L/day)
   - Low sodium diet (< 2g/day)

3. Labs:
   - Repeat BMP in 3 days (check K+, Cr after diuretic increase)
   - BNP in 1 week

4. Follow-up:
   - Phone call in 2 days
   - In-person follow-up in 1 week
   - Consider outpatient diuresis clinic if not improving
```

**Appointment Scheduling**:
```json
{
  "patient_id": "1002",
  "appointment_type": "urgent_follow_up",
  "specialty": "cardiology",
  "provider": "Dr. John Smith",
  "facility_id": 2,
  "datetime": "2026-01-13 14:00:00",
  "duration_minutes": 30,
  "visit_type": "established_patient",
  "reason": "CHF exacerbation",
  "pre_visit_orders": ["BNP", "BMP", "Chest X-ray", "ECG"]
}
```

**Expected Outcome**:
- Symptom improvement in 24-48 hours with increased diuretics
- Avoid hospitalization
- Resume baseline functional status

**Cost**: $300-500 (clinic visit + labs + imaging)

---

## Patient 4: Sarah Johnson - Diabetic Foot Ulcer with Infection (HIGH PRIORITY MULTI-SPECIALTY)

### Patient Demographics
- **Age**: 57 years old
- **Gender**: Female
- **FHIR ID**: `1003`

### Clinical Presentation
**Chief Complaint**: "I have a sore on my foot that won't heal and it smells bad"

**History of Present Illness**:
- Non-healing ulcer on left foot x 2 weeks
- Initially minor blister, progressively worsening
- Now: 3cm x 2cm ulcer on plantar surface, lateral foot
- Surrounding erythema (redness) spreading - now 5cm diameter
- Purulent drainage, foul odor
- Warmth to touch
- Decreased sensation in both feet (neuropathy)
- No fever, but feeling "warm"

**Diabetes History**:
- Type 2 DM x 15 years
- Poorly controlled (recent A1C 9.2%, 3 weeks ago)
- Non-compliant with glucose monitoring
- History of recurrent foot infections
- Previous toe amputation (right great toe, 2021)

**Past Medical History**:
- Type 2 Diabetes Mellitus (poorly controlled)
- Diabetic Peripheral Neuropathy
- Hypertension
- Obesity (BMI 38 - Class 2)
- Diabetic Retinopathy (laser treatment 2020)

**Current Medications**:
- Insulin Glargine (Lantus) 45 units at bedtime
- Metformin 1000mg BID
- Gabapentin 300mg TID (for neuropathy)
- Lisinopril 20mg daily

**Allergies**:
- Codeine → Nausea/vomiting

**Vital Signs**:
- BP: 155/92 mmHg
- HR: 88 bpm
- RR: 16 breaths/min
- O2 Sat: 98%
- Temp: 99.8°F (low-grade fever)
- Blood glucose: 285 mg/dL (finger stick)

**Physical Exam**:
- Ulcer: 3x2cm, depth to subcutaneous tissue
- Probe to bone: Negative (good sign)
- Pedal pulses: Diminished but palpable
- Monofilament test: Insensate in multiple areas

### Intelligent Triage Decision

**Urgency Level**: 🟠 **HIGH PRIORITY** (not emergency, but time-sensitive)

**Reasoning**:
1. **Infection Risk Stratification** (IDSA Classification):
   - Moderate infection (PEDIS Grade 3)
   - Systemic signs: Low-grade fever
   - Local signs: Erythema >2cm, purulent drainage
   - Risk factors: Poorly controlled DM, neuropathy, previous amputation

2. **Complications if Untreated**:
   - Progression to severe infection/sepsis
   - Osteomyelitis (bone infection)
   - Need for amputation
   - Mortality risk

3. **Time Sensitivity**:
   - Should be seen within 24-48 hours
   - Not immediate emergency (patient stable)

**Recommended Specialty**: **Multidisciplinary**
- Primary: Endocrinology
- Consults: Podiatry, Wound Care, Infectious Disease

**Triage Decision**: **Urgent appointment within 24-48 hours**

### Clinical Pathway

**Pre-visit Orders**:
```
Labs:
- Wound culture (send before antibiotics if possible)
- CBC with differential (expect leukocytosis)
- ESR, CRP (inflammatory markers)
- BMP (renal function before antibiotics)
- HbA1c (recheck)
- Blood glucose log review

Imaging:
- X-ray left foot (3 views) - r/o osteomyelitis, foreign body, gas
- Consider MRI if X-ray equivocal
```

**Appointment Details**:
```
Day 1 (Tomorrow):
Time: 9:00 AM
Provider: Dr. Lisa Chen, Endocrinologist
Location: West Valley City Community Health Center
Duration: 45 minutes (complex visit)

Day 1 (Same day):
Time: 10:00 AM
Provider: Wound Care Nurse Specialist
Duration: 30 minutes
```

**Treatment Protocol**:
```
1. Infection Management:
   - Antibiotics (AVOID Sulfa drugs - allergy):
     * Augmentin 875mg BID x 10-14 days, OR
     * Cephalexin 500mg QID x 10-14 days
     * If severe: IV Vancomycin + Zosyn (admit)

2. Wound Care:
   - Sharp debridement of necrotic tissue
   - Wound culture BEFORE debridement
   - Daily dressing changes (Aquacel Ag or similar)
   - Offloading: Total contact cast or CAM boot

3. Diabetes Management:
   - Optimize glucose control (target <180 mg/dL)
   - Increase Insulin Glargine 45→55 units
   - Add mealtime insulin (Humalog) 10 units TID
   - Diabetes education referral
   - CGM placement (continuous glucose monitor)

4. Vascular Assessment:
   - Check ABIs (ankle-brachial index)
   - Consider vascular surgery consult if ABIs <0.7

5. Podiatry Consult (Day 3-5):
   - Custom orthotics
   - Proper diabetic footwear
   - Nail care
   - Callus management
```

**Appointment Scheduling**:
```json
[
  {
    "patient_id": "1003",
    "appointment_type": "urgent_new_problem",
    "specialty": "endocrinology",
    "provider": "Dr. Lisa Chen",
    "datetime": "2026-01-13 09:00:00",
    "duration_minutes": 45,
    "reason": "Diabetic foot ulcer with infection",
    "pre_visit_orders": ["Wound culture", "CBC", "ESR", "CRP", "X-ray left foot"]
  },
  {
    "patient_id": "1003",
    "appointment_type": "same_day_consult",
    "specialty": "wound_care",
    "provider": "Wound Care RN",
    "datetime": "2026-01-13 10:00:00",
    "duration_minutes": 30,
    "reason": "Wound assessment and debridement"
  },
  {
    "patient_id": "1003",
    "appointment_type": "follow_up",
    "specialty": "podiatry",
    "provider": "Dr. Ahmed Hassan",
    "datetime": "2026-01-15 14:00:00",
    "duration_minutes": 30,
    "reason": "Foot evaluation, offloading"
  }
]
```

**Expected Outcome**:
- Wound healing in 6-12 weeks with aggressive management
- Improved glucose control
- Prevention of amputation
- Long-term: Quarterly diabetic foot exams

**Cost**: $2,500-5,000 (wound care, antibiotics, visits) vs. $50,000+ (amputation)

---

## Patient 5: Dorothy Anderson - Hip Fracture (EMERGENCY → SURGERY)

### Patient Demographics
- **Age**: 80 years old
- **Gender**: Female
- **FHIR ID**: `1004`

### Clinical Presentation
**Chief Complaint**: "I fell and I can't get up. My hip hurts terribly"

**History of Present Illness**:
- Fall at home 4 hours ago
- Mechanism: Tripped on rug while walking to bathroom
- Fell onto right side
- Immediate severe right hip pain (10/10)
- Unable to bear weight
- Unable to ambulate
- Lives alone, called daughter who found her

**Trauma Assessment**:
- No loss of consciousness
- No head strike
- No other injuries noted
- Ground-level fall (low energy trauma)

**Past Medical History**:
- Osteoporosis (T-score -3.2)
- Hypertension
- GERD
- Osteoarthritis (bilateral knees)
- No prior fractures

**Surgical History**:
- Cholecystectomy (1995)
- Cataract surgery (2018)

**Current Medications**:
- Alendronate (Fosamax) 70mg weekly
- Calcium + Vitamin D 600mg/400IU BID
- Lisinopril 5mg daily
- Omeprazole 20mg daily

**Allergies**:
- Morphine → Severe itching

**Social History**:
- Lives alone
- Independent in ADLs
- Widow (husband died 2020)
- Daughter lives nearby

**Vital Signs**:
- BP: 165/88 mmHg (pain response)
- HR: 95 bpm
- RR: 20 breaths/min
- O2 Sat: 96%
- Temp: 98.2°F

**Physical Exam**:
- Right leg: Shortened and externally rotated (classic hip fracture)
- Severe tenderness over right hip
- Unable to perform straight leg raise
- Pedal pulses intact bilaterally
- No open wounds

### Intelligent Triage Decision

**Urgency Level**: 🔴 **HIGH EMERGENCY** (Surgical Emergency)

**Reasoning**:
1. **High Probability Hip Fracture**:
   - Classic presentation (shortening, external rotation)
   - High-risk mechanism (elderly, osteoporosis, ground-level fall)
   - Unable to bear weight

2. **Surgical Emergency**:
   - Hip fractures require surgery within 24-48 hours
   - Delayed surgery = increased mortality
   - Complications: DVT, PE, pneumonia, delirium

3. **Geriatric Considerations**:
   - Age 80 = high anesthesia risk
   - Need pre-op medical clearance
   - Mobility issues = deconditioning risk

**Recommended Specialty**: **Orthopedic Surgery**

**Triage Decision**: **EMERGENCY DEPARTMENT → HOSPITAL ADMISSION → SURGERY**

### Clinical Pathway

**ED Evaluation**:
```
Time 0-30 minutes:
1. Pain Management:
   - AVOID morphine (allergy)
   - Fentanyl 25-50mcg IV, OR
   - Hydromorphone 0.5mg IV
   - Consider fascia iliaca nerve block

2. Imaging:
   - X-ray pelvis (AP view)
   - X-ray right hip (AP and lateral)
   - Expected: Femoral neck fracture or intertrochanteric fracture

3. Labs:
   - CBC (baseline Hgb - may need transfusion)
   - BMP (electrolytes, renal function)
   - PT/INR (baseline coag)
   - Type and screen (2 units PRBCs)
```

**Pre-operative Workup**:
```
Cardiology Clearance:
- ECG (check for ischemia, arrhythmia)
- Chest X-ray
- Possibly echocardiogram if cardiac history
- Medical optimization

Anesthesia Consult:
- ASA class III (age + comorbidities)
- Spinal vs. general anesthesia discussion
- Regional anesthesia preferred (lower mortality)

Orthopedic Surgery Consult:
- Fracture classification:
  * Femoral neck → Hemiarthroplasty vs. ORIF
  * Intertrochanteric → ORIF with IM nail
- Surgical timing: Within 24-48 hours optimal
```

**Surgical Plan**:
```
Procedure Options:

Option 1: Femoral Neck Fracture
- Hemiarthroplasty (if displaced)
- ORIF with cannulated screws (if non-displaced)

Option 2: Intertrochanteric Fracture
- ORIF with cephalomedullary nail (Gamma nail, PFNA)

Anesthesia:
- Spinal anesthesia preferred
- Fascia iliaca block for post-op pain

Post-op Orders:
- Admit to Orthopedic Surgery floor
- DVT prophylaxis (Lovenox 40mg SQ daily)
- Early mobilization (PT POD#1)
- Weight bearing as tolerated
- Fall precautions
- Delirium prevention protocol
```

**Timeline**:
```
Hour 0: ED arrival, X-rays confirm fracture
Hour 2: Admitted, pre-op workup started
Hour 4-8: Medical clearance obtained
Hour 24: Surgery (ORIF vs. arthroplasty)
Day 1-2: Post-op recovery, PT evaluation
Day 3-5: Discharge to SNF or home with home health
Week 6: Follow-up X-ray, advance weight bearing
Week 12: Full weight bearing, return to baseline (if no complications)
```

**Appointment Scheduling**: N/A (Emergency admission)

**Post-Discharge Follow-up**:
```json
{
  "patient_id": "1004",
  "appointments": [
    {
      "datetime": "2026-01-27 10:00:00",
      "provider": "Dr. Michael Rodriguez",
      "specialty": "orthopedic_surgery",
      "type": "post_op_check",
      "reason": "2-week post-op wound check, X-ray"
    },
    {
      "datetime": "2026-02-24 14:00:00",
      "provider": "Dr. Michael Rodriguez",
      "specialty": "orthopedic_surgery",
      "type": "post_op_check",
      "reason": "6-week post-op X-ray, advance weight bearing"
    },
    {
      "datetime": "2026-04-15 09:00:00",
      "provider": "Dr. Michael Rodriguez",
      "specialty": "orthopedic_surgery",
      "type": "post_op_check",
      "reason": "12-week final follow-up"
    }
  ]
}
```

**Expected Outcome**:
- 4-5 day hospital stay
- Discharge to skilled nursing facility (SNF) x 2-3 weeks
- Return home with walker/cane
- Full recovery in 3-6 months (with PT)
- 1-year mortality: 20-30% (baseline for elderly hip fracture)

**Cost**: $35,000-60,000 (surgery, admission, SNF, PT)

---

## Summary: Triage Urgency Matrix

| Patient | Age | Condition | Urgency | Specialty | Timeline | Destination |
|---------|-----|-----------|---------|-----------|----------|-------------|
| **1. John Martinez** | 60M | Acute MI | 🔴 Critical | Cardiology | Immediate | 911/ED → Cath Lab |
| **2. Margaret Chen** | 67F | Acute Stroke | 🔴 Critical | Neurology | Immediate | 911/ED → Stroke Unit |
| **3. Robert Williams** | 73M | CHF Exacerbation | 🟠 Urgent | Cardiology | Same-day | Clinic (avoid ED) |
| **4. Sarah Johnson** | 57F | Diabetic Ulcer | 🟡 High Priority | Endo/Wound | 24-48 hours | Clinic + Wound Care |
| **5. Dorothy Anderson** | 80F | Hip Fracture | 🔴 Emergency | Orthopedics | <24 hours | ED → OR |

## Key Clinical Decision Rules Applied

1. **STEMI**: Door-to-balloon <90 minutes
2. **Stroke**: Door-to-needle <60 minutes, LKN <4.5 hours for tPA
3. **CHF**: BNP-guided therapy, outpatient diuresis when possible
4. **Diabetic Foot**: PEDIS classification, early aggressive treatment
5. **Hip Fracture**: Surgery <48 hours, geriatric co-management

---

**Files Created**:
- `create-5-test-patients.sh` - Creates patients in HAPI FHIR
- `test-5-patient-workflow.sh` - Tests complete triage & scheduling
- `FIVE_PATIENT_SCENARIOS.md` - This comprehensive guide
