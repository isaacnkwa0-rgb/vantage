-- Multi-currency support on sales

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS transaction_currency TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,6) DEFAULT 1;

-- Exchange rate cache
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (base_currency, target_currency)
);
