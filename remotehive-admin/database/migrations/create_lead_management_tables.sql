-- Lead Management System Database Schema
-- This file contains the SQL commands to create all necessary tables for the lead management system

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    address TEXT,
    source VARCHAR(100) NOT NULL DEFAULT 'website_registration',
    type VARCHAR(20) NOT NULL CHECK (
        type IN ('employer', 'jobseeker')
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (
        status IN (
            'new',
            'contacted',
            'qualified',
            'converted',
            'closed',
            'lost'
        )
    ),
    assigned_to UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        last_activity TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        converted_at TIMESTAMP
    WITH
        TIME ZONE,
        conversion_value DECIMAL(10, 2)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads (user_id);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);

CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads (source);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads (assigned_to);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);

CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads (last_activity);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (
        type IN (
            'info',
            'success',
            'warning',
            'error',
            'new_lead',
            'lead_assigned',
            'lead_converted',
            'system'
        )
    ),
    data JSONB,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP
    WITH
        TIME ZONE
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);

-- Create lead_analytics table for tracking metrics
CREATE TABLE IF NOT EXISTS lead_analytics (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    date DATE NOT NULL,
    lead_type VARCHAR(20) NOT NULL CHECK (
        lead_type IN ('employer', 'jobseeker')
    ),
    source VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_lead_analytics_date ON lead_analytics (date);

CREATE INDEX IF NOT EXISTS idx_lead_analytics_type ON lead_analytics (lead_type);

CREATE INDEX IF NOT EXISTS idx_lead_analytics_source ON lead_analytics (source);

-- Create lead_activities table for tracking lead interactions
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    lead_id UUID REFERENCES leads (id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (
        activity_type IN (
            'created',
            'contacted',
            'note_added',
            'status_changed',
            'assigned',
            'converted'
        )
    ),
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities (lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON lead_activities (user_id);

CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities (activity_type);

CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities (created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to log lead activities
CREATE OR REPLACE FUNCTION log_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO lead_activities (lead_id, activity_type, description)
        VALUES (NEW.id, 'created', 'Lead created from ' || NEW.source);
        RETURN NEW;
    END IF;
    
    -- Log updates
    IF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO lead_activities (lead_id, activity_type, description, old_value, new_value)
            VALUES (NEW.id, 'status_changed', 'Status changed', OLD.status, NEW.status);
        END IF;
        
        -- Log assignment changes
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
            INSERT INTO lead_activities (lead_id, activity_type, description, old_value, new_value)
            VALUES (NEW.id, 'assigned', 'Lead assignment changed', 
                   COALESCE(OLD.assigned_to::text, 'unassigned'), 
                   COALESCE(NEW.assigned_to::text, 'unassigned'));
        END IF;
        
        -- Update last_activity
        NEW.last_activity = NOW();
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for lead activity logging
CREATE TRIGGER log_lead_activity_trigger
    AFTER INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_activity();

-- Create RLS (Row Level Security) policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE lead_analytics ENABLE ROW LEVEL SECURITY;

ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for leads table
CREATE POLICY "Admin users can view all leads" ON leads FOR
SELECT USING (
        auth.jwt () ->> 'role' IN ('admin', 'super_admin')
    );

CREATE POLICY "Admin users can insert leads" ON leads FOR
INSERT
WITH
    CHECK (
        auth.jwt () ->> 'role' IN ('admin', 'super_admin')
    );

CREATE POLICY "Admin users can update leads" ON leads FOR
UPDATE USING (
    auth.jwt () ->> 'role' IN ('admin', 'super_admin')
);

CREATE POLICY "Assigned users can view their leads" ON leads FOR
SELECT USING (assigned_to = auth.uid ());

-- Create policies for notifications table
CREATE POLICY "Users can view their notifications" ON notifications FOR
SELECT USING (
        user_id = auth.uid ()
        OR user_id IS NULL
    );

CREATE POLICY "Admin users can manage notifications" ON notifications FOR ALL USING (
    auth.jwt () ->> 'role' IN ('admin', 'super_admin')
);

-- Create policies for analytics table
CREATE POLICY "Admin users can view analytics" ON lead_analytics FOR
SELECT USING (
        auth.jwt () ->> 'role' IN ('admin', 'super_admin')
    );

CREATE POLICY "System can insert analytics" ON lead_analytics FOR
INSERT
WITH
    CHECK (true);

-- Create policies for activities table
CREATE POLICY "Admin users can view activities" ON lead_activities FOR
SELECT USING (
        auth.jwt () ->> 'role' IN ('admin', 'super_admin')
    );

CREATE POLICY "System can insert activities" ON lead_activities FOR
INSERT
WITH
    CHECK (true);

-- Insert some sample data for testing (optional)
-- This can be removed in production
/*
INSERT INTO leads (name, email, phone, company_name, address, source, type, status) VALUES
('John Smith', 'ranjeettiwary589@gmail.com', '+1-555-0101', 'Tech Corp', '123 Main St, New York, NY', 'website_registration', 'employer', 'new'),
('Jane Doe', 'ranjeettiwari105@gmail.com', '+1-555-0102', NULL, '456 Oak Ave, Los Angeles, CA', 'website_registration', 'jobseeker', 'contacted'),
('Mike Johnson', 'mike.j@startup.com', '+1-555-0103', 'StartupXYZ', '789 Pine St, San Francisco, CA', 'referral', 'employer', 'qualified'),
('Sarah Wilson', 'sarah.w@email.com', '+1-555-0104', NULL, '321 Elm St, Chicago, IL', 'social_media', 'jobseeker', 'new'),
('David Brown', 'david.brown@company.com', '+1-555-0105', 'Big Enterprise', '654 Cedar Rd, Boston, MA', 'website_registration', 'employer', 'converted');
*/

-- Create view for lead statistics
CREATE OR REPLACE VIEW lead_stats AS
SELECT
    COUNT(*) as total_leads,
    COUNT(
        CASE
            WHEN type = 'employer' THEN 1
        END
    ) as employer_leads,
    COUNT(
        CASE
            WHEN type = 'jobseeker' THEN 1
        END
    ) as jobseeker_leads,
    COUNT(
        CASE
            WHEN status = 'new' THEN 1
        END
    ) as new_leads,
    COUNT(
        CASE
            WHEN status = 'contacted' THEN 1
        END
    ) as contacted_leads,
    COUNT(
        CASE
            WHEN status = 'qualified' THEN 1
        END
    ) as qualified_leads,
    COUNT(
        CASE
            WHEN status = 'converted' THEN 1
        END
    ) as converted_leads,
    COUNT(
        CASE
            WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1
        END
    ) as leads_this_week,
    COUNT(
        CASE
            WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1
        END
    ) as leads_this_month
FROM leads;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT , UPDATE, DELETE ON leads TO authenticated;

GRANT
SELECT,
INSERT
,
UPDATE,
DELETE ON notifications TO authenticated;

GRANT SELECT, INSERT ON lead_analytics TO authenticated;

GRANT SELECT, INSERT ON lead_activities TO authenticated;

GRANT SELECT ON lead_stats TO authenticated;

-- Comments for documentation
COMMENT ON
TABLE leads IS 'Main table for storing lead information from registrations and other sources';

COMMENT ON
TABLE notifications IS 'System notifications for lead management events';

COMMENT ON
TABLE lead_analytics IS 'Analytics data for tracking lead generation metrics';

COMMENT ON
TABLE lead_activities IS 'Activity log for tracking changes and interactions with leads';

COMMENT ON VIEW lead_stats IS 'Aggregated statistics view for lead dashboard';