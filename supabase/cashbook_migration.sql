-- Cashbook / Petty Cash

CREATE TABLE IF NOT EXISTS cashbook_entries (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC(12,2) NOT NULL,
  description TEXT        NOT NULL,
  category    TEXT,
  reference   TEXT,
  entry_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_by  UUID        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cashbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_select" ON cashbook_entries FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "cb_insert" ON cashbook_entries FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "cb_update" ON cashbook_entries FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "cb_delete" ON cashbook_entries FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
