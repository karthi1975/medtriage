"""
Intelligent Test Ordering Service
Automatically determines required tests, schedules them, and creates patient instructions.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import httpx

from config.clinical_protocols import CLINICAL_PROTOCOLS, get_provider_preferences
# Database not needed for test ordering service
# from database.connection import SessionLocal


logger = logging.getLogger(__name__)


class IntelligentTestOrderingService:
    """Handles intelligent test ordering with scheduling and patient instructions."""

    def __init__(self, fhir_base_url: str = "http://localhost:8081/fhir"):
        self.fhir_base_url = fhir_base_url

    async def generate_test_ordering_plan(
        self,
        patient_fhir_id: str,
        protocol: Dict,
        provider_name: str,
        urgency: str = "routine",
        patient_data: Optional[Dict] = None
    ) -> Dict:
        """
        Generate comprehensive test ordering plan based on protocol and provider preferences.

        Args:
            patient_fhir_id: FHIR patient ID
            protocol: Clinical protocol dictionary
            provider_name: Assigned provider name
            urgency: Patient urgency level
            patient_data: Optional patient demographic and history data

        Returns:
            Complete test ordering plan with scheduling recommendations
        """
        logger.info(f"Generating test ordering plan for patient {patient_fhir_id}")

        # Get protocol tests
        protocol_tests = protocol.get("pre_appointment_tests", [])
        immediate_actions = protocol.get("actions", [])

        # Get provider preferences
        protocol_key = protocol.get("protocol_key", "")
        provider_prefs = get_provider_preferences(provider_name, protocol_key)

        # Check existing test results
        existing_tests = await self._get_existing_test_results(patient_fhir_id)

        # Categorize tests
        immediate_tests = []
        pre_appointment_labs = []
        imaging_studies = []
        optional_tests = []

        # Process immediate actions from protocol
        for action in immediate_actions:
            if action.get("urgency") in ["immediate", "urgent"]:
                immediate_tests.append({
                    "test": action["action"],
                    "urgency": action["urgency"],
                    "details": action.get("details", ""),
                    "status": "pending",
                    "order_type": self._categorize_test_type(action["action"])
                })

        # Process pre-appointment tests
        for test_req in protocol_tests:
            test_name = test_req["test"]
            max_age_days = test_req.get("max_age_days", 180)

            # Check if patient already has recent test
            existing_test = self._find_recent_test(existing_tests, test_name, max_age_days)

            if existing_test:
                # Test is recent enough, skip ordering
                continue

            test_order = {
                "test": test_name,
                "last_done": existing_test["date"] if existing_test else None,
                "needs_update": True if existing_test else False,
                "required": test_req.get("can_schedule_without", True) == False,
                "urgency": test_req.get("urgency", "routine"),
                "max_age_days": max_age_days,
                "reason": test_req.get("reason", ""),
                "insurance_coverage": "covered",  # Would check insurance in real implementation
                "order_type": self._categorize_test_type(test_name)
            }

            # Categorize by type
            if test_order["order_type"] == "laboratory":
                pre_appointment_labs.append(test_order)
            elif test_order["order_type"] == "imaging":
                imaging_studies.append(test_order)
            else:
                optional_tests.append(test_order)

        # Add provider-specific tests if any
        if provider_prefs:
            additional_tests = provider_prefs.get("additional_tests", [])
            for add_test in additional_tests:
                pre_appointment_labs.append({
                    "test": add_test["test"],
                    "reason": add_test.get("reason", "Provider preference"),
                    "max_age_days": add_test.get("max_age_days", 30),
                    "required": True,
                    "urgency": "routine",
                    "insurance_coverage": "covered",
                    "order_type": "laboratory"
                })

        # Generate timeline
        timeline = self._generate_timeline(
            immediate_tests,
            pre_appointment_labs,
            imaging_studies,
            urgency
        )

        # Generate patient instructions
        patient_instructions = self._generate_patient_instructions(
            timeline,
            patient_data
        )

        return {
            "ordering_plan": {
                "immediate_tests": immediate_tests,
                "pre_appointment_labs": pre_appointment_labs,
                "imaging_studies": imaging_studies,
                "optional_tests": optional_tests
            },
            "timeline": timeline,
            "patient_instructions": patient_instructions,
            "provider_preferences": provider_prefs,
            "earliest_appointment_date": self._calculate_earliest_appointment_date(timeline)
        }

    def _categorize_test_type(self, test_name: str) -> str:
        """Categorize test as laboratory, imaging, or procedure."""
        test_lower = test_name.lower()

        imaging_keywords = [
            "x-ray", "xray", "ct", "mri", "echo", "echocardiogram",
            "ultrasound", "mammogram", "dexa", "pet scan"
        ]
        lab_keywords = [
            "panel", "cbc", "bmp", "lipid", "troponin", "bnp",
            "glucose", "hba1c", "thyroid", "creatinine"
        ]
        procedure_keywords = [
            "ecg", "ekg", "holter", "stress test", "colonoscopy",
            "endoscopy", "biopsy"
        ]

        if any(keyword in test_lower for keyword in imaging_keywords):
            return "imaging"
        elif any(keyword in test_lower for keyword in lab_keywords):
            return "laboratory"
        elif any(keyword in test_lower for keyword in procedure_keywords):
            return "procedure"
        else:
            return "laboratory"  # Default to lab

    async def _get_existing_test_results(self, patient_fhir_id: str) -> List[Dict]:
        """Query FHIR for existing test results."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.fhir_base_url}/Observation",
                    params={
                        "patient": patient_fhir_id,
                        "_count": 100,
                        "_sort": "-date"
                    }
                )

                if response.status_code != 200:
                    logger.warning(f"Failed to fetch observations: {response.status_code}")
                    return []

                data = response.json()
                observations = []

                for entry in data.get("entry", []):
                    obs = entry.get("resource", {})
                    code = obs.get("code", {}).get("text", "Unknown")
                    effective_date = obs.get("effectiveDateTime", "")

                    observations.append({
                        "test_name": code,
                        "date": effective_date,
                        "value": self._extract_observation_value(obs)
                    })

                return observations

        except Exception as e:
            logger.error(f"Error fetching test results: {str(e)}")
            return []

    def _extract_observation_value(self, observation: Dict) -> Optional[str]:
        """Extract value from FHIR Observation resource."""
        if "valueQuantity" in observation:
            value = observation["valueQuantity"].get("value")
            unit = observation["valueQuantity"].get("unit", "")
            return f"{value} {unit}".strip()
        elif "valueString" in observation:
            return observation["valueString"]
        elif "valueCodeableConcept" in observation:
            return observation["valueCodeableConcept"].get("text", "")
        return None

    def _find_recent_test(
        self,
        existing_tests: List[Dict],
        test_name: str,
        max_age_days: int
    ) -> Optional[Dict]:
        """Find if patient has recent test results within max_age_days."""
        cutoff_date = datetime.now() - timedelta(days=max_age_days)

        for test in existing_tests:
            if test_name.lower() in test["test_name"].lower():
                if test["date"]:
                    try:
                        test_date = datetime.fromisoformat(test["date"].replace("Z", "+00:00"))
                        if test_date >= cutoff_date:
                            return test
                    except:
                        continue

        return None

    def _generate_timeline(
        self,
        immediate_tests: List[Dict],
        labs: List[Dict],
        imaging: List[Dict],
        urgency: str
    ) -> Dict:
        """Generate recommended timeline for tests and appointment."""
        today = datetime.now()
        timeline = {}

        # Day 1: Immediate tests
        if immediate_tests:
            timeline["day_1"] = {
                "date": today.strftime("%Y-%m-%d"),
                "tasks": [
                    {
                        "time": "ASAP",
                        "task": test["test"],
                        "status": "pending",
                        "urgency": test["urgency"]
                    }
                    for test in immediate_tests
                ]
            }

        # Day 2 or next available: Labs
        if labs:
            lab_date = today + timedelta(days=1)
            timeline["day_2"] = {
                "date": lab_date.strftime("%Y-%m-%d"),
                "tasks": [
                    {
                        "time": "Morning (fasting if required)",
                        "task": f"{lab['test']} - {lab['reason']}",
                        "status": "to_schedule",
                        "fasting_required": "fasting" in lab.get("reason", "").lower() or "lipid" in lab["test"].lower()
                    }
                    for lab in labs
                ]
            }

        # Day 3-5: Imaging
        if imaging:
            imaging_date = today + timedelta(days=3)  # Allow time for insurance auth
            timeline["day_3_to_5"] = {
                "date": imaging_date.strftime("%Y-%m-%d"),
                "tasks": [
                    {
                        "time": "TBD (pending insurance auth)",
                        "task": f"{img['test']} - {img['reason']}",
                        "status": "pending_auth",
                        "auth_required": True
                    }
                    for img in imaging
                ]
            }

        # Appointment day
        if urgency == "urgent":
            appt_offset = 1  # Next day for urgent
        else:
            appt_offset = 5 if imaging else 3  # After tests complete

        appt_date = today + timedelta(days=appt_offset)
        timeline["appointment_day"] = {
            "date": appt_date.strftime("%Y-%m-%d"),
            "tasks": [
                {
                    "time": "TBD",
                    "task": "Appointment with provider",
                    "status": "to_schedule",
                    "depends_on": "All test results available"
                }
            ]
        }

        return timeline

    def _generate_patient_instructions(self, timeline: Dict, patient_data: Optional[Dict]) -> Dict:
        """Generate patient-friendly instructions."""
        instructions = []

        for day_key, day_data in timeline.items():
            if day_key == "appointment_day":
                continue  # Skip appointment for patient prep instructions

            day_instructions = {
                "date": day_data["date"],
                "title": self._get_instruction_title(day_data["tasks"]),
                "tasks": [],
                "location": "Main Facility",  # Would be dynamic in real implementation
                "parking": "Patient parking in Lot A"
            }

            for task in day_data["tasks"]:
                if task.get("fasting_required"):
                    day_instructions["tasks"].append("No food or drink after midnight (water okay)")
                    day_instructions["tasks"].append("Take morning medications AFTER lab draw")

                day_instructions["tasks"].append(f"{task['task']}")

                if task.get("auth_required"):
                    day_instructions["tasks"].append("Insurance authorization being processed")

            instructions.append(day_instructions)

        return {
            "overview": "You have several tests scheduled before your appointment. All tests must be completed for the doctor to review.",
            "instructions": instructions,
            "next_steps": "We will call you to schedule your appointment once all test results are available.",
            "contact": "Call us at (555) 123-4567 if you have questions or need to reschedule."
        }

    def _get_instruction_title(self, tasks: List[Dict]) -> str:
        """Generate title for instruction section."""
        if any("lab" in task["task"].lower() or "panel" in task["task"].lower() for task in tasks):
            return "Fasting Lab Work"
        elif any("echo" in task["task"].lower() or "imaging" in task["task"].lower() for task in tasks):
            return "Imaging Study"
        elif any("ecg" in task["task"].lower() or "ekg" in task["task"].lower() for task in tasks):
            return "STAT Testing"
        else:
            return "Medical Tests"

    def _calculate_earliest_appointment_date(self, timeline: Dict) -> str:
        """Calculate earliest date appointment can be scheduled."""
        appt_day = timeline.get("appointment_day", {})
        return appt_day.get("date", "")
