-- ============================================
-- GCP Cloud SQL Complete Database Setup
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'America/Denver';

-- ============================================
-- TABLES (from 02-schema.sql)
-- ============================================

CREATE TABLE IF NOT EXISTS specialties (
    specialty_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    snomed_code VARCHAR(20),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilities (
    facility_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state CHAR(2) DEFAULT 'UT',
    zip_code VARCHAR(10),
    region VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    hours_of_operation JSONB,
    services_offered TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
    provider_id SERIAL PRIMARY KEY,
    npi VARCHAR(10) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialty_id INT REFERENCES specialties(specialty_id) ON DELETE RESTRICT,
    facility_id INT REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    email VARCHAR(255),
    phone VARCHAR(20),
    credentials VARCHAR(50),
    years_experience INT,
    languages TEXT[] DEFAULT ARRAY['English'],
    accepts_new_patients BOOLEAN DEFAULT true,
    telemedicine_available BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_availability (
    availability_id SERIAL PRIMARY KEY,
    provider_id INT REFERENCES providers(provider_id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT DEFAULT 15,
    active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    notes TEXT,
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    UNIQUE(provider_id, day_of_week, start_time, effective_from)
);

CREATE TABLE IF NOT EXISTS provider_preferences (
    preference_id SERIAL PRIMARY KEY,
    provider_id INT REFERENCES providers(provider_id) ON DELETE CASCADE,
    preference_type VARCHAR(50) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_provider_preference UNIQUE(provider_id, preference_type, preference_key)
);

CREATE TABLE IF NOT EXISTS clinic_rules (
    rule_id SERIAL PRIMARY KEY,
    facility_id INT REFERENCES facilities(facility_id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_definition JSONB NOT NULL,
    priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_facility_rule UNIQUE(facility_id, rule_type, rule_name)
);

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id SERIAL PRIMARY KEY,
    fhir_appointment_id VARCHAR(100) UNIQUE,
    patient_fhir_id VARCHAR(100) NOT NULL,
    provider_id INT REFERENCES providers(provider_id) ON DELETE RESTRICT,
    facility_id INT REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    specialty_id INT REFERENCES specialties(specialty_id) ON DELETE RESTRICT,
    appointment_datetime TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 15 CHECK (duration_minutes > 0),
    urgency VARCHAR(20) CHECK (urgency IN ('emergency', 'urgent', 'semi-urgent', 'non-urgent')),
    visit_type VARCHAR(50) DEFAULT 'in-person' CHECK (visit_type IN ('in-person', 'telemedicine', 'phone')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show')),
    reason_for_visit TEXT,
    chief_complaint TEXT,
    triage_priority VARCHAR(20),
    triage_session_id VARCHAR(100),
    confirmation_number VARCHAR(50) UNIQUE,
    patient_notified BOOLEAN DEFAULT false,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_double_booking UNIQUE(provider_id, appointment_datetime)
);

CREATE TABLE IF NOT EXISTS triage_history (
    triage_id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    patient_fhir_id VARCHAR(100),
    symptoms_text TEXT NOT NULL,
    extracted_symptoms JSONB,
    triage_priority VARCHAR(20) NOT NULL CHECK (triage_priority IN ('emergency', 'urgent', 'semi-urgent', 'non-urgent')),
    recommended_specialty_id INT REFERENCES specialties(specialty_id),
    confidence_score VARCHAR(20),
    red_flags TEXT[],
    recommendations JSONB,
    rag_context_used JSONB,
    ai_model_used VARCHAR(50),
    final_appointment_id INT REFERENCES appointments(appointment_id),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_audit (
    audit_id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'cancelled', 'rescheduled', 'completed', 'no-show')),
    changed_by VARCHAR(100) NOT NULL,
    changes JSONB,
    reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waitlist (
    waitlist_id SERIAL PRIMARY KEY,
    patient_fhir_id VARCHAR(100) NOT NULL,
    specialty_id INT REFERENCES specialties(specialty_id),
    preferred_provider_id INT REFERENCES providers(provider_id),
    preferred_facility_id INT REFERENCES facilities(facility_id),
    urgency VARCHAR(20) NOT NULL,
    preferred_date_range_start DATE,
    preferred_date_range_end DATE,
    preferred_time_of_day VARCHAR(20),
    triage_session_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'scheduled', 'expired', 'cancelled')),
    contact_attempts INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- ============================================
-- SEED DATA: Specialties
-- ============================================
INSERT INTO specialties (specialty_id, name, snomed_code, description) VALUES
    (1, 'Family Medicine', '419772000', 'Primary care for patients of all ages'),
    (2, 'Cardiology', '394579002', 'Diagnosis and treatment of heart conditions'),
    (3, 'Orthopedics', '394801008', 'Treatment of musculoskeletal system conditions'),
    (4, 'Dermatology', '394582007', 'Diagnosis and treatment of skin conditions'),
    (5, 'Mental Health', '394587001', 'Psychiatric and behavioral health services'),
    (6, 'Neurology', '394591006', 'Diagnosis and treatment of nervous system disorders'),
    (7, 'Gastroenterology', '394584008', 'Treatment of digestive system disorders'),
    (8, 'Pulmonology', '418112009', 'Treatment of respiratory system disorders'),
    (9, 'Endocrinology', '394583002', 'Treatment of hormonal and metabolic disorders'),
    (10, 'Nephrology', '394589003', 'Treatment of kidney disorders'),
    (11, 'Oncology', '394592004', 'Cancer diagnosis and treatment'),
    (12, 'Rheumatology', '394810000', 'Treatment of autoimmune and joint disorders'),
    (13, 'Ophthalmology', '422191005', 'Eye and vision care'),
    (14, 'ENT', '418960008', 'Ear, nose, and throat disorders'),
    (15, 'Urology', '394612005', 'Urinary tract and male reproductive system'),
    (16, 'OB/GYN', '394586005', 'Women''s health and obstetrics'),
    (17, 'Pediatrics', '394537008', 'Healthcare for children and adolescents'),
    (18, 'Geriatrics', '394811001', 'Healthcare for elderly patients'),
    (19, 'Infectious Disease', '408454008', 'Diagnosis and treatment of infections'),
    (20, 'Hematology', '394803003', 'Blood and bleeding disorders'),
    (21, 'Pain Management', '394914008', 'Chronic pain treatment and management')
ON CONFLICT (specialty_id) DO UPDATE SET
    name = EXCLUDED.name,
    snomed_code = EXCLUDED.snomed_code,
    description = EXCLUDED.description;

SELECT setval('specialties_specialty_id_seq', 22, false);

-- ============================================
-- SEED DATA: Facilities
-- ============================================
INSERT INTO facilities (facility_id, name, type, address_line1, city, state, zip_code, region, phone, active) VALUES
    (1, 'West Valley City Community Health Center', 'Community Health', '2850 W 3500 S', 'West Valley City', 'UT', '84119', 'Salt Lake Valley', '801-555-0100', true),
    (2, 'Salt Lake Heart Center', 'Specialty Clinic', '500 E 900 S', 'Salt Lake City', 'UT', '84102', 'Salt Lake Valley', '801-555-0200', true),
    (3, 'Utah Valley Orthopedics', 'Specialty Clinic', '1200 N University Ave', 'Provo', 'UT', '84604', 'Utah County', '801-555-0300', true),
    (4, 'Intermountain Healthcare - Murray', 'Hospital', '5169 Cottonwood St', 'Murray', 'UT', '84107', 'Salt Lake Valley', '801-555-0400', true),
    (5, 'Davis Behavioral Health', 'Mental Health Clinic', '934 S Main St', 'Layton', 'UT', '84041', 'Davis/Weber', '801-555-0500', true),
    (6, 'Logan Regional Hospital', 'Hospital', '1400 N 500 E', 'Logan', 'UT', '84341', 'Cache Valley', '435-555-0600', true)
ON CONFLICT (facility_id) DO NOTHING;

SELECT setval('facilities_facility_id_seq', 7, false);

-- ============================================
-- SEED DATA: Providers
-- ============================================
INSERT INTO providers (provider_id, npi, first_name, last_name, specialty_id, facility_id, credentials, years_experience, accepts_new_patients, active) VALUES
    (1, '1234567890', 'Sarah', 'Johnson', 1, 1, 'MD', 12, true, true),
    (2, '1234567891', 'Michael', 'Chen', 1, 4, 'DO', 8, true, true),
    (3, '1234567892', 'Emily', 'Davis', 1, 6, 'MD', 15, true, true),
    (4, '1234567893', 'David', 'Martinez', 2, 2, 'MD', 20, true, true),
    (5, '1234567894', 'Lisa', 'Thompson', 2, 4, 'MD', 18, true, true),
    (6, '1234567895', 'James', 'Wilson', 3, 3, 'MD', 22, true, true),
    (7, '1234567896', 'Jennifer', 'Anderson', 3, 4, 'DO', 10, true, true),
    (8, '1234567897', 'Robert', 'Taylor', 5, 5, 'MD', 16, true, true),
    (9, '1234567898', 'Maria', 'Garcia', 5, 4, 'PhD', 14, true, true),
    (10, '1234567899', 'Raj', 'Patel', 9, 4, 'MD', 19, true, true),
    (11, '1234567900', 'Susan', 'Lee', 6, 4, 'MD', 17, true, true),
    (12, '1234567901', 'Christopher', 'Brown', 8, 2, 'MD', 13, true, true),
    (13, '1234567902', 'Amanda', 'White', 4, 1, 'MD', 11, true, true),
    (14, '1234567903', 'Jessica', 'Miller', 16, 4, 'MD', 14, true, true),
    (15, '1234567904', 'Daniel', 'Harris', 17, 1, 'MD', 9, true, true)
ON CONFLICT (npi) DO NOTHING;

SELECT setval('providers_provider_id_seq', 16, false);

-- ============================================
-- SEED DATA: Provider Availability
-- ============================================
INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, slot_duration_minutes, active)
SELECT
    p.provider_id,
    dow,
    '08:00'::TIME,
    '17:00'::TIME,
    CASE 
        WHEN p.specialty_id IN (5, 8) THEN 60  -- Mental Health: 60 min
        WHEN p.specialty_id IN (2, 3, 9, 6) THEN 30  -- Cardiology, Ortho, Endo, Neuro: 30 min
        WHEN p.specialty_id IN (4, 17) THEN 20  -- Dermatology, Pediatrics: 20 min
        ELSE 15  -- Family Medicine, etc: 15 min
    END,
    true
FROM providers p
CROSS JOIN generate_series(1, 5) AS dow  -- Monday(1) to Friday(5)
WHERE p.active = true
ON CONFLICT DO NOTHING;

\echo 'Database setup complete!'
