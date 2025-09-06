-- ============================================================================
-- COMPREHENSIVE AUTHENTICATION & ROLE MANAGEMENT SYSTEM
-- RemoteHive - Clear Role Definition & Cross-Platform Access Control
-- ============================================================================

-- This SQL creates a comprehensive authentication system that clearly defines
-- how job seekers, employers, and admin users interact across:
-- 1. API Server (FastAPI backend)
-- 2. Admin Panel (Next.js admin interface)
-- 3. Public Website (React frontend)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE USER AUTHENTICATION TABLE
-- ============================================================================

-- Drop existing users table if recreating
-- DROP TABLE IF EXISTS users CASCADE;

-- Enhanced users table with clear role definitions
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    
    -- ROLE SYSTEM: Clear hierarchy and permissions
    role VARCHAR(50) NOT NULL DEFAULT 'job_seeker' 
        CHECK (role IN ('job_seeker', 'employer', 'admin', 'super_admin')),
    
    -- ACCOUNT STATUS
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    
    -- AUTHENTICATION METADATA
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    
    -- PROFILE INFORMATION
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    
    -- PLATFORM ACCESS PERMISSIONS
    can_access_api BOOLEAN DEFAULT true,
    can_access_admin_panel BOOLEAN DEFAULT false,
    can_access_public_site BOOLEAN DEFAULT true,
    
    -- AUDIT FIELDS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================================================
-- 2. ROLE PERMISSIONS MATRIX TABLE
-- ============================================================================

-- Define what each role can do across different platforms
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('api_server', 'admin_panel', 'public_website')),
    resource VARCHAR(100) NOT NULL, -- e.g., 'job_posts', 'users', 'applications'
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'list', 'export', 'import')),
    is_allowed BOOLEAN DEFAULT false,
    conditions JSONB, -- Additional conditions for permission
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. USER SESSIONS & TOKEN MANAGEMENT
-- ============================================================================

-- Track active sessions across platforms
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('api_server', 'admin_panel', 'public_website', 'mobile_app')),
    session_token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PLATFORM-SPECIFIC ACCESS CONTROL
-- ============================================================================

-- Define which users can access which platforms
CREATE TABLE IF NOT EXISTS platform_access (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('api_server', 'admin_panel', 'public_website')),
    access_level VARCHAR(50) DEFAULT 'read' CHECK (access_level IN ('none', 'read', 'write', 'admin', 'super_admin')),
    ip_whitelist INET[],
    time_restrictions JSONB, -- e.g., {"days": ["mon", "tue"], "hours": ["09:00", "17:00"]}
    is_active BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 5. AUDIT & SECURITY LOGGING
-- ============================================================================

-- Comprehensive audit log for all user actions
CREATE TABLE IF NOT EXISTS user_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES user_sessions(id),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events tracking
CREATE TABLE IF NOT EXISTS security_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
        'login_success', 'login_failed', 'logout', 'password_change', 
        'email_change', 'role_change', 'account_locked', 'account_unlocked',
        'suspicious_activity', 'unauthorized_access_attempt'
    )),
    platform VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_platform ON role_permissions(role, platform);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource_action ON role_permissions(resource, action);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_platform ON user_sessions(platform);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Platform access indexes
CREATE INDEX IF NOT EXISTS idx_platform_access_user_platform ON platform_access(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_platform_access_is_active ON platform_access(is_active);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_platform ON user_audit_log(platform);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_created_at ON user_audit_log(created_at);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_level ON security_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
);
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
);

-- Role permissions policies (admin only)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin only role permissions" ON role_permissions;

CREATE POLICY "Admin only role permissions" ON role_permissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
);

-- User sessions policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON user_sessions;

CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON user_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON user_sessions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
);

-- Platform access policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own platform access" ON platform_access;
DROP POLICY IF EXISTS "Admins can manage platform access" ON platform_access;

CREATE POLICY "Users can view own platform access" ON platform_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage platform access" ON platform_access FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
);

-- Audit log policies (admin only for full access, users can see their own)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own audit logs" ON user_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON user_audit_log;

CREATE POLICY "Users can view own audit logs" ON user_audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all audit logs" ON user_audit_log FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
);

-- Security events policies (admin only)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin only security events" ON security_events;

CREATE POLICY "Admin only security events" ON security_events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
);

-- ============================================================================
-- 8. INITIAL ROLE PERMISSIONS DATA
-- ============================================================================

-- Clear existing permissions
DELETE FROM role_permissions;

-- JOB SEEKER PERMISSIONS
-- API Server
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description) VALUES
('job_seeker', 'api_server', 'job_posts', 'read', true, 'Can view job postings'),
('job_seeker', 'api_server', 'job_posts', 'list', true, 'Can list job postings'),
('job_seeker', 'api_server', 'job_applications', 'create', true, 'Can apply to jobs'),
('job_seeker', 'api_server', 'job_applications', 'read', true, 'Can view own applications'),
('job_seeker', 'api_server', 'job_applications', 'update', true, 'Can update own applications'),
('job_seeker', 'api_server', 'profile', 'read', true, 'Can view own profile'),
('job_seeker', 'api_server', 'profile', 'update', true, 'Can update own profile'),
('job_seeker', 'api_server', 'saved_jobs', 'create', true, 'Can save jobs'),
('job_seeker', 'api_server', 'saved_jobs', 'read', true, 'Can view saved jobs'),
('job_seeker', 'api_server', 'saved_jobs', 'delete', true, 'Can remove saved jobs');

-- Public Website
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description) VALUES
('job_seeker', 'public_website', 'job_search', 'read', true, 'Can search and view jobs'),
('job_seeker', 'public_website', 'profile', 'read', true, 'Can view own profile'),
('job_seeker', 'public_website', 'profile', 'update', true, 'Can update own profile'),
('job_seeker', 'public_website', 'applications', 'read', true, 'Can view application status');

-- EMPLOYER PERMISSIONS
-- API Server
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description) VALUES
('employer', 'api_server', 'job_posts', 'create', true, 'Can create job postings'),
('employer', 'api_server', 'job_posts', 'read', true, 'Can view own job postings'),
('employer', 'api_server', 'job_posts', 'update', true, 'Can update own job postings'),
('employer', 'api_server', 'job_posts', 'delete', true, 'Can delete own job postings'),
('employer', 'api_server', 'job_posts', 'list', true, 'Can list own job postings'),
('employer', 'api_server', 'job_applications', 'read', true, 'Can view applications to own jobs'),
('employer', 'api_server', 'job_applications', 'update', true, 'Can update application status'),
('employer', 'api_server', 'profile', 'read', true, 'Can view own profile'),
('employer', 'api_server', 'profile', 'update', true, 'Can update own profile'),
('employer', 'api_server', 'company', 'create', true, 'Can create company profile'),
('employer', 'api_server', 'company', 'read', true, 'Can view own company'),
('employer', 'api_server', 'company', 'update', true, 'Can update own company');

-- Public Website
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description) VALUES
('employer', 'public_website', 'job_management', 'create', true, 'Can post jobs'),
('employer', 'public_website', 'job_management', 'read', true, 'Can view own jobs'),
('employer', 'public_website', 'job_management', 'update', true, 'Can edit own jobs'),
('employer', 'public_website', 'applications', 'read', true, 'Can view applications'),
('employer', 'public_website', 'company_profile', 'read', true, 'Can view company profile'),
('employer', 'public_website', 'company_profile', 'update', true, 'Can update company profile');

-- ADMIN PERMISSIONS
-- API Server
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description) VALUES
('admin', 'api_server', 'users', 'create', true, 'Can create users'),
('admin', 'api_server', 'users', 'read', true, 'Can view all users'),
('admin', 'api_server', 'users', 'update', true, 'Can update users'),
('admin', 'api_server', 'users', 'delete', true, 'Can delete users'),
('admin', 'api_server', 'users', 'list', true, 'Can list all users'),
('admin', 'api_server', 'job_posts', 'read', true, 'Can view all job posts'),
('admin', 'api_server', 'job_posts', 'update', true, 'Can moderate job posts'),
('admin', 'api_server', 'job_posts', 'delete', true, 'Can delete job posts'),
('admin', 'api_server', 'job_posts', 'list', true, 'Can list all job posts'),
('admin', 'api_server', 'job_applications', 'read', true, 'Can view all applications'),
('admin', 'api_server', 'job_applications', 'list', true, 'Can list all applications'),
('admin', 'api_server', 'analytics', 'read', true, 'Can view analytics'),
('admin', 'api_server', 'reports', 'read', true, 'Can view reports'),
('admin', 'api_server', 'reports', 'create', true, 'Can generate reports'),
('admin', 'api_server', 'contact_submissions', 'read', true, 'Can view contact submissions'),
('admin', 'api_server', 'contact_submissions', 'list', true, 'Can list contact submissions'),
('admin', 'api_server', 'contact_submissions', 'update', true, 'Can update contact submissions');

-- Admin Panel
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description) VALUES
('admin', 'admin_panel', 'dashboard', 'read', true, 'Can access admin dashboard'),
('admin', 'admin_panel', 'users', 'create', true, 'Can create users'),
('admin', 'admin_panel', 'users', 'read', true, 'Can view all users'),
('admin', 'admin_panel', 'users', 'update', true, 'Can update users'),
('admin', 'admin_panel', 'users', 'delete', true, 'Can delete users'),
('admin', 'admin_panel', 'users', 'list', true, 'Can list all users'),
('admin', 'admin_panel', 'users', 'export', true, 'Can export user data'),
('admin', 'admin_panel', 'job_posts', 'read', true, 'Can view all job posts'),
('admin', 'admin_panel', 'job_posts', 'update', true, 'Can moderate job posts'),
('admin', 'admin_panel', 'job_posts', 'delete', true, 'Can delete job posts'),
('admin', 'admin_panel', 'job_posts', 'list', true, 'Can list all job posts'),
('admin', 'admin_panel', 'job_posts', 'export', true, 'Can export job data'),
('admin', 'admin_panel', 'analytics', 'read', true, 'Can view analytics'),
('admin', 'admin_panel', 'reports', 'read', true, 'Can view reports'),
('admin', 'admin_panel', 'reports', 'create', true, 'Can generate reports'),
('admin', 'admin_panel', 'contact_management', 'read', true, 'Can view contact submissions'),
('admin', 'admin_panel', 'contact_management', 'list', true, 'Can list contact submissions'),
('admin', 'admin_panel', 'contact_management', 'update', true, 'Can update contact submissions'),
('admin', 'admin_panel', 'system_settings', 'read', true, 'Can view system settings'),
('admin', 'admin_panel', 'system_settings', 'update', true, 'Can update system settings');

-- SUPER ADMIN PERMISSIONS (inherits all admin permissions plus system management)
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description) VALUES
-- API Server
('super_admin', 'api_server', 'system', 'read', true, 'Can view system information'),
('super_admin', 'api_server', 'system', 'update', true, 'Can update system settings'),
('super_admin', 'api_server', 'roles', 'create', true, 'Can create roles'),
('super_admin', 'api_server', 'roles', 'read', true, 'Can view roles'),
('super_admin', 'api_server', 'roles', 'update', true, 'Can update roles'),
('super_admin', 'api_server', 'roles', 'delete', true, 'Can delete roles'),
('super_admin', 'api_server', 'permissions', 'create', true, 'Can create permissions'),
('super_admin', 'api_server', 'permissions', 'read', true, 'Can view permissions'),
('super_admin', 'api_server', 'permissions', 'update', true, 'Can update permissions'),
('super_admin', 'api_server', 'permissions', 'delete', true, 'Can delete permissions'),
-- Admin Panel
('super_admin', 'admin_panel', 'system_management', 'read', true, 'Can access system management'),
('super_admin', 'admin_panel', 'system_management', 'update', true, 'Can update system configuration'),
('super_admin', 'admin_panel', 'role_management', 'create', true, 'Can create roles'),
('super_admin', 'admin_panel', 'role_management', 'read', true, 'Can view roles'),
('super_admin', 'admin_panel', 'role_management', 'update', true, 'Can update roles'),
('super_admin', 'admin_panel', 'role_management', 'delete', true, 'Can delete roles'),
('super_admin', 'admin_panel', 'permission_management', 'create', true, 'Can create permissions'),
('super_admin', 'admin_panel', 'permission_management', 'read', true, 'Can view permissions'),
('super_admin', 'admin_panel', 'permission_management', 'update', true, 'Can update permissions'),
('super_admin', 'admin_panel', 'permission_management', 'delete', true, 'Can delete permissions'),
('super_admin', 'admin_panel', 'audit_logs', 'read', true, 'Can view audit logs'),
('super_admin', 'admin_panel', 'security_events', 'read', true, 'Can view security events');

-- Copy all admin permissions to super_admin
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description)
SELECT 'super_admin', platform, resource, action, is_allowed, description
FROM role_permissions 
WHERE role = 'admin';

-- Copy all employer permissions to admin and super_admin
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description)
SELECT 'admin', platform, resource, action, is_allowed, description
FROM role_permissions 
WHERE role = 'employer';

INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description)
SELECT 'super_admin', platform, resource, action, is_allowed, description
FROM role_permissions 
WHERE role = 'employer';

-- Copy all job_seeker permissions to employer, admin, and super_admin
INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description)
SELECT 'employer', platform, resource, action, is_allowed, description
FROM role_permissions 
WHERE role = 'job_seeker';

INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description)
SELECT 'admin', platform, resource, action, is_allowed, description
FROM role_permissions 
WHERE role = 'job_seeker';

INSERT INTO role_permissions (role, platform, resource, action, is_allowed, description)
SELECT 'super_admin', platform, resource, action, is_allowed, description
FROM role_permissions 
WHERE role = 'job_seeker';

-- ============================================================================
-- 9. INITIAL PLATFORM ACCESS SETUP
-- ============================================================================

-- Set platform access for existing users based on their roles
INSERT INTO platform_access (user_id, platform, access_level)
SELECT 
    id,
    'api_server',
    CASE 
        WHEN role = 'super_admin' THEN 'super_admin'
        WHEN role = 'admin' THEN 'admin'
        WHEN role = 'employer' THEN 'write'
        WHEN role = 'job_seeker' THEN 'read'
        ELSE 'none'
    END
FROM users
WHERE is_active = true;

INSERT INTO platform_access (user_id, platform, access_level)
SELECT 
    id,
    'public_website',
    CASE 
        WHEN role IN ('super_admin', 'admin', 'employer', 'job_seeker') THEN 'write'
        ELSE 'read'
    END
FROM users
WHERE is_active = true;

INSERT INTO platform_access (user_id, platform, access_level)
SELECT 
    id,
    'admin_panel',
    CASE 
        WHEN role = 'super_admin' THEN 'super_admin'
        WHEN role = 'admin' THEN 'admin'
        ELSE 'none'
    END
FROM users
WHERE is_active = true AND role IN ('admin', 'super_admin');

-- ============================================================================
-- 10. UPDATE EXISTING USERS TABLE
-- ============================================================================

-- Add new columns to existing users if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_access_api BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_access_admin_panel BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_access_public_site BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Update admin panel access for admin users
UPDATE users SET can_access_admin_panel = true WHERE role IN ('admin', 'super_admin');

-- ============================================================================
-- 11. FUNCTIONS FOR PERMISSION CHECKING
-- ============================================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_platform VARCHAR(50),
    p_resource VARCHAR(100),
    p_action VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(50);
    has_permission BOOLEAN := false;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = p_user_id AND is_active = true;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check permission
    SELECT is_allowed INTO has_permission
    FROM role_permissions
    WHERE role = user_role
    AND platform = p_platform
    AND resource = p_resource
    AND action = p_action;
    
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(
    platform VARCHAR(50),
    resource VARCHAR(100),
    action VARCHAR(50),
    is_allowed BOOLEAN
) AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    -- Get user role
    SELECT u.role INTO user_role FROM users u WHERE u.id = p_user_id AND u.is_active = true;
    
    IF user_role IS NULL THEN
        RETURN;
    END IF;
    
    -- Return permissions
    RETURN QUERY
    SELECT rp.platform, rp.resource, rp.action, rp.is_allowed
    FROM role_permissions rp
    WHERE rp.role = user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

-- Function to log user changes
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_audit_log (user_id, platform, action, resource_type, resource_id, new_values)
        VALUES (NEW.id, 'api_server', 'create', 'users', NEW.id::text, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO user_audit_log (user_id, platform, action, resource_type, resource_id, old_values, new_values)
        VALUES (NEW.id, 'api_server', 'update', 'users', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO user_audit_log (user_id, platform, action, resource_type, resource_id, old_values)
        VALUES (OLD.id, 'api_server', 'delete', 'users', OLD.id::text, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user changes
DROP TRIGGER IF EXISTS trigger_log_user_changes ON users;
CREATE TRIGGER trigger_log_user_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_user_changes();

-- ============================================================================
-- 13. VIEWS FOR EASY ACCESS
-- ============================================================================

-- View for user permissions summary
CREATE OR REPLACE VIEW user_permissions_summary AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.can_access_api,
    u.can_access_admin_panel,
    u.can_access_public_site,
    COUNT(rp.id) as total_permissions,
    COUNT(CASE WHEN rp.is_allowed = true THEN 1 END) as allowed_permissions
FROM users u
LEFT JOIN role_permissions rp ON rp.role = u.role
GROUP BY u.id, u.email, u.full_name, u.role, u.is_active, u.can_access_api, u.can_access_admin_panel, u.can_access_public_site;

-- View for active sessions
CREATE OR REPLACE VIEW active_user_sessions AS
SELECT 
    us.id,
    us.user_id,
    u.email,
    u.full_name,
    u.role,
    us.platform,
    us.ip_address,
    us.last_activity,
    us.expires_at,
    CASE WHEN us.expires_at > NOW() THEN true ELSE false END as is_valid
FROM user_sessions us
JOIN users u ON u.id = us.user_id
WHERE us.is_active = true;

-- ============================================================================
-- SUMMARY COMMENT
-- ============================================================================

/*
COMPREHENSIVE AUTHENTICATION & ROLE MANAGEMENT SYSTEM SUMMARY:

1. ROLE HIERARCHY:
   - job_seeker: Basic user, can search and apply for jobs
   - employer: Can post jobs and manage applications
   - admin: Can manage users, jobs, and view analytics
   - super_admin: Full system access including role/permission management

2. PLATFORM ACCESS:
   - API Server: Backend FastAPI application
   - Admin Panel: Next.js admin interface (admin/super_admin only)
   - Public Website: React frontend (all users)

3. SECURITY FEATURES:
   - Row Level Security (RLS) policies
   - Comprehensive audit logging
   - Session management
   - Security event tracking
   - Permission-based access control

4. KEY FUNCTIONS:
   - check_user_permission(): Verify user permissions
   - get_user_permissions(): Get all user permissions
   - Automatic audit logging via triggers

5. VIEWS:
   - user_permissions_summary: Overview of user permissions
   - active_user_sessions: Current active sessions

This system provides clear separation of concerns and comprehensive
security controls across all platforms while maintaining flexibility
for future enhancements.
*/