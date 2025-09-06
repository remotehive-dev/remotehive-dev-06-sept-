-- Add updated_by column to system_settings table
ALTER TABLE system_settings 
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Update existing records to have NULL updated_by (which is allowed)
UPDATE system_settings SET updated_by = NULL WHERE updated_by IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON system_settings(updated_by);