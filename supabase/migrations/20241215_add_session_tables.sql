-- Migration: Add scraping session management tables
-- Created: 2024-12-15
-- Description: Tables for comprehensive session management with progress tracking

-- Create enum types for session and website status
CREATE TYPE session_status AS ENUM (
    'created',
    'running', 
    'paused',
    'completed',
    'failed',
    'stopped'
);

CREATE TYPE website_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed',
    'skipped'
);

-- Scraping Sessions table
CREATE TABLE scraping_sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    status session_status NOT NULL DEFAULT 'created',
    total_websites INTEGER NOT NULL DEFAULT 0,
    completed_websites INTEGER DEFAULT 0,
    failed_websites INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timing information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    resumed_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance metrics
    total_duration DECIMAL(10,2), -- in seconds
    average_response_time DECIMAL(8,2), -- in milliseconds
    success_rate DECIMAL(5,2), -- percentage
    
    -- Configuration and context
    configuration JSONB DEFAULT '{}',
    memory_context JSONB,
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT fk_scraping_sessions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Session Websites table
CREATE TABLE session_websites (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    status website_status NOT NULL DEFAULT 'pending',
    
    -- Timing information
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results and metrics
    extracted_data JSONB,
    error_message TEXT,
    response_time DECIMAL(8,2), -- in milliseconds
    status_code INTEGER,
    content_length INTEGER,
    
    -- Scraping details
    selectors_used JSONB,
    screenshot_path TEXT,
    html_snapshot_path TEXT,
    
    -- ML optimization data
    ml_confidence_score DECIMAL(5,4),
    ml_optimization_applied BOOLEAN DEFAULT FALSE,
    ml_suggestions JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_session_websites_session FOREIGN KEY (session_id) REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    CONSTRAINT unique_session_website_order UNIQUE (session_id, order_index)
);

-- Session Events table for audit trail
CREATE TABLE session_events (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    website_id INTEGER,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_session_events_session FOREIGN KEY (session_id) REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_events_website FOREIGN KEY (website_id) REFERENCES session_websites(id) ON DELETE CASCADE
);

-- Session Metrics table for detailed analytics
CREATE TABLE session_metrics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6),
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_session_metrics_session FOREIGN KEY (session_id) REFERENCES scraping_sessions(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_scraping_sessions_user_id ON scraping_sessions(user_id);
CREATE INDEX idx_scraping_sessions_status ON scraping_sessions(status);
CREATE INDEX idx_scraping_sessions_created_at ON scraping_sessions(created_at DESC);
CREATE INDEX idx_scraping_sessions_user_status ON scraping_sessions(user_id, status);

CREATE INDEX idx_session_websites_session_id ON session_websites(session_id);
CREATE INDEX idx_session_websites_status ON session_websites(status);
CREATE INDEX idx_session_websites_session_order ON session_websites(session_id, order_index);
CREATE INDEX idx_session_websites_url ON session_websites USING hash(url);

CREATE INDEX idx_session_events_session_id ON session_events(session_id);
CREATE INDEX idx_session_events_created_at ON session_events(created_at DESC);
CREATE INDEX idx_session_events_type ON session_events(event_type);

CREATE INDEX idx_session_metrics_session_id ON session_metrics(session_id);
CREATE INDEX idx_session_metrics_name ON session_metrics(metric_name);
CREATE INDEX idx_session_metrics_recorded_at ON session_metrics(recorded_at DESC);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scraping_sessions_updated_at
    BEFORE UPDATE ON scraping_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_websites_updated_at
    BEFORE UPDATE ON session_websites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO scraping_sessions (name, user_id, status, total_websites, configuration) VALUES
('E-commerce Product Analysis', (SELECT id FROM auth.users LIMIT 1), 'completed', 50, 
 '{"max_concurrent_websites": 5, "request_delay": 1.0, "timeout": 30, "enable_ml_optimization": true}'),
('News Website Monitoring', (SELECT id FROM auth.users LIMIT 1), 'running', 25, 
 '{"max_concurrent_websites": 3, "request_delay": 2.0, "timeout": 45, "screenshot_enabled": true}'),
('Competitor Price Tracking', (SELECT id FROM auth.users LIMIT 1), 'paused', 100, 
 '{"max_concurrent_websites": 10, "request_delay": 0.5, "timeout": 20, "respect_robots_txt": true}');

-- Insert sample website data
INSERT INTO session_websites (session_id, url, order_index, status, extracted_data) VALUES
(1, 'https://example-shop.com/products', 0, 'completed', '{"title": "Products Page", "product_count": 25}'),
(1, 'https://another-shop.com/catalog', 1, 'completed', '{"title": "Catalog", "product_count": 30}'),
(1, 'https://third-shop.com/items', 2, 'failed', NULL),
(2, 'https://news-site.com/latest', 0, 'completed', '{"title": "Latest News", "article_count": 15}'),
(2, 'https://news-site.com/tech', 1, 'in_progress', NULL),
(3, 'https://competitor1.com/prices', 0, 'pending', NULL),
(3, 'https://competitor2.com/deals', 1, 'pending', NULL);

-- Insert sample events
INSERT INTO session_events (session_id, event_type, event_data, message) VALUES
(1, 'session_started', '{"timestamp": "2024-12-15T10:00:00Z"}', 'Session started successfully'),
(1, 'session_completed', '{"timestamp": "2024-12-15T10:30:00Z", "duration": 1800}', 'Session completed with 96% success rate'),
(2, 'session_started', '{"timestamp": "2024-12-15T11:00:00Z"}', 'Session started successfully'),
(2, 'website_completed', '{"website_id": 4, "response_time": 1250}', 'Successfully scraped news-site.com/latest');

-- Insert sample metrics
INSERT INTO session_metrics (session_id, metric_name, metric_value, metric_unit) VALUES
(1, 'average_response_time', 1250.50, 'ms'),
(1, 'success_rate', 96.00, 'percent'),
(1, 'total_data_extracted', 2048.75, 'kb'),
(2, 'average_response_time', 980.25, 'ms'),
(2, 'current_success_rate', 100.00, 'percent');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON scraping_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_websites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_metrics TO authenticated;

GRANT USAGE ON SEQUENCE scraping_sessions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE session_websites_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE session_events_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE session_metrics_id_seq TO authenticated;

-- Grant read-only access to anon for public session data (if needed)
GRANT SELECT ON scraping_sessions TO anon;
GRANT SELECT ON session_websites TO anon;
GRANT SELECT ON session_events TO anon;
GRANT SELECT ON session_metrics TO anon;

-- Add Row Level Security (RLS) policies
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for scraping_sessions
CREATE POLICY "Users can view their own sessions" ON scraping_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON scraping_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON scraping_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON scraping_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for session_websites
CREATE POLICY "Users can view websites from their sessions" ON session_websites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = session_websites.session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage websites from their sessions" ON session_websites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = session_websites.session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

-- RLS policies for session_events
CREATE POLICY "Users can view events from their sessions" ON session_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = session_events.session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage events from their sessions" ON session_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = session_events.session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

-- RLS policies for session_metrics
CREATE POLICY "Users can view metrics from their sessions" ON session_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = session_metrics.session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage metrics from their sessions" ON session_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = session_metrics.session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

-- Create views for common queries
CREATE VIEW session_summary AS
SELECT 
    s.id,
    s.name,
    s.user_id,
    s.status,
    s.total_websites,
    s.completed_websites,
    s.failed_websites,
    s.progress_percentage,
    s.created_at,
    s.started_at,
    s.completed_at,
    CASE 
        WHEN s.completed_at IS NOT NULL AND s.started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at))
        ELSE NULL 
    END as duration_seconds,
    COUNT(sw.id) as actual_website_count,
    COUNT(CASE WHEN sw.status = 'completed' THEN 1 END) as actual_completed,
    COUNT(CASE WHEN sw.status = 'failed' THEN 1 END) as actual_failed
FROM scraping_sessions s
LEFT JOIN session_websites sw ON s.id = sw.session_id
GROUP BY s.id, s.name, s.user_id, s.status, s.total_websites, 
         s.completed_websites, s.failed_websites, s.progress_percentage,
         s.created_at, s.started_at, s.completed_at;

-- Grant access to the view
GRANT SELECT ON session_summary TO authenticated;
GRANT SELECT ON session_summary TO anon;

-- Add comments for documentation
COMMENT ON TABLE scraping_sessions IS 'Main table for tracking scraping sessions with comprehensive lifecycle management';
COMMENT ON TABLE session_websites IS 'Individual websites within scraping sessions with detailed results';
COMMENT ON TABLE session_events IS 'Audit trail of all session-related events for monitoring and debugging';
COMMENT ON TABLE session_metrics IS 'Detailed performance metrics for sessions and analytics';
COMMENT ON VIEW session_summary IS 'Aggregated view of session data with calculated metrics';

-- Create function to automatically update session progress
CREATE OR REPLACE FUNCTION update_session_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update session progress when website status changes
    UPDATE scraping_sessions SET
        completed_websites = (
            SELECT COUNT(*) FROM session_websites 
            WHERE session_id = NEW.session_id AND status = 'completed'
        ),
        failed_websites = (
            SELECT COUNT(*) FROM session_websites 
            WHERE session_id = NEW.session_id AND status = 'failed'
        ),
        progress_percentage = (
            SELECT ROUND(
                (COUNT(CASE WHEN status IN ('completed', 'failed') THEN 1 END) * 100.0 / COUNT(*)), 2
            )
            FROM session_websites 
            WHERE session_id = NEW.session_id
        ),
        updated_at = NOW()
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update session progress
CREATE TRIGGER trigger_update_session_progress
    AFTER INSERT OR UPDATE OF status ON session_websites
    FOR EACH ROW
    EXECUTE FUNCTION update_session_progress();