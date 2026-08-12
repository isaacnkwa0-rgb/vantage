-- Referral Program

CREATE TABLE IF NOT EXISTS referral_programs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name            TEXT        NOT NULL DEFAULT 'Referral Program',
  reward_type     TEXT        NOT NULL DEFAULT 'discount' CHECK (reward_type IN ('discount', 'credit', 'gift_card')),
  reward_value    NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id)
);

CREATE TABLE IF NOT EXISTS referrals (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  referrer_id     UUID        REFERENCES customers ON DELETE CASCADE NOT NULL,
  referred_id     UUID        REFERENCES customers ON DELETE SET NULL,
  referral_code   TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','converted','rewarded')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  converted_at    TIMESTAMPTZ,
  UNIQUE(business_id, referral_code)
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES customers ON DELETE SET NULL;

ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rp_select" ON referral_programs FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "rp_all" ON referral_programs FOR ALL
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

CREATE POLICY "ref_select" ON referrals FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "ref_insert" ON referrals FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "ref_update" ON referrals FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
