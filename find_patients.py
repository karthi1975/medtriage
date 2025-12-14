#!/usr/bin/env python3
"""
Find patients from HAPI FHIR server
Usage: python3 find_patients.py [--count N]
"""
import requests
import json
import sys

def find_patients(count=20):
    """Fetch patients from HAPI FHIR server"""
    url = f"https://hapi.fhir.org/baseR4/Patient?_count={count}"
    headers = {"Accept": "application/fhir+json"}

    print(f"\n🔍 Fetching {count} patients from HAPI FHIR server...")
    print("=" * 80)

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        entries = data.get('entry', [])

        if not entries:
            print("\n⚠️  No patients found on the server.")
            return []

        print(f"\n✓ Found {len(entries)} patients:\n")

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

            # Calculate age if birthdate available
            age_str = ""
            if birthdate != 'N/A':
                try:
                    from datetime import datetime
                    birth_year = int(birthdate.split('-')[0])
                    current_year = datetime.now().year
                    age = current_year - birth_year
                    age_str = f" ({age} years old)"
                except:
                    pass

            print(f"{i}. Patient ID: {patient_id}")
            print(f"   Name: {full_name}")
            print(f"   Gender: {gender}")
            print(f"   Birth Date: {birthdate}{age_str}")
            print(f"   API Test: curl http://localhost:8002/api/v1/patients/{patient_id}")
            print()

        return patients

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error fetching patients: {e}")
        print("Make sure you have internet connection.")
        return []

def test_patient_api(patient_id):
    """Test if local API can retrieve patient data"""
    url = f"http://localhost:8002/api/v1/patients/{patient_id}"

    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return True, data
        else:
            return False, None
    except:
        return False, None

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description='Find patients from HAPI FHIR server for testing',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 find_patients.py              # Get 20 patients
  python3 find_patients.py --count 50   # Get 50 patients
  python3 find_patients.py --test       # Test API with found patients
        """
    )
    parser.add_argument('--count', type=int, default=20,
                       help='Number of patients to fetch (default: 20)')
    parser.add_argument('--test', action='store_true',
                       help='Test local API with first patient found')
    args = parser.parse_args()

    # Find patients
    patients = find_patients(args.count)

    if patients:
        print("=" * 80)
        print(f"\n✓ Total patients found: {len(patients)}")

        # Show quick test commands
        print("\n📋 Quick test commands (copy & paste):\n")
        for p in patients[:5]:
            print(f"  # {p['name']}")
            print(f"  curl http://localhost:8002/api/v1/patients/{p['id']}\n")

        # Test API if requested
        if args.test and patients:
            print("\n" + "=" * 80)
            print("🧪 Testing local API with first patient...\n")

            test_id = patients[0]['id']
            success, data = test_patient_api(test_id)

            if success:
                print(f"✓ Successfully retrieved patient {test_id} from local API")
                print(f"\nPatient data preview:")
                print(json.dumps(data, indent=2)[:500] + "...")
            else:
                print(f"❌ Could not retrieve patient from local API")
                print("Make sure your server is running at http://localhost:8002")

        # Save to file
        print("\n💾 Saving patient IDs to 'patient_ids.txt'...")
        with open('patient_ids.txt', 'w') as f:
            for p in patients:
                f.write(f"{p['id']}\t{p['name']}\t{p['gender']}\t{p['birthDate']}\n")
        print("✓ Saved to patient_ids.txt")

    else:
        print("\n⚠️  No patients found. Try again later or check your connection.")
        sys.exit(1)
