-- Recurring / Subscription Billing

CREATE TABLE IF NOT EXISTS recurring_invoices (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  customer_id     UUID        REFERENCES customers ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  description     TEXT,
  amount          NUMERIC(12,2) NOT NULL,
  frequency       TEXT        NOT NULL CHECK (frequency IN ('weekly','monthly','quarterly','yearly')),
  next_issue_date DATE        NOT NULL,
  last_issued_at  TIMESTAMPTZ,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  auto_send       BOOLEAN     NOT NULL DEFAULT false,
  created_by      UUID        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ri_select" ON recurring_invoices FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "ri_insert" ON recurring_invoices FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "ri_update" ON recurring_invoices FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "ri_delete" ON recurring_invoices FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
