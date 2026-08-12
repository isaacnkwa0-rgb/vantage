-- Minimum Order Quantity (MoQ) and Maximum Order Quantity (MaxOQ) per product/variant
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS min_order_qty INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_order_qty INTEGER;

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS min_order_qty INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_order_qty INTEGER;

-- Ensure MoQ is at least 1
ALTER TABLE products      ADD CONSTRAINT chk_products_min_order_qty      CHECK (min_order_qty >= 1);
ALTER TABLE product_variants ADD CONSTRAINT chk_variants_min_order_qty   CHECK (min_order_qty >= 1);
-- MaxOQ must be >= MoQ when set
ALTER TABLE products      ADD CONSTRAINT chk_products_max_order_qty      CHECK (max_order_qty IS NULL OR max_order_qty >= min_order_qty);
ALTER TABLE product_variants ADD CONSTRAINT chk_variants_max_order_qty   CHECK (max_order_qty IS NULL OR max_order_qty >= min_order_qty);
