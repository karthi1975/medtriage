"""
MediChat Synthetic Data Generation - Main Orchestrator
Generates complete Utah healthcare ecosystem with 500 patients, 50 providers, 21 facilities
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Any

# Import generators
from generators.patient_generator import PatientGenerator
from generators.provider_generator import ProviderGenerator
from generators.facility_generator import FacilityGenerator
from generators.clinical_generator import ClinicalDataGenerator

# Import loaders
from loaders.fhir_loader import FHIRLoader
from loaders.tribal_loader import TribalDBLoader


def load_configs() -> Dict[str, Any]:
    """Load all configuration files"""
    config_dir = os.path.join(os.path.dirname(__file__), 'config')

    with open(os.path.join(config_dir, 'utah_regions.json'), 'r') as f:
        regions_config = json.load(f)

    with open(os.path.join(config_dir, 'specialties.json'), 'r') as f:
        specialties_config = json.load(f)

    with open(os.path.join(config_dir, 'medical_codes', 'loinc_common_labs.json'), 'r') as f:
        loinc_config = json.load(f)

    with open(os.path.join(config_dir, 'medical_codes', 'rxnorm_common_meds.json'), 'r') as f:
        rxnorm_config = json.load(f)

    return {
        'regions': regions_config,
        'specialties': specialties_config,
        'loinc': loinc_config,
        'rxnorm': rxnorm_config
    }


def main():
    """Main data generation orchestrator"""
    print("=" * 80)
    print("MediChat Synthetic Data Generation")
    print("=" * 80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Load configurations
    print("Step 1: Loading configurations...")
    configs = load_configs()
    print(f"  ✓ Loaded {len(configs['regions']['regions'])} regions")
    print(f"  ✓ Loaded {len(configs['specialties']['specialties'])} specialties")
    print(f"  ✓ Loaded {len(configs['loinc']['common_labs'])} lab codes")
    print(f"  ✓ Loaded {len(configs['rxnorm']['medications_by_condition'])} medication categories\n")

    # Step 2: Generate facilities
    print("Step 2: Generating facilities...")
    facility_gen = FacilityGenerator(configs['regions'], configs['specialties'])
    facilities = facility_gen.generate_facilities(facilities_per_region=3)
    print(f"  ✓ Generated {len(facilities)} facilities across Utah\n")

    # Step 3: Generate providers
    print("Step 3: Generating providers...")
    provider_gen = ProviderGenerator(
        configs['specialties'],
        facilities
    )
    providers = provider_gen.generate_providers(providers_per_specialty=10)
    print(f"  ✓ Generated {len(providers)} providers across {len(configs['specialties']['specialties'])} specialties\n")

    # Step 4: Generate provider schedules and preferences
    print("Step 4: Generating provider schedules and preferences...")
    all_schedules = []
    all_preferences = []

    for provider in providers:
        provider_id = provider['tribal_data']['provider_id']
        specialty = provider['tribal_data']['specialty_name']

        schedules = provider_gen.generate_provider_schedule(provider_id)
        all_schedules.extend(schedules)

        preferences = provider_gen.generate_provider_preferences(provider_id, specialty)
        all_preferences.extend(preferences)

    print(f"  ✓ Generated {len(all_schedules)} schedule slots")
    print(f"  ✓ Generated {len(all_preferences)} preference records\n")

    # Step 5: Generate clinic rules
    print("Step 5: Generating clinic rules...")
    all_clinic_rules = []

    for facility in facilities:
        facility_id = facility['tribal_data']['facility_id']
        specialty_ids = facility['offered_specialty_ids']

        rules = facility_gen.generate_clinic_rules(facility_id, specialty_ids)
        all_clinic_rules.extend(rules)

    print(f"  ✓ Generated {len(all_clinic_rules)} clinic rules\n")

    # Step 6: Generate patients
    print("Step 6: Generating patients...")
    patient_gen = PatientGenerator(configs['regions'])
    patients = patient_gen.generate_patients(count=500)
    print(f"  ✓ Generated {len(patients)} patients\n")

    # Step 7: Generate clinical data for patients
    print("Step 7: Generating clinical data...")
    clinical_gen = ClinicalDataGenerator(
        configs['specialties'],
        configs['loinc'],
        configs['rxnorm']
    )

    all_conditions = []
    all_observations = []
    all_medications = []
    all_allergies = []

    for i, patient in enumerate(patients):
        if (i + 1) % 100 == 0:
            print(f"  Processing patient {i+1}/{len(patients)}...")

        # Calculate patient age
        # birthDate is already a date/datetime object from FHIR Patient
        if isinstance(patient.birthDate, str):
            birth_date = datetime.strptime(patient.birthDate, "%Y-%m-%d")
        else:
            # Convert date to datetime
            birth_date = datetime.combine(patient.birthDate, datetime.min.time())

        age = (datetime.now() - birth_date).days // 365

        # Generate clinical data
        conditions = clinical_gen.generate_conditions_for_patient(patient.id, age)
        observations = clinical_gen.generate_observations_for_patient(patient.id, conditions)
        medications = clinical_gen.generate_medications_for_patient(patient.id, conditions)
        allergies = clinical_gen.generate_allergies_for_patient(patient.id)

        # Add extensions to patient
        if conditions:
            condition_names = [c.code.coding[0].display for c in conditions if c.code and c.code.coding]
            patient_gen.add_condition_extension(patient, condition_names[:3])  # Limit to 3

        if allergies:
            allergy_names = [a.code.coding[0].display for a in allergies if a.code and a.code.coding]
            patient_gen.add_allergy_extension(patient, allergy_names)

        all_conditions.extend(conditions)
        all_observations.extend(observations)
        all_medications.extend(medications)
        all_allergies.extend(allergies)

    print(f"  ✓ Generated {len(all_conditions)} conditions")
    print(f"  ✓ Generated {len(all_observations)} observations")
    print(f"  ✓ Generated {len(all_medications)} medications")
    print(f"  ✓ Generated {len(all_allergies)} allergies\n")

    # Step 8: Load data to HAPI FHIR server
    print("Step 8: Loading data to HAPI FHIR server...")
    fhir_loader = FHIRLoader(fhir_base_url="http://localhost:8081/fhir")

    # Collect all FHIR resources
    fhir_resources = []

    # Add facilities (Organizations)
    fhir_resources.extend([f['fhir_resource'] for f in facilities])

    # Add providers (Practitioners)
    fhir_resources.extend([p['fhir_resource'] for p in providers])

    # Add patients
    fhir_resources.extend(patients)

    # Add clinical data
    fhir_resources.extend(all_conditions)
    fhir_resources.extend(all_observations)
    fhir_resources.extend(all_medications)
    fhir_resources.extend(all_allergies)

    print(f"  Total FHIR resources to load: {len(fhir_resources)}")
    print(f"  Loading in batches of 50...")

    results = fhir_loader.load_resources_in_batches(fhir_resources, batch_size=50)

    successful_batches = sum(1 for r in results if r['success'])
    print(f"  ✓ Loaded {successful_batches}/{len(results)} batches successfully\n")

    # Step 9: Load data to Tribal Knowledge DB
    print("Step 9: Loading data to Tribal Knowledge database...")
    tribal_loader = TribalDBLoader(
        db_url="postgresql://tribaluser:tribalpassword@localhost:5433/tribal_knowledge"
    )

    tribal_loader.load_facilities(facilities)
    tribal_loader.load_providers(providers)
    tribal_loader.load_provider_schedules(all_schedules)
    tribal_loader.load_provider_preferences(all_preferences)
    tribal_loader.load_clinic_rules(all_clinic_rules)

    print("\nStep 10: Verifying data...")
    counts = tribal_loader.verify_counts()
    print("  Tribal DB counts:")
    for table, count in counts.items():
        print(f"    {table}: {count}")

    tribal_loader.close()

    # Verify FHIR counts
    print("\n  FHIR Server counts:")
    for resource_type in ["Patient", "Practitioner", "Organization", "Condition", "Observation", "MedicationRequest", "AllergyIntolerance"]:
        count = fhir_loader.verify_resource_count(resource_type)
        print(f"    {resource_type}: {count}")

    print("\n" + "=" * 80)
    print("✓ Data generation complete!")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)


if __name__ == "__main__":
    main()
