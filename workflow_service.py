"""
Patient Workflow Tracking Service
Manages patient workflows from triage through test completion to appointment.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum
import uuid

# Database not actually needed for in-memory workflow tracker
# from database.connection import SessionLocal


logger = logging.getLogger(__name__)


class WorkflowStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"


class CheckpointStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PENDING_EXTERNAL = "pending_external"  # Waiting on insurance, lab results, etc.
    FAILED = "failed"


class PatientWorkflowTracker:
    """Tracks patient workflows through MA preparation process."""

    def __init__(self):
        self.workflows = {}  # In-memory storage (can be moved to DB)

    def create_workflow(
        self,
        patient_fhir_id: str,
        patient_name: str,
        protocol_name: str,
        provider_name: str,
        specialty: str,
        urgency: str = "routine"
    ) -> Dict:
        """
        Create a new patient workflow.

        Args:
            patient_fhir_id: FHIR patient ID
            patient_name: Patient name
            protocol_name: Clinical protocol being followed
            provider_name: Assigned provider
            specialty: Medical specialty
            urgency: urgent, routine, etc.

        Returns:
            Workflow dictionary
        """
        workflow_id = f"WORKFLOW-{patient_fhir_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        workflow = {
            "workflow_id": workflow_id,
            "patient_fhir_id": patient_fhir_id,
            "patient_name": patient_name,
            "protocol_name": protocol_name,
            "provider_name": provider_name,
            "specialty": specialty,
            "urgency": urgency,
            "status": WorkflowStatus.ACTIVE,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "current_step": "triage_completed",
            "checkpoints": [],
            "alerts": [],
            "test_orders": [],
            "appointment_scheduled": False
        }

        self.workflows[workflow_id] = workflow
        logger.info(f"Created workflow {workflow_id} for patient {patient_name}")

        return workflow

    def add_checkpoint(
        self,
        workflow_id: str,
        checkpoint_name: str,
        status: CheckpointStatus = CheckpointStatus.NOT_STARTED,
        details: Optional[str] = None,
        estimated_completion: Optional[datetime] = None
    ) -> Dict:
        """Add a checkpoint to the workflow."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")

        checkpoint = {
            "checkpoint": checkpoint_name,
            "status": status,
            "details": details,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "estimated_completion": estimated_completion.isoformat() if estimated_completion else None,
            "completed_at": None
        }

        self.workflows[workflow_id]["checkpoints"].append(checkpoint)
        self.workflows[workflow_id]["updated_at"] = datetime.now().isoformat()

        logger.info(f"Added checkpoint '{checkpoint_name}' to workflow {workflow_id}")

        return checkpoint

    def update_checkpoint(
        self,
        workflow_id: str,
        checkpoint_name: str,
        status: CheckpointStatus,
        details: Optional[str] = None
    ) -> Dict:
        """Update an existing checkpoint."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")

        workflow = self.workflows[workflow_id]

        for checkpoint in workflow["checkpoints"]:
            if checkpoint["checkpoint"] == checkpoint_name:
                checkpoint["status"] = status
                checkpoint["updated_at"] = datetime.now().isoformat()

                if details:
                    checkpoint["details"] = details

                if status == CheckpointStatus.COMPLETED:
                    checkpoint["completed_at"] = datetime.now().isoformat()

                workflow["updated_at"] = datetime.now().isoformat()

                logger.info(f"Updated checkpoint '{checkpoint_name}' to {status} in workflow {workflow_id}")

                return checkpoint

        raise ValueError(f"Checkpoint '{checkpoint_name}' not found in workflow {workflow_id}")

    def add_test_order(
        self,
        workflow_id: str,
        test_name: str,
        order_type: str,  # 'laboratory', 'imaging', 'procedure'
        scheduled_date: Optional[datetime] = None,
        status: str = "ordered",
        details: Optional[Dict] = None
    ) -> Dict:
        """Add a test order to the workflow."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")

        order_id = f"ORDER-{uuid.uuid4().hex[:8].upper()}"

        test_order = {
            "order_id": order_id,
            "test_name": test_name,
            "order_type": order_type,
            "status": status,
            "ordered_at": datetime.now().isoformat(),
            "scheduled_date": scheduled_date.isoformat() if scheduled_date else None,
            "completed_at": None,
            "results_available": False,
            "details": details or {}
        }

        self.workflows[workflow_id]["test_orders"].append(test_order)
        self.workflows[workflow_id]["updated_at"] = datetime.now().isoformat()

        logger.info(f"Added test order '{test_name}' ({order_id}) to workflow {workflow_id}")

        return test_order

    def update_test_order(
        self,
        workflow_id: str,
        order_id: str,
        status: str,
        results_available: bool = False,
        details: Optional[Dict] = None
    ) -> Dict:
        """Update a test order status."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")

        workflow = self.workflows[workflow_id]

        for order in workflow["test_orders"]:
            if order["order_id"] == order_id:
                order["status"] = status
                order["results_available"] = results_available

                if status == "completed":
                    order["completed_at"] = datetime.now().isoformat()

                if details:
                    order["details"].update(details)

                workflow["updated_at"] = datetime.now().isoformat()

                logger.info(f"Updated test order {order_id} to {status} in workflow {workflow_id}")

                return order

        raise ValueError(f"Test order {order_id} not found in workflow {workflow_id}")

    def add_alert(
        self,
        workflow_id: str,
        alert_type: str,  # 'action_required', 'results_available', 'auth_approved', etc.
        message: str,
        priority: str = "normal"  # 'critical', 'high', 'normal', 'low'
    ) -> Dict:
        """Add an alert to the workflow."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")

        alert = {
            "alert_id": f"ALERT-{uuid.uuid4().hex[:8].upper()}",
            "alert_type": alert_type,
            "message": message,
            "priority": priority,
            "created_at": datetime.now().isoformat(),
            "acknowledged": False
        }

        self.workflows[workflow_id]["alerts"].append(alert)
        self.workflows[workflow_id]["updated_at"] = datetime.now().isoformat()

        logger.info(f"Added {priority} priority alert to workflow {workflow_id}: {message}")

        return alert

    def get_workflow(self, workflow_id: str) -> Optional[Dict]:
        """Get workflow by ID."""
        return self.workflows.get(workflow_id)

    def get_workflows_by_patient(self, patient_fhir_id: str) -> List[Dict]:
        """Get all workflows for a patient."""
        return [
            workflow for workflow in self.workflows.values()
            if workflow["patient_fhir_id"] == patient_fhir_id
        ]

    def get_active_workflows(self) -> List[Dict]:
        """Get all active workflows."""
        return [
            workflow for workflow in self.workflows.values()
            if workflow["status"] == WorkflowStatus.ACTIVE
        ]

    def get_workflows_needing_attention(self) -> List[Dict]:
        """
        Get workflows that need MA attention.
        Returns workflows with pending results, failed tests, or upcoming appointments.
        """
        attention_needed = []

        for workflow in self.workflows.values():
            if workflow["status"] != WorkflowStatus.ACTIVE:
                continue

            # Check for unacknowledged alerts
            unack_alerts = [a for a in workflow["alerts"] if not a["acknowledged"]]
            if unack_alerts:
                attention_needed.append({
                    **workflow,
                    "attention_reason": f"{len(unack_alerts)} unacknowledged alert(s)"
                })
                continue

            # Check for pending test results
            pending_results = [
                order for order in workflow["test_orders"]
                if order["status"] == "completed" and not order["results_available"]
            ]
            if pending_results:
                attention_needed.append({
                    **workflow,
                    "attention_reason": f"{len(pending_results)} test results pending review"
                })
                continue

            # Check for failed checkpoints
            failed_checkpoints = [
                cp for cp in workflow["checkpoints"]
                if cp["status"] == CheckpointStatus.FAILED
            ]
            if failed_checkpoints:
                attention_needed.append({
                    **workflow,
                    "attention_reason": f"{len(failed_checkpoints)} checkpoint(s) failed"
                })
                continue

        return attention_needed

    def get_workflow_progress(self, workflow_id: str) -> Dict:
        """Calculate workflow completion percentage and next steps."""
        workflow = self.get_workflow(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        checkpoints = workflow["checkpoints"]
        total_checkpoints = len(checkpoints)

        if total_checkpoints == 0:
            return {
                "progress_percentage": 0,
                "completed_steps": 0,
                "total_steps": 0,
                "next_step": "No checkpoints defined"
            }

        completed = len([cp for cp in checkpoints if cp["status"] == CheckpointStatus.COMPLETED])
        progress_percentage = int((completed / total_checkpoints) * 100)

        # Find next pending step
        next_step = None
        for checkpoint in checkpoints:
            if checkpoint["status"] not in [CheckpointStatus.COMPLETED]:
                next_step = checkpoint["checkpoint"]
                break

        return {
            "progress_percentage": progress_percentage,
            "completed_steps": completed,
            "total_steps": total_checkpoints,
            "next_step": next_step or "All checkpoints completed",
            "current_status": workflow["status"]
        }

    def complete_workflow(self, workflow_id: str, reason: str = "Appointment scheduled") -> Dict:
        """Mark workflow as completed."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")

        workflow = self.workflows[workflow_id]
        workflow["status"] = WorkflowStatus.COMPLETED
        workflow["completed_at"] = datetime.now().isoformat()
        workflow["completion_reason"] = reason
        workflow["updated_at"] = datetime.now().isoformat()

        logger.info(f"Completed workflow {workflow_id}: {reason}")

        return workflow


# Global workflow tracker instance
workflow_tracker = PatientWorkflowTracker()
