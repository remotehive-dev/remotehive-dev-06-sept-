-- Fix missing fields in scraper models for remotehive.db
-- Add missing field to scraper_configs table
ALTER TABLE scraper_configs ADD COLUMN last_run DATETIME;

-- Update scraper_configs to sync last_run with last_run_at
UPDATE scraper_configs SET last_run = last_run_at WHERE last_run IS NULL AND last_run_at IS NOT NULL;