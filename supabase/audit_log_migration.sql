-- Audit Log / Activity History

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  user_id     UUID        NOT NULL,
  action      TEXT        NOT NULL,  -- e.g. 'sale.created', 'product.updated', 'customer.deleted'
  entity_type TEXT        NOT NULL,  -- 'sale', 'product', 'customer', 'invoice', etc.
  entity_id   TEXT,                  -- UUID of the affected record (nullable for bulk ops)
  entity_name TEXT,                  -- Human-readable label (product name, customer name, etc.)
  meta        JSONB,                 -- Extra context (amount, changes, etc.)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_business_created ON audit_logs (business_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select" ON audit_logs FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
