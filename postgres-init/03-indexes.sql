-- ============================================
-- MediChat Tribal Knowledge Database
-- Initialization Script 03: Performance Indexes
-- ============================================

\c tribal_knowledge;

-- ============================================
-- APPOINTMENTS TABLE INDEXES
-- ============================================

-- Primary query patterns: Find appointments by provider, date, patient
CREATE INDEX IF NOT EXISTS idx_appointments_provider_datetime
    ON appointments(provider_id, appointment_datetime);

CREATE INDEX IF NOT EXISTS idx_appointments_patient
    ON appointments(patient_fhir_id);

CREATE INDEX IF NOT EXISTS idx_appointments_datetime
    ON appointments(appointment_datetime);

CREATE INDEX IF NOT EXISTS idx_appointments_facility
    ON appointments(facility_id, appointment_datetime);

CREATE INDEX IF NOT EXISTS idx_appointments_specialty
    ON appointments(specialty_id, appointment_datetime);

CREATE INDEX IF NOT EXISTS idx_appointments_status
    ON appointments(status) WHERE status IN ('scheduled', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_urgency
    ON appointments(urgency);

CREATE INDEX IF NOT EXISTS idx_appointments_triage_session
    ON appointments(triage_session_id);

-- Compound index for availability checking
CREATE INDEX IF NOT EXISTS idx_appointments_availability_check
    ON appointments(provider_id, appointment_datetime, status)
    WHERE status IN ('scheduled', 'confirmed', 'checked-in');

-- ============================================
-- PROVIDER AVAILABILITY TABLE INDEXES
-- ============================================

-- Primary query pattern: Find provider schedule by day
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_day
    ON provider_availability(provider_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_provider_availability_active
    ON provider_availability(provider_id, active)
    WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_provider_availability_effective_dates
    ON provider_availability(provider_id, effective_from, effective_until);

-- ============================================
-- PROVIDERS TABLE INDEXES
-- ============================================

-- Query patterns: Search by specialty, facility, availability
CREATE INDEX IF NOT EXISTS idx_providers_specialty
    ON providers(specialty_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_providers_facility
    ON providers(facility_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_providers_npi
    ON providers(npi);

CREATE INDEX IF NOT EXISTS idx_providers_name
    ON providers(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_providers_accepts_new
    ON providers(accepts_new_patients) WHERE accepts_new_patients = true AND active = true;

-- Full-text search on provider name
CREATE INDEX IF NOT EXISTS idx_providers_name_trgm
    ON providers USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- ============================================
-- FACILITIES TABLE INDEXES
-- ============================================

-- Query patterns: Search by region, city, active status
CREATE INDEX IF NOT EXISTS idx_facilities_region
    ON facilities(region) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_facilities_city
    ON facilities(city) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_facilities_type
    ON facilities(type);

-- Full-text search on facility name
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm
    ON facilities USING gin (name gin_trgm_ops);

-- Geographic search (for future distance calculations)
CREATE INDEX IF NOT EXISTS idx_facilities_location
    ON facilities(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- PROVIDER PREFERENCES TABLE INDEXES
-- ============================================

-- Query pattern: Get all preferences for a provider
CREATE INDEX IF NOT EXISTS idx_provider_preferences_provider
    ON provider_preferences(provider_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_provider_preferences_type
    ON provider_preferences(preference_type, provider_id) WHERE active = true;

-- JSONB index for preference_value queries
CREATE INDEX IF NOT EXISTS idx_provider_preferences_value_gin
    ON provider_preferences USING gin (preference_value);

-- ============================================
-- CLINIC RULES TABLE INDEXES
-- ============================================

-- Query pattern: Get all rules for a facility
CREATE INDEX IF NOT EXISTS idx_clinic_rules_facility
    ON clinic_rules(facility_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_clinic_rules_type
    ON clinic_rules(rule_type, facility_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_clinic_rules_effective_dates
    ON clinic_rules(facility_id, effective_from, effective_until)
    WHERE active = true;

-- JSONB index for rule_definition queries
CREATE INDEX IF NOT EXISTS idx_clinic_rules_definition_gin
    ON clinic_rules USING gin (rule_definition);

-- ============================================
-- TRIAGE HISTORY TABLE INDEXES
-- ============================================

-- Query patterns: Analytics, patient history, session lookup
CREATE INDEX IF NOT EXISTS idx_triage_history_patient
    ON triage_history(patient_fhir_id);

CREATE INDEX IF NOT EXISTS idx_triage_history_session
    ON triage_history(session_id);

CREATE INDEX IF NOT EXISTS idx_triage_history_specialty
    ON triage_history(recommended_specialty_id);

CREATE INDEX IF NOT EXISTS idx_triage_history_priority
    ON triage_history(triage_priority, created_at);

CREATE INDEX IF NOT EXISTS idx_triage_history_created_at
    ON triage_history(created_at DESC);

-- JSONB indexes for extracted_symptoms and RAG context
CREATE INDEX IF NOT EXISTS idx_triage_history_symptoms_gin
    ON triage_history USING gin (extracted_symptoms);

CREATE INDEX IF NOT EXISTS idx_triage_history_rag_gin
    ON triage_history USING gin (rag_context_used);

-- ============================================
-- APPOINTMENT AUDIT TABLE INDEXES
-- ============================================

-- Query pattern: Audit trail by appointment
CREATE INDEX IF NOT EXISTS idx_appointment_audit_appointment
    ON appointment_audit(appointment_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_appointment_audit_timestamp
    ON appointment_audit(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_appointment_audit_changed_by
    ON appointment_audit(changed_by, timestamp DESC);

-- ============================================
-- WAITLIST TABLE INDEXES
-- ============================================

-- Query patterns: Active waitlist by specialty/provider/urgency
CREATE INDEX IF NOT EXISTS idx_waitlist_specialty
    ON waitlist(specialty_id, urgency, created_at)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_waitlist_provider
    ON waitlist(preferred_provider_id, created_at)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_waitlist_patient
    ON waitlist(patient_fhir_id);

CREATE INDEX IF NOT EXISTS idx_waitlist_status
    ON waitlist(status, created_at);

CREATE INDEX IF NOT EXISTS idx_waitlist_expires
    ON waitlist(expires_at) WHERE status = 'active';

-- ============================================
-- SPECIALTIES TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_specialties_active
    ON specialties(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_specialties_snomed
    ON specialties(snomed_code);

-- ============================================
-- INDEX STATISTICS AND MONITORING
-- ============================================

-- Analyze all tables to update statistics for query planner
ANALYZE specialties;
ANALYZE facilities;
ANALYZE providers;
ANALYZE provider_availability;
ANALYZE provider_preferences;
ANALYZE clinic_rules;
ANALYZE appointments;
ANALYZE triage_history;
ANALYZE appointment_audit;
ANALYZE waitlist;

-- ============================================
-- COMPLETION LOG
-- ============================================
DO $$
DECLARE
    index_count INT;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';

    RAISE NOTICE 'Performance indexes created successfully';
    RAISE NOTICE 'Total indexes in public schema: %', index_count;
    RAISE NOTICE 'Index types: B-tree (default), GIN (JSONB and text search), GiST (geographic)';
    RAISE NOTICE 'All tables analyzed for query planner optimization';
END $$;

-- ============================================
-- QUERY PERFORMANCE TIPS
-- ============================================

-- Query to monitor index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Query to find unused indexes:
-- SELECT schemaname, tablename, indexname
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0 AND schemaname = 'public';

-- Query to check table/index sizes:
-- SELECT
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
