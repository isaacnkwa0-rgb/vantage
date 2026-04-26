-- =============================================
-- Run this in your Supabase SQL editor
-- =============================================

-- 1. Add loyalty points balance to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- 2. Add loyalty settings to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS loyalty_points_per_dollar INTEGER DEFAULT 1;
-- points_per_dollar: how many points earned per 1 unit of currency spent
-- e.g. 1 means 1 point per $1 spent

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS loyalty_redemption_rate INTEGER DEFAULT 100;
-- redemption_rate: how many points equals 1 unit of currency off
-- e.g. 100 means 100 points = $1 discount
