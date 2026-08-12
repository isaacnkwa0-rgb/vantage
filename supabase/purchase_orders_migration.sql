-- Purchase Orders

CREATE TABLE IF NOT EXISTS purchase_orders (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  supplier_id UUID        REFERENCES suppliers ON DELETE SET NULL,
  po_number   TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','received','cancelled')),
  notes       TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_date DATE,
  received_date DATE,
  created_by  UUID        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id       UUID        REFERENCES purchase_orders ON DELETE CASCADE NOT NULL,
  product_id  UUID        REFERENCES products ON DELETE SET NULL,
  description TEXT        NOT NULL,
  quantity    NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_cost   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost  NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_select" ON purchase_orders FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "po_insert" ON purchase_orders FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "po_update" ON purchase_orders FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "po_delete" ON purchase_orders FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

CREATE POLICY "poi_select" ON purchase_order_items FOR SELECT
  USING (po_id IN (SELECT id FROM purchase_orders WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "poi_insert" ON purchase_order_items FOR INSERT
  WITH CHECK (po_id IN (SELECT id FROM purchase_orders WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "poi_update" ON purchase_order_items FOR UPDATE
  USING (po_id IN (SELECT id FROM purchase_orders WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "poi_delete" ON purchase_order_items FOR DELETE
  USING (po_id IN (SELECT id FROM purchase_orders WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true)));
