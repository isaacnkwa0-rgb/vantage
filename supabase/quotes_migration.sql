-- Quotations / Estimates

CREATE TABLE IF NOT EXISTS quotes (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id          UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  quote_number         TEXT        NOT NULL,
  customer_id          UUID        REFERENCES customers ON DELETE SET NULL,
  client_name          TEXT,
  client_email         TEXT,
  client_address       TEXT,
  issue_date           DATE        NOT NULL DEFAULT CURRENT_DATE,
  valid_until          DATE,
  status               TEXT        NOT NULL DEFAULT 'draft',
  subtotal             NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes                TEXT,
  terms                TEXT,
  converted_invoice_id UUID        REFERENCES invoices ON DELETE SET NULL,
  created_by           UUID        REFERENCES auth.users ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, quote_number)
);

CREATE TABLE IF NOT EXISTS quote_items (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id    UUID        REFERENCES quotes ON DELETE CASCADE NOT NULL,
  description TEXT        NOT NULL,
  quantity    NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total  NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_quotes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_quotes_updated_at ON quotes;
CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION touch_quotes_updated_at();

-- Sequential quote number per business
CREATE OR REPLACE FUNCTION generate_quote_number(p_business_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM quotes WHERE business_id = p_business_id;
  RETURN 'QTE-' || LPAD(v_count::TEXT, 4, '0');
END;
$$;

-- RLS
ALTER TABLE quotes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_select" ON quotes FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "quotes_insert" ON quotes FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "quotes_update" ON quotes FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "quotes_delete" ON quotes FOR DELETE
  USING (business_id IN (
    SELECT business_id FROM business_members
    WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')
  ));

CREATE POLICY "quote_items_select" ON quote_items FOR SELECT
  USING (quote_id IN (SELECT id FROM quotes));

CREATE POLICY "quote_items_insert" ON quote_items FOR INSERT
  WITH CHECK (quote_id IN (SELECT id FROM quotes));

CREATE POLICY "quote_items_delete" ON quote_items FOR DELETE
  USING (quote_id IN (SELECT id FROM quotes));
