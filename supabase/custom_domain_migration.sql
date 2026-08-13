-- Custom domain support for storefront
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Index for fast lookup by custom domain in the middleware resolution route
CREATE INDEX IF NOT EXISTS idx_businesses_custom_domain
  ON businesses (custom_domain)
  WHERE custom_domain IS NOT NULL;
