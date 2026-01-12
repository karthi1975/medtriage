"""
FHIR Client wrapper for patient data retrieval
"""
from typing import Dict, List, Optional, Any
from fhirclient import client
from fhirclient.models.patient import Patient
from fhirclient.models.condition import Condition
from fhirclient.models.observation import Observation
from fhirclient.models.medicationrequest import MedicationRequest
from fhirclient.models.procedure import Procedure
from fhirclient.models.allergyintolerance import AllergyIntolerance
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FHIRClient:
    """Wrapper class for FHIR client operations"""

    def __init__(self, fhir_server_url: str):
        """
        Initialize FHIR client with server URL

        Args:
            fhir_server_url: Base URL of the FHIR server
        """
        self.settings = {
            'app_id': 'fhir_chat_app',
            'api_base': fhir_server_url
        }
        self.client = client.FHIRClient(settings=self.settings)
        logger.info(f"FHIR Client initialized with server: {fhir_server_url}")

    def get_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve patient demographic information

        Args:
            patient_id: FHIR Patient ID

        Returns:
            Dictionary with patient information or None if not found
        """
        try:
            patient = Patient.read(patient_id, self.client.server)

            if not patient:
                logger.warning(f"Patient {patient_id} not found")
                return None

            # Extract patient demographics
            birth_date_str = patient.birthDate.isostring if hasattr(patient, 'birthDate') and patient.birthDate else None

            # Calculate age from birthDate
            age = None
            if birth_date_str:
                try:
                    from datetime import datetime
                    birth_date = datetime.fromisoformat(birth_date_str.replace('Z', '+00:00'))
                    today = datetime.now()
                    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                except:
                    age = None

            patient_data = {
                'id': patient.id,
                'name': self._format_name(patient.name),
                'gender': patient.gender if hasattr(patient, 'gender') else None,
                'birthDate': birth_date_str,
                'age': age,
                'address': self._format_address(patient.address) if hasattr(patient, 'address') else None,
                'telecom': self._format_telecom(patient.telecom) if hasattr(patient, 'telecom') else None
            }

            # Parse extensions for allergies and conditions
            extensions = self._parse_patient_extensions(patient)
            if extensions:
                patient_data.update(extensions)

            logger.info(f"Successfully retrieved patient {patient_id}")
            return patient_data

        except Exception as e:
            logger.error(f"Error retrieving patient {patient_id}: {str(e)}")
            return None

    def get_patient_conditions(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve patient's medical conditions/diagnoses

        Args:
            patient_id: FHIR Patient ID

        Returns:
            List of condition dictionaries
        """
        try:
            search = Condition.where(struct={'subject': f'Patient/{patient_id}'})
            conditions = search.perform_resources(self.client.server)

            condition_list = []
            for condition in conditions:
                condition_data = {
                    'id': condition.id,
                    'code': self._format_code(condition.code) if hasattr(condition, 'code') else None,
                    'clinicalStatus': condition.clinicalStatus.coding[0].code if hasattr(condition, 'clinicalStatus') and condition.clinicalStatus.coding else None,
                    'onsetDateTime': condition.onsetDateTime.isostring if hasattr(condition, 'onsetDateTime') and condition.onsetDateTime else None,
                    'recordedDate': condition.recordedDate.isostring if hasattr(condition, 'recordedDate') and condition.recordedDate else None
                }
                condition_list.append(condition_data)

            logger.info(f"Retrieved {len(condition_list)} conditions for patient {patient_id}")
            return condition_list

        except Exception as e:
            logger.error(f"Error retrieving conditions for patient {patient_id}: {str(e)}")
            return []

    def get_patient_observations(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve patient's observations (vitals, lab results, etc.)

        Args:
            patient_id: FHIR Patient ID

        Returns:
            List of observation dictionaries
        """
        try:
            search = Observation.where(struct={'subject': f'Patient/{patient_id}'})
            observations = search.perform_resources(self.client.server)

            observation_list = []
            for obs in observations:
                obs_data = {
                    'id': obs.id,
                    'code': self._format_code(obs.code) if hasattr(obs, 'code') else None,
                    'status': obs.status if hasattr(obs, 'status') else None,
                    'effectiveDateTime': obs.effectiveDateTime.isostring if hasattr(obs, 'effectiveDateTime') and obs.effectiveDateTime else None,
                    'value': self._format_value(obs) if hasattr(obs, 'valueQuantity') or hasattr(obs, 'valueString') or hasattr(obs, 'valueCodeableConcept') else None
                }
                observation_list.append(obs_data)

            logger.info(f"Retrieved {len(observation_list)} observations for patient {patient_id}")
            return observation_list

        except Exception as e:
            logger.error(f"Error retrieving observations for patient {patient_id}: {str(e)}")
            return []

    def get_patient_medications(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve patient's medications

        Args:
            patient_id: FHIR Patient ID

        Returns:
            List of medication dictionaries
        """
        try:
            search = MedicationRequest.where(struct={'subject': f'Patient/{patient_id}'})
            medications = search.perform_resources(self.client.server)

            medication_list = []
            for med in medications:
                med_data = {
                    'id': med.id,
                    'medication': self._format_code(med.medicationCodeableConcept) if hasattr(med, 'medicationCodeableConcept') else None,
                    'status': med.status if hasattr(med, 'status') else None,
                    'authoredOn': med.authoredOn.isostring if hasattr(med, 'authoredOn') and med.authoredOn else None,
                    'dosageInstruction': self._format_dosage(med.dosageInstruction) if hasattr(med, 'dosageInstruction') else None
                }
                medication_list.append(med_data)

            logger.info(f"Retrieved {len(medication_list)} medications for patient {patient_id}")
            return medication_list

        except Exception as e:
            logger.error(f"Error retrieving medications for patient {patient_id}: {str(e)}")
            return []

    def get_patient_allergies(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve patient's allergies

        Args:
            patient_id: FHIR Patient ID

        Returns:
            List of allergy dictionaries
        """
        try:
            search = AllergyIntolerance.where(struct={'patient': f'Patient/{patient_id}'})
            allergies = search.perform_resources(self.client.server)

            allergy_list = []
            for allergy in allergies:
                allergy_data = {
                    'id': allergy.id,
                    'code': self._format_code(allergy.code) if hasattr(allergy, 'code') else None,
                    'clinicalStatus': allergy.clinicalStatus.coding[0].code if hasattr(allergy, 'clinicalStatus') and allergy.clinicalStatus.coding else None,
                    'verificationStatus': allergy.verificationStatus.coding[0].code if hasattr(allergy, 'verificationStatus') and allergy.verificationStatus.coding else None,
                    'type': allergy.type if hasattr(allergy, 'type') else None,
                    'category': allergy.category if hasattr(allergy, 'category') else None,
                    'criticality': allergy.criticality if hasattr(allergy, 'criticality') else None,
                    'recordedDate': allergy.recordedDate.isostring if hasattr(allergy, 'recordedDate') and allergy.recordedDate else None
                }
                allergy_list.append(allergy_data)

            logger.info(f"Retrieved {len(allergy_list)} allergies for patient {patient_id}")
            return allergy_list

        except Exception as e:
            logger.error(f"Error retrieving allergies for patient {patient_id}: {str(e)}")
            return []

    def get_patient_history(self, patient_id: str) -> Dict[str, Any]:
        """
        Retrieve comprehensive patient history including demographics,
        conditions, observations, medications, and allergies

        Args:
            patient_id: FHIR Patient ID

        Returns:
            Dictionary with complete patient history
        """
        logger.info(f"Retrieving complete history for patient {patient_id}")

        patient_data = self.get_patient(patient_id)
        if not patient_data:
            return {'patient': None}

        patient_history = {
            'patient': patient_data.copy()  # Make a copy to avoid modifying original
        }

        # Try to get data from FHIR resources first, fall back to extensions
        conditions = self.get_patient_conditions(patient_id)
        if not conditions and patient_data and 'conditions_from_extensions' in patient_data:
            # Use extension data if no FHIR Condition resources exist
            conditions = patient_data['conditions_from_extensions']
        if conditions:
            patient_history['patient']['conditions'] = conditions
            patient_history['conditions'] = conditions

        observations = self.get_patient_observations(patient_id)
        if observations:
            patient_history['observations'] = observations

        medications = self.get_patient_medications(patient_id)
        if not medications and patient_data and 'medications_from_extensions' in patient_data:
            # Use extension data if no FHIR MedicationRequest resources exist
            # Convert string array to medication object array for frontend compatibility
            medications = [{"medication": med, "dosage": "", "frequency": ""} for med in patient_data['medications_from_extensions']]
        if medications:
            patient_history['patient']['medications'] = medications
            patient_history['medications'] = medications

        allergies = self.get_patient_allergies(patient_id)
        if not allergies and patient_data and 'allergies_from_extensions' in patient_data:
            # Use extension data if no FHIR AllergyIntolerance resources exist
            allergies = patient_data['allergies_from_extensions']
        if allergies:
            patient_history['patient']['allergies'] = allergies
            patient_history['allergies'] = allergies

        return patient_history

    # Helper methods for formatting FHIR data

    def _parse_patient_extensions(self, patient) -> Dict[str, Any]:
        """
        Parse patient extensions for allergies, conditions, and medications

        Args:
            patient: FHIR Patient resource

        Returns:
            Dictionary with parsed extensions
        """
        extensions_data = {}

        if not hasattr(patient, 'extension') or not patient.extension:
            return extensions_data

        allergies = []
        conditions = []
        medications = []

        for ext in patient.extension:
            if hasattr(ext, 'url') and hasattr(ext, 'valueString'):
                if 'allergies' in ext.url.lower():
                    # Parse comma-separated allergies
                    allergy_list = [a.strip() for a in ext.valueString.split(',')]
                    allergies.extend(allergy_list)
                elif 'conditions' in ext.url.lower():
                    # Parse comma-separated conditions
                    condition_list = [c.strip() for c in ext.valueString.split(',')]
                    conditions.extend(condition_list)
                elif 'medications' in ext.url.lower():
                    # Parse comma-separated medications
                    medication_list = [m.strip() for m in ext.valueString.split(',')]
                    medications.extend(medication_list)

        if allergies:
            extensions_data['allergies_from_extensions'] = allergies
        if conditions:
            extensions_data['conditions_from_extensions'] = conditions
        if medications:
            extensions_data['medications_from_extensions'] = medications

        return extensions_data

    def _format_name(self, names) -> Optional[str]:
        """Format FHIR HumanName to string"""
        if not names:
            return None
        name = names[0]
        parts = []
        if hasattr(name, 'given') and name.given:
            parts.extend(name.given)
        if hasattr(name, 'family') and name.family:
            parts.append(name.family)
        return ' '.join(parts) if parts else None

    def _format_address(self, addresses) -> Optional[str]:
        """Format FHIR Address to string"""
        if not addresses:
            return None
        addr = addresses[0]
        parts = []
        if hasattr(addr, 'line') and addr.line:
            parts.extend(addr.line)
        if hasattr(addr, 'city') and addr.city:
            parts.append(addr.city)
        if hasattr(addr, 'state') and addr.state:
            parts.append(addr.state)
        if hasattr(addr, 'postalCode') and addr.postalCode:
            parts.append(addr.postalCode)
        return ', '.join(parts) if parts else None

    def _format_telecom(self, telecoms) -> Optional[str]:
        """Format FHIR ContactPoint to string"""
        if not telecoms:
            return None
        telecom = telecoms[0]
        if hasattr(telecom, 'value'):
            return telecom.value
        return None

    def _format_code(self, codeable_concept) -> Optional[str]:
        """Format FHIR CodeableConcept to string"""
        if not codeable_concept:
            return None
        if hasattr(codeable_concept, 'text') and codeable_concept.text:
            return codeable_concept.text
        if hasattr(codeable_concept, 'coding') and codeable_concept.coding:
            coding = codeable_concept.coding[0]
            if hasattr(coding, 'display') and coding.display:
                return coding.display
            if hasattr(coding, 'code') and coding.code:
                return coding.code
        return None

    def _format_value(self, observation) -> Optional[str]:
        """Format observation value"""
        if hasattr(observation, 'valueQuantity') and observation.valueQuantity:
            value = observation.valueQuantity.value
            unit = observation.valueQuantity.unit if hasattr(observation.valueQuantity, 'unit') else ''
            return f"{value} {unit}".strip()
        elif hasattr(observation, 'valueString') and observation.valueString:
            return observation.valueString
        elif hasattr(observation, 'valueCodeableConcept') and observation.valueCodeableConcept:
            return self._format_code(observation.valueCodeableConcept)
        return None

    def _format_dosage(self, dosage_instructions) -> Optional[str]:
        """Format dosage instructions"""
        if not dosage_instructions:
            return None
        dosage = dosage_instructions[0]
        if hasattr(dosage, 'text') and dosage.text:
            return dosage.text
        return None
