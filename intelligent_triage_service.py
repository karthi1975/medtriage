"""
Intelligent Triage Service
Integrates clinical protocols with AI triage for proactive MA assistance.
"""

import logging
from typing import List, Dict, Optional
from datetime import datetime

from config.clinical_protocols import (
    get_protocol_for_symptoms,
    assess_risk_level,
    get_provider_preferences
)
from workflow_service import workflow_tracker, CheckpointStatus
from intelligent_test_ordering_service import IntelligentTestOrderingService


logger = logging.getLogger(__name__)


class IntelligentTriageService:
    """Intelligent triage with automatic protocol activation and workflow creation."""

    def __init__(self):
        self.test_ordering_service = IntelligentTestOrderingService()

    async def perform_intelligent_triage(
        self,
        patient_fhir_id: str,
        patient_name: str,
        patient_age: int,
        patient_gender: str,
        patient_conditions: List[str],
        symptoms: List[str],
        symptom_details: Dict,
        provider_name: str,
        specialty: str,
        urgency_override: Optional[str] = None
    ) -> Dict:
        """
        Perform intelligent triage with automatic protocol activation.

        Args:
            patient_fhir_id: FHIR patient ID
            patient_name: Patient name
            patient_age: Patient age
            patient_gender: Patient gender
            patient_conditions: List of existing conditions
            symptoms: List of symptoms
            symptom_details: Detailed symptom information
            provider_name: Assigned provider
            specialty: Medical specialty
            urgency_override: Optional manual urgency override

        Returns:
            Complete triage assessment with protocol, workflow, and test ordering plan
        """
        logger.info(f"Performing intelligent triage for patient {patient_name} with symptoms: {symptoms}")

        # Step 1: Find matching clinical protocol
        protocol = get_protocol_for_symptoms(symptoms, patient_conditions)

        triage_result = {
            "patient": {
                "fhir_id": patient_fhir_id,
                "name": patient_name,
                "age": patient_age,
                "gender": patient_gender,
                "conditions": patient_conditions
            },
            "symptoms": symptoms,
            "protocol_activated": False,
            "protocol": None,
            "risk_assessment": None,
            "immediate_actions": [],
            "provider_preferences": None,
            "test_ordering_plan": None,
            "workflow": None,
            "alerts": []
        }

        # Step 2: If protocol found, activate it
        if protocol:
            triage_result["protocol_activated"] = True
            triage_result["protocol"] = {
                "name": protocol["name"],
                "priority": protocol["priority"],
                "key": protocol.get("protocol_key", "unknown")
            }

            # Step 3: Assess risk level
            risk_assessment = assess_risk_level(
                protocol,
                patient_age,
                patient_conditions,
                symptoms
            )
            triage_result["risk_assessment"] = risk_assessment

            # Step 4: Get immediate actions from protocol
            immediate_actions = protocol.get("actions", [])
            triage_result["immediate_actions"] = immediate_actions

            # Step 5: Get provider preferences
            provider_prefs = get_provider_preferences(
                provider_name,
                protocol.get("protocol_key", "")
            )
            triage_result["provider_preferences"] = provider_prefs

            # Step 6: Determine urgency
            urgency = self._determine_urgency(
                risk_assessment,
                protocol,
                urgency_override
            )
            triage_result["urgency"] = urgency

            # Step 7: Generate test ordering plan
            test_plan = await self.test_ordering_service.generate_test_ordering_plan(
                patient_fhir_id=patient_fhir_id,
                protocol=protocol,
                provider_name=provider_name,
                urgency=urgency,
                patient_data={
                    "age": patient_age,
                    "gender": patient_gender,
                    "conditions": patient_conditions
                }
            )
            triage_result["test_ordering_plan"] = test_plan

            # Step 8: Create workflow
            workflow = workflow_tracker.create_workflow(
                patient_fhir_id=patient_fhir_id,
                patient_name=patient_name,
                protocol_name=protocol["name"],
                provider_name=provider_name,
                specialty=specialty,
                urgency=urgency
            )

            # Add checkpoints to workflow
            self._create_workflow_checkpoints(
                workflow["workflow_id"],
                immediate_actions,
                test_plan
            )

            triage_result["workflow"] = workflow

            # Step 9: Generate alerts
            alerts = self._generate_triage_alerts(
                risk_assessment,
                immediate_actions,
                protocol,
                provider_prefs
            )
            triage_result["alerts"] = alerts

            # Add alerts to workflow
            for alert in alerts:
                workflow_tracker.add_alert(
                    workflow["workflow_id"],
                    alert_type=alert["type"],
                    message=alert["message"],
                    priority=alert["priority"]
                )

        else:
            # No protocol matched - standard triage
            triage_result["urgency"] = urgency_override or "routine"
            triage_result["workflow_id"] = None
            logger.info(f"No protocol matched for symptoms: {symptoms}")

        # Step 10: Generate MA-friendly summary
        triage_result["ma_summary"] = self._generate_ma_summary(triage_result)

        return triage_result

    def _determine_urgency(
        self,
        risk_assessment: Dict,
        protocol: Dict,
        override: Optional[str]
    ) -> str:
        """Determine patient urgency level.

        Returns urgency values that match database constraints:
        - emergency: Immediate life-threatening
        - urgent: Within 24-48 hours
        - semi-urgent: Within 1 week
        - non-urgent: Within 30 days
        """
        if override:
            return override

        risk_level = risk_assessment.get("risk_level", "LOW")

        if risk_level == "HIGH":
            return "urgent"
        elif risk_level == "MODERATE":
            return "semi-urgent"  # Changed from "soon" to match DB constraint
        else:
            return "non-urgent"  # Changed from "routine" to match DB constraint

    def _create_workflow_checkpoints(
        self,
        workflow_id: str,
        immediate_actions: List[Dict],
        test_plan: Dict
    ):
        """Create workflow checkpoints based on protocol actions and test plan."""

        # Add immediate action checkpoints
        for action in immediate_actions:
            if action.get("urgency") in ["immediate", "urgent"]:
                workflow_tracker.add_checkpoint(
                    workflow_id=workflow_id,
                    checkpoint_name=action["action"],
                    status=CheckpointStatus.NOT_STARTED,
                    details=action.get("details")
                )

        # Add test ordering checkpoints
        ordering_plan = test_plan.get("ordering_plan", {})

        for lab in ordering_plan.get("pre_appointment_labs", []):
            workflow_tracker.add_checkpoint(
                workflow_id=workflow_id,
                checkpoint_name=f"Order {lab['test']}",
                status=CheckpointStatus.NOT_STARTED,
                details=lab.get("reason")
            )

        for imaging in ordering_plan.get("imaging_studies", []):
            workflow_tracker.add_checkpoint(
                workflow_id=workflow_id,
                checkpoint_name=f"Schedule {imaging['test']}",
                status=CheckpointStatus.NOT_STARTED,
                details=imaging.get("reason")
            )

            # Add insurance auth checkpoint if needed
            workflow_tracker.add_checkpoint(
                workflow_id=workflow_id,
                checkpoint_name=f"Insurance auth for {imaging['test']}",
                status=CheckpointStatus.NOT_STARTED,
                details="Authorization typically takes 2-3 business days"
            )

        # Add appointment scheduling checkpoint
        workflow_tracker.add_checkpoint(
            workflow_id=workflow_id,
            checkpoint_name="Schedule appointment",
            status=CheckpointStatus.NOT_STARTED,
            details="Schedule after all test results available"
        )

    def _generate_triage_alerts(
        self,
        risk_assessment: Dict,
        immediate_actions: List[Dict],
        protocol: Dict,
        provider_prefs: Optional[Dict]
    ) -> List[Dict]:
        """Generate alerts for MA based on triage results."""
        alerts = []

        # High risk alert
        if risk_assessment.get("risk_level") == "HIGH":
            alerts.append({
                "type": "high_risk",
                "priority": "critical",
                "message": f"HIGH RISK PATIENT: {', '.join(risk_assessment.get('risk_factors', []))}"
            })

        # Immediate action alerts
        urgent_actions = [
            action for action in immediate_actions
            if action.get("urgency") == "immediate"
        ]
        if urgent_actions:
            alerts.append({
                "type": "immediate_actions",
                "priority": "high",
                "message": f"{len(urgent_actions)} immediate actions required: {', '.join([a['action'] for a in urgent_actions])}"
            })

        # Provider preference alerts
        if provider_prefs and provider_prefs.get("notes"):
            alerts.append({
                "type": "provider_preference",
                "priority": "normal",
                "message": f"Provider note: {provider_prefs['notes']}"
            })

        return alerts

    def _generate_ma_summary(self, triage_result: Dict) -> str:
        """Generate human-readable summary for MA."""
        parts = []

        patient = triage_result["patient"]
        parts.append(f"Patient: {patient['name']}, {patient['age']}yo {patient['gender']}")

        if triage_result["protocol_activated"]:
            protocol = triage_result["protocol"]
            parts.append(f"\n🚨 PROTOCOL ACTIVATED: {protocol['name']}")

            risk = triage_result.get("risk_assessment", {})
            parts.append(f"\nRisk Level: {risk.get('risk_level', 'UNKNOWN')}")

            if risk.get("risk_factors"):
                parts.append(f"Risk Factors: {', '.join(risk['risk_factors'])}")

            immediate = triage_result.get("immediate_actions", [])
            urgent_actions = [a for a in immediate if a.get("urgency") in ["immediate", "urgent"]]

            if urgent_actions:
                parts.append(f"\n⚡ IMMEDIATE ACTIONS REQUIRED:")
                for action in urgent_actions:
                    parts.append(f"  • {action['action']} - {action.get('details', '')}")

            test_plan = triage_result.get("test_ordering_plan", {})
            if test_plan:
                ordering = test_plan.get("ordering_plan", {})
                labs = ordering.get("pre_appointment_labs", [])
                imaging = ordering.get("imaging_studies", [])

                if labs or imaging:
                    parts.append(f"\n📋 PRE-APPOINTMENT TESTS NEEDED:")
                    for lab in labs:
                        parts.append(f"  • {lab['test']} - {lab.get('reason', '')}")
                    for img in imaging:
                        parts.append(f"  • {img['test']} - {img.get('reason', '')}")

            prefs = triage_result.get("provider_preferences")
            if prefs and prefs.get("notes"):
                parts.append(f"\n💡 Provider Preference: {prefs['notes']}")

            workflow = triage_result.get("workflow")
            if workflow:
                parts.append(f"\n✅ Workflow created: {workflow['workflow_id']}")

        else:
            parts.append("\nNo specific protocol activated - standard triage")

        return "\n".join(parts)


# Global instance
intelligent_triage_service = IntelligentTriageService()
