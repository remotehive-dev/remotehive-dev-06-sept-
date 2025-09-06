-- ============================================================================
-- ADVANCED JOB MANAGEMENT SYSTEM - DATABASE ENHANCEMENTS
-- RemoteHive - Employer RH00 Series & Enhanced Workflow
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EMPLOYER UNIQUE NUMBERING SYSTEM (RH00 Series)
-- ============================================================================

-- Add employer_number field to employers table
ALTER TABLE employers ADD COLUMN IF NOT EXISTS employer_number VARCHAR(20) UNIQUE;

-- Create sequence for RH00 series numbering
DROP SEQUENCE IF EXISTS employer_number_seq CASCADE;
CREATE SEQUENCE employer_number_seq START 1;

-- Function to generate RH00 series numbers
CREATE OR REPLACE FUNCTION generate_employer_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    next_num INTEGER;
    formatted_num VARCHAR(20);
BEGIN
    SELECT nextval('employer_number_seq') INTO next_num;
    formatted_num := 'RH' || LPAD(next_num::TEXT, 4, '0');
    
    -- Ensure uniqueness (in case of concurrent access)
    WHILE EXISTS (SELECT 1 FROM employers WHERE employer_number = formatted_num) LOOP
        SELECT nextval('employer_number_seq') INTO next_num;
        formatted_num := 'RH' || LPAD(next_num::TEXT, 4, '0');
    END LOOP;
    
    RETURN formatted_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate employer numbers
CREATE OR REPLACE FUNCTION set_employer_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employer_number IS NULL OR NEW.employer_number = '' THEN
        NEW.employer_number := generate_employer_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new employers
DROP TRIGGER IF EXISTS employer_number_trigger ON employers;
CREATE TRIGGER employer_number_trigger
    BEFORE INSERT ON employers
    FOR EACH ROW
    EXECUTE FUNCTION set_employer_number();

-- Update existing employers with RH00 numbers
UPDATE employers 
SET employer_number = generate_employer_number() 
WHERE employer_number IS NULL OR employer_number = '';

-- ============================================================================
-- 2. ENHANCED JOB POSTS WORKFLOW FIELDS
-- ============================================================================

-- Add enhanced workflow fields to job_posts table
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS employer_number VARCHAR(20);
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50) DEFAULT 'draft';
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS scheduled_publish_date TIMESTAMP;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS last_workflow_action VARCHAR(50);
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS workflow_notes TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS admin_priority INTEGER DEFAULT 0;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT false;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS review_completed_at TIMESTAMP;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS review_completed_by VARCHAR(36);

-- Update existing job posts with employer numbers
UPDATE job_posts 
SET employer_number = e.employer_number
FROM employers e 
WHERE job_posts.employer_id = e.id 
AND job_posts.employer_number IS NULL;

-- ============================================================================
-- 3. ENHANCED WORKFLOW STATUS ENUM
-- ============================================================================

-- Create comprehensive workflow status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_workflow_status') THEN
        CREATE TYPE job_workflow_status AS ENUM (
            'draft',
            'pending_approval',
            'under_review',
            'approved',
            'rejected',
            'published',
            'active',
            'paused',
            'closed',
            'expired',
            'archived',
            'flagged',
            'cancelled'
        );
    END IF;
END $$;

-- ============================================================================
-- 4. WORKFLOW PRIORITY ENUM
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_priority') THEN
        CREATE TYPE workflow_priority AS ENUM (
            'low',
            'normal',
            'high',
            'urgent',
            'critical'
        );
    END IF;
END $$;

-- ============================================================================
-- 5. ENHANCED WORKFLOW LOGGING
-- ============================================================================

-- Add additional fields to job_workflow_logs
ALTER TABLE job_workflow_logs ADD COLUMN IF NOT EXISTS employer_number VARCHAR(20);
ALTER TABLE job_workflow_logs ADD COLUMN IF NOT EXISTS workflow_stage_before VARCHAR(50);
ALTER TABLE job_workflow_logs ADD COLUMN IF NOT EXISTS workflow_stage_after VARCHAR(50);
ALTER TABLE job_workflow_logs ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE job_workflow_logs ADD COLUMN IF NOT EXISTS automated_action BOOLEAN DEFAULT false;
ALTER TABLE job_workflow_logs ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- ============================================================================
-- 6. PERFORMANCE INDEXES
-- ============================================================================

-- Employers table indexes
CREATE INDEX IF NOT EXISTS idx_employers_number ON employers(employer_number);
CREATE INDEX IF NOT EXISTS idx_employers_company_name ON employers(company_name);
CREATE INDEX IF NOT EXISTS idx_employers_verified ON employers(is_verified);
CREATE INDEX IF NOT EXISTS idx_employers_created_at ON employers(created_at);

-- Job posts table indexes
CREATE INDEX IF NOT EXISTS idx_job_posts_employer_number ON job_posts(employer_number);
CREATE INDEX IF NOT EXISTS idx_job_posts_workflow_stage ON job_posts(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_job_posts_auto_publish ON job_posts(auto_publish);
CREATE INDEX IF NOT EXISTS idx_job_posts_scheduled_publish ON job_posts(scheduled_publish_date);
CREATE INDEX IF NOT EXISTS idx_job_posts_expiry_date ON job_posts(expiry_date);
CREATE INDEX IF NOT EXISTS idx_job_posts_admin_priority ON job_posts(admin_priority);
CREATE INDEX IF NOT EXISTS idx_job_posts_requires_review ON job_posts(requires_review);
CREATE INDEX IF NOT EXISTS idx_job_posts_company_status ON job_posts(employer_number, status);
CREATE INDEX IF NOT EXISTS idx_job_posts_workflow_created ON job_posts(workflow_stage, created_at);

-- Workflow logs indexes
CREATE INDEX IF NOT EXISTS idx_workflow_logs_employer_number ON job_workflow_logs(employer_number);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_action ON job_workflow_logs(action);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_performed_by ON job_workflow_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_created_at ON job_workflow_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_automated ON job_workflow_logs(automated_action);

-- ============================================================================
-- 7. WORKFLOW STATISTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW workflow_statistics AS
SELECT 
    e.employer_number,
    e.company_name,
    COUNT(jp.id) as total_jobs,
    COUNT(CASE WHEN jp.status = 'draft' THEN 1 END) as draft_jobs,
    COUNT(CASE WHEN jp.status = 'pending_approval' THEN 1 END) as pending_jobs,
    COUNT(CASE WHEN jp.status = 'approved' THEN 1 END) as approved_jobs,
    COUNT(CASE WHEN jp.status = 'active' THEN 1 END) as active_jobs,
    COUNT(CASE WHEN jp.status = 'rejected' THEN 1 END) as rejected_jobs,
    COUNT(CASE WHEN jp.is_featured = true THEN 1 END) as featured_jobs,
    COUNT(CASE WHEN jp.is_flagged = true THEN 1 END) as flagged_jobs,
    AVG(jp.views_count) as avg_views,
    AVG(jp.applications_count) as avg_applications,
    MAX(jp.created_at) as last_job_created,
    MIN(jp.created_at) as first_job_created
FROM employers e
LEFT JOIN job_posts jp ON e.employer_number = jp.employer_number
GROUP BY e.employer_number, e.company_name;

-- ============================================================================
-- 8. WORKFLOW AUTOMATION FUNCTIONS
-- ============================================================================

-- Function to auto-publish approved jobs
CREATE OR REPLACE FUNCTION auto_publish_scheduled_jobs()
RETURNS INTEGER AS $$
DECLARE
    published_count INTEGER := 0;
    job_record RECORD;
BEGIN
    -- Find jobs ready for auto-publishing
    FOR job_record IN 
        SELECT id, title, employer_number
        FROM job_posts 
        WHERE auto_publish = true 
        AND status = 'approved'
        AND scheduled_publish_date <= NOW()
        AND (published_at IS NULL OR published_at > scheduled_publish_date)
    LOOP
        -- Update job status to published
        UPDATE job_posts 
        SET 
            status = 'active',
            published_at = NOW(),
            workflow_stage = 'published',
            last_workflow_action = 'auto_published'
        WHERE id = job_record.id;
        
        -- Log the auto-publish action
        INSERT INTO job_workflow_logs (
            job_post_id,
            employer_number,
            action,
            from_status,
            to_status,
            workflow_stage_before,
            workflow_stage_after,
            performed_by,
            notes,
            automated_action,
            ip_address
        ) VALUES (
            job_record.id,
            job_record.employer_number,
            'auto_publish',
            'approved',
            'active',
            'approved',
            'published',
            'system',
            'Automatically published based on scheduled date',
            true,
            '127.0.0.1'
        );
        
        published_count := published_count + 1;
    END LOOP;
    
    RETURN published_count;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire jobs
CREATE OR REPLACE FUNCTION auto_expire_jobs()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    job_record RECORD;
BEGIN
    -- Find jobs that should be expired
    FOR job_record IN 
        SELECT id, title, employer_number, status
        FROM job_posts 
        WHERE expiry_date <= NOW()
        AND status IN ('active', 'published')
    LOOP
        -- Update job status to expired
        UPDATE job_posts 
        SET 
            status = 'expired',
            workflow_stage = 'expired',
            last_workflow_action = 'auto_expired'
        WHERE id = job_record.id;
        
        -- Log the auto-expire action
        INSERT INTO job_workflow_logs (
            job_post_id,
            employer_number,
            action,
            from_status,
            to_status,
            workflow_stage_before,
            workflow_stage_after,
            performed_by,
            notes,
            automated_action,
            ip_address
        ) VALUES (
            job_record.id,
            job_record.employer_number,
            'auto_expire',
            job_record.status,
            'expired',
            'published',
            'expired',
            'system',
            'Automatically expired based on expiry date',
            true,
            '127.0.0.1'
        );
        
        expired_count := expired_count + 1;
    END LOOP;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. WORKFLOW HELPER FUNCTIONS
-- ============================================================================

-- Function to get employer by RH number
CREATE OR REPLACE FUNCTION get_employer_by_rh_number(rh_number VARCHAR(20))
RETURNS TABLE(
    id VARCHAR(36),
    employer_number VARCHAR(20),
    company_name VARCHAR(255),
    company_email VARCHAR(255),
    is_verified BOOLEAN,
    total_jobs BIGINT,
    active_jobs BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.employer_number,
        e.company_name,
        e.company_email,
        e.is_verified,
        COUNT(jp.id) as total_jobs,
        COUNT(CASE WHEN jp.status = 'active' THEN 1 END) as active_jobs
    FROM employers e
    LEFT JOIN job_posts jp ON e.employer_number = jp.employer_number
    WHERE e.employer_number = rh_number
    GROUP BY e.id, e.employer_number, e.company_name, e.company_email, e.is_verified;
END;
$$ LANGUAGE plpgsql;

-- Function to get workflow statistics
CREATE OR REPLACE FUNCTION get_workflow_stats()
RETURNS TABLE(
    total_jobs BIGINT,
    pending_approval BIGINT,
    approved_today BIGINT,
    rejected_today BIGINT,
    published_today BIGINT,
    avg_approval_time_hours NUMERIC,
    total_employers BIGINT,
    active_employers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM job_posts) as total_jobs,
        (SELECT COUNT(*) FROM job_posts WHERE status = 'pending_approval') as pending_approval,
        (SELECT COUNT(*) FROM job_posts WHERE approved_at::date = CURRENT_DATE) as approved_today,
        (SELECT COUNT(*) FROM job_posts WHERE rejected_at::date = CURRENT_DATE) as rejected_today,
        (SELECT COUNT(*) FROM job_posts WHERE published_at::date = CURRENT_DATE) as published_today,
        (
            SELECT AVG(EXTRACT(EPOCH FROM (approved_at - submitted_for_approval_at))/3600)
            FROM job_posts 
            WHERE approved_at IS NOT NULL 
            AND submitted_for_approval_at IS NOT NULL
            AND approved_at::date >= CURRENT_DATE - INTERVAL '30 days'
        ) as avg_approval_time_hours,
        (SELECT COUNT(*) FROM employers) as total_employers,
        (
            SELECT COUNT(DISTINCT e.id) 
            FROM employers e 
            JOIN job_posts jp ON e.employer_number = jp.employer_number 
            WHERE jp.created_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as active_employers;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. DATA VALIDATION AND CLEANUP
-- ============================================================================

-- Ensure all job posts have employer numbers
UPDATE job_posts 
SET employer_number = e.employer_number
FROM employers e 
WHERE job_posts.employer_id = e.id 
AND (job_posts.employer_number IS NULL OR job_posts.employer_number = '');

-- Set default workflow stages for existing jobs
UPDATE job_posts 
SET workflow_stage = 
    CASE 
        WHEN status = 'draft' THEN 'draft'
        WHEN status = 'pending_approval' THEN 'pending_approval'
        WHEN status = 'approved' THEN 'approved'
        WHEN status = 'active' THEN 'published'
        WHEN status = 'paused' THEN 'paused'
        WHEN status = 'closed' THEN 'closed'
        WHEN status = 'rejected' THEN 'rejected'
        ELSE 'draft'
    END
WHERE workflow_stage IS NULL OR workflow_stage = '';

-- ============================================================================
-- 11. PERMISSIONS AND SECURITY
-- ============================================================================

-- Grant necessary permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE ON employers TO admin_role;
-- GRANT SELECT, INSERT, UPDATE ON job_posts TO admin_role;
-- GRANT SELECT, INSERT ON job_workflow_logs TO admin_role;
-- GRANT SELECT ON workflow_statistics TO admin_role;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Advanced Job Management System database enhancements completed successfully!' as message;
SELECT 
    'Employers with RH numbers: ' || COUNT(*) as employer_count,
    'Jobs with employer numbers: ' || (
        SELECT COUNT(*) FROM job_posts WHERE employer_number IS NOT NULL
    ) as job_count
FROM employers WHERE employer_number IS NOT NULL;