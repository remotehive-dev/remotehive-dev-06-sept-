-- Scraper Queue Table Schema for RemoteHive Admin Panel
-- This table tracks job scraping tasks and their status

CREATE TABLE IF NOT EXISTS scraper_queue (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    job_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraper_queue_status ON scraper_queue(status);
CREATE INDEX IF NOT EXISTS idx_scraper_queue_priority ON scraper_queue(priority);
CREATE INDEX IF NOT EXISTS idx_scraper_queue_created_at ON scraper_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_scraper_queue_source_name ON scraper_queue(source_name);

-- Enable RLS
ALTER TABLE scraper_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admin only access" ON scraper_queue FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
    )
);

-- Trigger for updated_at column
CREATE TRIGGER update_scraper_queue_updated_at 
    BEFORE UPDATE ON scraper_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO scraper_queue (source_name, url, status, priority, job_count) VALUES
('Indeed', 'https://indeed.com/jobs?q=remote+developer', 'completed', 1, 25),
('LinkedIn', 'https://linkedin.com/jobs/search/?keywords=remote%20engineer', 'running', 2, 0),
('AngelList', 'https://angel.co/jobs', 'pending', 1, 0),
('RemoteOK', 'https://remoteok.io/', 'completed', 1, 18),
('We Work Remotely', 'https://weworkremotely.com/', 'failed', 3, 0)
ON CONFLICT DO NOTHING;

COMMIT;

SELECT 'Scraper queue table created successfully!' as message;