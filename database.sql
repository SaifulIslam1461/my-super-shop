-- 1. Create Extended Tables
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    address TEXT,
    total_orders INT DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Purchase, Courier, Marketing, Packaging, Others
    amount NUMERIC NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Categories
INSERT INTO categories (name, slug) VALUES 
('Short Wallet', 'short-wallet'),
('Long Wallet', 'long-wallet'),
('Card Holder', 'card-holder'),
('Shoes', 'shoes'),
('Accessories', 'accessories')
ON CONFLICT (slug) DO NOTHING;

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin full access categories" ON categories USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access customers" ON customers USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access expenses" ON expenses USING (auth.role() = 'authenticated');
