"""
Clinical Data Generator - Creates conditions, observations, medications, allergies
"""
import random
import json
from datetime import datetime, timedelta
from fhir.resources.condition import Condition
from fhir.resources.observation import Observation
from fhir.resources.medicationrequest import MedicationRequest
from fhir.resources.allergyintolerance import AllergyIntolerance
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.codeablereference import CodeableReference
from fhir.resources.coding import Coding
from fhir.resources.quantity import Quantity
from fhir.resources.reference import Reference
from typing import List, Dict, Any, Optional


class ClinicalDataGenerator:
    """Generate clinical FHIR resources for patients"""

    def __init__(self, specialties_config: Dict, loinc_config: Dict, rxnorm_config: Dict):
        self.specialties = specialties_config['specialties']
        self.loinc_labs = loinc_config
        self.medications_by_condition = rxnorm_config['medications_by_condition']

        # Common allergies
        self.common_allergies = [
            {"code": "387207008", "display": "Penicillin"},
            {"code": "300916003", "display": "Peanuts"},
            {"code": "102263004", "display": "Eggs"},
            {"code": "227037002", "display": "Fish"},
            {"code": "762952008", "display": "Shellfish"},
            {"code": "3718001", "display": "Cow's milk"},
            {"code": "256277009", "display": "Grass pollen"},
            {"code": "387517004", "display": "Aspirin"},
            {"code": "387207008", "display": "Sulfa drugs"}
        ]

    def generate_conditions_for_patient(
        self,
        patient_id: str,
        patient_age: int,
        count: Optional[int] = None
    ) -> List[Condition]:
        """Generate 0-5 conditions for a patient based on age"""
        if count is None:
            # Older patients tend to have more conditions
            if patient_age < 18:
                count = random.choices([0, 1, 2], weights=[60, 30, 10])[0]
            elif patient_age < 40:
                count = random.choices([0, 1, 2, 3], weights=[40, 35, 20, 5])[0]
            elif patient_age < 65:
                count = random.choices([0, 1, 2, 3, 4], weights=[20, 30, 30, 15, 5])[0]
            else:
                count = random.choices([1, 2, 3, 4, 5], weights=[10, 25, 30, 25, 10])[0]

        conditions = []
        all_conditions = []

        # Collect all possible conditions from specialties
        for specialty in self.specialties:
            all_conditions.extend(specialty['common_conditions'])

        # Select random conditions
        selected = random.sample(all_conditions, min(count, len(all_conditions)))

        for i, cond_data in enumerate(selected):
            # Simplified Condition resource with code and clinicalStatus
            condition = Condition(
                id=f"COND-{patient_id}-{str(i+1).zfill(3)}",
                clinicalStatus=CodeableConcept(
                    coding=[Coding(
                        system="http://terminology.hl7.org/CodeSystem/condition-clinical",
                        code="active",
                        display="Active"
                    )]
                ),
                code=CodeableConcept(
                    coding=[Coding(
                        system="http://snomed.info/sct",
                        code=cond_data['code'],
                        display=cond_data['display']
                    )]
                ),
                subject=Reference(reference=f"Patient/{patient_id}")
            )

            conditions.append(condition)

        return conditions

    def generate_observations_for_patient(
        self,
        patient_id: str,
        conditions: List[Condition]
    ) -> List[Observation]:
        """Generate lab results and vitals"""
        observations = []

        # Always generate common vitals
        common_labs = self.loinc_labs['common_labs'][:10]  # First 10 common labs

        for i, lab in enumerate(common_labs):
            # Generate value in or near reference range
            ref_range = lab['reference_range']
            is_abnormal = random.random() < 0.2  # 20% abnormal

            if is_abnormal:
                # Generate abnormal value
                if random.choice([True, False]):
                    value = ref_range['low'] * random.uniform(0.6, 0.95)
                else:
                    value = ref_range['high'] * random.uniform(1.05, 1.4)
            else:
                # Generate normal value
                value = random.uniform(ref_range['low'], ref_range['high'])

            # Simplified Observation resource with required code field
            observation = Observation(
                id=f"OBS-{patient_id}-{str(i+1).zfill(3)}",
                status="final",
                code=CodeableConcept(
                    coding=[Coding(
                        system="http://loinc.org",
                        code=lab['code'],
                        display=lab['display']
                    )]
                ),
                subject=Reference(reference=f"Patient/{patient_id}")
            )

            observations.append(observation)

        return observations

    def generate_medications_for_patient(
        self,
        patient_id: str,
        conditions: List[Condition]
    ) -> List[MedicationRequest]:
        """Generate medications based on patient conditions"""
        medications = []

        # Extract condition displays
        condition_names = []
        for cond in conditions:
            if cond.code and cond.code.coding:
                display = cond.code.coding[0].display
                condition_names.append(display)

        # Map conditions to medication categories
        med_count = 0
        for condition_name in condition_names:
            # Find matching medications
            matched_meds = []

            if "hypertension" in condition_name.lower():
                matched_meds = self.medications_by_condition.get("Hypertension", [])
            elif "diabetes" in condition_name.lower():
                matched_meds = self.medications_by_condition.get("Diabetes", [])
            elif "hyperlipidemia" in condition_name.lower() or "cholesterol" in condition_name.lower():
                matched_meds = self.medications_by_condition.get("Hyperlipidemia", [])
            elif "heart failure" in condition_name.lower():
                matched_meds = self.medications_by_condition.get("Heart_Failure", [])
            elif "asthma" in condition_name.lower():
                matched_meds = self.medications_by_condition.get("Asthma", [])
            elif "anxiety" in condition_name.lower():
                matched_meds = self.medications_by_condition.get("Anxiety", [])
            elif "depression" in condition_name.lower():
                matched_meds = self.medications_by_condition.get("Depression", [])
            elif "arthritis" in condition_name.lower():
                matched_meds = self.medications_by_condition.get("Arthritis", [])

            # Add 1-2 medications per condition
            if matched_meds:
                num_meds = random.randint(1, min(2, len(matched_meds)))
                selected_meds = random.sample(matched_meds, num_meds)

                for med_data in selected_meds:
                    # Simplified MedicationRequest with medication as CodeableReference
                    med_request = MedicationRequest(
                        id=f"MED-{patient_id}-{str(med_count+1).zfill(3)}",
                        status="active",
                        intent="order",
                        medication=CodeableReference(
                            concept=CodeableConcept(
                                coding=[Coding(
                                    system="http://www.nlm.nih.gov/research/umls/rxnorm",
                                    code=med_data['code'],
                                    display=med_data['display']
                                )]
                            )
                        ),
                        subject=Reference(reference=f"Patient/{patient_id}")
                    )

                    medications.append(med_request)
                    med_count += 1

        return medications

    def generate_allergies_for_patient(
        self,
        patient_id: str
    ) -> List[AllergyIntolerance]:
        """Generate 0-3 allergies for a patient"""
        # 60% of patients have at least one allergy
        if random.random() < 0.4:
            return []

        num_allergies = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
        selected_allergies = random.sample(self.common_allergies, num_allergies)

        allergies = []
        for i, allergy_data in enumerate(selected_allergies):
            # Simplified AllergyIntolerance with code
            allergy = AllergyIntolerance(
                id=f"ALG-{patient_id}-{str(i+1).zfill(3)}",
                code=CodeableConcept(
                    coding=[Coding(
                        system="http://snomed.info/sct",
                        code=allergy_data['code'],
                        display=allergy_data['display']
                    )]
                ),
                patient=Reference(reference=f"Patient/{patient_id}")
            )

            allergies.append(allergy)

        return allergies


def main():
    """Test clinical data generation"""
    import os

    # Load configs
    base_path = os.path.join(os.path.dirname(__file__), '..', 'config')

    with open(os.path.join(base_path, 'specialties.json'), 'r') as f:
        specialties_config = json.load(f)

    with open(os.path.join(base_path, 'medical_codes', 'loinc_common_labs.json'), 'r') as f:
        loinc_config = json.load(f)

    with open(os.path.join(base_path, 'medical_codes', 'rxnorm_common_meds.json'), 'r') as f:
        rxnorm_config = json.load(f)

    generator = ClinicalDataGenerator(specialties_config, loinc_config, rxnorm_config)

    # Test data generation
    patient_id = "PT-00001"
    patient_age = 55

    conditions = generator.generate_conditions_for_patient(patient_id, patient_age)
    print(f"Generated {len(conditions)} conditions")

    observations = generator.generate_observations_for_patient(patient_id, conditions)
    print(f"Generated {len(observations)} observations")

    medications = generator.generate_medications_for_patient(patient_id, conditions)
    print(f"Generated {len(medications)} medications")

    allergies = generator.generate_allergies_for_patient(patient_id)
    print(f"Generated {len(allergies)} allergies")


if __name__ == "__main__":
    main()
