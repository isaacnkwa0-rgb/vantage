-- Product Bundles

CREATE TABLE IF NOT EXISTS product_bundles (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL,
  image_url   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundle_items (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id   UUID    REFERENCES product_bundles ON DELETE CASCADE NOT NULL,
  product_id  UUID    REFERENCES products        ON DELETE CASCADE NOT NULL,
  variant_id  UUID    REFERENCES product_variants ON DELETE SET NULL,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1)
);

-- Link sold bundles back to their definition
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES product_bundles ON DELETE SET NULL;

-- Atomically deduct stock for all components of a bundle sale
CREATE OR REPLACE FUNCTION deduct_bundle_stock(p_bundle_id UUID, p_cart_qty INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Deduct from variants first
  UPDATE product_variants pv
  SET stock_quantity = GREATEST(0, pv.stock_quantity - (bi.quantity * p_cart_qty))
  FROM bundle_items bi
  WHERE bi.bundle_id = p_bundle_id
    AND bi.variant_id = pv.id;

  -- Deduct from base products (only where no variant is specified)
  UPDATE products p
  SET stock_quantity = GREATEST(0, p.stock_quantity - (bi.quantity * p_cart_qty)),
      updated_at = NOW()
  FROM bundle_items bi
  WHERE bi.bundle_id  = p_bundle_id
    AND bi.product_id = p.id
    AND bi.variant_id IS NULL;
END;
$$;

-- RLS
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bundles_select" ON product_bundles FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "bundles_insert" ON product_bundles FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "bundles_update" ON product_bundles FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "bundles_delete" ON product_bundles FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

CREATE POLICY "bundle_items_select" ON bundle_items FOR SELECT
  USING (bundle_id IN (SELECT id FROM product_bundles));
CREATE POLICY "bundle_items_insert" ON bundle_items FOR INSERT
  WITH CHECK (bundle_id IN (SELECT id FROM product_bundles));
CREATE POLICY "bundle_items_delete" ON bundle_items FOR DELETE
  USING (bundle_id IN (SELECT id FROM product_bundles));
