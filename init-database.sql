-- MediChat Database Schema and Initial Data
-- Target: Cloud SQL PostgreSQL (hapi database)

-- Drop existing tables if they exist
DROP TABLE IF EXISTS triage_history CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS provider_availability CASCADE;
DROP TABLE IF EXISTS provider_preferences CASCADE;
DROP TABLE IF EXISTS clinic_rules CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;

-- Create specialties table
CREATE TABLE specialties (
    specialty_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    snomed_code VARCHAR(20),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create facilities table
CREATE TABLE facilities (
    facility_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) DEFAULT 'UT',
    zip_code VARCHAR(10),
    region VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    hours_of_operation JSONB,
    services_offered TEXT[],
    fhir_location_id VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create providers table
CREATE TABLE providers (
    provider_id SERIAL PRIMARY KEY,
    npi VARCHAR(10) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialty_id INTEGER REFERENCES specialties(specialty_id) ON DELETE RESTRICT,
    facility_id INTEGER REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    email VARCHAR(255),
    phone VARCHAR(20),
    credentials VARCHAR(50),
    years_experience INTEGER,
    languages TEXT[] DEFAULT ARRAY['English'],
    accepts_new_patients BOOLEAN DEFAULT true,
    telemedicine_available BOOLEAN DEFAULT false,
    fhir_practitioner_id VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create provider_availability table
CREATE TABLE provider_availability (
    availability_id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(provider_id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER DEFAULT 15,
    active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    notes TEXT,
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_provider_schedule UNIQUE (provider_id, day_of_week, start_time, effective_from)
);

-- Create provider_preferences table
CREATE TABLE provider_preferences (
    preference_id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(provider_id) ON DELETE CASCADE NOT NULL,
    preference_type VARCHAR(50) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    priority INTEGER CHECK (priority BETWEEN 1 AND 10) DEFAULT 5,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_provider_preference UNIQUE (provider_id, preference_type, preference_key)
);

-- Create clinic_rules table
CREATE TABLE clinic_rules (
    rule_id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES facilities(facility_id) ON DELETE CASCADE NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_definition JSONB NOT NULL,
    priority INTEGER CHECK (priority BETWEEN 1 AND 10) DEFAULT 5,
    active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_facility_rule UNIQUE (facility_id, rule_type, rule_name)
);

-- Create appointments table
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    fhir_appointment_id VARCHAR(100) UNIQUE,
    patient_fhir_id VARCHAR(100) NOT NULL,
    provider_id INTEGER REFERENCES providers(provider_id) ON DELETE RESTRICT NOT NULL,
    facility_id INTEGER REFERENCES facilities(facility_id) ON DELETE RESTRICT NOT NULL,
    specialty_id INTEGER REFERENCES specialties(specialty_id) ON DELETE RESTRICT NOT NULL,
    appointment_datetime TIMESTAMP NOT NULL,
    duration_minutes INTEGER CHECK (duration_minutes > 0) DEFAULT 15,
    urgency VARCHAR(20) CHECK (urgency IN ('emergency', 'urgent', 'semi-urgent', 'non-urgent')),
    visit_type VARCHAR(50) CHECK (visit_type IN ('in-person', 'telemedicine', 'phone')) DEFAULT 'in-person',
    status VARCHAR(50) CHECK (status IN ('scheduled', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show')) DEFAULT 'scheduled',
    reason_for_visit TEXT,
    chief_complaint TEXT,
    triage_priority VARCHAR(20),
    triage_session_id VARCHAR(100),
    confirmation_number VARCHAR(50) UNIQUE,
    patient_notified BOOLEAN DEFAULT false,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_double_booking UNIQUE (provider_id, appointment_datetime)
);

-- Create triage_history table
CREATE TABLE triage_history (
    triage_id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    patient_fhir_id VARCHAR(100),
    symptoms_text TEXT NOT NULL,
    extracted_symptoms JSONB,
    triage_priority VARCHAR(20) CHECK (triage_priority IN ('emergency', 'urgent', 'semi-urgent', 'non-urgent')) NOT NULL,
    recommended_specialty_id INTEGER REFERENCES specialties(specialty_id),
    confidence_score VARCHAR(20),
    red_flags TEXT[],
    recommendations JSONB,
    rag_context_used JSONB,
    ai_model_used VARCHAR(50),
    final_appointment_id INTEGER REFERENCES appointments(appointment_id),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial specialties
INSERT INTO specialties (name, snomed_code, description) VALUES
('Cardiology', '394579002', 'Heart and cardiovascular system'),
('Emergency Medicine', '773568002', 'Emergency and urgent care'),
('Internal Medicine', '419192003', 'General adult medicine'),
('Family Medicine', '419772000', 'Primary care for all ages'),
('Orthopedic Surgery', '394801008', 'Musculoskeletal surgery'),
('Neurology', '394591006', 'Nervous system disorders'),
('Endocrinology', '394583002', 'Diabetes and hormonal disorders'),
('Podiatry', '394862001', 'Foot and ankle care');

-- Insert initial facilities
INSERT INTO facilities (name, type, address_line1, city, state, zip_code, region, phone, email, services_offered) VALUES
('West Valley City Community Health Center', 'Community Health', '2850 W 3500 S', 'West Valley City', 'UT', '84119', 'Utah', '801-555-1000', 'info@wvcchc.org', ARRAY['Primary Care', 'Cardiology', 'Endocrinology', 'Orthopedics']),
('Salt Lake Heart Center', 'Specialty Clinic', '500 E 900 S', 'Salt Lake City', 'UT', '84102', 'Utah', '801-555-2000', 'cardiology@slhc.org', ARRAY['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology']),
('Utah Valley Orthopedics', 'Specialty Clinic', '1200 N University Ave', 'Provo', 'UT', '84604', 'Utah', '801-555-3000', 'ortho@uvortho.org', ARRAY['Orthopedic Surgery', 'Sports Medicine', 'Joint Replacement']);

-- Insert initial providers
INSERT INTO providers (npi, first_name, last_name, specialty_id, facility_id, credentials, years_experience, email, phone) VALUES
('1234567890', 'John', 'Smith', 1, 2, 'MD, FACC', 15, 'jsmith@slhc.org', '801-555-2001'),
('2345678901', 'Lisa', 'Chen', 7, 1, 'MD, FACE', 12, 'lchen@wvcchc.org', '801-555-1001'),
('3456789012', 'Michael', 'Rodriguez', 5, 3, 'MD, FAAOS', 20, 'mrodriguez@uvortho.org', '801-555-3001'),
('4567890123', 'Sarah', 'Williams', 3, 1, 'MD', 8, 'swilliams@wvcchc.org', '801-555-1002'),
('5678901234', 'David', 'Patel', 6, 1, 'MD, PhD', 18, 'dpatel@wvcchc.org', '801-555-1003');

-- Insert provider availability (Monday-Friday, 9 AM - 5 PM for all providers)
INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT p.provider_id, d.day, '09:00'::time, '17:00'::time, 30
FROM providers p
CROSS JOIN (SELECT generate_series(0, 4) AS day) d;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hapiuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hapiuser;

-- Display summary
SELECT 'Database initialization complete!' AS status;
SELECT COUNT(*) AS specialty_count FROM specialties;
SELECT COUNT(*) AS facility_count FROM facilities;
SELECT COUNT(*) AS provider_count FROM providers;
SELECT COUNT(*) AS availability_count FROM provider_availability;
