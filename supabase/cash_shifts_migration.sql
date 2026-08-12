-- Cash Drawer / Shift Management

CREATE TABLE IF NOT EXISTS cash_shifts (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID          REFERENCES businesses ON DELETE CASCADE NOT NULL,
  opened_by     UUID          NOT NULL,
  closed_by     UUID,
  opening_float NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_float NUMERIC(12,2),
  cash_sales    NUMERIC(12,2),
  expected_cash NUMERIC(12,2),
  discrepancy   NUMERIC(12,2),
  notes         TEXT,
  opened_at     TIMESTAMPTZ   DEFAULT NOW(),
  closed_at     TIMESTAMPTZ,
  status        TEXT          NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_select" ON cash_shifts FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "shifts_insert" ON cash_shifts FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "shifts_update" ON cash_shifts FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
