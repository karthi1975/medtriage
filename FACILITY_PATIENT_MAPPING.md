# Facility and Patient Mapping Guide

## Available Facilities

| ID | Facility Name | Type | City | Phone | Specialties |
|----|--------------|------|------|-------|-------------|
| **1** | West Valley City Community Health Center | Community Health | West Valley City | 801-555-0100 | Family Medicine, Primary Care |
| **2** | Salt Lake Heart Center | Specialty Clinic | Salt Lake City | 801-555-0200 | **Cardiology** |
| **3** | Utah Valley Orthopedics | Specialty Clinic | Provo | 801-555-0300 | **Orthopedics** |
| **4** | Intermountain Healthcare - Murray | Hospital | Murray | 801-555-0400 | Multiple (Emergency, Cardiology, Family Medicine) |
| **5** | Davis Behavioral Health | Mental Health Clinic | Layton | 801-555-0500 | Mental Health, Psychiatry |
| **6** | Logan Regional Hospital | Hospital | Logan | 801-555-0600 | Family Medicine, Emergency |

## Patient to Facility Mapping

### Patient 1000: John Martinez - Acute MI (STEMI)
**Condition**: Acute Myocardial Infarction (Heart Attack)

**Recommended Facilities**:
1. **Primary**: Facility #4 - **Intermountain Healthcare - Murray** (Hospital with Cath Lab)
   - Emergency Department
   - Cardiac Catheterization Lab
   - CCU (Cardiac Care Unit)

2. **Follow-up**: Facility #2 - **Salt Lake Heart Center** (Cardiology)
   - Post-discharge cardiology care
   - Cardiac rehabilitation
   - Long-term cardiac management

**Specialty Required**: Cardiology (specialty_id: 2)

---

### Patient 1001: Margaret Chen - Acute Stroke
**Condition**: Acute Ischemic Stroke

**Recommended Facilities**:
1. **Primary**: Facility #4 - **Intermountain Healthcare - Murray** (Hospital with Stroke Unit)
   - Emergency Department
   - CT/MRI capability
   - Stroke Unit
   - Neurology consultation available

2. **Alternative**: Facility #6 - **Logan Regional Hospital**
   - If geographically closer
   - Must verify stroke protocol capability

**Specialty Required**: Neurology (specialty_id: 6)

---

### Patient 1002: Robert Williams - CHF Exacerbation
**Condition**: Congestive Heart Failure Exacerbation

**Recommended Facilities**:
1. **Urgent Same-Day**: Facility #2 - **Salt Lake Heart Center** (Cardiology Clinic)
   - Address: 500 E 900 S, Salt Lake City
   - Specialty cardiology care
   - Outpatient diuresis capability
   - Avoid ED if possible

2. **If Unstable**: Facility #4 - **Intermountain Healthcare - Murray**
   - If O2 sat too low (<90%)
   - If requires IV diuretics
   - If showing signs of acute decompensation

**Specialty Required**: Cardiology (specialty_id: 2)

---

### Patient 1003: Sarah Johnson - Diabetic Foot Ulcer
**Condition**: Diabetic Foot Ulcer with Infection

**Recommended Facilities**:
1. **Primary Visit**: Facility #1 - **West Valley City Community Health Center**
   - Address: 2850 W 3500 S, West Valley City
   - Wound care services
   - Family Medicine with endocrine expertise
   - Diabetic education programs

2. **Endocrinology Consult**:
   - May need referral to specialized endocrinology at Facility #4 (Intermountain Healthcare)
   - Podiatry consultation (may need external referral)

3. **If Severe**: Facility #4 - **Intermountain Healthcare - Murray**
   - For IV antibiotics if needed
   - Surgical debridement capability
   - Vascular surgery consultation available

**Specialties Required**:
- Primary: Endocrinology (specialty_id: 9)
- Support: Family Medicine (specialty_id: 1), Infectious Disease (specialty_id: 19)

---

### Patient 1004: Dorothy Anderson - Hip Fracture
**Condition**: Hip Fracture (post-fall)

**Recommended Facilities**:
1. **Emergency/Surgery**: Facility #3 - **Utah Valley Orthopedics** + Hospital Transfer
   - Initial: Emergency Department at Facility #4 or #6
   - Surgery: Facility #3 (Utah Valley Orthopedics)
   - Post-op care: Hospital admission at Facility #4

2. **Complete Pathway**:
   - **Step 1**: Emergency Department (Facility #4 or #6)
     - X-rays, pain management, medical clearance
   - **Step 2**: Orthopedic Surgery (Facility #3 collaboration)
     - Hip ORIF or hemiarthroplasty
   - **Step 3**: Post-op Follow-up (Facility #3)
     - 2-week, 6-week, 12-week visits

**Specialty Required**: Orthopedics (specialty_id: 3)

---

## Facility Capacity Matrix

| Facility | Emergency | Urgent Same-Day | Scheduled Appt | Surgical | Multi-Day Admit |
|----------|-----------|-----------------|----------------|----------|-----------------|
| **1 - West Valley CC** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **2 - Salt Lake Heart** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **3 - Utah Valley Ortho** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **4 - Intermountain Murray** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **5 - Davis Behavioral** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **6 - Logan Regional** | ✅ | ✅ | ✅ | ✅ | ✅ |

## Summary: Patient → Facility Quick Reference

```
Patient 1000 (John Martinez - Acute MI)
  ├─ EMERGENCY → Facility #4 (Intermountain Murray) 🔴
  └─ Follow-up → Facility #2 (Salt Lake Heart Center)

Patient 1001 (Margaret Chen - Stroke)
  ├─ EMERGENCY → Facility #4 (Intermountain Murray) 🔴
  └─ Rehab → Facility #4 or external rehab facility

Patient 1002 (Robert Williams - CHF)
  ├─ URGENT → Facility #2 (Salt Lake Heart Center) 🟠
  └─ If unstable → Facility #4 (Intermountain Murray)

Patient 1003 (Sarah Johnson - Diabetic Ulcer)
  ├─ PRIMARY → Facility #1 (West Valley CC) 🟡
  └─ If severe → Facility #4 (Intermountain Murray)

Patient 1004 (Dorothy Anderson - Hip Fracture)
  ├─ EMERGENCY → Facility #4 or #6 (Hospital ED) 🔴
  ├─ SURGERY → Facility #3 (Utah Valley Ortho)
  └─ Post-op → Facility #4 (Hospital admission)
```

## Geographic Considerations

**Salt Lake Valley Region** (Closest for most patients):
- Facility #1: West Valley City CC
- Facility #2: Salt Lake Heart Center
- Facility #4: Intermountain Murray

**Utah County** (Provo area):
- Facility #3: Utah Valley Orthopedics

**Northern Utah**:
- Facility #5: Davis Behavioral (Layton)
- Facility #6: Logan Regional (Logan)

## Testing the Facility Assignment

To test facility assignment in the API:

```bash
# Get patient and check recommended facility
curl -X POST "https://medichat-backend-820444130598.us-east5.run.app/api/v1/ma/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "1000",
    "ma_session_id": "YOUR_SESSION_ID",
    "conversation_history": [],
    "current_patient_id": null
  }' | jq '.metadata.recommended_facility'

# Schedule appointment at specific facility
curl -X POST "https://medichat-backend-820444130598.us-east5.run.app/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "1002",
    "facility_id": 2,
    "specialty_id": 2,
    "appointment_datetime": "2026-01-14T14:00:00",
    "reason": "CHF follow-up"
  }'
```

## Provider Assignment by Facility

Based on the database:

**Facility #1 (West Valley CC)**:
- Dr. Sarah Johnson (Family Medicine) - NPI: 1234567890

**Facility #2 (Salt Lake Heart Center)**:
- Dr. David Martinez (Cardiology) - NPI: 1234567893

**Facility #3 (Utah Valley Orthopedics)**:
- Dr. James Wilson (Orthopedics) - NPI: 1234567895

**Facility #4 (Intermountain Murray)**:
- Dr. Michael Chen (Family Medicine) - NPI: 1234567891
- Dr. Lisa Thompson (Cardiology) - NPI: 1234567894

**Facility #6 (Logan Regional)**:
- Dr. Emily Davis (Family Medicine) - NPI: 1234567892

---

**Last Updated**: 2026-01-13
**Backend URL**: https://medichat-backend-820444130598.us-east5.run.app
**Frontend URL**: https://medichat-frontend-tg3weve6aq-ul.a.run.app
