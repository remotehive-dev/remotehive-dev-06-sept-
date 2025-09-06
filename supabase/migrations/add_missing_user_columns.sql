-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;

-- Check if role column exists and add it with correct enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role userrole DEFAULT 'JOB_SEEKER';
    END IF;
END $$;

-- Create index on clerk_user_id for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have default role if null
UPDATE users SET role = 'JOB_SEEKER' WHERE role IS NULL;