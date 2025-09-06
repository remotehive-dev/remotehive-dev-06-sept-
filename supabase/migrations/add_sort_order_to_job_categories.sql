-- Add sort_order column to job_categories table
ALTER TABLE job_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing records with default sort_order values
UPDATE job_categories SET sort_order = 0 WHERE sort_order IS NULL;