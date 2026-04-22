-- VANTAGE Database Schema
-- Run this in Supabase SQL Editor to set up the complete database

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  avatar_url    TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  description             TEXT,
  logo_url                TEXT,
  email                   TEXT,
  phone                   TEXT,
  address                 TEXT,
  city                    TEXT,
  country                 TEXT NOT NULL DEFAULT 'NG',
  currency                TEXT NOT NULL DEFAULT 'NGN',
  timezone                TEXT NOT NULL DEFAULT 'Africa/Lagos',
  business_type           TEXT NOT NULL DEFAULT 'retail',
  subscription_tier       TEXT NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUSINESS_MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS business_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'cashier',
  is_active     BOOLEAN DEFAULT TRUE,
  invited_by    UUID REFERENCES profiles(id),
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- ============================================================
-- INVITATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'cashier',
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by    UUID NOT NULL REFERENCES profiles(id),
  accepted_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT DEFAULT '#6366f1',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  sku                 TEXT,
  barcode             TEXT,
  image_url           TEXT,
  cost_price          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price       NUMERIC(12, 2) NOT NULL,
  stock_quantity      INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  track_inventory     BOOLEAN DEFAULT TRUE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCT_VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  attributes      JSONB NOT NULL DEFAULT '{}',
  sku             TEXT,
  barcode         TEXT,
  cost_price      NUMERIC(12, 2),
  selling_price   NUMERIC(12, 2),
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  address           TEXT,
  notes             TEXT,
  credit_balance    NUMERIC(12, 2) DEFAULT 0,
  total_spent       NUMERIC(12, 2) DEFAULT 0,
  last_purchase_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id       UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_number       TEXT NOT NULL,
  subtotal          NUMERIC(12, 2) NOT NULL,
  discount_type     TEXT,
  discount_value    NUMERIC(12, 2) DEFAULT 0,
  discount_amount   NUMERIC(12, 2) DEFAULT 0,
  tax_amount        NUMERIC(12, 2) DEFAULT 0,
  total_amount      NUMERIC(12, 2) NOT NULL,
  amount_paid       NUMERIC(12, 2) NOT NULL,
  change_amount     NUMERIC(12, 2) DEFAULT 0,
  payment_method    TEXT NOT NULL DEFAULT 'cash',
  payment_reference TEXT,
  payment_status    TEXT NOT NULL DEFAULT 'paid',
  notes             TEXT,
  served_by         UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, sale_number)
);

-- ============================================================
-- SALE_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id    UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  variant_name  TEXT,
  sku           TEXT,
  quantity      INTEGER NOT NULL,
  unit_price    NUMERIC(12, 2) NOT NULL,
  cost_price    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  line_total    NUMERIC(12, 2) NOT NULL
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category      TEXT NOT NULL DEFAULT 'other',
  title         TEXT NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL,
  description   TEXT,
  receipt_url   TEXT,
  recorded_by   UUID REFERENCES profiles(id),
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STOCK_ADJUSTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id    UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  adjustment    INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  notes         TEXT,
  adjusted_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Helper: returns all business_ids the current user belongs to (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_business_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT business_id FROM business_members
  WHERE user_id = auth.uid() AND is_active = TRUE;
$$;

-- Helper: checks if current user is owner of a specific business
CREATE OR REPLACE FUNCTION is_business_owner(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = p_business_id
    AND user_id = auth.uid()
    AND role = 'owner'
    AND is_active = TRUE
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number(p_business_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM sales WHERE business_id = p_business_id;
  RETURN 'INV-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-deduct stock on sale item insert
CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
    WHERE id = NEW.variant_id;
  ELSIF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_deduct_stock ON sale_items;
CREATE TRIGGER trigger_deduct_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_sale();

-- Auto-update customer stats on sale
CREATE OR REPLACE FUNCTION update_customer_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_spent = total_spent + NEW.total_amount,
        last_purchase_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_customer ON sales;
CREATE TRIGGER trigger_update_customer
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION update_customer_on_sale();

-- P&L Report
CREATE OR REPLACE FUNCTION get_profit_loss_report(
  p_business_id UUID,
  p_start TEXT,
  p_end TEXT
)
RETURNS TABLE (
  gross_revenue    NUMERIC,
  cogs             NUMERIC,
  gross_profit     NUMERIC,
  total_expenses   NUMERIC,
  net_profit       NUMERIC,
  margin_percent   NUMERIC
) AS $$
DECLARE
  v_revenue    NUMERIC;
  v_cogs       NUMERIC;
  v_expenses   NUMERIC;
  v_gross      NUMERIC;
  v_net        NUMERIC;
  v_margin     NUMERIC;
BEGIN
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_revenue
  FROM sales
  WHERE business_id = p_business_id
    AND created_at >= p_start::TIMESTAMPTZ
    AND created_at <= p_end::TIMESTAMPTZ;

  SELECT COALESCE(SUM(si.cost_price * si.quantity), 0)
  INTO v_cogs
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  WHERE si.business_id = p_business_id
    AND s.created_at >= p_start::TIMESTAMPTZ
    AND s.created_at <= p_end::TIMESTAMPTZ;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_expenses
  FROM expenses
  WHERE business_id = p_business_id
    AND expense_date >= p_start::DATE
    AND expense_date <= p_end::DATE;

  v_gross  := v_revenue - v_cogs;
  v_net    := v_gross - v_expenses;
  v_margin := CASE WHEN v_revenue > 0 THEN (v_net / v_revenue) * 100 ELSE 0 END;

  RETURN QUERY SELECT v_revenue, v_cogs, v_gross, v_expenses, v_net, v_margin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Businesses: members can read
CREATE POLICY "businesses_select_member" ON businesses FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT get_my_business_ids())
  );
CREATE POLICY "businesses_insert_auth" ON businesses FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "businesses_update_owner_manager" ON businesses FOR UPDATE
  USING (id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));

-- Business members (use SECURITY DEFINER helpers to avoid infinite recursion)
CREATE POLICY "members_select" ON business_members FOR SELECT
  USING (business_id IN (SELECT get_my_business_ids()));
CREATE POLICY "members_insert_owner" ON business_members FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_business_owner(business_id));
CREATE POLICY "members_update_owner" ON business_members FOR UPDATE
  USING (is_business_owner(business_id));

-- Invitations
CREATE POLICY "invitations_select" ON invitations FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner') AND is_active = TRUE)
    OR email = (SELECT email FROM profiles WHERE id = auth.uid()));
CREATE POLICY "invitations_insert_owner" ON invitations FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role = 'owner' AND is_active = TRUE));
CREATE POLICY "invitations_update_all" ON invitations FOR UPDATE USING (TRUE);

-- Generic helper: is user a member of this business?
-- Applied to: categories, products, product_variants, customers, sales, sale_items, expenses, stock_adjustments

-- Categories
CREATE POLICY "categories_select" ON categories FOR SELECT USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE));
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));

-- Products
CREATE POLICY "products_select" ON products FOR SELECT USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE));
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));
CREATE POLICY "products_update" ON products FOR UPDATE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));
CREATE POLICY "products_delete" ON products FOR DELETE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role = 'owner' AND is_active = TRUE));

-- Product variants
CREATE POLICY "variants_select" ON product_variants FOR SELECT USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE));
CREATE POLICY "variants_insert" ON product_variants FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));
CREATE POLICY "variants_update" ON product_variants FOR UPDATE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));

-- Customers
CREATE POLICY "customers_select" ON customers FOR SELECT USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE));
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager','cashier') AND is_active = TRUE));
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager','cashier') AND is_active = TRUE));
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role = 'owner' AND is_active = TRUE));

-- Sales
CREATE POLICY "sales_select" ON sales FOR SELECT USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE));
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager','cashier') AND is_active = TRUE));
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));

-- Sale items
CREATE POLICY "sale_items_select" ON sale_items FOR SELECT USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE));
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager','cashier') AND is_active = TRUE));

-- Expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE));
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));

-- Stock adjustments
CREATE POLICY "adjustments_select" ON stock_adjustments FOR SELECT USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = TRUE));
CREATE POLICY "adjustments_insert" ON stock_adjustments FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = TRUE));

-- ============================================================
-- STORAGE BUCKET (run after creating bucket in Supabase dashboard)
-- ============================================================
-- Create a bucket named "product-images" in Supabase Storage > Buckets (set to Public)
-- Then run:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- Storage policy: authenticated users can upload to their business folder
CREATE POLICY "product_images_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "product_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "product_images_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
