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
