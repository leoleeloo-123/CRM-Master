-- Supabase customers table schema for CRM Master
-- Run this in Supabase SQL Editor

-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT DEFAULT '',
    rank INTEGER DEFAULT 3,
    status TEXT DEFAULT 'Active',
    product_summary TEXT DEFAULT '',
    last_status_update TEXT DEFAULT '',
    follow_up_status TEXT DEFAULT 'No Action',
    contacts TEXT DEFAULT '[]',
    next_action_date TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    interactions TEXT DEFAULT '[]',
    doc_links TEXT DEFAULT '[]',
    upcoming_plan TEXT DEFAULT '',
    mailing_info TEXT DEFAULT '{}',
    last_customer_reply_date TEXT DEFAULT '',
    last_my_reply_date TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations" ON customers
    FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
