"""
Patient Generator - Creates synthetic FHIR Patient resources
"""
import random
import json
from datetime import datetime, timedelta
from faker import Faker
from fhir.resources.patient import Patient
from fhir.resources.humanname import HumanName
from fhir.resources.address import Address
from fhir.resources.contactpoint import ContactPoint
from fhir.resources.extension import Extension
from typing import List, Dict, Any

fake = Faker()


class PatientGenerator:
    """Generate synthetic patient data for Utah healthcare network"""

    def __init__(self, regions_config: Dict[str, Any]):
        self.regions = regions_config['regions']

    def generate_patients(self, count: int = 500) -> List[Patient]:
        """Generate specified number of patients distributed across regions"""
        patients = []

        for i in range(count):
            region = self._select_region()
            city_info = random.choice(region['cities'])
            age_group = self._select_age_group(region['demographics']['age_distribution'])
            gender = self._select_gender(region['demographics']['gender_distribution'])

            patient = self._create_patient(
                patient_id=f"PT-{str(i+1).zfill(5)}",
                region=region['name'],
                city=city_info['name'],
                zip_code=random.choice(city_info['zip_codes']),
                age_group=age_group,
                gender=gender
            )

            patients.append(patient)

        return patients

    def _select_region(self) -> Dict[str, Any]:
        """Select region based on population percentage"""
        total = sum(r['population_percentage'] for r in self.regions)
        rand = random.uniform(0, total)

        cumulative = 0
        for region in self.regions:
            cumulative += region['population_percentage']
            if rand <= cumulative:
                return region

        return self.regions[0]

    def _select_age_group(self, distribution: Dict[str, int]) -> str:
        """Select age group based on distribution"""
        total = sum(distribution.values())
        rand = random.uniform(0, total)

        cumulative = 0
        for age_group, percentage in distribution.items():
            cumulative += percentage
            if rand <= cumulative:
                return age_group

        return "18-35"

    def _select_gender(self, distribution: Dict[str, int]) -> str:
        """Select gender based on distribution"""
        rand = random.uniform(0, 100)
        if rand <= distribution['male']:
            return "male"
        return "female"

    def _age_from_group(self, age_group: str) -> int:
        """Generate specific age from age group range"""
        ranges = {
            "0-17": (0, 17),
            "18-35": (18, 35),
            "36-50": (36, 50),
            "51-65": (51, 65),
            "66+": (66, 95)
        }

        min_age, max_age = ranges.get(age_group, (18, 65))
        return random.randint(min_age, max_age)

    def _create_patient(
        self,
        patient_id: str,
        region: str,
        city: str,
        zip_code: str,
        age_group: str,
        gender: str
    ) -> Patient:
        """Create a FHIR Patient resource"""

        age = self._age_from_group(age_group)
        birth_date = datetime.now() - timedelta(days=age*365.25)

        # Generate name based on gender
        if gender == "male":
            first_name = fake.first_name_male()
            last_name = fake.last_name()
        else:
            first_name = fake.first_name_female()
            last_name = fake.last_name()

        # Create patient resource (simplified - using just essential fields)
        patient = Patient(
            id=patient_id,
            gender=gender,
            birthDate=birth_date.strftime("%Y-%m-%d"),
            active=True
        )

        # Add custom extensions for allergies and conditions (will be populated later)
        # These are placeholders that will be populated by condition/allergy generators
        patient.extension = []

        return patient

    def add_allergy_extension(self, patient: Patient, allergies: List[str]):
        """Add allergy information via FHIR extension"""
        if allergies:
            allergy_ext = Extension(
                url="http://hl7.org/fhir/StructureDefinition/patient-allergy",
                valueString=", ".join(allergies)
            )
            if not patient.extension:
                patient.extension = []
            patient.extension.append(allergy_ext)

    def add_condition_extension(self, patient: Patient, conditions: List[str]):
        """Add condition information via FHIR extension"""
        if conditions:
            condition_ext = Extension(
                url="http://hl7.org/fhir/StructureDefinition/patient-condition",
                valueString=", ".join(conditions)
            )
            if not patient.extension:
                patient.extension = []
            patient.extension.append(condition_ext)


def main():
    """Test patient generation"""
    import os

    # Load regions config
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'utah_regions.json')
    with open(config_path, 'r') as f:
        regions_config = json.load(f)

    # Generate 10 test patients
    generator = PatientGenerator(regions_config)
    patients = generator.generate_patients(10)

    print(f"Generated {len(patients)} patients")
    print(f"\nSample patient:")
    print(f"ID: {patients[0].id}")
    print(f"Name: {patients[0].name[0].given[0]} {patients[0].name[0].family}")
    print(f"Gender: {patients[0].gender}")
    print(f"Birth Date: {patients[0].birthDate}")
    print(f"City: {patients[0].address[0].city}")
    print(f"State: {patients[0].address[0].state}")
    print(f"ZIP: {patients[0].address[0].postalCode}")


if __name__ == "__main__":
    main()
