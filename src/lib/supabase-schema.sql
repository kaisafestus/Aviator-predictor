-- Supabase Schema for Aviator Signals
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  package_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  checkout_id TEXT NOT NULL UNIQUE,
  result_code TEXT,
  result_desc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_phone ON payments(phone);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON payments(checkout_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow inserts from API (service role)
CREATE POLICY "Allow service role insert" ON payments
  FOR INSERT WITH CHECK (true);

-- Allow updates from API (service role)
CREATE POLICY "Allow service role update" ON payments
  FOR UPDATE USING (true);

-- Allow users to view their own payments
CREATE POLICY "Allow users view own payments" ON payments
  FOR SELECT USING (auth.uid()::text = phone OR true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists (PostgreSQL doesn't support IF NOT EXISTS on CREATE TRIGGER)
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

