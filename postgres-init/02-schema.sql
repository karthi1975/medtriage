-- ============================================
-- MediChat Tribal Knowledge Database
-- Initialization Script 02: Schema Creation
-- ============================================

-- Connect to tribal_knowledge database
\c tribal_knowledge;

-- ============================================
-- SPECIALTIES TABLE
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

COMMENT ON TABLE specialties IS 'Medical specialties offered in the system';
COMMENT ON COLUMN specialties.snomed_code IS 'SNOMED CT code for the specialty';

-- ============================================
-- FACILITIES TABLE
-- ============================================
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

COMMENT ON TABLE facilities IS 'Healthcare facilities across Utah regions';
COMMENT ON COLUMN facilities.region IS 'Utah region: Salt Lake Valley, Utah County, Davis/Weber, Cache Valley, Washington County, Central Utah, Uintah Basin';
COMMENT ON COLUMN facilities.hours_of_operation IS 'JSON: {mon: "8:00-17:00", tue: "8:00-17:00", ...}';

-- ============================================
-- PROVIDERS TABLE
-- ============================================
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

COMMENT ON TABLE providers IS 'Healthcare providers (physicians, PAs, NPs)';
COMMENT ON COLUMN providers.npi IS 'National Provider Identifier (10 digits)';
COMMENT ON COLUMN providers.credentials IS 'MD, DO, PA, NP, etc.';

-- ============================================
-- PROVIDER AVAILABILITY TABLE
-- ============================================
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

COMMENT ON TABLE provider_availability IS 'Weekly schedules for providers';
COMMENT ON COLUMN provider_availability.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN provider_availability.slot_duration_minutes IS 'Default appointment slot length';

-- ============================================
-- PROVIDER PREFERENCES TABLE
-- ============================================
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

COMMENT ON TABLE provider_preferences IS 'Tribal knowledge: Provider-specific scheduling preferences';
COMMENT ON COLUMN provider_preferences.preference_type IS 'urgency_slots, scheduling_rules, patient_type_preferences, special_considerations';
COMMENT ON COLUMN provider_preferences.priority IS '1=highest priority, 10=lowest (for conflict resolution)';

-- Example preference_value structures:
-- urgency_slots: {"emergency": 2, "urgent": 4, "semi_urgent": 6}
-- scheduling_rules: {"new_patient_duration": 30, "buffer_between_appointments": 5, "max_overbook_per_day": 2}
-- patient_type_preferences: {"pediatric": true, "geriatric": true, "chronic_disease": true}

-- ============================================
-- CLINIC RULES TABLE
-- ============================================
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

COMMENT ON TABLE clinic_rules IS 'Tribal knowledge: Facility-level scheduling policies';
COMMENT ON COLUMN clinic_rules.rule_type IS 'scheduling_policy, specialty_hours, equipment_availability, insurance_policy';

-- Example rule_definition structures:
-- scheduling_policy: {"advance_booking_limit_days": 90, "same_day_cutoff_time": "15:00"}
-- specialty_hours: {"cardiology": {"days": ["Monday", "Wednesday"], "hours": "09:00-16:00"}}

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
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

COMMENT ON TABLE appointments IS 'Scheduled patient appointments';
COMMENT ON COLUMN appointments.fhir_appointment_id IS 'Link to FHIR Appointment resource ID';
COMMENT ON COLUMN appointments.triage_session_id IS 'Link to triage_history record';
COMMENT ON COLUMN appointments.confirmation_number IS 'Unique confirmation code for patient';

-- ============================================
-- TRIAGE HISTORY TABLE
-- ============================================
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

COMMENT ON TABLE triage_history IS 'Historical record of all triage assessments for analytics and machine learning';
COMMENT ON COLUMN triage_history.session_id IS 'Unique session identifier (UUID)';
COMMENT ON COLUMN triage_history.rag_context_used IS 'RAG documents retrieved during triage';
COMMENT ON COLUMN triage_history.ai_model_used IS 'OpenAI model used (gpt-3.5-turbo, gpt-4, etc.)';

-- ============================================
-- APPOINTMENT AUDIT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointment_audit (
    audit_id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'cancelled', 'rescheduled', 'completed', 'no-show')),
    changed_by VARCHAR(100) NOT NULL,
    changes JSONB,
    reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE appointment_audit IS 'Audit trail for all appointment changes';
COMMENT ON COLUMN appointment_audit.changes IS 'Before/after values in JSON format';

-- ============================================
-- WAITLIST TABLE
-- ============================================
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

COMMENT ON TABLE waitlist IS 'Patients waiting for appointment availability';
COMMENT ON COLUMN waitlist.preferred_time_of_day IS 'morning, afternoon, evening, any';

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- View: Provider Utilization
CREATE OR REPLACE VIEW provider_utilization AS
SELECT
    p.provider_id,
    p.first_name || ' ' || p.last_name AS provider_name,
    s.name AS specialty,
    f.name AS facility_name,
    COUNT(a.appointment_id) AS total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_appointments,
    COUNT(CASE WHEN a.status = 'no-show' THEN 1 END) AS no_shows,
    COUNT(CASE WHEN a.urgency = 'emergency' THEN 1 END) AS emergency_appointments,
    COUNT(CASE WHEN a.urgency = 'urgent' THEN 1 END) AS urgent_appointments,
    AVG(a.duration_minutes) AS avg_appointment_duration
FROM providers p
LEFT JOIN specialties s ON p.specialty_id = s.specialty_id
LEFT JOIN facilities f ON p.facility_id = f.facility_id
LEFT JOIN appointments a ON p.provider_id = a.provider_id
    AND a.appointment_datetime >= CURRENT_DATE - INTERVAL '30 days'
WHERE p.active = true
GROUP BY p.provider_id, p.first_name, p.last_name, s.name, f.name;

-- View: Appointment Demand by Specialty
CREATE OR REPLACE VIEW specialty_demand AS
SELECT
    s.specialty_id,
    s.name AS specialty_name,
    COUNT(a.appointment_id) AS appointments_scheduled,
    COUNT(CASE WHEN a.urgency = 'emergency' THEN 1 END) AS emergency_count,
    COUNT(CASE WHEN a.urgency = 'urgent' THEN 1 END) AS urgent_count,
    COUNT(w.waitlist_id) AS waitlist_count,
    AVG(EXTRACT(EPOCH FROM (a.created_at - th.created_at))/3600) AS avg_hours_to_schedule
FROM specialties s
LEFT JOIN appointments a ON s.specialty_id = a.specialty_id
    AND a.created_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN triage_history th ON a.triage_session_id = th.session_id
LEFT JOIN waitlist w ON s.specialty_id = w.specialty_id AND w.status = 'active'
GROUP BY s.specialty_id, s.name;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_specialties_updated_at BEFORE UPDATE ON specialties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_preferences_updated_at BEFORE UPDATE ON provider_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_rules_updated_at BEFORE UPDATE ON clinic_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appointment audit trigger
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO appointment_audit (appointment_id, action, changed_by, changes)
        VALUES (NEW.appointment_id, 'updated', NEW.updated_at::TEXT,
                jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO appointment_audit (appointment_id, action, changed_by, changes)
        VALUES (NEW.appointment_id, 'created', NEW.created_by, row_to_json(NEW)::jsonb);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_audit_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION log_appointment_changes();

-- ============================================
-- SEED DATA: Specialties (All 21 Specialties)
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

-- Reset sequence to continue from 22
SELECT setval('specialties_specialty_id_seq', 22, false);

-- ============================================
-- COMPLETION LOG
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Schema creation completed successfully';
    RAISE NOTICE 'Tables created: specialties, facilities, providers, provider_availability, provider_preferences, clinic_rules, appointments, triage_history, appointment_audit, waitlist';
    RAISE NOTICE 'Views created: provider_utilization, specialty_demand';
    RAISE NOTICE 'Triggers created: update timestamps, appointment audit';
    RAISE NOTICE '21 specialties seeded: Family Medicine, Cardiology, Orthopedics, Dermatology, Mental Health, Neurology, Gastroenterology, Pulmonology, Endocrinology, Nephrology, Oncology, Rheumatology, Ophthalmology, ENT, Urology, OB/GYN, Pediatrics, Geriatrics, Infectious Disease, Hematology, Pain Management';
END $$;
