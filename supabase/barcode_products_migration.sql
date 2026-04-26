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
