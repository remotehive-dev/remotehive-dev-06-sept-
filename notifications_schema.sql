-- Notifications System Schema Extension for RemoteHive
-- Run this SQL in your Supabase SQL Editor to add notification functionality

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'application_status_update',
        'new_application',
        'job_posted',
        'job_expired',
        'profile_viewed',
        'message_received',
        'system_announcement'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data for the notification
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url VARCHAR(500), -- URL to navigate when notification is clicked
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    application_updates BOOLEAN DEFAULT true,
    new_job_alerts BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications" 
    ON notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
    ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
    ON notifications FOR INSERT 
    WITH CHECK (true); -- Allow system to create notifications

-- RLS policies for notification preferences
CREATE POLICY "Users can view own notification preferences" 
    ON notification_preferences FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" 
    ON notification_preferences FOR ALL 
    USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_action_url VARCHAR(500) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data, priority, action_url)
    VALUES (p_user_id, p_type, p_title, p_message, p_data, p_priority, p_action_url)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE user_id = auth.uid() AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for job application status updates
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    job_seeker_user_id UUID;
    job_title VARCHAR(255);
    company_name VARCHAR(255);
BEGIN
    -- Only trigger on status change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Get job seeker user ID and job details
    SELECT js.user_id, jp.title, e.company_name
    INTO job_seeker_user_id, job_title, company_name
    FROM job_seekers js
    JOIN job_posts jp ON jp.id = NEW.job_post_id
    JOIN employers e ON e.id = jp.employer_id
    WHERE js.id = NEW.job_seeker_id;
    
    -- Create notification for job seeker
    PERFORM create_notification(
        job_seeker_user_id,
        'application_status_update',
        'Application Status Updated',
        format('Your application for %s at %s has been %s', job_title, company_name, NEW.status),
        jsonb_build_object(
            'application_id', NEW.id,
            'job_post_id', NEW.job_post_id,
            'old_status', OLD.status,
            'new_status', NEW.status
        ),
        'normal',
        format('/jobs/%s', NEW.job_post_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new job applications
CREATE OR REPLACE FUNCTION notify_new_application()
RETURNS TRIGGER AS $$
DECLARE
    employer_user_id UUID;
    job_title VARCHAR(255);
    applicant_name VARCHAR(255);
BEGIN
    -- Get employer user ID and job details
    SELECT e.user_id, jp.title, u.full_name
    INTO employer_user_id, job_title, applicant_name
    FROM employers e
    JOIN job_posts jp ON jp.employer_id = e.id
    JOIN job_seekers js ON js.id = NEW.job_seeker_id
    JOIN users u ON u.id = js.user_id
    WHERE jp.id = NEW.job_post_id;
    
    -- Create notification for employer
    PERFORM create_notification(
        employer_user_id,
        'new_application',
        'New Job Application',
        format('New application from %s for %s', applicant_name, job_title),
        jsonb_build_object(
            'application_id', NEW.id,
            'job_post_id', NEW.job_post_id,
            'applicant_name', applicant_name
        ),
        'normal',
        format('/employer/applications/%s', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_notify_application_status_change
    AFTER UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_application_status_change();

CREATE TRIGGER trigger_notify_new_application
    AFTER INSERT ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_application();

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

SELECT 'Notifications system schema created successfully!' as message;