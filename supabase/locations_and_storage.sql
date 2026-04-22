-- ============================================================
-- 1. LOCATIONS TABLE (multi-branch support)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  address    TEXT,
  phone      TEXT,
  is_active  BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_select" ON locations;
DROP POLICY IF EXISTS "locations_insert" ON locations;
DROP POLICY IF EXISTS "locations_update" ON locations;
DROP POLICY IF EXISTS "locations_delete" ON locations;

CREATE POLICY "locations_select" ON locations FOR SELECT
  USING (business_id IN (SELECT get_my_business_ids()));

CREATE POLICY "locations_insert" ON locations FOR INSERT
  WITH CHECK (business_id IN (SELECT get_my_business_ids()));

CREATE POLICY "locations_update" ON locations FOR UPDATE
  USING (business_id IN (SELECT get_my_business_ids()));

CREATE POLICY "locations_delete" ON locations FOR DELETE
  USING (business_id IN (SELECT get_my_business_ids()));

-- ============================================================
-- 2. ADD location_id TO products AND business_members
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- ============================================================
-- 3. STORAGE BUCKET (product-images) + POLICIES
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old storage policies to avoid duplicates
DROP POLICY IF EXISTS "Anyone can view product images"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
