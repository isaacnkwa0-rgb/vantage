-- Campaigns: Bulk Email, SMS, WhatsApp

CREATE TABLE IF NOT EXISTS campaigns (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name          TEXT        NOT NULL,
  channel       TEXT        NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  subject       TEXT,
  message       TEXT        NOT NULL,
  target_type   TEXT        NOT NULL DEFAULT 'all'
                CHECK (target_type IN ('all', 'tag', 'debtors', 'high_value')),
  target_tag_id UUID        REFERENCES customer_tags ON DELETE SET NULL,
  target_min_spent NUMERIC(12,2),
  status        TEXT        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_count    INTEGER     DEFAULT 0,
  failed_count  INTEGER     DEFAULT 0,
  sent_at       TIMESTAMPTZ,
  created_by    UUID        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select" ON campaigns FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "campaigns_insert" ON campaigns FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "campaigns_update" ON campaigns FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "campaigns_delete" ON campaigns FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
