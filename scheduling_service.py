"""
Scheduling Service - Intelligent appointment slot recommendation and booking
"""
from datetime import datetime, timedelta, time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import json

from database.models import (
    Provider, Facility, ProviderAvailability, ProviderPreference,
    Appointment, ClinicRule, Specialty
)


class SchedulingService:
    """Intelligent appointment scheduling with tribal knowledge"""

    def __init__(self, db: Session):
        self.db = db

    def recommend_slots(
        self,
        specialty_id: int,
        triage_priority: str,
        patient_region: Optional[str] = None,
        preferred_date_range: Optional[Dict[str, str]] = None,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Recommend appointment slots based on multiple factors

        Scoring weights:
        - Urgency match: 40%
        - Geographic proximity: 20%
        - Provider preferences: 20%
        - Availability cushion: 10%
        - Historical success (RAG): 10%
        """

        # Determine search time window based on urgency
        time_window = self._get_time_window_by_urgency(triage_priority, preferred_date_range)

        # Get providers by specialty and region
        providers = self._get_available_providers(specialty_id, patient_region)

        if not providers:
            return []

        # Collect candidate slots
        candidate_slots = []

        for provider in providers:
            # Get provider preferences
            preferences = self._get_provider_preferences(provider.provider_id)

            # Get provider schedule
            schedule_slots = self._get_provider_schedule_slots(
                provider.provider_id,
                time_window['start_date'],
                time_window['end_date']
            )

            # Get booked appointments
            booked_appointments = self._get_booked_appointments(
                provider.provider_id,
                time_window['start_date'],
                time_window['end_date']
            )

            # Calculate open slots
            open_slots = self._calculate_open_slots(
                schedule_slots,
                booked_appointments,
                preferences,
                triage_priority
            )

            # Score slots
            for slot in open_slots:
                score = self._calculate_slot_score(
                    slot,
                    triage_priority,
                    patient_region,
                    provider.facility.region,
                    preferences
                )

                candidate_slots.append({
                    "provider": self._format_provider_info(provider),
                    "facility": self._format_facility_info(provider.facility),
                    "slot_datetime": slot['datetime'],
                    "duration_minutes": slot['duration'],
                    "reasoning": self._generate_reasoning(score, provider, slot),
                    "match_score": score['total'],
                    "distance_miles": score.get('distance', 0)
                })

        # Sort by score and return top N
        candidate_slots.sort(key=lambda x: x['match_score'], reverse=True)
        return candidate_slots[:limit]

    def _get_time_window_by_urgency(
        self,
        urgency: str,
        preferred_range: Optional[Dict[str, str]]
    ) -> Dict[str, datetime]:
        """Determine search window based on urgency"""
        now = datetime.now()

        if urgency == "emergency":
            # Same day only
            return {
                "start_date": now,
                "end_date": now.replace(hour=23, minute=59)
            }
        elif urgency == "urgent":
            # Within 48 hours
            return {
                "start_date": now,
                "end_date": now + timedelta(hours=48)
            }
        elif urgency == "semi-urgent":
            # Within 1 week
            return {
                "start_date": now,
                "end_date": now + timedelta(days=7)
            }
        else:  # non-urgent
            # Within 30 days
            start = datetime.strptime(preferred_range['start'], "%Y-%m-%d") if preferred_range and 'start' in preferred_range else now
            end = datetime.strptime(preferred_range['end'], "%Y-%m-%d") if preferred_range and 'end' in preferred_range else now + timedelta(days=30)
            return {"start_date": start, "end_date": end}

    def _get_available_providers(
        self,
        specialty_id: int,
        patient_region: Optional[str]
    ) -> List[Provider]:
        """Get providers by specialty, prioritizing patient's region"""
        query = self.db.query(Provider).join(Facility).filter(
            Provider.specialty_id == specialty_id,
            Provider.active == True,
            Provider.accepts_new_patients == True,
            Facility.active == True
        )

        if patient_region:
            # Prioritize same region, but include all
            same_region = query.filter(Facility.region == patient_region).all()
            other_regions = query.filter(Facility.region != patient_region).all()
            return same_region + other_regions
        else:
            return query.all()

    def _get_provider_preferences(self, provider_id: int) -> Dict[str, Any]:
        """Get provider scheduling preferences"""
        prefs = self.db.query(ProviderPreference).filter(
            ProviderPreference.provider_id == provider_id,
            ProviderPreference.active == True
        ).all()

        preferences = {}
        for pref in prefs:
            if pref.preference_type not in preferences:
                preferences[pref.preference_type] = {}
            preferences[pref.preference_type][pref.preference_key] = pref.preference_value

        return preferences

    def _get_provider_schedule_slots(
        self,
        provider_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get provider's available time slots"""
        schedule = self.db.query(ProviderAvailability).filter(
            ProviderAvailability.provider_id == provider_id,
            ProviderAvailability.active == True,
            or_(
                ProviderAvailability.effective_until == None,
                ProviderAvailability.effective_until >= start_date.date()
            )
        ).all()

        slots = []
        current_date = start_date.date()

        while current_date <= end_date.date():
            day_of_week = current_date.weekday() + 1  # Monday = 1
            if day_of_week == 7:
                day_of_week = 0  # Sunday = 0

            day_schedule = [s for s in schedule if s.day_of_week == day_of_week]

            for slot_config in day_schedule:
                # Generate time slots
                current_time = datetime.combine(current_date, slot_config.start_time)
                end_time = datetime.combine(current_date, slot_config.end_time)

                while current_time < end_time:
                    if current_time >= start_date:  # Only future slots
                        slots.append({
                            "datetime": current_time,
                            "duration": slot_config.slot_duration_minutes
                        })

                    current_time += timedelta(minutes=slot_config.slot_duration_minutes)

            current_date += timedelta(days=1)

        return slots

    def _get_booked_appointments(
        self,
        provider_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Appointment]:
        """Get provider's booked appointments"""
        return self.db.query(Appointment).filter(
            Appointment.provider_id == provider_id,
            Appointment.appointment_datetime >= start_date,
            Appointment.appointment_datetime <= end_date,
            Appointment.status.in_(['scheduled', 'confirmed', 'checked-in'])
        ).all()

    def _calculate_open_slots(
        self,
        schedule_slots: List[Dict[str, Any]],
        booked_appointments: List[Appointment],
        preferences: Dict[str, Any],
        urgency: str
    ) -> List[Dict[str, Any]]:
        """Calculate which slots are available considering urgency reservations"""
        booked_times = {appt.appointment_datetime for appt in booked_appointments}

        # Get urgency slot preferences
        urgency_slots = preferences.get('urgency_slots', {}).get('daily_slots', {
            "emergency": 2,
            "urgent": 4,
            "semi_urgent": 6
        })

        # Count urgency appointments per day
        urgency_counts = {}
        for appt in booked_appointments:
            day_key = appt.appointment_datetime.date()
            if day_key not in urgency_counts:
                urgency_counts[day_key] = {"emergency": 0, "urgent": 0, "semi_urgent": 0}

            if appt.urgency:
                urgency_key = appt.urgency.replace('-', '_')
                if urgency_key in urgency_counts[day_key]:
                    urgency_counts[day_key][urgency_key] += 1

        open_slots = []
        for slot in schedule_slots:
            if slot['datetime'] not in booked_times:
                day_key = slot['datetime'].date()
                urgency_key = urgency.replace('-', '_')

                # Check if urgency slot quota exceeded
                day_counts = urgency_counts.get(day_key, {"emergency": 0, "urgent": 0, "semi_urgent": 0})
                reserved_limit = urgency_slots.get(urgency_key, 999)

                if day_counts.get(urgency_key, 0) < reserved_limit:
                    open_slots.append(slot)

        return open_slots

    def _calculate_slot_score(
        self,
        slot: Dict[str, Any],
        urgency: str,
        patient_region: Optional[str],
        facility_region: str,
        preferences: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate multi-factor slot score"""
        scores = {}

        # Urgency match score (40%)
        urgency_score = self._score_urgency_match(slot['datetime'], urgency)
        scores['urgency'] = urgency_score * 0.4

        # Geographic proximity score (20%)
        if patient_region:
            proximity_score = 1.0 if patient_region == facility_region else 0.5
        else:
            proximity_score = 0.7
        scores['proximity'] = proximity_score * 0.2

        # Provider preference match (20%)
        preference_score = 0.8  # Simplified
        scores['preference'] = preference_score * 0.2

        # Availability cushion (10%)
        cushion_score = 0.7  # Simplified
        scores['cushion'] = cushion_score * 0.1

        # RAG/Historical (10%)
        rag_score = 0.6  # Simplified
        scores['rag'] = rag_score * 0.1

        scores['total'] = sum(scores.values())
        scores['distance'] = 0 if patient_region == facility_region else 20  # Simplified miles

        return scores

    def _score_urgency_match(self, slot_datetime: datetime, urgency: str) -> float:
        """Score how well slot timing matches urgency"""
        hours_from_now = (slot_datetime - datetime.now()).total_seconds() / 3600

        if urgency == "emergency":
            return 1.0 if hours_from_now <= 4 else max(0, 1.0 - (hours_from_now / 24))
        elif urgency == "urgent":
            return 1.0 if hours_from_now <= 24 else max(0, 1.0 - (hours_from_now / 48))
        elif urgency == "semi-urgent":
            return 1.0 if hours_from_now <= 72 else max(0, 1.0 - (hours_from_now / 168))
        else:  # non-urgent
            return max(0.3, 1.0 - (hours_from_now / 720))  # 30 days

    def _format_provider_info(self, provider: Provider) -> Dict[str, Any]:
        """Format provider information"""
        return {
            "provider_id": provider.provider_id,
            "npi": provider.npi,
            "name": f"Dr. {provider.first_name} {provider.last_name}",
            "credentials": provider.credentials,
            "specialty": provider.specialty.name,
            "years_experience": provider.years_experience,
            "languages": provider.languages
        }

    def _format_facility_info(self, facility: Facility) -> Dict[str, Any]:
        """Format facility information"""
        return {
            "facility_id": facility.facility_id,
            "name": facility.name,
            "address": f"{facility.address_line1}, {facility.city}, {facility.state} {facility.zip_code}",
            "city": facility.city,
            "region": facility.region,
            "phone": facility.phone
        }

    def _generate_reasoning(self, score: Dict[str, float], provider: Provider, slot: Dict) -> str:
        """Generate human-readable reasoning"""
        reasons = []

        if score['urgency'] > 0.35:
            reasons.append("Slot timing matches urgency level")

        if score['proximity'] > 0.15:
            reasons.append("Facility is in patient's region")

        reasons.append(f"{provider.first_name} {provider.last_name} has {provider.years_experience} years experience")

        return "; ".join(reasons)

    def book_appointment(
        self,
        provider_id: int,
        facility_id: int,
        specialty_id: int,
        patient_fhir_id: str,
        appointment_datetime: datetime,
        duration_minutes: int,
        urgency: str,
        triage_session_id: Optional[str] = None,
        reason_for_visit: Optional[str] = None,
        created_by: Optional[str] = "SYSTEM"
    ) -> Dict[str, Any]:
        """Book an appointment with race condition handling"""
        import uuid

        # Check for double-booking using SELECT FOR UPDATE
        existing = self.db.query(Appointment).filter(
            Appointment.provider_id == provider_id,
            Appointment.appointment_datetime == appointment_datetime,
            Appointment.status.in_(['scheduled', 'confirmed'])
        ).with_for_update().first()

        if existing:
            return {"success": False, "error": "Slot no longer available", "code": 409}

        # Create appointment
        appointment = Appointment(
            fhir_appointment_id=f"APPT-{uuid.uuid4().hex[:12].upper()}",
            patient_fhir_id=patient_fhir_id,
            provider_id=provider_id,
            facility_id=facility_id,
            specialty_id=specialty_id,
            appointment_datetime=appointment_datetime,
            duration_minutes=duration_minutes,
            urgency=urgency,
            status="scheduled",
            reason_for_visit=reason_for_visit,
            triage_session_id=triage_session_id,
            confirmation_number=str(uuid.uuid4().hex[:8].upper()),
            created_by=created_by
        )

        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)

        return {
            "success": True,
            "appointment_id": appointment.appointment_id,
            "confirmation_number": appointment.confirmation_number,
            "fhir_appointment_id": appointment.fhir_appointment_id
        }
