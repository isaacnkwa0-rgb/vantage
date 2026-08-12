-- Credit Notes

CREATE TABLE IF NOT EXISTS credit_notes (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  customer_id     UUID        REFERENCES customers ON DELETE SET NULL,
  invoice_id      UUID        REFERENCES invoices ON DELETE SET NULL,
  cn_number       TEXT        NOT NULL,
  reason          TEXT        NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','applied','voided')),
  notes           TEXT,
  created_by      UUID        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cn_select" ON credit_notes FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "cn_insert" ON credit_notes FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "cn_update" ON credit_notes FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "cn_delete" ON credit_notes FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
