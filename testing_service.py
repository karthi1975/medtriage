"""
Testing Service
Checks if patients have required tests before appointments
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import logging

from fhir_client import FHIRClient
from config.testing_requirements import get_requirements_for_specialty, TESTING_REQUIREMENTS
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TestRequirement:
    """Represents a single test requirement"""
    type: str
    max_age_days: int
    loinc_codes: List[str] = field(default_factory=list)
    dicom_modality: Optional[str] = None
    description: str = ""
    urgent: bool = False


@dataclass
class TestResult:
    """Represents a test result"""
    type: str
    date: str
    days_ago: int
    value: Optional[str] = None
    unit: Optional[str] = None
    status: str = "final"


@dataclass
class TestingStatus:
    """Complete testing status for a patient"""
    patient_id: str
    specialty: str
    visit_type: str
    urgency: str
    required_tests_missing: List[TestRequirement] = field(default_factory=list)
    recommended_tests_missing: List[TestRequirement] = field(default_factory=list)
    recent_tests: List[TestResult] = field(default_factory=list)
    all_required_met: bool = False
    needs_urgent_testing: bool = False


class TestingService:
    """Service for checking patient testing requirements"""

    def __init__(self, fhir_client: FHIRClient):
        """
        Initialize testing service

        Args:
            fhir_client: FHIR client for patient data retrieval
        """
        self.fhir_client = fhir_client
        logger.info("TestingService initialized")

    async def check_testing_status(
        self,
        patient_id: str,
        specialty_name: str,
        visit_type: str = "new_patient",
        urgency: str = "non-urgent"
    ) -> TestingStatus:
        """
        Check if patient has required tests for specialty appointment.

        Args:
            patient_id: FHIR Patient ID
            specialty_name: Name of specialty (e.g., "Cardiology")
            visit_type: Type of visit - "new_patient" or "followup"
            urgency: Priority level - "urgent", "emergency", or "non-urgent"

        Returns:
            TestingStatus with missing/outdated tests and recent valid tests
        """
        logger.info(f"Checking testing status for patient {patient_id}, specialty {specialty_name}, urgency {urgency}")

        # Get testing requirements for this specialty
        requirements = get_requirements_for_specialty(specialty_name, visit_type, urgency)

        required_reqs = [TestRequirement(**req) for req in requirements.get("required", [])]
        recommended_reqs = [TestRequirement(**req) for req in requirements.get("recommended", [])]

        # Get all patient observations from FHIR
        all_observations = self.fhir_client.get_patient_observations(patient_id)

        # Check each required test
        required_missing = []
        recommended_missing = []
        recent_tests = []

        for req in required_reqs:
            result = self._check_test_requirement(req, all_observations)
            if result:
                recent_tests.append(result)
            else:
                required_missing.append(req)

        for req in recommended_reqs:
            result = self._check_test_requirement(req, all_observations)
            if result:
                recent_tests.append(result)
            else:
                recommended_missing.append(req)

        # Check if urgent testing is needed
        needs_urgent = any(req.urgent for req in required_missing)

        # Create status object
        status = TestingStatus(
            patient_id=patient_id,
            specialty=specialty_name,
            visit_type=visit_type,
            urgency=urgency,
            required_tests_missing=required_missing,
            recommended_tests_missing=recommended_missing,
            recent_tests=recent_tests,
            all_required_met=len(required_missing) == 0,
            needs_urgent_testing=needs_urgent
        )

        logger.info(f"Testing status: {len(required_missing)} required missing, {len(recommended_missing)} recommended missing, {len(recent_tests)} recent tests")

        return status

    def _check_test_requirement(
        self,
        requirement: TestRequirement,
        observations: List[Dict[str, Any]]
    ) -> Optional[TestResult]:
        """
        Check if a specific test requirement is met

        Args:
            requirement: Test requirement to check
            observations: List of FHIR observations

        Returns:
            TestResult if requirement is met (recent enough), None otherwise
        """
        # Handle vitals separately (special case - not LOINC-based)
        if requirement.type == "Vitals":
            return self._check_vitals(requirement, observations)

        # For LOINC-coded tests, search by code
        if requirement.loinc_codes:
            for obs in observations:
                if not obs.get('code'):
                    continue

                obs_code = obs['code'].get('coding', [{}])[0].get('code', '')

                # Check if observation matches any of the required LOINC codes
                if obs_code in requirement.loinc_codes:
                    # Check if recent enough
                    if obs.get('effectiveDateTime'):
                        days_ago = self._days_since(obs['effectiveDateTime'])
                        if days_ago <= requirement.max_age_days:
                            # Found valid recent test
                            return TestResult(
                                type=requirement.type,
                                date=obs['effectiveDateTime'],
                                days_ago=days_ago,
                                value=obs.get('value', {}).get('value'),
                                unit=obs.get('value', {}).get('unit'),
                                status=obs.get('status', 'final')
                            )

        # For imaging tests (would need DiagnosticReport resource - simplified for now)
        if requirement.dicom_modality:
            # In production, would query DiagnosticReport resources
            # For now, return None (test not found)
            pass

        return None

    def _check_vitals(
        self,
        requirement: TestRequirement,
        observations: List[Dict[str, Any]]
    ) -> Optional[TestResult]:
        """Check for recent vital signs"""
        # Common vital sign LOINC codes
        vital_codes = [
            "85354-9",  # Blood pressure systolic
            "8867-4",   # Heart rate
            "29463-7",  # Body weight
            "39156-5",  # BMI
            "8310-5",   # Body temperature
            "9279-1"    # Respiratory rate
        ]

        # Check if any vital signs are recent enough
        for obs in observations:
            if not obs.get('code'):
                continue

            obs_code = obs['code'].get('coding', [{}])[0].get('code', '')

            if obs_code in vital_codes:
                if obs.get('effectiveDateTime'):
                    days_ago = self._days_since(obs['effectiveDateTime'])
                    if days_ago <= requirement.max_age_days:
                        return TestResult(
                            type="Vitals",
                            date=obs['effectiveDateTime'],
                            days_ago=days_ago,
                            value=obs.get('value', {}).get('value'),
                            unit=obs.get('value', {}).get('unit'),
                            status=obs.get('status', 'final')
                        )

        return None

    def _days_since(self, date_string: str) -> int:
        """Calculate days since a date string"""
        try:
            if 'T' in date_string:
                # Full datetime
                date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            else:
                # Date only
                date = datetime.fromisoformat(date_string)

            now = datetime.now(date.tzinfo) if date.tzinfo else datetime.now()
            delta = now - date
            return delta.days
        except Exception as e:
            logger.error(f"Error parsing date {date_string}: {str(e)}")
            return 9999  # Return large number to indicate invalid/very old

    def get_testing_requirements_by_specialty_id(
        self,
        specialty_id: int,
        db: Session,
        visit_type: str = "new_patient",
        urgency: str = "non-urgent"
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get testing requirements by specialty ID (from database)

        Args:
            specialty_id: Database specialty ID
            db: Database session
            visit_type: Type of visit
            urgency: Priority level

        Returns:
            Dictionary with 'required' and 'recommended' test lists
        """
        try:
            # Query specialty name from database
            from database.models import Specialty
            specialty = db.query(Specialty).filter(Specialty.specialty_id == specialty_id).first()

            if not specialty:
                logger.warning(f"Specialty ID {specialty_id} not found")
                return {"required": [], "recommended": []}

            # Get requirements using specialty name
            requirements = get_requirements_for_specialty(specialty.name, visit_type, urgency)
            return requirements

        except Exception as e:
            logger.error(f"Error getting testing requirements for specialty {specialty_id}: {str(e)}")
            return {"required": [], "recommended": []}

    def format_testing_requirements_for_chat(
        self,
        status: TestingStatus
    ) -> str:
        """
        Format testing status for conversational display

        Args:
            status: TestingStatus object

        Returns:
            Human-readable string describing testing status
        """
        if status.all_required_met and not status.recommended_tests_missing:
            return f"✅ All required tests are up to date. Patient is ready for appointment."

        lines = []

        if status.required_tests_missing:
            lines.append("⚠️ **Required Tests Missing:**")
            for test in status.required_tests_missing:
                urgency_flag = " (URGENT)" if test.urgent else ""
                lines.append(f"   - {test.type}: {test.description}{urgency_flag}")
                lines.append(f"     Must be within {test.max_age_days} days")

        if status.recommended_tests_missing:
            lines.append("\n📋 **Recommended Tests (optional):**")
            for test in status.recommended_tests_missing:
                lines.append(f"   - {test.type}: {test.description}")

        if status.recent_tests:
            lines.append("\n✓ **Recent Tests (valid):**")
            for test in status.recent_tests:
                lines.append(f"   - {test.type}: {test.days_ago} days ago")

        return "\n".join(lines)

    def can_schedule_appointment(self, status: TestingStatus) -> bool:
        """
        Determine if appointment can be scheduled given testing status

        Args:
            status: TestingStatus object

        Returns:
            True if can schedule, False if required tests must be done first
        """
        # Can schedule if all required tests are met
        if status.all_required_met:
            return True

        # Can still schedule if only non-urgent tests are missing
        # (tests can be ordered to be done before appointment)
        if not status.needs_urgent_testing:
            return True

        # If urgent tests are missing, should do them first
        return False
