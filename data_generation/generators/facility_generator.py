"""
Facility Generator - Creates synthetic healthcare facilities (Organizations)
"""
import random
import json
from faker import Faker
from fhir.resources.organization import Organization
from fhir.resources.contactpoint import ContactPoint
from fhir.resources.address import Address
from typing import List, Dict, Any

fake = Faker()


class FacilityGenerator:
    """Generate synthetic healthcare facility data"""

    def __init__(self, regions_config: Dict[str, Any], specialties_config: Dict[str, Any]):
        self.regions = regions_config['regions']
        self.specialties = specialties_config['specialties']

    def generate_facilities(self, facilities_per_region: int = 3) -> List[Dict[str, Any]]:
        """Generate facilities across all Utah regions"""
        facilities = []
        facility_id = 1

        for region in self.regions:
            for i in range(facilities_per_region):
                facility_data = self._create_facility(
                    facility_id=facility_id,
                    region=region,
                    facility_index=i
                )

                facilities.append(facility_data)
                facility_id += 1

        return facilities

    def _create_facility(
        self,
        facility_id: int,
        region: Dict[str, Any],
        facility_index: int
    ) -> Dict[str, Any]:
        """Create a facility with FHIR Organization resource + tribal DB data"""

        # Select a city from the region
        city_info = random.choice(region['cities'])
        city = city_info['name']
        zip_code = random.choice(city_info['zip_codes'])

        # Generate facility name
        facility_types = [
            "Medical Center",
            "Health Clinic",
            "Family Practice",
            "Specialty Care Center",
            "Community Health Center"
        ]

        facility_type = random.choice(facility_types)
        facility_name = f"{city} {facility_type}"

        # Ensure unique names within region
        if facility_index > 0:
            facility_name = f"{city} {facility_type} - {chr(65 + facility_index)}"  # A, B, C

        # Generate phone number
        phone = f"801-{random.randint(200, 999)}-{random.randint(1000, 9999)}"

        # Create FHIR Organization resource (simplified - contact info in tribal DB)
        organization = Organization(
            id=f"FAC-{str(facility_id).zfill(5)}",
            name=facility_name,
            active=True
        )

        # Determine which specialties are offered (2-4 specialties per facility)
        num_specialties = random.randint(2, min(4, len(self.specialties)))
        offered_specialties = random.sample(self.specialties, num_specialties)

        # Generate hours of operation
        hours = self._generate_hours()

        # Additional tribal DB data
        facility_data = {
            "fhir_resource": organization,
            "tribal_data": {
                "facility_id": facility_id,
                "name": facility_name,
                "type": facility_type,
                "address_line1": fake.street_address(),
                "city": city,
                "state": "UT",
                "zip_code": zip_code,
                "region": region['name'],
                "latitude": float(fake.latitude()),
                "longitude": float(fake.longitude()),
                "phone": phone,
                "email": f"contact@{facility_name.replace(' ', '').lower()}.org",
                "website": f"https://www.{facility_name.replace(' ', '').lower()}.org",
                "hours_of_operation": hours,
                "services_offered": [s['name'] for s in offered_specialties],
                "active": True
            },
            "offered_specialty_ids": [s['id'] for s in offered_specialties]
        }

        return facility_data

    def _generate_hours(self) -> Dict[str, str]:
        """Generate hours of operation"""
        # Most clinics operate Monday-Friday
        standard_hours = {
            "Monday": "08:00-17:00",
            "Tuesday": "08:00-17:00",
            "Wednesday": "08:00-17:00",
            "Thursday": "08:00-17:00",
            "Friday": "08:00-17:00"
        }

        # Some offer Saturday hours
        if random.random() < 0.3:
            standard_hours["Saturday"] = "09:00-13:00"

        return standard_hours

    def generate_clinic_rules(self, facility_id: int, specialty_ids: List[int]) -> List[Dict[str, Any]]:
        """Generate tribal knowledge clinic rules for facility"""
        rules = []

        # Scheduling policy
        rules.append({
            "facility_id": facility_id,
            "rule_type": "scheduling_policy",
            "rule_name": "appointment_booking",
            "rule_definition": {
                "advance_booking_limit_days": random.choice([30, 60, 90]),
                "same_day_appointments_available": random.choice([True, False]),
                "same_day_cutoff_time": "15:00",
                "cancellation_policy_hours": 24,
                "waitlist_enabled": True,
                "double_booking_policy": "urgent_only"
            },
            "priority": 8,
            "active": True
        })

        # Specialty hours (if multiple specialties)
        if len(specialty_ids) > 1:
            specialty_hours = {}
            for spec_id in specialty_ids:
                # Different specialties may have different availability
                days = random.sample(
                    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    k=random.randint(3, 5)
                )
                specialty_hours[f"specialty_{spec_id}"] = {
                    "days": days,
                    "hours": "08:00-17:00"
                }

            rules.append({
                "facility_id": facility_id,
                "rule_type": "specialty_hours",
                "rule_name": "specialty_availability",
                "rule_definition": specialty_hours,
                "priority": 7,
                "active": True
            })

        # Insurance accepted
        insurance_options = [
            "Medicare",
            "Medicaid",
            "Blue Cross Blue Shield UT",
            "SelectHealth",
            "University of Utah Health Plans",
            "Regence BlueCross BlueShield",
            "Humana",
            "Aetna",
            "Cigna",
            "United Healthcare"
        ]

        rules.append({
            "facility_id": facility_id,
            "rule_type": "insurance_policy",
            "rule_name": "accepted_insurance",
            "rule_definition": {
                "accepted_plans": random.sample(insurance_options, k=random.randint(5, 8))
            },
            "priority": 6,
            "active": True
        })

        return rules


def main():
    """Test facility generation"""
    import os

    # Load configs
    regions_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'utah_regions.json')
    specialties_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'specialties.json')

    with open(regions_path, 'r') as f:
        regions_config = json.load(f)

    with open(specialties_path, 'r') as f:
        specialties_config = json.load(f)

    # Generate 1 facility per region for testing
    generator = FacilityGenerator(regions_config, specialties_config)
    facilities = generator.generate_facilities(1)

    print(f"Generated {len(facilities)} facilities")
    print(f"\nSample facility:")
    facility = facilities[0]
    print(f"ID: {facility['tribal_data']['facility_id']}")
    print(f"Name: {facility['tribal_data']['name']}")
    print(f"Type: {facility['tribal_data']['type']}")
    print(f"Region: {facility['tribal_data']['region']}")
    print(f"City: {facility['tribal_data']['city']}")
    print(f"Phone: {facility['tribal_data']['phone']}")
    print(f"Services: {', '.join(facility['tribal_data']['services_offered'])}")
    print(f"Hours: {facility['tribal_data']['hours_of_operation']}")

    # Generate clinic rules
    rules = generator.generate_clinic_rules(1, facility['offered_specialty_ids'])
    print(f"\nGenerated {len(rules)} clinic rules")


if __name__ == "__main__":
    main()
