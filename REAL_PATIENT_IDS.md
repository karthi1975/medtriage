# Real HAPI FHIR Patient IDs for Testing

Quick reference of verified patient IDs from HAPI FHIR server.

---

## ✅ Verified Patient IDs (Ready to Use)

### Patient 1: Riquelme Luis (RECOMMENDED)
- **ID**: `47077394`
- **Name**: Riquelme Luis
- **Gender**: Male
- **Birth Date**: 1982-01-01 (43 years old)
- **Has Data**: ✅ Has allergies (Shrimp allergy)

```bash
# Get all patient data
curl http://localhost:8002/api/v1/patients/47077394 | python3 -m json.tool

# Get allergies (has data!)
curl http://localhost:8002/api/v1/patients/47077394/allergies

# Triage with patient context
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I accidentally ate shrimp and now my throat feels tight",
    "patient_id": "47077394"
  }'
```

**Expected Allergy Response**:
```json
{
  "patient_id": "47077394",
  "allergies": [
    {
      "id": "52704061",
      "code": "Shrimp",
      "clinicalStatus": "active",
      "verificationStatus": "confirmed",
      "category": ["food"]
    }
  ]
}
```

---

### Patient 2: Vimal Thomas Joseph
- **ID**: `47936476`
- **Name**: Vimal Thomas Joseph
- **Gender**: Male
- **Birth Date**: 1980-01-01 (45 years old)

```bash
curl http://localhost:8002/api/v1/patients/47936476
```

---

### Patient 3: Núñez Karla
- **ID**: `47936493`
- **Name**: Núñez Karla
- **Gender**: Female
- **Birth Date**: 1980-01-02 (45 years old)

```bash
curl http://localhost:8002/api/v1/patients/47936493
```

---

### Patient 4: Aage Test
- **ID**: `47936371`
- **Name**: Aage Test
- **Gender**: Male
- **Birth Date**: 2002-10-27 (23 years old)

```bash
curl http://localhost:8002/api/v1/patients/47936371
```

---

## 🧪 Complete Test Examples with Real Patients

### Test 1: Get Patient History
```bash
curl http://localhost:8002/api/v1/patients/47077394 | python3 -m json.tool
```

### Test 2: Get Patient Demographics
```bash
curl http://localhost:8002/api/v1/patients/47077394/demographics | python3 -m json.tool
```

### Test 3: Get Patient Allergies (Has Data!)
```bash
curl http://localhost:8002/api/v1/patients/47077394/allergies | python3 -m json.tool
```

### Test 4: Get Patient Conditions
```bash
curl http://localhost:8002/api/v1/patients/47077394/conditions | python3 -m json.tool
```

### Test 5: Get Patient Medications
```bash
curl http://localhost:8002/api/v1/patients/47077394/medications | python3 -m json.tool
```

### Test 6: Chat with Patient Context
```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been feeling very tired lately",
    "patient_id": "47077394"
  }' | python3 -m json.tool
```

### Test 7: Triage with Patient Context
```bash
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have chest pain and shortness of breath",
    "patient_id": "47077394"
  }' | python3 -m json.tool
```

### Test 8: Triage with Allergy Context (Special Case!)
```bash
# This patient has a shrimp allergy, so mention shrimp exposure
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I ate shrimp at dinner and now my lips are swelling and I feel itchy all over",
    "patient_id": "47077394"
  }' | python3 -m json.tool
```

Expected: System should recognize the shrimp allergy and classify as emergency (anaphylaxis risk)

---

## 🔍 Find More Patients

### Using the Python Script
```bash
# Find 20 patients
python3 find_patients.py

# Find 50 patients
python3 find_patients.py --count 50

# Find patients and test API
python3 find_patients.py --test
```

### Using Direct HAPI FHIR Query
```bash
curl "https://hapi.fhir.org/baseR4/Patient?_count=10" \
  -H "Accept: application/fhir+json"
```

---

## 📊 Patient Data Summary

| Patient ID | Name | Gender | Age | Has Allergies | Has Conditions | Has Medications |
|------------|------|--------|-----|---------------|----------------|-----------------|
| 47077394 | Riquelme Luis | M | 43 | ✅ Shrimp | ❌ | ❌ |
| 47936476 | Vimal Thomas Joseph | M | 45 | ❓ | ❓ | ❓ |
| 47936493 | Núñez Karla | F | 45 | ❓ | ❓ | ❓ |
| 47936371 | Aage Test | M | 23 | ❓ | ❓ | ❓ |

**Legend**: ✅ = Has data, ❌ = No data, ❓ = Not tested yet

---

## 🎯 Best Patient for Testing

**Use Patient ID: `47077394` (Riquelme Luis)**

**Why?**
- Has actual allergy data (Shrimp)
- Complete demographics
- Can test patient context features
- Good for testing allergy-related triage scenarios

---

## 💡 Testing Tips

1. **Start with Patient 47077394** - Most complete data
2. **Test allergies endpoint** - Only patient with confirmed allergy data
3. **Test triage with allergy context** - Mention shrimp to see if system recognizes the allergy
4. **Use find_patients.py** - Discover more patients anytime
5. **Check patient_ids.txt** - Auto-generated list of all found patients

---

## 🚀 Quick Start Testing

Copy and run these commands:

```bash
# 1. Get patient with allergy data
curl http://localhost:8002/api/v1/patients/47077394/allergies

# 2. Test emergency triage with allergy context
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I ate shrimp and now my throat is closing up and I have hives everywhere",
    "patient_id": "47077394"
  }'

# 3. Find more patients
python3 find_patients.py --count 20
```

---

## 📝 Notes

- HAPI FHIR is a public test server
- Patient data may be limited or change over time
- Not all patients have conditions, medications, or allergies
- Use `find_patients.py` to get the latest patient list
- Patient IDs are saved to `patient_ids.txt` for reference
