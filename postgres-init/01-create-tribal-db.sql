-- ============================================
-- MediChat Tribal Knowledge Database
-- Initialization Script 01: Database Creation
-- ============================================

-- This script ensures the tribal_knowledge database exists
-- Note: Docker PostgreSQL will create the database from POSTGRES_DB env var
-- This script is for manual setup or migrations

-- Create database (skip if using Docker POSTGRES_DB)
SELECT 'CREATE DATABASE tribal_knowledge'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tribal_knowledge')\gexec

-- Connect to the database
\c tribal_knowledge;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For text search and similarity

-- Set timezone
SET timezone = 'America/Denver';  -- Utah timezone (Mountain Time)

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Tribal Knowledge Database initialized successfully';
    RAISE NOTICE 'Timezone set to: America/Denver (Mountain Time)';
END $$;
