-- Store visits: one row per unique IP per business per day
CREATE TABLE IF NOT EXISTS store_visits (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  ip_address  text NOT NULL,
  visit_date  date NOT NULL DEFAULT CURRENT_DATE,
  visited_at  timestamptz NOT NULL DEFAULT now()
);

-- Deduplicate: same IP visiting same business on the same day = 1 row
CREATE UNIQUE INDEX IF NOT EXISTS store_visits_daily_unique
  ON store_visits (business_id, ip_address, visit_date);

-- Fast range queries for the dashboard
CREATE INDEX IF NOT EXISTS store_visits_business_period
  ON store_visits (business_id, visited_at DESC);

-- RLS: business owners can read their own visits; inserts go through service role
ALTER TABLE store_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can read own store visits"
  ON store_visits FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
