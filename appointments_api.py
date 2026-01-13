"""
Appointments API Service
Comprehensive appointment management endpoints for EHR integration
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from database.models import (
    Appointment, Provider, Facility, Specialty
)
import logging

logger = logging.getLogger(__name__)


class AppointmentsAPIService:
    """Service for managing appointment queries and operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_appointments(
        self,
        facility_id: Optional[int] = None,
        specialty_id: Optional[int] = None,
        provider_id: Optional[int] = None,
        patient_fhir_id: Optional[str] = None,
        status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get appointments with comprehensive filtering

        Returns appointments with provider, facility, and patient details
        """
        try:
            # Build base query with joins
            query = self.db.query(Appointment).join(
                Provider, Appointment.provider_id == Provider.provider_id
            ).join(
                Facility, Appointment.facility_id == Facility.facility_id
            ).join(
                Specialty, Appointment.specialty_id == Specialty.specialty_id
            )

            # Apply filters
            filters = []

            if facility_id:
                filters.append(Appointment.facility_id == facility_id)

            if specialty_id:
                filters.append(Appointment.specialty_id == specialty_id)

            if provider_id:
                filters.append(Appointment.provider_id == provider_id)

            if patient_fhir_id:
                filters.append(Appointment.patient_fhir_id == patient_fhir_id)

            if status:
                filters.append(Appointment.status == status)

            if start_date:
                filters.append(Appointment.appointment_datetime >= start_date)

            if end_date:
                filters.append(Appointment.appointment_datetime <= end_date)

            if filters:
                query = query.filter(and_(*filters))

            # Get total count
            total = query.count()

            # Order by appointment datetime descending (newest first)
            query = query.order_by(desc(Appointment.appointment_datetime))

            # Apply pagination
            appointments = query.limit(limit).offset(offset).all()

            # Format results
            results = []
            for appt in appointments:
                results.append(self._format_appointment(appt))

            return {
                "appointments": results,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < total
            }

        except Exception as e:
            logger.error(f"Error fetching appointments: {str(e)}", exc_info=True)
            raise

    def get_appointment_by_id(self, appointment_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed appointment information by ID"""
        try:
            appointment = self.db.query(Appointment).filter(
                Appointment.appointment_id == appointment_id
            ).first()

            if not appointment:
                return None

            return self._format_appointment_detail(appointment)

        except Exception as e:
            logger.error(f"Error fetching appointment {appointment_id}: {str(e)}")
            raise

    def get_todays_appointments(
        self,
        facility_id: Optional[int] = None,
        provider_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get today's appointments for quick dashboard view"""
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        result = self.get_appointments(
            facility_id=facility_id,
            provider_id=provider_id,
            start_date=today_start,
            end_date=today_end,
            limit=100
        )

        return result['appointments']

    def get_upcoming_appointments(
        self,
        patient_fhir_id: str,
        days_ahead: int = 30
    ) -> List[Dict[str, Any]]:
        """Get upcoming appointments for a patient"""
        now = datetime.now()
        future = now + timedelta(days=days_ahead)

        result = self.get_appointments(
            patient_fhir_id=patient_fhir_id,
            start_date=now,
            end_date=future,
            status='scheduled',
            limit=10
        )

        return result['appointments']

    def get_provider_schedule(
        self,
        provider_id: int,
        date: datetime
    ) -> List[Dict[str, Any]]:
        """Get full day schedule for a provider"""
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        result = self.get_appointments(
            provider_id=provider_id,
            start_date=day_start,
            end_date=day_end,
            limit=100
        )

        return result['appointments']

    def get_appointment_stats(
        self,
        facility_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get appointment statistics for dashboard"""
        try:
            query = self.db.query(Appointment)

            if facility_id:
                query = query.filter(Appointment.facility_id == facility_id)

            if start_date:
                query = query.filter(Appointment.appointment_datetime >= start_date)

            if end_date:
                query = query.filter(Appointment.appointment_datetime <= end_date)

            total = query.count()

            # Count by status
            status_counts = {}
            for status in ['scheduled', 'confirmed', 'checked-in', 'completed', 'cancelled', 'no-show']:
                count = query.filter(Appointment.status == status).count()
                status_counts[status] = count

            # Count by urgency
            urgency_counts = {}
            for urgency in ['emergency', 'urgent', 'semi-urgent', 'non-urgent']:
                count = query.filter(Appointment.urgency == urgency).count()
                urgency_counts[urgency] = count

            return {
                "total": total,
                "by_status": status_counts,
                "by_urgency": urgency_counts
            }

        except Exception as e:
            logger.error(f"Error getting appointment stats: {str(e)}")
            raise

    def _format_appointment(self, appt: Appointment) -> Dict[str, Any]:
        """Format appointment for list view"""
        return {
            "appointment_id": appt.appointment_id,
            "confirmation_number": appt.confirmation_number,
            "fhir_appointment_id": appt.fhir_appointment_id,
            "patient_fhir_id": appt.patient_fhir_id,
            "appointment_datetime": appt.appointment_datetime.isoformat() if appt.appointment_datetime else None,
            "duration_minutes": appt.duration_minutes,
            "status": appt.status,
            "urgency": appt.urgency,
            "reason_for_visit": appt.reason_for_visit,
            "chief_complaint": appt.chief_complaint,
            "provider": {
                "provider_id": appt.provider.provider_id,
                "name": f"Dr. {appt.provider.first_name} {appt.provider.last_name}",
                "credentials": appt.provider.credentials,
                "npi": appt.provider.npi
            } if appt.provider else None,
            "facility": {
                "facility_id": appt.facility.facility_id,
                "name": appt.facility.name,
                "city": appt.facility.city,
                "address": appt.facility.address_line1
            } if appt.facility else None,
            "specialty": {
                "specialty_id": appt.specialty.specialty_id,
                "name": appt.specialty.name
            } if appt.specialty else None,
            "created_at": appt.created_at.isoformat() if appt.created_at else None
        }

    def _format_appointment_detail(self, appt: Appointment) -> Dict[str, Any]:
        """Format appointment with full details"""
        basic = self._format_appointment(appt)

        # Add additional detail fields
        basic.update({
            "visit_type": appt.visit_type,
            "triage_priority": appt.triage_priority,
            "triage_session_id": appt.triage_session_id,
            "patient_notified": appt.patient_notified,
            "created_by": appt.created_by,
            "updated_at": appt.updated_at.isoformat() if appt.updated_at else None
        })

        return basic
