-- =============================================
-- Returns & Refunds
-- Run this in your Supabase SQL editor
-- =============================================

-- 1. Returns table
CREATE TABLE IF NOT EXISTS returns (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  original_sale_id  UUID        NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  return_number     TEXT        NOT NULL,
  refund_method     TEXT        NOT NULL DEFAULT 'cash',
  refund_amount     NUMERIC(12, 2) NOT NULL,
  reason            TEXT        NOT NULL,
  notes             TEXT,
  processed_by      UUID        REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, return_number)
);

-- 2. Return items table
CREATE TABLE IF NOT EXISTS return_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id     UUID        NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  business_id   UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id    UUID        REFERENCES products(id) ON DELETE SET NULL,
  variant_id    UUID        REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name  TEXT        NOT NULL,
  variant_name  TEXT,
  quantity      INTEGER     NOT NULL,
  unit_price    NUMERIC(12, 2) NOT NULL,
  line_total    NUMERIC(12, 2) NOT NULL
);

-- 3. Generate return number (RTN-0001, RTN-0002, ...)
CREATE OR REPLACE FUNCTION generate_return_number(p_business_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM returns WHERE business_id = p_business_id;
  RETURN 'RTN-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Restock inventory when return items are inserted
CREATE OR REPLACE FUNCTION restock_on_return()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE id = NEW.variant_id;
  ELSIF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET stock_quantity = stock_quantity + NEW.quantity,
        updated_at     = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_restock_on_return ON return_items;
CREATE TRIGGER trigger_restock_on_return
  AFTER INSERT ON return_items
  FOR EACH ROW EXECUTE FUNCTION restock_on_return();

-- 5. Update customer stats on return:
--    - Subtract refund from total_spent
--    - If store_credit, add to customer credit_balance
CREATE OR REPLACE FUNCTION update_customer_on_return()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT customer_id INTO v_customer_id
  FROM sales WHERE id = NEW.original_sale_id;

  IF v_customer_id IS NOT NULL THEN
    IF NEW.refund_method = 'store_credit' THEN
      UPDATE customers
      SET total_spent    = GREATEST(0, total_spent - NEW.refund_amount),
          credit_balance = credit_balance + NEW.refund_amount,
          updated_at     = NOW()
      WHERE id = v_customer_id;
    ELSE
      UPDATE customers
      SET total_spent = GREATEST(0, total_spent - NEW.refund_amount),
          updated_at  = NOW()
      WHERE id = v_customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_customer_on_return ON returns;
CREATE TRIGGER trigger_update_customer_on_return
  AFTER INSERT ON returns
  FOR EACH ROW EXECUTE FUNCTION update_customer_on_return();

-- 6. Row Level Security
ALTER TABLE returns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Returns: all members can read; owner/manager/cashier can insert
CREATE POLICY "returns_select" ON returns FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid() AND is_active = TRUE
  ));

CREATE POLICY "returns_insert" ON returns FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager', 'cashier')
      AND is_active = TRUE
  ));

-- Return items: same rules
CREATE POLICY "return_items_select" ON return_items FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid() AND is_active = TRUE
  ));

CREATE POLICY "return_items_insert" ON return_items FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager', 'cashier')
      AND is_active = TRUE
  ));

-- 7. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_returns_business_id       ON returns (business_id);
CREATE INDEX IF NOT EXISTS idx_returns_original_sale_id  ON returns (original_sale_id);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id    ON return_items (return_id);
