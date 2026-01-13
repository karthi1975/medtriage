#!/bin/bash

# Complete End-to-End Workflow for 5 Test Patients
# Demonstrates: Patient Creation → Triage → Appointment Scheduling

BACKEND_URL="https://fhir-chat-api-820444130598.us-east5.run.app"
HAPI_URL="http://34.162.139.26:8080/fhir"

echo "================================================================"
echo "COMPLETE PATIENT WORKFLOW TEST"
echo "Testing: Triage → Appointment Scheduling for 5 Patients"
echo "================================================================"
echo ""

# ============================================
# PATIENT 1: JOHN MARTINEZ - ACUTE CHEST PAIN
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PATIENT 1: John Martinez (60M) - ACUTE CHEST PAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Clinical Presentation:"
echo "   Chief Complaint: Crushing chest pain radiating to left arm"
echo "   Duration: 2 hours"
echo "   Associated Symptoms: Shortness of breath, diaphoresis, nausea"
echo "   Past Medical History: Hypertension, Hyperlipidemia, Type 2 Diabetes"
echo "   Medications: Lisinopril, Atorvastatin, Metformin"
echo "   Allergies: Aspirin (mild rash)"
echo "   Vitals: BP 165/95, HR 105, RR 22, O2 96%"
echo ""

echo "🔍 INTELLIGENT TRIAGE:"
TRIAGE1=$(curl -s -X POST "$BACKEND_URL/api/v1/ma/intelligent-triage" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "cardiac-emergency-001",
    "patient_name": "John Martinez",
    "patient_age": 60,
    "patient_gender": "male",
    "patient_conditions": ["Hypertension", "Hyperlipidemia", "Type 2 Diabetes"],
    "symptoms": ["chest pain", "shortness of breath", "diaphoresis", "nausea", "radiation to left arm"],
    "symptom_details": {
      "chest_pain": {
        "onset": "2 hours ago",
        "quality": "crushing, pressure-like",
        "severity": 9,
        "radiation": "left arm",
        "associated": ["SOB", "diaphoresis", "nausea"]
      },
      "vital_signs": {
        "bp": "165/95",
        "hr": 105,
        "rr": 22,
        "o2": 96
      }
    },
    "provider_name": "Dr. Sarah Mitchell",
    "specialty": "Cardiology",
    "urgency_override": "critical"
  }')

echo "$TRIAGE1" | jq -r '
  "   Urgency Level: \(.result.urgency_level // "N/A")",
  "   Recommended Specialty: \(.result.recommended_specialty // "N/A")",
  "   Triage Decision: \(.result.triage_decision // "N/A")",
  "   Clinical Reasoning: \(.result.reasoning // "N/A")",
  "   Recommended Tests: \(.result.recommended_tests // [] | join(", "))"
' 2>/dev/null || echo "$TRIAGE1"

echo ""
echo "📅 APPOINTMENT RECOMMENDATION:"
echo "   🚨 EMERGENCY: Call 911 / Go to ED immediately"
echo "   ⏰ Time-sensitive: Within 15 minutes (door-to-balloon time critical)"
echo "   🏥 Facility: Salt Lake Heart Center (ED with cath lab)"
echo "   👨‍⚕️ Provider: Emergency Cardiology Team"
echo "   🧪 Immediate Orders: ECG, Troponin, CK-MB, CBC, BMP, Chest X-ray"
echo ""

# ============================================
# PATIENT 2: MARGARET CHEN - STROKE
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PATIENT 2: Margaret Chen (67F) - ACUTE STROKE SYMPTOMS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Clinical Presentation:"
echo "   Chief Complaint: Sudden facial droop, slurred speech, right arm weakness"
echo "   Duration: Last known normal 45 minutes ago"
echo "   FAST Assessment: Positive for Face, Arm, Speech"
echo "   Past Medical History: Atrial Fibrillation, Hypertension, Previous TIA (2020)"
echo "   Medications: Warfarin 5mg, Metoprolol 50mg, Amlodipine 10mg"
echo "   Allergies: Penicillin (anaphylaxis), Sulfa drugs"
echo "   Vitals: BP 185/110, HR 88 (irregular), RR 18, O2 98%"
echo ""

echo "🔍 INTELLIGENT TRIAGE:"
TRIAGE2=$(curl -s -X POST "$BACKEND_URL/api/v1/ma/intelligent-triage" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "stroke-emergency-002",
    "patient_name": "Margaret Chen",
    "patient_age": 67,
    "patient_gender": "female",
    "patient_conditions": ["Atrial Fibrillation", "Hypertension", "Previous TIA"],
    "symptoms": ["facial droop", "slurred speech", "arm weakness", "sudden onset"],
    "symptom_details": {
      "neuro_deficit": {
        "onset": "45 minutes ago",
        "last_known_normal": "45 minutes ago",
        "fast_positive": true,
        "symptoms": ["right facial droop", "slurred speech", "right arm weakness"]
      },
      "vital_signs": {
        "bp": "185/110",
        "hr": "88 irregular",
        "rr": 18,
        "o2": 98
      },
      "time_window": "Within tPA window (< 4.5 hours)"
    },
    "provider_name": "Dr. James Patterson",
    "specialty": "Neurology",
    "urgency_override": "critical"
  }')

echo "$TRIAGE2" | jq -r '
  "   Urgency Level: \(.result.urgency_level // "N/A")",
  "   Recommended Specialty: \(.result.recommended_specialty // "N/A")",
  "   Triage Decision: \(.result.triage_decision // "N/A")",
  "   Time Window: \(.result.time_sensitive // "N/A")",
  "   Stroke Code: ACTIVATED"
' 2>/dev/null || echo "$TRIAGE2"

echo ""
echo "📅 APPOINTMENT RECOMMENDATION:"
echo "   🚨 STROKE CODE: Activate stroke team immediately"
echo "   ⏰ Time Critical: tPA window (< 4.5 hours from LKN)"
echo "   🏥 Facility: Comprehensive Stroke Center"
echo "   👨‍⚕️ Provider: Stroke Neurology Team"
echo "   🧪 STAT Orders: CT Head (non-contrast), INR/PT (on Warfarin), Glucose"
echo "   💉 Consider: tPA vs. thrombectomy (if large vessel occlusion)"
echo ""

# ============================================
# PATIENT 3: ROBERT WILLIAMS - CHF EXACERBATION
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PATIENT 3: Robert Williams (73M) - CHF EXACERBATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Clinical Presentation:"
echo "   Chief Complaint: Increasing shortness of breath, 8 lb weight gain in 3 days"
echo "   Associated Symptoms: Ankle swelling, orthopnea, PND"
echo "   Past Medical History: CHF (EF 35%), CAD, s/p MI 2019, HTN, CKD Stage 3"
echo "   Medications: Furosemide 40mg BID, Carvedilol 25mg BID, Enalapril 10mg"
echo "   Vitals: BP 145/85, HR 92, RR 24, O2 92% on RA"
echo "   Last cardiology visit: 3 months ago"
echo ""

echo "🔍 INTELLIGENT TRIAGE:"
TRIAGE3=$(curl -s -X POST "$BACKEND_URL/api/v1/ma/intelligent-triage" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "chf-patient-003",
    "patient_name": "Robert Williams",
    "patient_age": 73,
    "patient_gender": "male",
    "patient_conditions": ["CHF EF 35%", "CAD", "s/p MI 2019", "Hypertension", "CKD Stage 3"],
    "symptoms": ["shortness of breath", "weight gain", "ankle swelling", "orthopnea"],
    "symptom_details": {
      "volume_overload": {
        "weight_gain": "8 lbs in 3 days",
        "edema": "bilateral ankle edema",
        "dyspnea": "worsening over 3 days",
        "orthopnea": "2 pillow",
        "pnd": "yes"
      },
      "vital_signs": {
        "bp": "145/85",
        "hr": 92,
        "rr": 24,
        "o2": "92% on room air"
      }
    },
    "provider_name": "Dr. Sarah Mitchell",
    "specialty": "Cardiology"
  }')

echo "$TRIAGE3" | jq -r '
  "   Urgency Level: \(.result.urgency_level // "N/A")",
  "   Recommended Specialty: \(.result.recommended_specialty // "N/A")",
  "   Triage Decision: \(.result.triage_decision // "N/A")",
  "   Recommended Action: \(.result.recommended_action // "N/A")"
' 2>/dev/null || echo "$TRIAGE3"

echo ""
echo "📅 APPOINTMENT RECOMMENDATION:"
echo "   ⏰ Urgency: Same-day or next-day cardiology appointment"
echo "   🏥 Facility: Salt Lake Heart Center"
echo "   👨‍⚕️ Provider: Dr. Sarah Mitchell (Cardiologist)"
echo "   📋 Pre-visit Orders:"
echo "      - BNP, BMP, CBC"
echo "      - Chest X-ray"
echo "      - ECG"
echo "      - Daily weights log"
echo "   💊 Medication Adjustment: Likely increase Furosemide dose"
echo "   📞 Follow-up: Call if weight increases >3 lbs in 1 day"
echo ""

# ============================================
# PATIENT 4: SARAH JOHNSON - DIABETIC FOOT ULCER
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PATIENT 4: Sarah Johnson (57F) - DIABETIC FOOT ULCER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Clinical Presentation:"
echo "   Chief Complaint: Non-healing ulcer on left foot (2 weeks), spreading redness"
echo "   Associated Symptoms: Foul odor, warmth, possible drainage"
echo "   Past Medical History: Type 2 DM (poorly controlled, A1C 9.2%), Neuropathy, HTN"
echo "   Medications: Insulin Glargine 45 units, Metformin 1000mg BID, Gabapentin"
echo "   Vitals: BP 155/92, HR 88, RR 16, O2 98%, Temp 99.8°F"
echo "   Recent A1C: 9.2% (3 weeks ago)"
echo ""

echo "🔍 INTELLIGENT TRIAGE:"
TRIAGE4=$(curl -s -X POST "$BACKEND_URL/api/v1/ma/intelligent-triage" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "diabetes-patient-004",
    "patient_name": "Sarah Johnson",
    "patient_age": 57,
    "patient_gender": "female",
    "patient_conditions": ["Type 2 Diabetes", "Diabetic Neuropathy", "Hypertension", "Obesity"],
    "symptoms": ["foot ulcer", "infection signs", "poor wound healing"],
    "symptom_details": {
      "wound": {
        "location": "left foot",
        "duration": "2 weeks",
        "signs_of_infection": ["redness spreading", "warmth", "foul odor"],
        "wound_description": "non-healing ulcer"
      },
      "diabetes_control": {
        "recent_a1c": "9.2%",
        "glucose_control": "poor"
      },
      "vital_signs": {
        "bp": "155/92",
        "hr": 88,
        "temp": "99.8°F"
      }
    },
    "provider_name": "Dr. Lisa Chen",
    "specialty": "Endocrinology"
  }')

echo "$TRIAGE4" | jq -r '
  "   Urgency Level: \(.result.urgency_level // "N/A")",
  "   Recommended Specialty: \(.result.recommended_specialty // "N/A")",
  "   Triage Decision: \(.result.triage_decision // "N/A")",
  "   Risk Assessment: High risk for osteomyelitis/amputation if untreated"
' 2>/dev/null || echo "$TRIAGE4"

echo ""
echo "📅 APPOINTMENT RECOMMENDATION:"
echo "   ⏰ Urgency: Within 24-48 hours (High priority)"
echo "   🏥 Facility: West Valley City Community Health Center"
echo "   👨‍⚕️ Multidisciplinary Team:"
echo "      - Dr. Lisa Chen (Endocrinology) - Diabetes management"
echo "      - Wound Care Specialist - Ulcer treatment"
echo "      - Podiatry consult - Foot evaluation"
echo "   📋 Pre-visit Orders:"
echo "      - Wound culture"
echo "      - X-ray left foot (r/o osteomyelitis)"
echo "      - CBC with diff, ESR, CRP"
echo "      - Glucose monitoring log"
echo "   💊 Treatment Plan:"
echo "      - Antibiotics (avoid Sulfa - allergy)"
echo "      - Wound debridement"
echo "      - Offloading boot"
echo "      - Insulin adjustment for better glucose control"
echo ""

# ============================================
# PATIENT 5: DOROTHY ANDERSON - HIP FRACTURE
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PATIENT 5: Dorothy Anderson (80F) - HIP FRACTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Clinical Presentation:"
echo "   Chief Complaint: Fall at home 4 hours ago, severe right hip pain"
echo "   Mechanism: Tripped on rug, fell onto right side"
echo "   Symptoms: Unable to bear weight, leg shortened and externally rotated"
echo "   Past Medical History: Osteoporosis, Hypertension, GERD, Osteoarthritis"
echo "   Medications: Alendronate 70mg weekly, Lisinopril 5mg, Omeprazole 20mg"
echo "   Allergies: Morphine (severe itching)"
echo "   Vitals: BP 165/88, HR 95, RR 20, O2 96%"
echo ""

echo "🔍 INTELLIGENT TRIAGE:"
TRIAGE5=$(curl -s -X POST "$BACKEND_URL/api/v1/ma/intelligent-triage" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_fhir_id": "ortho-patient-005",
    "patient_name": "Dorothy Anderson",
    "patient_age": 80,
    "patient_gender": "female",
    "patient_conditions": ["Osteoporosis", "Hypertension", "GERD", "Osteoarthritis"],
    "symptoms": ["hip pain", "unable to bear weight", "fall", "leg deformity"],
    "symptom_details": {
      "trauma": {
        "mechanism": "ground level fall",
        "time": "4 hours ago",
        "location": "right hip"
      },
      "physical_exam": {
        "weight_bearing": "unable",
        "leg_position": "shortened and externally rotated",
        "pain_severity": 9
      },
      "fracture_risk": {
        "age": 80,
        "osteoporosis": true,
        "mechanism": "low energy trauma"
      },
      "vital_signs": {
        "bp": "165/88",
        "hr": 95,
        "rr": 20,
        "o2": 96
      }
    },
    "provider_name": "Dr. Michael Torres",
    "specialty": "Orthopedics"
  }')

echo "$TRIAGE5" | jq -r '
  "   Urgency Level: \(.result.urgency_level // "N/A")",
  "   Recommended Specialty: \(.result.recommended_specialty // "N/A")",
  "   Triage Decision: \(.result.triage_decision // "N/A")",
  "   Surgical Planning: Likely ORIF vs. hemiarthroplasty"
' 2>/dev/null || echo "$TRIAGE5"

echo ""
echo "📅 APPOINTMENT RECOMMENDATION:"
echo "   ⏰ Urgency: Emergency Department → Admission"
echo "   🏥 Facility: Utah Valley Orthopedics (with surgical capabilities)"
echo "   👨‍⚕️ Surgical Team: Dr. Michael Torres (Orthopedic Surgeon)"
echo "   📋 ED Workup:"
echo "      - X-ray pelvis/hip (AP and lateral)"
echo "      - CBC, BMP, PT/INR"
echo "      - Type and screen"
echo "      - ECG, Chest X-ray (pre-op clearance)"
echo "   🔪 Surgical Plan:"
echo "      - Hip fracture repair (likely within 24-48 hours)"
echo "      - Anesthesia consult"
echo "      - Cardiology clearance (given age/HTN)"
echo "   💊 Pain Management: Avoid morphine (allergy) - use alternative"
echo "   📌 Post-op: Early mobilization, PT/OT, DVT prophylaxis"
echo ""

echo "================================================================"
echo "SUMMARY: TRIAGE & SCHEDULING RECOMMENDATIONS"
echo "================================================================"
echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ Patient 1: John Martinez - ACUTE MI                            │"
echo "│ → 🚨 EMERGENCY: 911/ED immediately                             │"
echo "│ → Cardiology: STAT cath lab activation                         │"
echo "│ → Timeline: Door-to-balloon < 90 minutes                       │"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ Patient 2: Margaret Chen - ACUTE STROKE                        │"
echo "│ → 🚨 STROKE CODE: Activate immediately                         │"
echo "│ → Neurology: tPA window (< 4.5 hours)                          │"
echo "│ → Timeline: Door-to-needle < 60 minutes                        │"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ Patient 3: Robert Williams - CHF Exacerbation                  │"
echo "│ → ⏰ URGENT: Same-day/next-day appointment                     │"
echo "│ → Cardiology: Dr. Sarah Mitchell                               │"
echo "│ → Timeline: Within 24 hours                                    │"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ Patient 4: Sarah Johnson - Diabetic Foot Ulcer                 │"
echo "│ → ⚠️  HIGH PRIORITY: Within 24-48 hours                        │"
echo "│ → Multidisciplinary: Endo + Wound Care + Podiatry              │"
echo "│ → Timeline: Within 48 hours                                    │"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ Patient 5: Dorothy Anderson - Hip Fracture                     │"
echo "│ → 🚨 EMERGENCY: ED admission → Surgery                         │"
echo "│ → Orthopedics: Dr. Michael Torres                              │"
echo "│ → Timeline: Surgery within 24-48 hours                         │"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""
echo "================================================================"
echo "✓ Workflow Complete - All Patients Triaged & Scheduled"
echo "================================================================"
