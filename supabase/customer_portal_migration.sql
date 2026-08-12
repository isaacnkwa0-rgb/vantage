-- Customer Portal

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS customer_portal_otps (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID        REFERENCES customers ON DELETE CASCADE NOT NULL,
  email       TEXT        NOT NULL,
  otp         TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_portal_otps ENABLE ROW LEVEL SECURITY;
-- Public insert (so the OTP request API can insert without auth)
CREATE POLICY "otp_insert" ON customer_portal_otps FOR INSERT WITH CHECK (true);
CREATE POLICY "otp_select" ON customer_portal_otps FOR SELECT USING (true);
CREATE POLICY "otp_update" ON customer_portal_otps FOR UPDATE USING (true);
