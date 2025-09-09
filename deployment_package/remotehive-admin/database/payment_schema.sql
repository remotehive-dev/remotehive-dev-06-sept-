-- Payment Management System Database Schema

-- Payment Plans Table
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  billing_period VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', 'one-time'
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Gateway Configurations Table
CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'razorpay', 'stripe', 'payu', 'cashfree'
  display_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_test_mode BOOLEAN DEFAULT true,
  configuration JSONB NOT NULL, -- Store encrypted API keys and settings
  supported_methods JSONB, -- ['card', 'upi', 'netbanking', 'wallet']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id VARCHAR(255),
  gateway_transaction_id VARCHAR(255),
  gateway_name VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
  payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking', 'wallet'
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  plan_id UUID REFERENCES payment_plans(id),
  plan_name VARCHAR(100),
  billing_address JSONB,
  gateway_response JSONB, -- Store full gateway response
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  refund_id VARCHAR(255), -- Gateway refund ID
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  reason TEXT,
  gateway_response JSONB,
  processed_by UUID, -- Admin user ID
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Analytics Table (for caching analytics data)
CREATE TABLE IF NOT EXISTS payment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_transactions INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  successful_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  refunded_transactions INTEGER DEFAULT 0,
  gateway_breakdown JSONB, -- Breakdown by gateway
  plan_breakdown JSONB, -- Breakdown by plan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Fraud Detection Logs Table
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  risk_score INTEGER NOT NULL, -- 0-100
  risk_factors JSONB, -- Array of detected risk factors
  action_taken VARCHAR(50), -- 'allowed', 'blocked', 'manual_review'
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhooks Log Table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  payload JSONB NOT NULL,
  signature VARCHAR(255),
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_customer_email ON transactions(customer_email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway ON transactions(gateway_name);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent ON transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_refunds_transaction_id ON refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_transaction_id ON fraud_detection_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_gateway ON webhook_logs(gateway_name);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_date ON payment_analytics(date);

-- Insert default payment plans
INSERT INTO payment_plans (name, description, price, billing_period, features) VALUES
('Free', 'Perfect for job seekers getting started', 0.00, 'one-time', '["Browse unlimited jobs", "Apply to 5 jobs per month", "Basic profile creation", "Email notifications", "Mobile app access"]'),
('Pro', 'For serious job seekers who want more opportunities', 299.00, 'monthly', '["Everything in Free", "Unlimited job applications", "Advanced search filters", "Profile analytics & insights", "Resume builder with templates", "Priority customer support", "Application tracking", "Salary insights", "Interview preparation resources", "Profile visibility boost"]'),
('Business', 'For small to medium companies hiring remote talent', 2999.00, 'monthly', '["Post up to 10 jobs per month", "Access to candidate database", "Basic applicant tracking", "Company profile page", "Email support", "Job posting templates", "Basic analytics"]'),
('Enterprise', 'For large organizations with extensive hiring needs', 9999.00, 'monthly', '["Everything in Business", "Unlimited job postings", "Advanced applicant tracking system", "Candidate screening & assessment tools", "Custom integrations (ATS, HRIS)", "Dedicated account manager", "Priority support (24/7)", "Advanced analytics & reporting", "White-label solutions", "Custom onboarding & training"]')
ON CONFLICT DO NOTHING;

-- Insert default gateway configurations (with placeholder values)
INSERT INTO payment_gateways (name, display_name, is_active, configuration, supported_methods) VALUES
('razorpay', 'Razorpay', false, '{"key_id": "", "key_secret": "", "webhook_secret": ""}', '["card", "upi", "netbanking", "wallet"]'),
('stripe', 'Stripe', false, '{"publishable_key": "", "secret_key": "", "webhook_secret": ""}', '["card"]'),
('payu', 'PayU', false, '{"merchant_key": "", "merchant_salt": ""}', '["card", "upi", "netbanking", "wallet"]'),
('cashfree', 'Cashfree', false, '{"app_id": "", "secret_key": ""}', '["card", "upi", "netbanking", "wallet"]')
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON payment_gateways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_analytics_updated_at BEFORE UPDATE ON payment_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();