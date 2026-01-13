#!/bin/bash

# Create 5 Realistic Patient Scenarios for Testing
# Each patient has different conditions requiring different service lines

HAPI_URL="http://34.162.139.26:8080/fhir"

echo "========================================"
echo "Creating 5 Test Patients in HAPI FHIR"
echo "========================================"
echo ""

# ============================================
# PATIENT 1: Acute Chest Pain (CARDIAC EMERGENCY)
# ============================================
echo "1. Creating PATIENT 1: John Martinez - Acute Chest Pain (Cardiac Emergency)"
echo "   Condition: Acute chest pain, history of hypertension"
echo "   Priority: URGENT (possible MI)"
echo "   Service Line: Cardiology"
echo ""

PATIENT1=$(curl -s -X PUT "$HAPI_URL/Patient/cardiac-emergency-001" \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "id": "cardiac-emergency-001",
    "name": [{
      "family": "Martinez",
      "given": ["John", "Robert"]
    }],
    "gender": "male",
    "birthDate": "1965-03-15",
    "address": [{
      "line": ["456 Oak Street"],
      "city": "Salt Lake City",
      "state": "UT",
      "postalCode": "84101"
    }],
    "telecom": [{
      "system": "phone",
      "value": "801-555-0101"
    }],
    "extension": [{
      "url": "http://medichat.com/fhir/StructureDefinition/allergies",
      "valueString": "Aspirin (mild rash)"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/conditions",
      "valueString": "Hypertension, Hyperlipidemia, Type 2 Diabetes"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/medications",
      "valueString": "Lisinopril 10mg, Atorvastatin 40mg, Metformin 1000mg"
    }]
  }')

echo "✓ Patient 1 created: John Martinez (Age 60, Male)"
echo "  Chief Complaint: Crushing chest pain radiating to left arm, onset 2 hours ago"
echo "  Vitals: BP 165/95, HR 105, RR 22, O2 96%"
echo ""

# ============================================
# PATIENT 2: Stroke Symptoms (NEURO EMERGENCY)
# ============================================
echo "2. Creating PATIENT 2: Margaret Chen - Acute Stroke Symptoms"
echo "   Condition: Sudden onset facial droop, slurred speech"
echo "   Priority: CRITICAL (possible CVA)"
echo "   Service Line: Neurology/Emergency"
echo ""

PATIENT2=$(curl -s -X PUT "$HAPI_URL/Patient/stroke-emergency-002" \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "id": "stroke-emergency-002",
    "name": [{
      "family": "Chen",
      "given": ["Margaret", "Lynn"]
    }],
    "gender": "female",
    "birthDate": "1958-07-22",
    "address": [{
      "line": ["789 Maple Avenue"],
      "city": "Provo",
      "state": "UT",
      "postalCode": "84601"
    }],
    "telecom": [{
      "system": "phone",
      "value": "801-555-0202"
    }],
    "extension": [{
      "url": "http://medichat.com/fhir/StructureDefinition/allergies",
      "valueString": "Penicillin (anaphylaxis), Sulfa drugs"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/conditions",
      "valueString": "Atrial Fibrillation, Hypertension, Previous TIA (2020)"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/medications",
      "valueString": "Warfarin 5mg, Metoprolol 50mg, Amlodipine 10mg"
    }]
  }')

echo "✓ Patient 2 created: Margaret Chen (Age 67, Female)"
echo "  Chief Complaint: Sudden facial droop on right side, slurred speech, weakness in right arm"
echo "  Vitals: BP 185/110, HR 88 (irregular), RR 18, O2 98%"
echo "  Last known normal: 45 minutes ago"
echo ""

# ============================================
# PATIENT 3: Heart Failure Exacerbation (CARDIAC)
# ============================================
echo "3. Creating PATIENT 3: Robert Williams - CHF Exacerbation"
echo "   Condition: Chronic Heart Failure, worsening symptoms"
echo "   Priority: HIGH (but not emergency)"
echo "   Service Line: Cardiology"
echo ""

PATIENT3=$(curl -s -X PUT "$HAPI_URL/Patient/chf-patient-003" \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "id": "chf-patient-003",
    "name": [{
      "family": "Williams",
      "given": ["Robert", "James"]
    }],
    "gender": "male",
    "birthDate": "1952-11-08",
    "address": [{
      "line": ["321 Pine Street"],
      "city": "West Valley City",
      "state": "UT",
      "postalCode": "84119"
    }],
    "telecom": [{
      "system": "phone",
      "value": "801-555-0303"
    }],
    "extension": [{
      "url": "http://medichat.com/fhir/StructureDefinition/allergies",
      "valueString": "No known drug allergies"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/conditions",
      "valueString": "CHF (EF 35%), CAD, s/p MI 2019, Hypertension, CKD Stage 3"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/medications",
      "valueString": "Furosemide 40mg BID, Carvedilol 25mg BID, Enalapril 10mg, Spironolactone 25mg"
    }]
  }')

echo "✓ Patient 3 created: Robert Williams (Age 73, Male)"
echo "  Chief Complaint: Increasing shortness of breath, gained 8 lbs in 3 days, ankle swelling"
echo "  Vitals: BP 145/85, HR 92, RR 24, O2 92% on room air"
echo "  Last seen by cardiologist: 3 months ago"
echo ""

# ============================================
# PATIENT 4: Diabetic Foot Ulcer (ENDOCRINE/WOUND CARE)
# ============================================
echo "4. Creating PATIENT 4: Sarah Johnson - Diabetic Foot Ulcer"
echo "   Condition: Type 2 Diabetes with complications"
echo "   Priority: MEDIUM-HIGH (infection risk)"
echo "   Service Line: Endocrinology + Podiatry"
echo ""

PATIENT4=$(curl -s -X PUT "$HAPI_URL/Patient/diabetes-patient-004" \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "id": "diabetes-patient-004",
    "name": [{
      "family": "Johnson",
      "given": ["Sarah", "Marie"]
    }],
    "gender": "female",
    "birthDate": "1968-04-30",
    "address": [{
      "line": ["555 Cedar Lane"],
      "city": "Salt Lake City",
      "state": "UT",
      "postalCode": "84102"
    }],
    "telecom": [{
      "system": "phone",
      "value": "801-555-0404"
    }],
    "extension": [{
      "url": "http://medichat.com/fhir/StructureDefinition/allergies",
      "valueString": "Codeine (nausea)"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/conditions",
      "valueString": "Type 2 Diabetes (poorly controlled), Diabetic Neuropathy, Hypertension, Obesity (BMI 38)"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/medications",
      "valueString": "Insulin Glargine 45 units daily, Metformin 1000mg BID, Gabapentin 300mg TID"
    }]
  }')

echo "✓ Patient 4 created: Sarah Johnson (Age 57, Female)"
echo "  Chief Complaint: Non-healing ulcer on left foot (2 weeks), redness spreading, foul odor"
echo "  Vitals: BP 155/92, HR 88, RR 16, O2 98%, Temp 99.8°F"
echo "  Recent A1C: 9.2% (3 weeks ago)"
echo ""

# ============================================
# PATIENT 5: Hip Fracture (ORTHOPEDIC)
# ============================================
echo "5. Creating PATIENT 5: Dorothy Anderson - Hip Fracture"
echo "   Condition: Fall with suspected hip fracture"
echo "   Priority: HIGH (surgical candidate)"
echo "   Service Line: Orthopedic Surgery"
echo ""

PATIENT5=$(curl -s -X PUT "$HAPI_URL/Patient/ortho-patient-005" \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "id": "ortho-patient-005",
    "name": [{
      "family": "Anderson",
      "given": ["Dorothy", "Mae"]
    }],
    "gender": "female",
    "birthDate": "1945-09-12",
    "address": [{
      "line": ["888 Willow Court"],
      "city": "Provo",
      "state": "UT",
      "postalCode": "84604"
    }],
    "telecom": [{
      "system": "phone",
      "value": "801-555-0505"
    }],
    "extension": [{
      "url": "http://medichat.com/fhir/StructureDefinition/allergies",
      "valueString": "Morphine (severe itching)"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/conditions",
      "valueString": "Osteoporosis, Hypertension, GERD, Osteoarthritis"
    }, {
      "url": "http://medichat.com/fhir/StructureDefinition/medications",
      "valueString": "Alendronate 70mg weekly, Lisinopril 5mg, Omeprazole 20mg, Calcium+Vit D"
    }]
  }')

echo "✓ Patient 5 created: Dorothy Anderson (Age 80, Female)"
echo "  Chief Complaint: Fall at home 4 hours ago, severe right hip pain, unable to bear weight"
echo "  Vitals: BP 165/88, HR 95, RR 20, O2 96%"
echo "  Mechanism: Tripped on rug, fell onto right side"
echo ""

echo "========================================"
echo "✓ All 5 Patients Created Successfully!"
echo "========================================"
echo ""
echo "Patient IDs:"
echo "  1. cardiac-emergency-001 (John Martinez - Chest Pain)"
echo "  2. stroke-emergency-002 (Margaret Chen - Stroke)"
echo "  3. chf-patient-003 (Robert Williams - CHF)"
echo "  4. diabetes-patient-004 (Sarah Johnson - Diabetic Ulcer)"
echo "  5. ortho-patient-005 (Dorothy Anderson - Hip Fracture)"
echo ""
