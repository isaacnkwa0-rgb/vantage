-- Online Store Orders

CREATE TABLE IF NOT EXISTS store_orders (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  order_number    TEXT        NOT NULL,
  customer_name   TEXT        NOT NULL,
  customer_email  TEXT        NOT NULL,
  customer_phone  TEXT,
  shipping_address TEXT,
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_fee    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled')),
  payment_ref     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_order_items (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    UUID        REFERENCES store_orders ON DELETE CASCADE NOT NULL,
  product_id  UUID        REFERENCES products ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  price       NUMERIC(12,2) NOT NULL,
  quantity    INTEGER     NOT NULL DEFAULT 1,
  total       NUMERIC(12,2) GENERATED ALWAYS AS (price * quantity) STORED
);

ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public checkout)
CREATE POLICY "so_insert" ON store_orders FOR INSERT WITH CHECK (true);
-- Only business members can select/update
CREATE POLICY "so_select" ON store_orders FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "so_update" ON store_orders FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

CREATE POLICY "soi_insert" ON store_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "soi_select" ON store_order_items FOR SELECT
  USING (order_id IN (SELECT id FROM store_orders WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
-- Store shipping settings

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS store_shipping_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS store_shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS store_free_shipping_above NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS store_delivery_note TEXT;
-- Facebook Pixel and Google Analytics columns

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS fb_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT;
-- Multi-currency support on sales

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS transaction_currency TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,6) DEFAULT 1;

-- Exchange rate cache
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (base_currency, target_currency)
);
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
-- Shared crowd-sourced barcode product database
-- Every product added with a barcode contributes to this global pool

CREATE TABLE IF NOT EXISTS barcode_products (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode     TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL,
  brand       TEXT,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone (including anonymous) to read
ALTER TABLE barcode_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barcode_products_public_read"
  ON barcode_products FOR SELECT
  USING (true);

-- Allow any authenticated user to insert
CREATE POLICY "barcode_products_auth_insert"
  ON barcode_products FOR INSERT
  WITH CHECK (true);

-- Allow updates (to enrich existing entries)
CREATE POLICY "barcode_products_auth_update"
  ON barcode_products FOR UPDATE
  USING (true);

-- Index for fast barcode lookups
CREATE INDEX IF NOT EXISTS idx_barcode_products_barcode ON barcode_products (barcode);


            -- In-app notifications

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  user_id     UUID,
  type        TEXT        NOT NULL DEFAULT 'info',
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  href        TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select" ON notifications FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "notif_insert" ON notifications FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "notif_update" ON notifications FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "notif_delete" ON notifications FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));

CREATE INDEX IF NOT EXISTS idx_notifications_business ON notifications (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (business_id, read_at) WHERE read_at IS NULL;
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
-- Staff Payroll

CREATE TABLE IF NOT EXISTS staff (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name          TEXT        NOT NULL,
  role          TEXT,
  email         TEXT,
  phone         TEXT,
  salary_type   TEXT        NOT NULL DEFAULT 'monthly' CHECK (salary_type IN ('monthly','weekly','daily','hourly')),
  salary_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  bank_name     TEXT,
  account_number TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  joined_at     DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  period_label  TEXT        NOT NULL,
  period_start  DATE        NOT NULL,
  period_end    DATE        NOT NULL,
  total_gross   NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_net     NUMERIC(14,2) NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid')),
  notes         TEXT,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id        UUID        REFERENCES payroll_runs ON DELETE CASCADE NOT NULL,
  staff_id      UUID        REFERENCES staff ON DELETE SET NULL,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  staff_name    TEXT        NOT NULL,
  gross_pay     NUMERIC(14,2) NOT NULL DEFAULT 0,
  deductions    NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_pay       NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_at       TIMESTAMPTZ,
  notes         TEXT
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;

-- Staff policies
CREATE POLICY "staff_select" ON staff FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "staff_insert" ON staff FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "staff_update" ON staff FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "staff_delete" ON staff FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

-- Payroll run policies
CREATE POLICY "pr_select" ON payroll_runs FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "pr_insert" ON payroll_runs FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pr_update" ON payroll_runs FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pr_delete" ON payroll_runs FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

-- Payroll entry policies
CREATE POLICY "pe_select" ON payroll_entries FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "pe_insert" ON payroll_entries FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pe_update" ON payroll_entries FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pe_delete" ON payroll_entries FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
