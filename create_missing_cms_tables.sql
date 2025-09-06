-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    author VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT NOT NULL,
    company VARCHAR(100),
    position VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    featured BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
    content TEXT,
    script_code TEXT,
    image_url VARCHAR(500),
    link_url VARCHAR(500),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    budget DECIMAL(10,2),
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample reviews
INSERT INTO reviews (author, rating, title, content, company, position, status, featured, verified) VALUES
('Sarah Johnson', 5, 'Amazing Platform!', 'Found my dream remote job within a week. The platform is user-friendly and has great job opportunities.', 'Tech Corp', 'Software Developer', 'approved', true, true),
('Mike Chen', 4, 'Great Selection', 'Excellent selection of remote opportunities. Highly recommended for anyone looking for remote work.', 'Design Studio', 'UX Designer', 'approved', false, true),
('Emily Davis', 5, 'Life Changing', 'This platform changed my career. Now I work remotely for a top company and have perfect work-life balance.', 'Marketing Agency', 'Digital Marketer', 'pending', false, false);

-- Insert sample ads
INSERT INTO ads (name, type, position, status, content, budget, clicks, impressions, revenue) VALUES
('Google AdSense - Header', 'google_adsense', 'header', 'active', 'Google AdSense Header Ad', 500.00, 1250, 45000, 245.67),
('Meta Ads - Sidebar', 'meta_ads', 'sidebar', 'active', 'Meta Ads Sidebar Campaign', 300.00, 890, 32000, 189.34);