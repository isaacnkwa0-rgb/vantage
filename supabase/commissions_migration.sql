-- Staff Commission Tracking

-- Commission config per staff member per business
CREATE TABLE IF NOT EXISTS commission_rules (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  user_id       UUID NOT NULL,
  type          TEXT NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'flat')),
  value         NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_rules_select" ON commission_rules FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "commission_rules_insert" ON commission_rules FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "commission_rules_update" ON commission_rules FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "commission_rules_delete" ON commission_rules FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
