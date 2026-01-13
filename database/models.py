"""
SQLAlchemy ORM Models for Tribal Knowledge Database
"""
from sqlalchemy import Column, Integer, String, Boolean, Date, Time, TIMESTAMP, Text, DECIMAL, ForeignKey, ARRAY, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


class Specialty(Base):
    __tablename__ = 'specialties'

    specialty_id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    snomed_code = Column(String(20))
    description = Column(Text)
    active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    # Relationships
    providers = relationship("Provider", back_populates="specialty")
    appointments = relationship("Appointment", back_populates="specialty")


class Facility(Base):
    __tablename__ = 'facilities'

    facility_id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100), nullable=False)
    state = Column(String(2), default='UT')
    zip_code = Column(String(10))
    region = Column(String(50), nullable=False)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    phone = Column(String(20))
    email = Column(String(255))
    website = Column(String(255))
    hours_of_operation = Column(JSONB)
    services_offered = Column(ARRAY(Text))
    fhir_location_id = Column(String(100))  # FHIR Location resource ID
    active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    # Relationships
    providers = relationship("Provider", back_populates="facility")
    appointments = relationship("Appointment", back_populates="facility")
    clinic_rules = relationship("ClinicRule", back_populates="facility")


class Provider(Base):
    __tablename__ = 'providers'

    provider_id = Column(Integer, primary_key=True)
    npi = Column(String(10), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    specialty_id = Column(Integer, ForeignKey('specialties.specialty_id', ondelete='RESTRICT'))
    facility_id = Column(Integer, ForeignKey('facilities.facility_id', ondelete='RESTRICT'))
    email = Column(String(255))
    phone = Column(String(20))
    credentials = Column(String(50))
    years_experience = Column(Integer)
    languages = Column(ARRAY(Text), default=['English'])
    accepts_new_patients = Column(Boolean, default=True)
    telemedicine_available = Column(Boolean, default=False)
    fhir_practitioner_id = Column(String(100))  # FHIR Practitioner resource ID
    active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    @property
    def contact_info(self):
        """Helper property for FHIR sync"""
        return self.phone or self.email

    # Relationships
    specialty = relationship("Specialty", back_populates="providers")
    facility = relationship("Facility", back_populates="providers")
    availability = relationship("ProviderAvailability", back_populates="provider", cascade="all, delete-orphan")
    preferences = relationship("ProviderPreference", back_populates="provider", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="provider")


class ProviderAvailability(Base):
    __tablename__ = 'provider_availability'

    availability_id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey('providers.provider_id', ondelete='CASCADE'), nullable=False)
    day_of_week = Column(Integer, CheckConstraint('day_of_week BETWEEN 0 AND 6'), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    slot_duration_minutes = Column(Integer, default=15)
    active = Column(Boolean, default=True)
    effective_from = Column(Date, default=func.current_date())
    effective_until = Column(Date)
    notes = Column(Text)

    __table_args__ = (
        CheckConstraint('end_time > start_time', name='valid_time_range'),
        UniqueConstraint('provider_id', 'day_of_week', 'start_time', 'effective_from', name='unique_provider_schedule'),
    )

    # Relationships
    provider = relationship("Provider", back_populates="availability")


class ProviderPreference(Base):
    __tablename__ = 'provider_preferences'

    preference_id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey('providers.provider_id', ondelete='CASCADE'), nullable=False)
    preference_type = Column(String(50), nullable=False)
    preference_key = Column(String(100), nullable=False)
    preference_value = Column(JSONB, nullable=False)
    priority = Column(Integer, CheckConstraint('priority BETWEEN 1 AND 10'), default=5)
    notes = Column(Text)
    active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        UniqueConstraint('provider_id', 'preference_type', 'preference_key', name='unique_provider_preference'),
    )

    # Relationships
    provider = relationship("Provider", back_populates="preferences")


class ClinicRule(Base):
    __tablename__ = 'clinic_rules'

    rule_id = Column(Integer, primary_key=True)
    facility_id = Column(Integer, ForeignKey('facilities.facility_id', ondelete='CASCADE'), nullable=False)
    rule_type = Column(String(50), nullable=False)
    rule_name = Column(String(100), nullable=False)
    rule_definition = Column(JSONB, nullable=False)
    priority = Column(Integer, CheckConstraint('priority BETWEEN 1 AND 10'), default=5)
    active = Column(Boolean, default=True)
    effective_from = Column(Date, default=func.current_date())
    effective_until = Column(Date)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        UniqueConstraint('facility_id', 'rule_type', 'rule_name', name='unique_facility_rule'),
    )

    # Relationships
    facility = relationship("Facility", back_populates="clinic_rules")


class Appointment(Base):
    __tablename__ = 'appointments'

    appointment_id = Column(Integer, primary_key=True)
    fhir_appointment_id = Column(String(100), unique=True)
    patient_fhir_id = Column(String(100), nullable=False)
    provider_id = Column(Integer, ForeignKey('providers.provider_id', ondelete='RESTRICT'), nullable=False)
    facility_id = Column(Integer, ForeignKey('facilities.facility_id', ondelete='RESTRICT'), nullable=False)
    specialty_id = Column(Integer, ForeignKey('specialties.specialty_id', ondelete='RESTRICT'), nullable=False)
    appointment_datetime = Column(TIMESTAMP, nullable=False)
    duration_minutes = Column(Integer, CheckConstraint('duration_minutes > 0'), default=15)
    urgency = Column(String(20), CheckConstraint("urgency IN ('emergency', 'urgent', 'semi-urgent', 'non-urgent')"))
    visit_type = Column(String(50), CheckConstraint("visit_type IN ('in-person', 'telemedicine', 'phone')"), default='in-person')
    status = Column(String(50), CheckConstraint("status IN ('scheduled', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show')"), default='scheduled')
    reason_for_visit = Column(Text)
    chief_complaint = Column(Text)
    triage_priority = Column(String(20))
    triage_session_id = Column(String(100))
    confirmation_number = Column(String(50), unique=True)
    patient_notified = Column(Boolean, default=False)
    created_by = Column(String(100))
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        UniqueConstraint('provider_id', 'appointment_datetime', name='no_double_booking'),
    )

    # Relationships
    provider = relationship("Provider", back_populates="appointments")
    facility = relationship("Facility", back_populates="appointments")
    specialty = relationship("Specialty", back_populates="appointments")


class TriageHistory(Base):
    __tablename__ = 'triage_history'

    triage_id = Column(Integer, primary_key=True)
    session_id = Column(String(100), unique=True, nullable=False)
    patient_fhir_id = Column(String(100))
    symptoms_text = Column(Text, nullable=False)
    extracted_symptoms = Column(JSONB)
    triage_priority = Column(String(20), CheckConstraint("triage_priority IN ('emergency', 'urgent', 'semi-urgent', 'non-urgent')"), nullable=False)
    recommended_specialty_id = Column(Integer, ForeignKey('specialties.specialty_id'))
    confidence_score = Column(String(20))
    red_flags = Column(ARRAY(Text))
    recommendations = Column(JSONB)
    rag_context_used = Column(JSONB)
    ai_model_used = Column(String(50))
    final_appointment_id = Column(Integer, ForeignKey('appointments.appointment_id'))
    created_by = Column(String(100))
    created_at = Column(TIMESTAMP, default=datetime.now)

    # Relationships
    specialty = relationship("Specialty")
    appointment = relationship("Appointment")
