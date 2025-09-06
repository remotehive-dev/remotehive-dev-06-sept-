-- Row Level Security (RLS) Policies for RemoteHive
-- This script sets up comprehensive security policies for all tables

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_apply_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GRANT BASIC PERMISSIONS TO ROLES
-- ============================================================================

-- Grant permissions to anon role (for public access)
GRANT SELECT ON users TO anon;
GRANT INSERT ON contact_submissions TO anon;
GRANT SELECT ON contact_information TO anon;
GRANT SELECT ON seo_settings TO anon;
GRANT SELECT ON reviews TO anon;
GRANT SELECT ON ads TO anon;
GRANT SELECT ON job_categories TO anon;
GRANT SELECT ON job_posts TO anon;
GRANT SELECT ON employers TO anon;
GRANT SELECT ON media_files TO anon;
GRANT SELECT ON carousel_items TO anon;
GRANT SELECT ON galleries TO anon;
GRANT SELECT ON gallery_images TO anon;
GRANT SELECT ON pages TO anon;
GRANT SELECT ON theme_settings TO anon;
GRANT SELECT ON navigation_menus TO anon;
GRANT SELECT ON navigation_items TO anon;

-- Grant permissions to authenticated role (for logged-in users)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- USER POLICIES
-- ============================================================================

-- Users can view their own profile and public profiles
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (registration)
CREATE POLICY "Users can register" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CONTACT POLICIES
-- ============================================================================

-- Anyone can submit contact forms
CREATE POLICY "Anyone can submit contact forms" ON contact_submissions
    FOR INSERT WITH CHECK (true);

-- Only admins can view contact submissions
CREATE POLICY "Admins can view contact submissions" ON contact_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Only admins can update contact submissions
CREATE POLICY "Admins can update contact submissions" ON contact_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Anyone can view contact information
CREATE POLICY "Anyone can view contact info" ON contact_information
    FOR SELECT USING (true);

-- ============================================================================
-- SEO AND CONTENT POLICIES
-- ============================================================================

-- Anyone can view SEO settings
CREATE POLICY "Anyone can view SEO settings" ON seo_settings
    FOR SELECT USING (true);

-- Only admins can modify SEO settings
CREATE POLICY "Admins can modify SEO settings" ON seo_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- ============================================================================
-- REVIEW POLICIES
-- ============================================================================

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (is_approved = true);

-- Anyone can submit reviews
CREATE POLICY "Anyone can submit reviews" ON reviews
    FOR INSERT WITH CHECK (true);

-- Only admins can approve/manage reviews
CREATE POLICY "Admins can manage reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- ============================================================================
-- JOB SEEKER POLICIES
-- ============================================================================

-- Job seekers can view and manage their own profile
CREATE POLICY "Job seekers can manage own profile" ON job_seekers
    FOR ALL USING (auth.uid() = user_id);

-- Employers can view job seeker profiles (for applications)
CREATE POLICY "Employers can view job seeker profiles" ON job_seekers
    FOR SELECT USING (
        profile_visibility = 'public' OR
        EXISTS (
            SELECT 1 FROM employers 
            WHERE employers.user_id = auth.uid()
        )
    );

-- ============================================================================
-- EMPLOYER POLICIES
-- ============================================================================

-- Employers can manage their own profile
CREATE POLICY "Employers can manage own profile" ON employers
    FOR ALL USING (auth.uid() = user_id);

-- Anyone can view verified employer profiles
CREATE POLICY "Anyone can view verified employers" ON employers
    FOR SELECT USING (verification_status = 'verified');

-- ============================================================================
-- JOB POST POLICIES
-- ============================================================================

-- Anyone can view active job posts
CREATE POLICY "Anyone can view active jobs" ON job_posts
    FOR SELECT USING (status = 'active');

-- Employers can manage their own job posts
CREATE POLICY "Employers can manage own jobs" ON job_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employers 
            WHERE employers.id = job_posts.employer_id 
            AND employers.user_id = auth.uid()
        )
    );

-- Admins can manage all job posts
CREATE POLICY "Admins can manage all jobs" ON job_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- ============================================================================
-- JOB APPLICATION POLICIES
-- ============================================================================

-- Job seekers can manage their own applications
CREATE POLICY "Job seekers can manage own applications" ON job_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_seekers 
            WHERE job_seekers.id = job_applications.job_seeker_id 
            AND job_seekers.user_id = auth.uid()
        )
    );

-- Employers can view applications for their jobs
CREATE POLICY "Employers can view applications for their jobs" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_posts jp
            JOIN employers e ON e.id = jp.employer_id
            WHERE jp.id = job_applications.job_post_id 
            AND e.user_id = auth.uid()
        )
    );

-- Employers can update applications for their jobs
CREATE POLICY "Employers can update applications for their jobs" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM job_posts jp
            JOIN employers e ON e.id = jp.employer_id
            WHERE jp.id = job_applications.job_post_id 
            AND e.user_id = auth.uid()
        )
    );

-- ============================================================================
-- SAVED JOBS POLICIES
-- ============================================================================

-- Job seekers can manage their saved jobs
CREATE POLICY "Job seekers can manage saved jobs" ON saved_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_seekers 
            WHERE job_seekers.id = saved_jobs.job_seeker_id 
            AND job_seekers.user_id = auth.uid()
        )
    );

-- ============================================================================
-- INTERVIEW POLICIES
-- ============================================================================

-- Users can view interviews for their applications
CREATE POLICY "Users can view own interviews" ON interviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_applications ja
            JOIN job_seekers js ON js.id = ja.job_seeker_id
            WHERE ja.id = interviews.application_id 
            AND js.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM job_applications ja
            JOIN job_posts jp ON jp.id = ja.job_post_id
            JOIN employers e ON e.id = jp.employer_id
            WHERE ja.id = interviews.application_id 
            AND e.user_id = auth.uid()
        )
    );

-- Employers can manage interviews for their job applications
CREATE POLICY "Employers can manage interviews" ON interviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_applications ja
            JOIN job_posts jp ON jp.id = ja.job_post_id
            JOIN employers e ON e.id = jp.employer_id
            WHERE ja.id = interviews.application_id 
            AND e.user_id = auth.uid()
        )
    );

-- ============================================================================
-- AUTO APPLY SETTINGS POLICIES
-- ============================================================================

-- Job seekers can manage their auto apply settings
CREATE POLICY "Job seekers can manage auto apply settings" ON auto_apply_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_seekers 
            WHERE job_seekers.id = auto_apply_settings.job_seeker_id 
            AND job_seekers.user_id = auth.uid()
        )
    );

-- ============================================================================
-- EMAIL POLICIES
-- ============================================================================

-- Users can view their own email verification tokens
CREATE POLICY "Users can view own email tokens" ON email_verification_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert email verification tokens
CREATE POLICY "System can insert email tokens" ON email_verification_tokens
    FOR INSERT WITH CHECK (true);

-- Only admins can manage email templates
CREATE POLICY "Admins can manage email templates" ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs" ON email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- ============================================================================
-- CMS POLICIES
-- ============================================================================

-- Anyone can view public media files
CREATE POLICY "Anyone can view public media" ON media_files
    FOR SELECT USING (is_public = true);

-- Authenticated users can view all media files
CREATE POLICY "Authenticated users can view all media" ON media_files
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can upload media files
CREATE POLICY "Authenticated users can upload media" ON media_files
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own uploaded files
CREATE POLICY "Users can update own media" ON media_files
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Anyone can view active carousel items
CREATE POLICY "Anyone can view active carousel items" ON carousel_items
    FOR SELECT USING (is_active = true);

-- Admins can manage carousel items
CREATE POLICY "Admins can manage carousel items" ON carousel_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Anyone can view public galleries
CREATE POLICY "Anyone can view public galleries" ON galleries
    FOR SELECT USING (is_public = true);

-- Users can manage their own galleries
CREATE POLICY "Users can manage own galleries" ON galleries
    FOR ALL USING (auth.uid() = created_by);

-- Gallery images follow gallery permissions
CREATE POLICY "Gallery images follow gallery permissions" ON gallery_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = gallery_images.gallery_id 
            AND galleries.is_public = true
        )
    );

-- Users can manage images in their galleries
CREATE POLICY "Users can manage own gallery images" ON gallery_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = gallery_images.gallery_id 
            AND galleries.created_by = auth.uid()
        )
    );

-- Anyone can view published pages
CREATE POLICY "Anyone can view published pages" ON pages
    FOR SELECT USING (status = 'published');

-- Authors can manage their own pages
CREATE POLICY "Authors can manage own pages" ON pages
    FOR ALL USING (auth.uid() = author_id);

-- Admins can manage all pages
CREATE POLICY "Admins can manage all pages" ON pages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Anyone can view active theme settings
CREATE POLICY "Anyone can view active theme" ON theme_settings
    FOR SELECT USING (is_active = true);

-- Only admins can manage theme settings
CREATE POLICY "Admins can manage theme settings" ON theme_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Only admins can manage ad campaigns
CREATE POLICY "Admins can manage ad campaigns" ON ad_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Anyone can view active navigation menus
CREATE POLICY "Anyone can view active navigation" ON navigation_menus
    FOR SELECT USING (is_active = true);

-- Navigation items follow menu permissions
CREATE POLICY "Anyone can view active navigation items" ON navigation_items
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM navigation_menus 
            WHERE navigation_menus.id = navigation_items.menu_id 
            AND navigation_menus.is_active = true
        )
    );

-- Only admins can manage navigation
CREATE POLICY "Admins can manage navigation menus" ON navigation_menus
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can manage navigation items" ON navigation_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- ============================================================================
-- ADMIN AND SYSTEM POLICIES
-- ============================================================================

-- Only admins can view public system settings
CREATE POLICY "Anyone can view public system settings" ON system_settings
    FOR SELECT USING (is_public = true);

-- Only admins can manage system settings
CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Only admins can view admin logs
CREATE POLICY "Admins can view admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Only admins can manage scraper config
CREATE POLICY "Admins can manage scraper config" ON scraper_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Only admins can view scraper logs
CREATE POLICY "Admins can view scraper logs" ON scraper_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Only system can manage scraper memory
CREATE POLICY "System can manage scraper memory" ON scraper_memory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Anyone can view job categories
CREATE POLICY "Anyone can view job categories" ON job_categories
    FOR SELECT USING (is_active = true);

-- Only admins can manage job categories
CREATE POLICY "Admins can manage job categories" ON job_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Anyone can view active ads
CREATE POLICY "Anyone can view active ads" ON ads
    FOR SELECT USING (
        is_active = true AND 
        (start_date IS NULL OR start_date <= NOW()) AND
        (end_date IS NULL OR end_date >= NOW())
    );

-- Only admins can manage ads
CREATE POLICY "Admins can manage ads" ON ads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Only admins can view job workflow logs
CREATE POLICY "Admins can view job workflow logs" ON job_workflow_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- System can insert job workflow logs
CREATE POLICY "System can insert job workflow logs" ON job_workflow_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns resource
CREATE OR REPLACE FUNCTION owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Row Level Security policies applied successfully!' as message;