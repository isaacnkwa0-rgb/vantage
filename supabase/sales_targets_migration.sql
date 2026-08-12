-- Sales Targets / Goals

CREATE TABLE IF NOT EXISTS sales_targets (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  period      TEXT        NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'custom')),
  target_type TEXT        NOT NULL DEFAULT 'revenue' CHECK (target_type IN ('revenue', 'units', 'transactions')),
  target_value NUMERIC(12,2) NOT NULL,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_by  UUID        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "targets_select" ON sales_targets FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "targets_insert" ON sales_targets FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "targets_update" ON sales_targets FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "targets_delete" ON sales_targets FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
