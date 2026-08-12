-- Gift Cards

CREATE TABLE IF NOT EXISTS gift_cards (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  code            TEXT        NOT NULL,
  initial_value   NUMERIC(12,2) NOT NULL,
  balance         NUMERIC(12,2) NOT NULL,
  customer_id     UUID        REFERENCES customers ON DELETE SET NULL,
  customer_email  TEXT,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','voided')),
  expires_at      DATE,
  created_by      UUID        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, code)
);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id     UUID        REFERENCES gift_cards ON DELETE CASCADE NOT NULL,
  sale_id     UUID        REFERENCES sales ON DELETE SET NULL,
  amount      NUMERIC(12,2) NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('redemption', 'refund')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gc_select" ON gift_cards FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "gc_insert" ON gift_cards FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "gc_update" ON gift_cards FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "gc_delete" ON gift_cards FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

CREATE POLICY "gct_select" ON gift_card_transactions FOR SELECT
  USING (card_id IN (SELECT id FROM gift_cards WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "gct_insert" ON gift_card_transactions FOR INSERT
  WITH CHECK (card_id IN (SELECT id FROM gift_cards WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
