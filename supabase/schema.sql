-- CRM Master Database Schema for Supabase

-- Enable Row Level Security
alter table if exists customers enable row level security;
alter table if exists samples enable row level security;
alter table if exists exhibitions enable row level security;
alter table if exists expenses enable row level security;
alter table if exists fx_rates enable row level security;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT[] DEFAULT '{}',
    country TEXT,
    tags TEXT[] DEFAULT '{}',
    rank INTEGER DEFAULT 3,
    status TEXT DEFAULT 'Active',
    product_summary TEXT,
    last_status_update DATE,
    follow_up_status TEXT DEFAULT 'No Action',
    upcoming_plan TEXT,
    next_action_date DATE,
    last_customer_reply_date DATE,
    last_my_reply_date DATE,
    last_contact_date DATE,
    contacts JSONB DEFAULT '[]',
    doc_links JSONB DEFAULT '[]',
    interactions JSONB DEFAULT '[]',
    mailing_info JSONB DEFAULT '{}',
    last_updated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Samples Table
CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    sample_index INTEGER DEFAULT 1,
    sample_name TEXT,
    sample_sku TEXT,
    status TEXT DEFAULT '等待中',
    test_status TEXT DEFAULT 'Ongoing',
    crystal_type TEXT,
    product_category TEXT[] DEFAULT '{}',
    product_form TEXT,
    original_size TEXT,
    processed_size TEXT,
    nickname TEXT,
    quantity TEXT,
    application TEXT,
    is_starred BOOLEAN DEFAULT FALSE,
    is_graded TEXT DEFAULT 'Graded',
    last_status_date DATE,
    status_details TEXT,
    tracking_number TEXT,
    upcoming_plan TEXT,
    next_action_date DATE,
    doc_links JSONB DEFAULT '[]',
    is_paid BOOLEAN DEFAULT FALSE,
    fee_category TEXT,
    fee_type TEXT,
    actual_unit_price TEXT,
    standard_unit_price TEXT,
    origination_date DATE,
    transaction_date DATE,
    fee_status TEXT,
    currency TEXT DEFAULT 'USD',
    balance TEXT,
    fee_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exhibitions Table
CREATE TABLE IF NOT EXISTS exhibitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE,
    location TEXT,
    link TEXT,
    event_series TEXT[] DEFAULT '{}',
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT,
    detail TEXT,
    exp_inc TEXT,
    party TEXT,
    name TEXT,
    origination_date DATE,
    transaction_date DATE,
    status TEXT,
    currency TEXT DEFAULT 'USD',
    balance TEXT,
    comment TEXT,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FX Rates Table
CREATE TABLE IF NOT EXISTS fx_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency TEXT UNIQUE NOT NULL,
    rate_to_usd DECIMAL(10, 6) DEFAULT 1.0,
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Products Table (auto-generated from samples)
CREATE TABLE IF NOT EXISTS master_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    crystal_type TEXT,
    product_category TEXT[] DEFAULT '{}',
    product_form TEXT,
    original_size TEXT,
    processed_size TEXT,
    nickname TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tag Options Table (for customizable dropdowns)
CREATE TABLE IF NOT EXISTS tag_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    options TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tag options
INSERT INTO tag_options (category, options) VALUES
    ('sample_status', ARRAY['等待中', '样品制作中', '样品已发出', '客户初步测试', '客户初步结果']),
    ('crystal_type', ARRAY['单晶', '多晶']),
    ('product_category', ARRAY['团聚', '纳米金刚石', '球形金刚石', '金刚石球', '微米粉', 'CVD']),
    ('product_form', ARRAY['微粉', '悬浮液']),
    ('event_series', ARRAY['Semicon', 'Optical Expo', 'Industrial Fair']),
    ('interaction_types', ARRAY['无', '对方邮件', '我方邮件', '双方邮件', '展会相见', '视频会议', '线下会面']),
    ('interaction_effects', ARRAY['无', '对方回复', '我方跟进', '对方回复及我方跟进']),
    ('fee_status', ARRAY['等待中', '待付款', '已付款']),
    ('expense_category', ARRAY['差旅费用', '展会摊位', '样品运输', '材料采购', '日常运营', '研发投入', '其他支出'])
ON CONFLICT DO NOTHING;

-- Insert default FX rates
INSERT INTO fx_rates (currency, rate_to_usd) VALUES
    ('USD', 1.0),
    ('CNY', 0.138),
    ('EUR', 1.085),
    ('HKD', 0.128),
    ('JPY', 0.0064)
ON CONFLICT (currency) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_samples_updated_at BEFORE UPDATE ON samples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exhibitions_updated_at BEFORE UPDATE ON exhibitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fx_rates_updated_at BEFORE UPDATE ON fx_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for all tables
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table samples;
alter publication supabase_realtime add table exhibitions;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table fx_rates;
