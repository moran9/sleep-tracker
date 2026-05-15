-- Idempotent migrations — safe to run on any existing database.
-- Add new columns here as the schema evolves.

ALTER TABLE periods ADD COLUMN IF NOT EXISTS comment TEXT;
