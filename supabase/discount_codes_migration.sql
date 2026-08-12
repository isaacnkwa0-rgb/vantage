-- =============================================
-- Promo / Discount Codes
-- Run this in your Supabase SQL editor
-- =============================================

-- 1. Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code             TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  discount_type    TEXT        NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  discount_value   NUMERIC(12, 2) NOT NULL,
  min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_uses         INTEGER,       -- NULL = unlimited
  uses_count       INTEGER     NOT NULL DEFAULT 0,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  expires_at       TIMESTAMPTZ,   -- NULL = never expires
  created_by       UUID        REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, code)
);

-- 2. Track which promo code was used on each sale
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL;

-- 3. Atomically increment uses_count to avoid race conditions
CREATE OR REPLACE FUNCTION increment_promo_uses(p_code_id UUID)
RETURNS void AS $$
  UPDATE discount_codes
  SET uses_count = uses_count + 1,
      updated_at = NOW()
  WHERE id = p_code_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Row Level Security
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- All members can read codes (needed for POS validation)
CREATE POLICY "discount_codes_select" ON discount_codes FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid() AND is_active = TRUE
  ));

-- Only owner/manager can create, edit, delete
CREATE POLICY "discount_codes_insert" ON discount_codes FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE
  ));

CREATE POLICY "discount_codes_update" ON discount_codes FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE
  ));

CREATE POLICY "discount_codes_delete" ON discount_codes FOR DELETE
  USING (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE
  ));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_business ON discount_codes (business_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_lookup  ON discount_codes (business_id, code);
