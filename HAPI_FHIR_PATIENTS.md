# HAPI FHIR Test Patients

Real patient IDs from the public HAPI FHIR server (https://hapi.fhir.org/baseR4)

---

## Real Patient IDs for Testing

### Patient 1: Riquelme Luis
- **Patient ID**: `47077394`
- **Name**: Riquelme Luis
- **Gender**: Male
- **Birth Date**: 1982-01-01 (43 years old)
- **FHIR URL**: https://hapi.fhir.org/baseR4/Patient/47077394

**Test Commands**:
```bash
# Get complete patient history
curl http://localhost:8002/api/v1/patients/47077394

# Get demographics
curl http://localhost:8002/api/v1/patients/47077394/demographics

# Get conditions
curl http://localhost:8002/api/v1/patients/47077394/conditions

# Get medications
curl http://localhost:8002/api/v1/patients/47077394/medications

# Get allergies
curl http://localhost:8002/api/v1/patients/47077394/allergies

# Triage with patient context
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have chest pain and shortness of breath",
    "patient_id": "47077394"
  }'
```

---

### Patient 2: Aage Test
- **Patient ID**: `47936371`
- **Name**: Aage Test
- **Gender**: Male
- **Birth Date**: 2002-10-27 (22 years old)
- **FHIR URL**: https://hapi.fhir.org/baseR4/Patient/47936371

**Test Commands**:
```bash
# Get complete patient history
curl http://localhost:8002/api/v1/patients/47936371

# Triage with patient context
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a severe headache and fever",
    "patient_id": "47936371"
  }'
```

---

### Patient 3: Aage Test (Duplicate)
- **Patient ID**: `47936378`
- **Name**: Aage Test
- **Gender**: Male
- **Birth Date**: 2002-10-27 (22 years old)
- **FHIR URL**: https://hapi.fhir.org/baseR4/Patient/47936378

---

## How to Find More Patients

### Method 1: Using curl and HAPI FHIR API directly
```bash
# Get 10 patients from HAPI FHIR
curl -s "https://hapi.fhir.org/baseR4/Patient?_count=10" \
  -H "Accept: application/fhir+json" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); \
  [print(f\"ID: {p['resource']['id']}, Name: {p['resource'].get('name', [{}])[0].get('given', [''])[0]} {p['resource'].get('name', [{}])[0].get('family', '')}\") \
  for p in data.get('entry', [])]"
```

### Method 2: Search by name
```bash
# Search for patients with specific name
curl -s "https://hapi.fhir.org/baseR4/Patient?name=Smith&_count=5" \
  -H "Accept: application/fhir+json"
```

### Method 3: Search by gender
```bash
# Search for female patients
curl -s "https://hapi.fhir.org/baseR4/Patient?gender=female&_count=5" \
  -H "Accept: application/fhir+json"
```

### Method 4: Use the HAPI FHIR Web Interface
Visit: https://hapi.fhir.org/

1. Click on "Patient" in the left sidebar
2. Click "Search" to see available patients
3. Copy the patient ID from the results

---

## Script to Find Patients

Save this as `find_patients.sh`:

```bash
#!/bin/bash

echo "Fetching patients from HAPI FHIR server..."
echo ""

curl -s "https://hapi.fhir.org/baseR4/Patient?_count=20" \
  -H "Accept: application/fhir+json" | \
python3 << 'EOF'
import sys
import json

try:
    data = json.load(sys.stdin)
    entries = data.get('entry', [])

    print(f"Found {len(entries)} patients:\n")
    print("=" * 80)

    for i, entry in enumerate(entries, 1):
        resource = entry.get('resource', {})
        patient_id = resource.get('id', 'N/A')

        # Get name
        names = resource.get('name', [])
        if names:
            given = ' '.join(names[0].get('given', []))
            family = names[0].get('family', '')
            full_name = f"{given} {family}".strip()
        else:
            full_name = 'N/A'

        # Get gender and birthdate
        gender = resource.get('gender', 'N/A')
        birthdate = resource.get('birthDate', 'N/A')

        print(f"{i}. Patient ID: {patient_id}")
        print(f"   Name: {full_name}")
        print(f"   Gender: {gender}")
        print(f"   Birth Date: {birthdate}")
        print(f"   Test URL: http://localhost:8002/api/v1/patients/{patient_id}")
        print()

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
EOF
```

Make it executable:
```bash
chmod +x find_patients.sh
./find_patients.sh
```

---

## Python Script to Find Patients

Save this as `find_patients.py`:

```python
#!/usr/bin/env python3
import requests
import json

def find_patients(count=20):
    """Fetch patients from HAPI FHIR server"""
    url = f"https://hapi.fhir.org/baseR4/Patient?_count={count}"
    headers = {"Accept": "application/fhir+json"}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        entries = data.get('entry', [])
        print(f"\nFound {len(entries)} patients:\n")
        print("=" * 80)

        patients = []
        for i, entry in enumerate(entries, 1):
            resource = entry.get('resource', {})
            patient_id = resource.get('id', 'N/A')

            # Get name
            names = resource.get('name', [])
            if names:
                given = ' '.join(names[0].get('given', []))
                family = names[0].get('family', '')
                full_name = f"{given} {family}".strip()
            else:
                full_name = 'N/A'

            # Get other details
            gender = resource.get('gender', 'N/A')
            birthdate = resource.get('birthDate', 'N/A')

            patient_info = {
                'id': patient_id,
                'name': full_name,
                'gender': gender,
                'birthDate': birthdate
            }
            patients.append(patient_info)

            print(f"{i}. Patient ID: {patient_id}")
            print(f"   Name: {full_name}")
            print(f"   Gender: {gender}")
            print(f"   Birth Date: {birthdate}")
            print(f"   Test: curl http://localhost:8002/api/v1/patients/{patient_id}")
            print()

        return patients

    except requests.exceptions.RequestException as e:
        print(f"Error fetching patients: {e}")
        return []

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Find patients from HAPI FHIR server')
    parser.add_argument('--count', type=int, default=20, help='Number of patients to fetch')
    args = parser.parse_args()

    patients = find_patients(args.count)

    if patients:
        print("\n" + "=" * 80)
        print(f"Total patients found: {len(patients)}")
        print("\nQuick test commands:")
        for p in patients[:5]:
            print(f"  curl http://localhost:8002/api/v1/patients/{p['id']}")
```

Run it:
```bash
python3 find_patients.py
python3 find_patients.py --count 50  # Get more patients
```

---

## Quick Test Examples with Real Patient IDs

### Test Patient Data Retrieval
```bash
# Patient 47077394 (Riquelme Luis)
curl http://localhost:8002/api/v1/patients/47077394 | python3 -m json.tool

# Patient demographics only
curl http://localhost:8002/api/v1/patients/47077394/demographics | python3 -m json.tool
```

### Test Triage with Patient Context
```bash
# Emergency case with patient context
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe crushing chest pain radiating to my left arm",
    "patient_id": "47077394"
  }' | python3 -m json.tool

# Urgent case with patient context
curl -X POST http://localhost:8002/api/v1/triage \
  -H "Content-Type: application/json" \
  -d '{
    "message": "High fever of 103F and severe headache for 2 days",
    "patient_id": "47936371"
  }' | python3 -m json.tool
```

### Test Chat with Patient Context
```bash
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been feeling very tired and thirsty lately",
    "patient_id": "47077394"
  }' | python3 -m json.tool
```

---

## Important Notes

1. **Public Test Server**: HAPI FHIR is a public test server, patient data may be limited
2. **Data Availability**: Not all patients have conditions, medications, or allergies
3. **Temporary Data**: Patient data on the test server may be deleted periodically
4. **Rate Limiting**: Don't make too many requests in quick succession

---

## Recommended Test Patient IDs

Use these patient IDs for testing:
- `47077394` - Adult male (43 years old)
- `47936371` - Young adult male (22 years old)
- `47936378` - Young adult male (22 years old)

For more patients, run the `find_patients.py` script or visit https://hapi.fhir.org
