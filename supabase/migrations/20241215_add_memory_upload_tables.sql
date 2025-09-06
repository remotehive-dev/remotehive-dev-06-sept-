-- Add memory upload tables for CSV memory management

-- Create memory_uploads table
CREATE TABLE IF NOT EXISTS memory_uploads (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
    user_id INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    error_log TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memory_contexts table for processed memory data
CREATE TABLE IF NOT EXISTS memory_contexts (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER REFERENCES memory_uploads(id) ON DELETE CASCADE,
    website_patterns JSONB DEFAULT '{}',
    extraction_rules JSONB DEFAULT '{}',
    success_indicators JSONB DEFAULT '[]',
    failure_patterns JSONB DEFAULT '[]',
    custom_selectors JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memory_records table for individual memory entries
CREATE TABLE IF NOT EXISTS memory_records (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER REFERENCES memory_uploads(id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    domain VARCHAR(255),
    selector_type VARCHAR(100),
    selector_value TEXT,
    extraction_rule TEXT,
    success_indicator TEXT,
    failure_pattern TEXT,
    custom_data JSONB DEFAULT '{}',
    is_processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memory_uploads_user_id ON memory_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_uploads_status ON memory_uploads(status);
CREATE INDEX IF NOT EXISTS idx_memory_uploads_upload_date ON memory_uploads(upload_date);

CREATE INDEX IF NOT EXISTS idx_memory_contexts_upload_id ON memory_contexts(upload_id);

CREATE INDEX IF NOT EXISTS idx_memory_records_upload_id ON memory_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_memory_records_domain ON memory_records(domain);
CREATE INDEX IF NOT EXISTS idx_memory_records_website_url ON memory_records(website_url);
CREATE INDEX IF NOT EXISTS idx_memory_records_is_processed ON memory_records(is_processed);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_memory_uploads_updated_at ON memory_uploads;
CREATE TRIGGER update_memory_uploads_updated_at
    BEFORE UPDATE ON memory_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memory_contexts_updated_at ON memory_contexts;
CREATE TRIGGER update_memory_contexts_updated_at
    BEFORE UPDATE ON memory_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memory_records_updated_at ON memory_records;
CREATE TRIGGER update_memory_records_updated_at
    BEFORE UPDATE ON memory_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing
INSERT INTO memory_uploads (filename, status, user_id, total_records, processed_records, progress_percentage)
VALUES 
    ('sample_memory.csv', 'completed', 1, 100, 100, 100.0),
    ('test_patterns.csv', 'processing', 1, 50, 25, 50.0)
ON CONFLICT DO NOTHING;

-- Grant permissions to authenticated and anonymous users
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_uploads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_contexts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON memory_records TO authenticated;

GRANT SELECT ON memory_uploads TO anon;
GRANT SELECT ON memory_contexts TO anon;
GRANT SELECT ON memory_records TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE memory_uploads_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE memory_contexts_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE memory_records_id_seq TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE memory_uploads_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE memory_contexts_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE memory_records_id_seq TO anon;

-- Add comments for documentation
COMMENT ON TABLE memory_uploads IS 'Stores information about uploaded memory CSV files';
COMMENT ON TABLE memory_contexts IS 'Stores processed memory context data for ML training';
COMMENT ON TABLE memory_records IS 'Stores individual memory records from CSV uploads';

COMMENT ON COLUMN memory_uploads.status IS 'Status: uploaded, processing, completed, failed';
COMMENT ON COLUMN memory_uploads.progress_percentage IS 'Processing progress from 0.0 to 100.0';
COMMENT ON COLUMN memory_contexts.website_patterns IS 'JSON object containing website-specific patterns';
COMMENT ON COLUMN memory_contexts.extraction_rules IS 'JSON object containing extraction rules by domain';
COMMENT ON COLUMN memory_records.selector_type IS 'Type of selector: css, xpath, class, id, etc.';
COMMENT ON COLUMN memory_records.custom_data IS 'Additional custom data in JSON format';