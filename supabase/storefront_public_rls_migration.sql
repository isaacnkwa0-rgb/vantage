-- Allow unauthenticated (public) users to read active businesses for the storefront.
-- Without this, the store page 404s for anyone not logged in.
CREATE POLICY "businesses_select_public_store" ON businesses
  FOR SELECT USING (is_active = true);

-- Allow public users to read active products belonging to active businesses.
CREATE POLICY "products_select_public_store" ON products
  FOR SELECT USING (
    is_active = true
    AND business_id IN (SELECT id FROM businesses WHERE is_active = true)
  );

-- Allow public users to read categories belonging to active businesses.
CREATE POLICY "categories_select_public_store" ON categories
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE is_active = true)
  );
