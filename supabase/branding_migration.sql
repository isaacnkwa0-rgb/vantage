-- Add receipt & invoice customization columns to businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS receipt_footer       TEXT,
  ADD COLUMN IF NOT EXISTS receipt_tagline      TEXT,
  ADD COLUMN IF NOT EXISTS receipt_show_logo    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS invoice_accent_color TEXT    NOT NULL DEFAULT '#16a34a',
  ADD COLUMN IF NOT EXISTS invoice_footer_notes TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram     TEXT,
  ADD COLUMN IF NOT EXISTS social_twitter       TEXT,
  ADD COLUMN IF NOT EXISTS social_whatsapp      TEXT;
