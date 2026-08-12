-- Bank Account Management

CREATE TABLE IF NOT EXISTS bank_accounts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  account_name  TEXT        NOT NULL,
  bank_name     TEXT        NOT NULL,
  account_number TEXT,
  account_type  TEXT        NOT NULL DEFAULT 'current' CHECK (account_type IN ('current','savings','merchant')),
  currency      TEXT        NOT NULL DEFAULT 'NGN',
  balance       NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_primary    BOOLEAN     NOT NULL DEFAULT false,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_transactions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id    UUID        REFERENCES bank_accounts ON DELETE CASCADE NOT NULL,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  type          TEXT        NOT NULL CHECK (type IN ('deposit','withdrawal','transfer')),
  amount        NUMERIC(14,2) NOT NULL,
  description   TEXT,
  reference     TEXT,
  date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ba_select" ON bank_accounts FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "ba_insert" ON bank_accounts FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "ba_update" ON bank_accounts FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "ba_delete" ON bank_accounts FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

CREATE POLICY "bt_select" ON bank_transactions FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "bt_insert" ON bank_transactions FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "bt_update" ON bank_transactions FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "bt_delete" ON bank_transactions FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
