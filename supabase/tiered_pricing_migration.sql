-- Wholesale / Tiered Pricing

CREATE TABLE IF NOT EXISTS price_tiers (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  discount_type TEXT       NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(12,2),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_price_tiers (
  customer_id UUID        REFERENCES customers ON DELETE CASCADE NOT NULL,
  tier_id     UUID        REFERENCES price_tiers ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (customer_id, tier_id)
);

ALTER TABLE price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pt_select" ON price_tiers FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "pt_insert" ON price_tiers FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pt_update" ON price_tiers FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pt_delete" ON price_tiers FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

CREATE POLICY "cpt_select" ON customer_price_tiers FOR SELECT
  USING (tier_id IN (SELECT id FROM price_tiers WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "cpt_insert" ON customer_price_tiers FOR INSERT
  WITH CHECK (tier_id IN (SELECT id FROM price_tiers WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "cpt_delete" ON customer_price_tiers FOR DELETE
  USING (tier_id IN (SELECT id FROM price_tiers WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
