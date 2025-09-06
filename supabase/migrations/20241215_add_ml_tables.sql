-- Migration: Add ML Intelligence Tables
-- Description: Creates tables for ML training data, model metrics, pattern analysis, and insights
-- Date: 2024-12-15

-- ML Training Data table
CREATE TABLE IF NOT EXISTS ml_training_data (
    id SERIAL PRIMARY KEY,
    website_url VARCHAR(2048) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    selector_used VARCHAR(500) NOT NULL,
    extraction_success BOOLEAN NOT NULL DEFAULT FALSE,
    extracted_content TEXT,
    content_quality_score FLOAT DEFAULT 0.0,
    response_time_ms INTEGER,
    error_message TEXT,
    user_id INTEGER,
    session_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_training_data_website_url ON ml_training_data(website_url);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_content_type ON ml_training_data(content_type);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_success ON ml_training_data(extraction_success);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_user_id ON ml_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_session_id ON ml_training_data(session_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_created_at ON ml_training_data(created_at);

-- ML Model Metrics table
CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    training_data_count INTEGER DEFAULT 0,
    evaluation_data_count INTEGER DEFAULT 0,
    training_duration_seconds INTEGER,
    model_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for model metrics
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_name ON ml_model_metrics(model_name);
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_version ON ml_model_metrics(model_version);
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_metric_name ON ml_model_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_created_at ON ml_model_metrics(created_at);

-- Pattern Analysis table
CREATE TABLE IF NOT EXISTS pattern_analysis (
    id SERIAL PRIMARY KEY,
    website_url VARCHAR(2048) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    website_category VARCHAR(100),
    dom_structure JSONB,
    content_patterns JSONB,
    selector_recommendations JSONB,
    similarity_score FLOAT DEFAULT 0.0,
    confidence_score FLOAT DEFAULT 0.0,
    analysis_version VARCHAR(50) DEFAULT '1.0',
    user_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for pattern analysis
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_website_url ON pattern_analysis(website_url);
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_domain ON pattern_analysis(domain);
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_category ON pattern_analysis(website_category);
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_confidence ON pattern_analysis(confidence_score);
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_user_id ON pattern_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_created_at ON pattern_analysis(created_at);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_dom_structure ON pattern_analysis USING GIN (dom_structure);
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_content_patterns ON pattern_analysis USING GIN (content_patterns);
CREATE INDEX IF NOT EXISTS idx_pattern_analysis_selector_recommendations ON pattern_analysis USING GIN (selector_recommendations);

-- Selector Performance table
CREATE TABLE IF NOT EXISTS selector_performance (
    id SERIAL PRIMARY KEY,
    website_url VARCHAR(2048) NOT NULL,
    selector VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    avg_response_time_ms FLOAT DEFAULT 0.0,
    avg_content_quality FLOAT DEFAULT 0.0,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    user_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for selector performance
CREATE INDEX IF NOT EXISTS idx_selector_performance_website_url ON selector_performance(website_url);
CREATE INDEX IF NOT EXISTS idx_selector_performance_selector ON selector_performance(selector);
CREATE INDEX IF NOT EXISTS idx_selector_performance_content_type ON selector_performance(content_type);
CREATE INDEX IF NOT EXISTS idx_selector_performance_success_count ON selector_performance(success_count);
CREATE INDEX IF NOT EXISTS idx_selector_performance_user_id ON selector_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_selector_performance_created_at ON selector_performance(created_at);

-- ML Insights table
CREATE TABLE IF NOT EXISTS ml_insights (
    id SERIAL PRIMARY KEY,
    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score FLOAT DEFAULT 0.0,
    priority VARCHAR(20) DEFAULT 'medium',
    actionable BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    user_id INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ML insights
CREATE INDEX IF NOT EXISTS idx_ml_insights_type ON ml_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ml_insights_priority ON ml_insights(priority);
CREATE INDEX IF NOT EXISTS idx_ml_insights_confidence ON ml_insights(confidence_score);
CREATE INDEX IF NOT EXISTS idx_ml_insights_user_id ON ml_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_insights_expires_at ON ml_insights(expires_at);
CREATE INDEX IF NOT EXISTS idx_ml_insights_created_at ON ml_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ml_insights_actionable ON ml_insights(actionable);

-- Create GIN index for metadata JSONB column
CREATE INDEX IF NOT EXISTS idx_ml_insights_metadata ON ml_insights USING GIN (metadata);

-- Add constraints
ALTER TABLE ml_training_data ADD CONSTRAINT chk_content_quality_score 
    CHECK (content_quality_score >= 0.0 AND content_quality_score <= 1.0);

ALTER TABLE ml_model_metrics ADD CONSTRAINT chk_metric_value_positive 
    CHECK (metric_value >= 0.0);

ALTER TABLE pattern_analysis ADD CONSTRAINT chk_similarity_score 
    CHECK (similarity_score >= 0.0 AND similarity_score <= 1.0);

ALTER TABLE pattern_analysis ADD CONSTRAINT chk_confidence_score 
    CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0);

ALTER TABLE selector_performance ADD CONSTRAINT chk_success_failure_counts 
    CHECK (success_count >= 0 AND failure_count >= 0);

ALTER TABLE selector_performance ADD CONSTRAINT chk_avg_response_time 
    CHECK (avg_response_time_ms >= 0.0);

ALTER TABLE selector_performance ADD CONSTRAINT chk_avg_content_quality 
    CHECK (avg_content_quality >= 0.0 AND avg_content_quality <= 1.0);

ALTER TABLE ml_insights ADD CONSTRAINT chk_insight_confidence_score 
    CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0);

ALTER TABLE ml_insights ADD CONSTRAINT chk_insight_priority 
    CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Add updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_ml_training_data_updated_at 
    BEFORE UPDATE ON ml_training_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_model_metrics_updated_at 
    BEFORE UPDATE ON ml_model_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pattern_analysis_updated_at 
    BEFORE UPDATE ON pattern_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_selector_performance_updated_at 
    BEFORE UPDATE ON selector_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_insights_updated_at 
    BEFORE UPDATE ON ml_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial ML insights for demonstration
INSERT INTO ml_insights (insight_type, title, description, confidence_score, priority, actionable, metadata) VALUES
('performance', 'Selector Optimization Available', 'Several websites in your collection could benefit from optimized selectors to improve extraction accuracy.', 0.85, 'medium', true, '{"affected_websites": 5, "potential_improvement": "15-25%"}'),
('pattern', 'Similar Website Patterns Detected', 'We found similar DOM patterns across multiple websites that could be leveraged for better extraction strategies.', 0.92, 'high', true, '{"pattern_count": 3, "websites_affected": 12}'),
('efficiency', 'Rate Limiting Optimization', 'Your current scraping rate could be optimized based on website response patterns to improve overall efficiency.', 0.78, 'medium', true, '{"current_rate": "2 req/sec", "recommended_rate": "3.5 req/sec"}');

-- Add comments for documentation
COMMENT ON TABLE ml_training_data IS 'Stores training data for ML models from scraping sessions';
COMMENT ON TABLE ml_model_metrics IS 'Tracks performance metrics for different ML models';
COMMENT ON TABLE pattern_analysis IS 'Stores website pattern analysis results for optimization';
COMMENT ON TABLE selector_performance IS 'Tracks performance of CSS selectors across different websites';
COMMENT ON TABLE ml_insights IS 'Stores ML-generated insights and recommendations for users';

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ml_training_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ml_model_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pattern_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON selector_performance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ml_insights TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE ml_training_data_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ml_model_metrics_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE pattern_analysis_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE selector_performance_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ml_insights_id_seq TO authenticated;

-- Grant read-only access to anonymous users for insights (if needed)
GRANT SELECT ON ml_insights TO anon;