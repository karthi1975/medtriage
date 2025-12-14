"""
Provider Generator - Creates synthetic healthcare providers (Practitioners)
"""
import random
import json
from faker import Faker
from fhir.resources.practitioner import Practitioner
from fhir.resources.humanname import HumanName
from fhir.resources.contactpoint import ContactPoint
from fhir.resources.identifier import Identifier
from typing import List, Dict, Any

fake = Faker()


class ProviderGenerator:
    """Generate synthetic healthcare provider data"""

    def __init__(self, specialties_config: Dict[str, Any], facilities: List[Dict[str, Any]]):
        self.specialties = specialties_config['specialties']
        self.facilities = facilities
        self.credentials = ["MD", "DO", "PA", "NP"]

    def generate_providers(self, providers_per_specialty: int = 10) -> List[Dict[str, Any]]:
        """Generate providers across all specialties"""
        providers = []
        provider_id = 1

        for specialty in self.specialties:
            for i in range(providers_per_specialty):
                # Select facility from same region distribution
                facility = random.choice(self.facilities)

                provider_data = self._create_provider(
                    provider_id=provider_id,
                    specialty=specialty,
                    facility=facility
                )

                providers.append(provider_data)
                provider_id += 1

        return providers

    def _generate_npi(self) -> str:
        """Generate a 10-digit NPI number"""
        return str(random.randint(1000000000, 9999999999))

    def _create_provider(
        self,
        provider_id: int,
        specialty: Dict[str, Any],
        facility: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a provider with FHIR Practitioner resource + tribal DB data"""

        gender = random.choice(["male", "female"])
        if gender == "male":
            first_name = fake.first_name_male()
        else:
            first_name = fake.first_name_female()
        last_name = fake.last_name()

        # Select credential with weighted distribution (MD/DO more common)
        credential = random.choices(
            self.credentials,
            weights=[50, 30, 15, 5],  # MD most common
            k=1
        )[0]

        years_experience = random.randint(2, 35)

        npi = self._generate_npi()

        # Create FHIR Practitioner resource (simplified - detailed info in tribal DB)
        practitioner = Practitioner(
            id=f"PROV-{str(provider_id).zfill(5)}",
            active=True
        )

        # Additional tribal DB data
        facility_data = facility['tribal_data']

        provider_data = {
            "fhir_resource": practitioner,
            "tribal_data": {
                "provider_id": provider_id,
                "npi": npi,
                "first_name": first_name,
                "last_name": last_name,
                "specialty_id": specialty['id'],
                "specialty_name": specialty['name'],
                "facility_id": facility_data['facility_id'],
                "facility_name": facility_data['name'],
                "email": f"{first_name.lower()}.{last_name.lower()}@{facility_data['name'].replace(' ', '').lower()}.org",
                "phone": facility_data['phone'],
                "credentials": credential,
                "years_experience": years_experience,
                "languages": self._generate_languages(),
                "accepts_new_patients": random.choice([True, True, True, False]),  # 75% accept
                "telemedicine_available": random.choice([True, False]),
                "active": True
            }
        }

        return provider_data

    def _generate_languages(self) -> List[str]:
        """Generate languages spoken by provider"""
        languages = ["English"]

        # 30% chance of speaking Spanish
        if random.random() < 0.3:
            languages.append("Spanish")

        # 5% chance of other language
        if random.random() < 0.05:
            other_languages = ["Mandarin", "Vietnamese", "Tagalog", "German", "French"]
            languages.append(random.choice(other_languages))

        return languages

    def generate_provider_schedule(self, provider_id: int) -> List[Dict[str, Any]]:
        """Generate weekly availability schedule for provider"""
        schedules = []

        # Common schedule patterns
        patterns = [
            # Full-time (Mon-Fri)
            {"days": [1, 2, 3, 4, 5], "hours": [("08:00", "12:00"), ("13:00", "17:00")]},
            # Part-time (Mon, Wed, Fri)
            {"days": [1, 3, 5], "hours": [("08:00", "12:00"), ("13:00", "17:00")]},
            # Part-time (Tue, Thu)
            {"days": [2, 4], "hours": [("09:00", "12:00"), ("14:00", "17:00")]},
            # Full-time with half-day Friday
            {"days": [1, 2, 3, 4], "hours": [("08:00", "12:00"), ("13:00", "17:00")]},
        ]

        pattern = random.choice(patterns)

        for day in pattern['days']:
            for start_time, end_time in pattern['hours']:
                schedules.append({
                    "provider_id": provider_id,
                    "day_of_week": day,
                    "start_time": start_time,
                    "end_time": end_time,
                    "slot_duration_minutes": 15,
                    "active": True
                })

        return schedules

    def generate_provider_preferences(self, provider_id: int, specialty: str) -> List[Dict[str, Any]]:
        """Generate tribal knowledge preferences for provider"""
        preferences = []

        # Urgency slot preferences (all 21 specialties)
        urgency_slots = {
            "Family Medicine": {"emergency": 2, "urgent": 6, "semi_urgent": 10},
            "Cardiology": {"emergency": 3, "urgent": 5, "semi_urgent": 6},
            "Orthopedics": {"emergency": 1, "urgent": 4, "semi_urgent": 8},
            "Dermatology": {"emergency": 0, "urgent": 2, "semi_urgent": 10},
            "Mental Health": {"emergency": 2, "urgent": 4, "semi_urgent": 8},
            "Neurology": {"emergency": 2, "urgent": 5, "semi_urgent": 7},
            "Gastroenterology": {"emergency": 1, "urgent": 4, "semi_urgent": 8},
            "Pulmonology": {"emergency": 2, "urgent": 5, "semi_urgent": 6},
            "Endocrinology": {"emergency": 1, "urgent": 4, "semi_urgent": 8},
            "Nephrology": {"emergency": 2, "urgent": 4, "semi_urgent": 6},
            "Oncology": {"emergency": 1, "urgent": 6, "semi_urgent": 5},
            "Rheumatology": {"emergency": 0, "urgent": 3, "semi_urgent": 8},
            "Ophthalmology": {"emergency": 1, "urgent": 3, "semi_urgent": 10},
            "ENT": {"emergency": 1, "urgent": 4, "semi_urgent": 8},
            "Urology": {"emergency": 1, "urgent": 4, "semi_urgent": 8},
            "OB/GYN": {"emergency": 2, "urgent": 5, "semi_urgent": 7},
            "Pediatrics": {"emergency": 3, "urgent": 6, "semi_urgent": 10},
            "Geriatrics": {"emergency": 2, "urgent": 5, "semi_urgent": 8},
            "Infectious Disease": {"emergency": 1, "urgent": 5, "semi_urgent": 6},
            "Hematology": {"emergency": 1, "urgent": 4, "semi_urgent": 7},
            "Pain Management": {"emergency": 0, "urgent": 3, "semi_urgent": 10}
        }

        preferences.append({
            "provider_id": provider_id,
            "preference_type": "urgency_slots",
            "preference_key": "daily_slots",
            "preference_value": urgency_slots.get(specialty, {"emergency": 2, "urgent": 4, "semi_urgent": 6}),
            "priority": 8
        })

        # Scheduling rules (all 21 specialties)
        visit_durations = {
            "Family Medicine": {"new": 30, "followup": 15},
            "Cardiology": {"new": 45, "followup": 20},
            "Orthopedics": {"new": 30, "followup": 15},
            "Dermatology": {"new": 20, "followup": 10},
            "Mental Health": {"new": 60, "followup": 30},
            "Neurology": {"new": 45, "followup": 25},
            "Gastroenterology": {"new": 40, "followup": 20},
            "Pulmonology": {"new": 40, "followup": 20},
            "Endocrinology": {"new": 45, "followup": 25},
            "Nephrology": {"new": 40, "followup": 25},
            "Oncology": {"new": 60, "followup": 30},
            "Rheumatology": {"new": 45, "followup": 25},
            "Ophthalmology": {"new": 30, "followup": 15},
            "ENT": {"new": 30, "followup": 15},
            "Urology": {"new": 30, "followup": 20},
            "OB/GYN": {"new": 40, "followup": 20},
            "Pediatrics": {"new": 30, "followup": 20},
            "Geriatrics": {"new": 50, "followup": 30},
            "Infectious Disease": {"new": 45, "followup": 25},
            "Hematology": {"new": 40, "followup": 25},
            "Pain Management": {"new": 45, "followup": 25}
        }

        preferences.append({
            "provider_id": provider_id,
            "preference_type": "scheduling_rules",
            "preference_key": "appointment_durations",
            "preference_value": {
                **visit_durations.get(specialty, {"new": 30, "followup": 15}),
                "buffer_between_appointments": 5,
                "max_overbook_per_day": random.randint(1, 3),
                "lunch_break": {"start": "12:00", "end": "13:00"}
            },
            "priority": 7
        })

        # Patient type preferences (all 21 specialties)
        patient_types = {
            "Family Medicine": ["pediatric", "geriatric", "chronic_disease", "preventive_care"],
            "Cardiology": ["chronic_disease", "post_procedure_followup", "diabetic_cardiac"],
            "Orthopedics": ["sports_medicine", "joint_replacement", "fracture_care"],
            "Dermatology": ["cosmetic", "medical", "surgical"],
            "Mental Health": ["anxiety", "depression", "medication_management"],
            "Neurology": ["headache", "seizure", "stroke_followup", "neurodegenerative"],
            "Gastroenterology": ["endoscopy", "IBD", "liver_disease"],
            "Pulmonology": ["COPD", "asthma", "sleep_apnea"],
            "Endocrinology": ["diabetes", "thyroid", "metabolic_disorders"],
            "Nephrology": ["dialysis", "CKD", "transplant"],
            "Oncology": ["chemotherapy", "radiation", "survivorship"],
            "Rheumatology": ["autoimmune", "inflammatory_arthritis"],
            "Ophthalmology": ["cataract", "glaucoma", "retinal"],
            "ENT": ["sinus", "hearing", "throat"],
            "Urology": ["prostate", "stones", "bladder"],
            "OB/GYN": ["prenatal", "gynecology", "menopause"],
            "Pediatrics": ["well_child", "immunizations", "sick_visits"],
            "Geriatrics": ["comprehensive_assessment", "falls", "dementia"],
            "Infectious Disease": ["HIV", "hepatitis", "complex_infections"],
            "Hematology": ["anemia", "clotting_disorders", "blood_cancers"],
            "Pain Management": ["chronic_pain", "interventional", "medication_management"]
        }

        preferences.append({
            "provider_id": provider_id,
            "preference_type": "patient_type_preferences",
            "preference_key": "preferred_types",
            "preference_value": {"types": patient_types.get(specialty, [])},
            "priority": 5
        })

        return preferences


def main():
    """Test provider generation"""
    import os

    # Load specialties config
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'specialties.json')
    with open(config_path, 'r') as f:
        specialties_config = json.load(f)

    # Mock facilities
    facilities = [
        {"id": 1, "name": "Salt Lake Medical Center", "phone": "801-555-0001"},
        {"id": 2, "name": "Utah Valley Clinic", "phone": "801-555-0002"}
    ]

    # Generate 2 providers per specialty
    generator = ProviderGenerator(specialties_config, facilities)
    providers = generator.generate_providers(2)

    print(f"Generated {len(providers)} providers")
    print(f"\nSample provider:")
    provider = providers[0]
    print(f"ID: {provider['tribal_data']['provider_id']}")
    print(f"Name: Dr. {provider['tribal_data']['first_name']} {provider['tribal_data']['last_name']}, {provider['tribal_data']['credentials']}")
    print(f"NPI: {provider['tribal_data']['npi']}")
    print(f"Specialty: {provider['tribal_data']['specialty_name']}")
    print(f"Facility: {provider['tribal_data']['facility_name']}")
    print(f"Experience: {provider['tribal_data']['years_experience']} years")
    print(f"Languages: {', '.join(provider['tribal_data']['languages'])}")

    # Generate schedule
    schedule = generator.generate_provider_schedule(1)
    print(f"\nGenerated {len(schedule)} schedule slots")

    # Generate preferences
    preferences = generator.generate_provider_preferences(1, "Family Medicine")
    print(f"Generated {len(preferences)} preference records")


if __name__ == "__main__":
    main()
