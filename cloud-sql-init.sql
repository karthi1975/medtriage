-- ============================================
-- Cloud SQL Database Initialization
-- Combined schema + sample data for GCP deployment
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'America/Denver';

-- ============================================
-- SAMPLE DATA: Facilities (Utah-based healthcare facilities)
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
-- SAMPLE DATA: Providers
-- ============================================
INSERT INTO providers (provider_id, npi, first_name, last_name, specialty_id, facility_id, credentials, years_experience, accepts_new_patients, active) VALUES
    -- Family Medicine Providers
    (1, '1234567890', 'Sarah', 'Johnson', 1, 1, 'MD', 12, true, true),
    (2, '1234567891', 'Michael', 'Chen', 1, 4, 'DO', 8, true, true),
    (3, '1234567892', 'Emily', 'Davis', 1, 6, 'MD', 15, true, true),

    -- Cardiology Providers
    (4, '1234567893', 'David', 'Martinez', 2, 2, 'MD', 20, true, true),
    (5, '1234567894', 'Lisa', 'Thompson', 2, 4, 'MD', 18, true, true),

    -- Orthopedics Providers
    (6, '1234567895', 'James', 'Wilson', 3, 3, 'MD', 22, true, true),
    (7, '1234567896', 'Jennifer', 'Anderson', 3, 4, 'DO', 10, true, true),

    -- Mental Health Providers
    (8, '1234567897', 'Robert', 'Taylor', 5, 5, 'MD', 16, true, true),
    (9, '1234567898', 'Maria', 'Garcia', 5, 4, 'PhD', 14, true, true),

    -- Endocrinology Providers
    (10, '1234567899', 'Raj', 'Patel', 9, 4, 'MD', 19, true, true),

    -- Neurology Providers
    (11, '1234567900', 'Susan', 'Lee', 6, 4, 'MD', 17, true, true),

    -- Pulmonology Providers
    (12, '1234567901', 'Christopher', 'Brown', 8, 2, 'MD', 13, true, true),

    -- Dermatology Providers
    (13, '1234567902', 'Amanda', 'White', 4, 1, 'MD', 11, true, true),

    -- OB/GYN Providers
    (14, '1234567903', 'Jessica', 'Miller', 16, 4, 'MD', 14, true, true),

    -- Pediatrics Providers
    (15, '1234567904', 'Daniel', 'Harris', 17, 1, 'MD', 9, true, true)
ON CONFLICT (npi) DO NOTHING;

SELECT setval('providers_provider_id_seq', 16, false);

-- ============================================
-- SAMPLE DATA: Provider Availability (Mon-Fri, 8 AM - 5 PM)
-- ============================================
INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, slot_duration_minutes, active) VALUES
    -- Dr. Sarah Johnson (Family Medicine) - Monday to Friday
    (1, 1, '08:00', '17:00', 15, true),
    (1, 2, '08:00', '17:00', 15, true),
    (1, 3, '08:00', '17:00', 15, true),
    (1, 4, '08:00', '17:00', 15, true),
    (1, 5, '08:00', '17:00', 15, true),

    -- Dr. Michael Chen (Family Medicine) - Monday to Friday
    (2, 1, '08:00', '17:00', 15, true),
    (2, 2, '08:00', '17:00', 15, true),
    (2, 3, '08:00', '17:00', 15, true),
    (2, 4, '08:00', '17:00', 15, true),
    (2, 5, '08:00', '17:00', 15, true),

    -- Dr. Emily Davis (Family Medicine) - Monday to Friday
    (3, 1, '08:00', '17:00', 15, true),
    (3, 2, '08:00', '17:00', 15, true),
    (3, 3, '08:00', '17:00', 15, true),
    (3, 4, '08:00', '17:00', 15, true),
    (3, 5, '08:00', '17:00', 15, true),

    -- Dr. David Martinez (Cardiology) - Monday, Wednesday, Friday (longer appointments)
    (4, 1, '08:00', '17:00', 30, true),
    (4, 3, '08:00', '17:00', 30, true),
    (4, 5, '08:00', '17:00', 30, true),

    -- Dr. Lisa Thompson (Cardiology) - Monday to Thursday
    (5, 1, '09:00', '17:00', 30, true),
    (5, 2, '09:00', '17:00', 30, true),
    (5, 3, '09:00', '17:00', 30, true),
    (5, 4, '09:00', '17:00', 30, true),

    -- Dr. James Wilson (Orthopedics) - Monday to Friday
    (6, 1, '08:00', '16:00', 30, true),
    (6, 2, '08:00', '16:00', 30, true),
    (6, 3, '08:00', '16:00', 30, true),
    (6, 4, '08:00', '16:00', 30, true),
    (6, 5, '08:00', '16:00', 30, true),

    -- Dr. Jennifer Anderson (Orthopedics) - Tuesday to Friday
    (7, 2, '08:00', '17:00', 30, true),
    (7, 3, '08:00', '17:00', 30, true),
    (7, 4, '08:00', '17:00', 30, true),
    (7, 5, '08:00', '17:00', 30, true),

    -- Dr. Robert Taylor (Mental Health) - Monday to Thursday (longer sessions)
    (8, 1, '09:00', '17:00', 60, true),
    (8, 2, '09:00', '17:00', 60, true),
    (8, 3, '09:00', '17:00', 60, true),
    (8, 4, '09:00', '17:00', 60, true),

    -- Dr. Maria Garcia (Mental Health) - Monday to Friday
    (9, 1, '08:00', '16:00', 60, true),
    (9, 2, '08:00', '16:00', 60, true),
    (9, 3, '08:00', '16:00', 60, true),
    (9, 4, '08:00', '16:00', 60, true),
    (9, 5, '08:00', '16:00', 60, true),

    -- Dr. Raj Patel (Endocrinology) - Monday, Wednesday, Friday
    (10, 1, '08:00', '17:00', 30, true),
    (10, 3, '08:00', '17:00', 30, true),
    (10, 5, '08:00', '17:00', 30, true),

    -- Dr. Susan Lee (Neurology) - Monday to Thursday
    (11, 1, '09:00', '17:00', 30, true),
    (11, 2, '09:00', '17:00', 30, true),
    (11, 3, '09:00', '17:00', 30, true),
    (11, 4, '09:00', '17:00', 30, true),

    -- Dr. Christopher Brown (Pulmonology) - Tuesday, Thursday
    (12, 2, '08:00', '17:00', 30, true),
    (12, 4, '08:00', '17:00', 30, true),

    -- Dr. Amanda White (Dermatology) - Monday to Friday (short appointments)
    (13, 1, '08:00', '17:00', 20, true),
    (13, 2, '08:00', '17:00', 20, true),
    (13, 3, '08:00', '17:00', 20, true),
    (13, 4, '08:00', '17:00', 20, true),
    (13, 5, '08:00', '17:00', 20, true),

    -- Dr. Jessica Miller (OB/GYN) - Monday to Friday
    (14, 1, '08:00', '17:00', 30, true),
    (14, 2, '08:00', '17:00', 30, true),
    (14, 3, '08:00', '17:00', 30, true),
    (14, 4, '08:00', '17:00', 30, true),
    (14, 5, '08:00', '17:00', 30, true),

    -- Dr. Daniel Harris (Pediatrics) - Monday to Friday
    (15, 1, '08:00', '17:00', 20, true),
    (15, 2, '08:00', '17:00', 20, true),
    (15, 3, '08:00', '17:00', 20, true),
    (15, 4, '08:00', '17:00', 20, true),
    (15, 5, '08:00', '17:00', 20, true)
ON CONFLICT DO NOTHING;

-- Analyze tables for query optimization
ANALYZE specialties;
ANALYZE facilities;
ANALYZE providers;
ANALYZE provider_availability;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Cloud SQL database initialization completed successfully!';
    RAISE NOTICE 'Sample data loaded:';
    RAISE NOTICE '  - 6 facilities across Utah';
    RAISE NOTICE '  - 15 providers across various specialties';
    RAISE NOTICE '  - Provider schedules configured for Mon-Fri';
    RAISE NOTICE 'Database is ready for appointment scheduling!';
END $$;
