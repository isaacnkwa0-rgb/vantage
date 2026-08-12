-- Store shipping settings

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS store_shipping_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS store_shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS store_free_shipping_above NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS store_delivery_note TEXT;
