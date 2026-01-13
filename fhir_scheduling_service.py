"""
FHIR Scheduling Service
Manages FHIR R4 Appointment, Schedule, and Slot resources for EHR integration
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from fhirclient import client
from fhirclient.models.appointment import Appointment, AppointmentParticipant
from fhirclient.models.schedule import Schedule
from fhirclient.models.slot import Slot
from fhirclient.models.fhirreference import FHIRReference
from fhirclient.models.period import Period
from fhirclient.models.fhirdate import FHIRDate
from fhirclient.models.codeableconcept import CodeableConcept
from fhirclient.models.coding import Coding
from fhirclient.models.identifier import Identifier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FHIRSchedulingService:
    """Service for managing FHIR scheduling resources (Appointment, Schedule, Slot)"""

    def __init__(self, fhir_server_url: str):
        """
        Initialize FHIR scheduling service

        Args:
            fhir_server_url: Base URL of the HAPI FHIR server
        """
        self.settings = {
            'app_id': 'fhir_scheduling_app',
            'api_base': fhir_server_url
        }
        self.client = client.FHIRClient(settings=self.settings)
        logger.info(f"FHIR Scheduling Service initialized with server: {fhir_server_url}")

    # ========== Appointment Resource Management ==========

    def create_appointment(
        self,
        patient_fhir_id: str,
        provider_fhir_id: str,
        facility_fhir_id: str,
        start_datetime: datetime,
        duration_minutes: int,
        status: str = "booked",
        appointment_type: str = "in-person",
        reason: str = None,
        description: str = None,
        urgency: str = "routine",
        confirmation_number: str = None
    ) -> Dict[str, Any]:
        """
        Create a FHIR Appointment resource

        Args:
            patient_fhir_id: FHIR Patient ID
            provider_fhir_id: FHIR Practitioner ID
            facility_fhir_id: FHIR Location ID
            start_datetime: Appointment start time
            duration_minutes: Duration in minutes
            status: booked, fulfilled, cancelled, noshow, pending, proposed
            appointment_type: Type of appointment
            reason: Reason for appointment
            description: Additional description
            urgency: routine, urgent, asap, stat
            confirmation_number: Confirmation number for tracking

        Returns:
            Dict with created appointment details
        """
        try:
            # Create FHIR Appointment resource
            appointment = Appointment()

            # Status (required)
            appointment.status = status

            # Start time (required)
            appointment.start = FHIRDate(start_datetime.isoformat())

            # End time (calculated from duration)
            end_datetime = start_datetime + timedelta(minutes=duration_minutes)
            appointment.end = FHIRDate(end_datetime.isoformat())

            # Duration in minutes
            appointment.minutesDuration = duration_minutes

            # Priority (urgency) - FHIR uses unsigned int (0-9)
            # Lower numbers indicate higher priority
            priority_map = {
                "stat": 1,
                "emergency": 1,
                "asap": 2,
                "urgent": 3,
                "semi-urgent": 4,
                "routine": 5,
                "non-urgent": 5
            }
            appointment.priority = priority_map.get(urgency.lower(), 5)

            # Description
            if description:
                appointment.description = description
            elif reason:
                appointment.description = reason

            # Participants
            appointment.participant = []

            # Patient participant
            patient_participant = AppointmentParticipant()
            patient_participant.actor = FHIRReference()
            patient_participant.actor.reference = f"Patient/{patient_fhir_id}"
            patient_participant.status = "accepted"
            patient_participant.required = "required"
            appointment.participant.append(patient_participant)

            # Practitioner participant
            practitioner_participant = AppointmentParticipant()
            practitioner_participant.actor = FHIRReference()
            practitioner_participant.actor.reference = f"Practitioner/{provider_fhir_id}"
            practitioner_participant.status = "accepted"
            practitioner_participant.required = "required"
            appointment.participant.append(practitioner_participant)

            # Location participant
            location_participant = AppointmentParticipant()
            location_participant.actor = FHIRReference()
            location_participant.actor.reference = f"Location/{facility_fhir_id}"
            location_participant.status = "accepted"
            location_participant.required = "required"
            appointment.participant.append(location_participant)

            # Appointment type
            if appointment_type:
                appointment.appointmentType = CodeableConcept()
                appointment.appointmentType.coding = [Coding()]
                appointment.appointmentType.coding[0].system = "http://terminology.hl7.org/CodeSystem/v2-0276"
                appointment.appointmentType.coding[0].code = "WALKIN" if appointment_type == "in-person" else "ROUTINE"
                appointment.appointmentType.coding[0].display = appointment_type.replace("-", " ").title()
                appointment.appointmentType.text = appointment_type

            # Reason code
            if reason:
                appointment.reasonCode = [CodeableConcept()]
                appointment.reasonCode[0].text = reason

            # Identifier for tracking (confirmation number)
            if confirmation_number:
                appointment.identifier = [Identifier()]
                appointment.identifier[0].system = "http://medichat.example.com/appointment-confirmation"
                appointment.identifier[0].value = confirmation_number

            # Create on FHIR server
            appointment.create(self.client.server)

            logger.info(f"Created FHIR Appointment: {appointment.id}")

            return {
                "fhir_appointment_id": appointment.id,
                "status": appointment.status,
                "start": start_datetime.isoformat(),
                "end": end_datetime.isoformat(),
                "patient_id": patient_fhir_id,
                "provider_id": provider_fhir_id,
                "facility_id": facility_fhir_id,
                "confirmation_number": confirmation_number
            }

        except Exception as e:
            logger.error(f"Error creating FHIR Appointment: {str(e)}", exc_info=True)
            raise Exception(f"Failed to create FHIR Appointment: {str(e)}")

    def get_appointment(self, appointment_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a FHIR Appointment resource by ID

        Args:
            appointment_id: FHIR Appointment ID

        Returns:
            Dict with appointment details or None
        """
        try:
            appointment = Appointment.read(appointment_id, self.client.server)

            if not appointment:
                logger.warning(f"FHIR Appointment {appointment_id} not found")
                return None

            # Extract participant IDs
            patient_id = None
            provider_id = None
            facility_id = None

            for participant in appointment.participant or []:
                if participant.actor and participant.actor.reference:
                    ref = participant.actor.reference
                    if ref.startswith("Patient/"):
                        patient_id = ref.replace("Patient/", "")
                    elif ref.startswith("Practitioner/"):
                        provider_id = ref.replace("Practitioner/", "")
                    elif ref.startswith("Location/"):
                        facility_id = ref.replace("Location/", "")

            # Extract confirmation number
            confirmation_number = None
            if appointment.identifier:
                for identifier in appointment.identifier:
                    if identifier.value:
                        confirmation_number = identifier.value
                        break

            return {
                "id": appointment.id,
                "status": appointment.status,
                "start": appointment.start.isostring if appointment.start else None,
                "end": appointment.end.isostring if appointment.end else None,
                "minutesDuration": appointment.minutesDuration,
                "priority": appointment.priority,
                "description": appointment.description,
                "patient_id": patient_id,
                "provider_id": provider_id,
                "facility_id": facility_id,
                "confirmation_number": confirmation_number,
                "appointmentType": appointment.appointmentType.text if appointment.appointmentType else None,
                "reasonCode": appointment.reasonCode[0].text if appointment.reasonCode else None
            }

        except Exception as e:
            logger.error(f"Error retrieving FHIR Appointment {appointment_id}: {str(e)}")
            return None

    def update_appointment_status(self, appointment_id: str, new_status: str) -> bool:
        """
        Update the status of a FHIR Appointment

        Args:
            appointment_id: FHIR Appointment ID
            new_status: New status (booked, fulfilled, cancelled, noshow, etc.)

        Returns:
            True if successful, False otherwise
        """
        try:
            appointment = Appointment.read(appointment_id, self.client.server)

            if not appointment:
                logger.warning(f"FHIR Appointment {appointment_id} not found")
                return False

            # Update status
            appointment.status = new_status

            # Update on server
            appointment.update(self.client.server)

            logger.info(f"Updated FHIR Appointment {appointment_id} status to {new_status}")
            return True

        except Exception as e:
            logger.error(f"Error updating FHIR Appointment status: {str(e)}")
            return False

    def search_appointments(
        self,
        patient_id: Optional[str] = None,
        practitioner_id: Optional[str] = None,
        location_id: Optional[str] = None,
        status: Optional[str] = None,
        date_start: Optional[datetime] = None,
        date_end: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for appointments with filters

        Args:
            patient_id: Filter by patient FHIR ID
            practitioner_id: Filter by practitioner FHIR ID
            location_id: Filter by location FHIR ID
            status: Filter by status
            date_start: Filter by start date (>=)
            date_end: Filter by end date (<=)

        Returns:
            List of appointment dictionaries
        """
        try:
            # Build search parameters
            search_params = {}

            if patient_id:
                search_params['patient'] = f"Patient/{patient_id}"

            if practitioner_id:
                search_params['practitioner'] = f"Practitioner/{practitioner_id}"

            if location_id:
                search_params['location'] = f"Location/{location_id}"

            if status:
                search_params['status'] = status

            if date_start:
                search_params['date'] = f"ge{date_start.strftime('%Y-%m-%d')}"

            if date_end:
                # If we have both start and end, we need to combine them
                if date_start:
                    search_params['date'] = f"ge{date_start.strftime('%Y-%m-%d')}&date=le{date_end.strftime('%Y-%m-%d')}"
                else:
                    search_params['date'] = f"le{date_end.strftime('%Y-%m-%d')}"

            # Perform search
            search = Appointment.where(struct=search_params)
            appointments = search.perform_resources(self.client.server)

            # Convert to dict format
            results = []
            for appt in appointments:
                appt_dict = self.get_appointment(appt.id)
                if appt_dict:
                    results.append(appt_dict)

            logger.info(f"Found {len(results)} appointments matching search criteria")
            return results

        except Exception as e:
            logger.error(f"Error searching FHIR Appointments: {str(e)}")
            return []

    # ========== Schedule Resource Management ==========

    def create_schedule(
        self,
        provider_fhir_id: str,
        facility_fhir_id: str,
        specialty: str,
        period_start: datetime,
        period_end: datetime,
        schedule_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a FHIR Schedule resource for provider availability

        Args:
            provider_fhir_id: FHIR Practitioner ID
            facility_fhir_id: FHIR Location ID
            specialty: Specialty name
            period_start: Schedule validity start
            period_end: Schedule validity end
            schedule_id: Optional custom schedule ID

        Returns:
            Dict with created schedule details
        """
        try:
            schedule = Schedule()

            # Active status
            schedule.active = True

            # Actors (who this schedule is for)
            schedule.actor = []

            # Practitioner
            practitioner_ref = FHIRReference()
            practitioner_ref.reference = f"Practitioner/{provider_fhir_id}"
            schedule.actor.append(practitioner_ref)

            # Location
            location_ref = FHIRReference()
            location_ref.reference = f"Location/{facility_fhir_id}"
            schedule.actor.append(location_ref)

            # Specialty
            if specialty:
                schedule.specialty = [CodeableConcept()]
                schedule.specialty[0].text = specialty

            # Planning horizon (validity period)
            schedule.planningHorizon = Period()
            schedule.planningHorizon.start = FHIRDate(period_start.isoformat())
            schedule.planningHorizon.end = FHIRDate(period_end.isoformat())

            # Identifier
            if schedule_id:
                schedule.identifier = [Identifier()]
                schedule.identifier[0].system = "http://medichat.example.com/schedule"
                schedule.identifier[0].value = schedule_id

            # Create on server
            schedule.create(self.client.server)

            logger.info(f"Created FHIR Schedule: {schedule.id}")

            return {
                "fhir_schedule_id": schedule.id,
                "provider_id": provider_fhir_id,
                "facility_id": facility_fhir_id,
                "specialty": specialty,
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "active": True
            }

        except Exception as e:
            logger.error(f"Error creating FHIR Schedule: {str(e)}", exc_info=True)
            raise Exception(f"Failed to create FHIR Schedule: {str(e)}")

    # ========== Slot Resource Management ==========

    def create_slot(
        self,
        schedule_fhir_id: str,
        start_datetime: datetime,
        end_datetime: datetime,
        status: str = "free",
        specialty: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a FHIR Slot resource for a bookable time slot

        Args:
            schedule_fhir_id: Reference to Schedule resource
            start_datetime: Slot start time
            end_datetime: Slot end time
            status: free, busy, busy-unavailable, busy-tentative, entered-in-error
            specialty: Optional specialty for the slot

        Returns:
            Dict with created slot details
        """
        try:
            slot = Slot()

            # Schedule reference (required)
            slot.schedule = FHIRReference()
            slot.schedule.reference = f"Schedule/{schedule_fhir_id}"

            # Status (required)
            slot.status = status

            # Start and end times (required)
            slot.start = FHIRDate(start_datetime.isoformat())
            slot.end = FHIRDate(end_datetime.isoformat())

            # Specialty
            if specialty:
                slot.specialty = [CodeableConcept()]
                slot.specialty[0].text = specialty

            # Create on server
            slot.create(self.client.server)

            logger.info(f"Created FHIR Slot: {slot.id}")

            return {
                "fhir_slot_id": slot.id,
                "schedule_id": schedule_fhir_id,
                "start": start_datetime.isoformat(),
                "end": end_datetime.isoformat(),
                "status": status
            }

        except Exception as e:
            logger.error(f"Error creating FHIR Slot: {str(e)}", exc_info=True)
            raise Exception(f"Failed to create FHIR Slot: {str(e)}")

    def update_slot_status(self, slot_id: str, new_status: str) -> bool:
        """
        Update the status of a FHIR Slot (e.g., from 'free' to 'busy' when booked)

        Args:
            slot_id: FHIR Slot ID
            new_status: New status (free, busy, busy-unavailable, etc.)

        Returns:
            True if successful, False otherwise
        """
        try:
            slot = Slot.read(slot_id, self.client.server)

            if not slot:
                logger.warning(f"FHIR Slot {slot_id} not found")
                return False

            # Update status
            slot.status = new_status

            # Update on server
            slot.update(self.client.server)

            logger.info(f"Updated FHIR Slot {slot_id} status to {new_status}")
            return True

        except Exception as e:
            logger.error(f"Error updating FHIR Slot status: {str(e)}")
            return False

    def search_available_slots(
        self,
        schedule_id: Optional[str] = None,
        specialty: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for available (free) slots

        Args:
            schedule_id: Filter by schedule FHIR ID
            specialty: Filter by specialty
            start_date: Filter by start date
            end_date: Filter by end date

        Returns:
            List of available slot dictionaries
        """
        try:
            search_params = {
                'status': 'free'
            }

            if schedule_id:
                search_params['schedule'] = f"Schedule/{schedule_id}"

            if start_date:
                search_params['start'] = f"ge{start_date.strftime('%Y-%m-%dT%H:%M:%S')}"

            if end_date:
                if start_date:
                    search_params['start'] = f"ge{start_date.strftime('%Y-%m-%dT%H:%M:%S')}&start=le{end_date.strftime('%Y-%m-%dT%H:%M:%S')}"
                else:
                    search_params['start'] = f"le{end_date.strftime('%Y-%m-%dT%H:%M:%S')}"

            # Perform search
            search = Slot.where(struct=search_params)
            slots = search.perform_resources(self.client.server)

            # Convert to dict format
            results = []
            for slot in slots:
                results.append({
                    "id": slot.id,
                    "schedule_id": slot.schedule.reference.replace("Schedule/", "") if slot.schedule else None,
                    "start": slot.start.isostring if slot.start else None,
                    "end": slot.end.isostring if slot.end else None,
                    "status": slot.status,
                    "specialty": slot.specialty[0].text if slot.specialty else None
                })

            logger.info(f"Found {len(results)} available slots")
            return results

        except Exception as e:
            logger.error(f"Error searching FHIR Slots: {str(e)}")
            return []
