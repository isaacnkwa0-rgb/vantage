-- 1. Add payment_method column to store_orders
ALTER TABLE store_orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'paystack';

-- 2. Allow the storefront (unauthenticated) to read only the primary active
--    bank account for a given business so checkout can display transfer details.
CREATE POLICY "bank_accounts_select_public_storefront" ON bank_accounts
  FOR SELECT USING (
    is_active = true
    AND is_primary = true
    AND business_id IN (SELECT id FROM businesses WHERE is_active = true)
  );
