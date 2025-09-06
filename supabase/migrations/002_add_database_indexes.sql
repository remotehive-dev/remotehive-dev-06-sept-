-- Add database indexes for performance optimization
-- This migration adds indexes on frequently queried fields

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Job posts table indexes
CREATE INDEX IF NOT EXISTS idx_job_posts_employer_id ON job_posts(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_category_id ON job_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_job_posts_is_featured ON job_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_job_posts_is_remote ON job_posts(is_remote);
CREATE INDEX IF NOT EXISTS idx_job_posts_created_at ON job_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_job_posts_updated_at ON job_posts(updated_at);
CREATE INDEX IF NOT EXISTS idx_job_posts_application_deadline ON job_posts(application_deadline);
CREATE INDEX IF NOT EXISTS idx_job_posts_employment_type ON job_posts(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_posts_experience_level ON job_posts(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_posts_location ON job_posts(location);
CREATE INDEX IF NOT EXISTS idx_job_posts_salary_range ON job_posts(salary_min, salary_max);

-- Job applications table indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_job_post_id ON job_applications(job_post_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_seeker_id ON job_applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_reviewed_at ON job_applications(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_reviewed_by ON job_applications(reviewed_by);

-- Job seekers table indexes
CREATE INDEX IF NOT EXISTS idx_job_seekers_user_id ON job_seekers(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seekers_experience_level ON job_seekers(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_seekers_availability ON job_seekers(availability);
CREATE INDEX IF NOT EXISTS idx_job_seekers_is_open_to_work ON job_seekers(is_open_to_work);
CREATE INDEX IF NOT EXISTS idx_job_seekers_profile_visibility ON job_seekers(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_job_seekers_salary_range ON job_seekers(salary_expectation_min, salary_expectation_max);

-- Employers table indexes
CREATE INDEX IF NOT EXISTS idx_employers_user_id ON employers(user_id);
CREATE INDEX IF NOT EXISTS idx_employers_verification_status ON employers(verification_status);
CREATE INDEX IF NOT EXISTS idx_employers_is_premium ON employers(is_premium);
CREATE INDEX IF NOT EXISTS idx_employers_industry ON employers(industry);
CREATE INDEX IF NOT EXISTS idx_employers_company_size ON employers(company_size);
CREATE INDEX IF NOT EXISTS idx_employers_subscription_expires_at ON employers(subscription_expires_at);

-- Job categories table indexes
CREATE INDEX IF NOT EXISTS idx_job_categories_slug ON job_categories(slug);
CREATE INDEX IF NOT EXISTS idx_job_categories_is_active ON job_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_job_categories_sort_order ON job_categories(sort_order);

-- Contact submissions table indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read ON contact_submissions(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_replied ON contact_submissions(is_replied);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_priority ON contact_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_email ON reviews(email);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Media files table indexes
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON media_files(media_type);
CREATE INDEX IF NOT EXISTS idx_media_files_is_public ON media_files(is_public);
CREATE INDEX IF NOT EXISTS idx_media_files_folder ON media_files(folder);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- Email logs table indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- System settings table indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON system_settings(is_public);

-- Admin logs table indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource_type ON admin_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- User sessions table indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Email users table indexes
CREATE INDEX IF NOT EXISTS idx_email_users_email ON email_users(email);
CREATE INDEX IF NOT EXISTS idx_email_users_role ON email_users(role);
CREATE INDEX IF NOT EXISTS idx_email_users_is_active ON email_users(is_active);
CREATE INDEX IF NOT EXISTS idx_email_users_is_verified ON email_users(is_verified);
CREATE INDEX IF NOT EXISTS idx_email_users_is_locked ON email_users(is_locked);
CREATE INDEX IF NOT EXISTS idx_email_users_created_at ON email_users(created_at);
CREATE INDEX IF NOT EXISTS idx_email_users_last_login ON email_users(last_login);

-- Email messages table indexes
CREATE INDEX IF NOT EXISTS idx_email_messages_from_email ON email_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_to_email ON email_messages(to_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_status ON email_messages(status);
CREATE INDEX IF NOT EXISTS idx_email_messages_priority ON email_messages(priority);
CREATE INDEX IF NOT EXISTS idx_email_messages_is_read ON email_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_email_messages_is_starred ON email_messages(is_starred);
CREATE INDEX IF NOT EXISTS idx_email_messages_is_archived ON email_messages(is_archived);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_created_at ON email_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_email_messages_sent_at ON email_messages(sent_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_job_posts_status_featured ON job_posts(status, is_featured);
CREATE INDEX IF NOT EXISTS idx_job_posts_location_remote ON job_posts(location, is_remote);
CREATE INDEX IF NOT EXISTS idx_job_applications_seeker_status ON job_applications(job_seeker_id, status);
CREATE INDEX IF NOT EXISTS idx_users_active_verified ON users(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_email_messages_user_status ON email_messages(to_email, status, is_read);

-- Performance indexes for pagination and sorting
CREATE INDEX IF NOT EXISTS idx_job_posts_created_desc ON job_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_desc ON job_applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_desc ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_desc ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_created_desc ON email_messages(created_at DESC);

-- Text search indexes for job posts
CREATE INDEX IF NOT EXISTS idx_job_posts_title_gin ON job_posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_job_posts_description_gin ON job_posts USING gin(to_tsvector('english', description));

-- JSONB indexes for structured data
CREATE INDEX IF NOT EXISTS idx_job_posts_skills_gin ON job_posts USING gin(skills_required);
CREATE INDEX IF NOT EXISTS idx_job_seekers_skills_gin ON job_seekers USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_job_seekers_preferred_types_gin ON job_seekers USING gin(preferred_job_types);
CREATE INDEX IF NOT EXISTS idx_job_seekers_preferred_locations_gin ON job_seekers USING gin(preferred_locations);

COMMIT;