-- In-app notifications

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  user_id     UUID,
  type        TEXT        NOT NULL DEFAULT 'info',
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  href        TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select" ON notifications FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "notif_insert" ON notifications FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "notif_update" ON notifications FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "notif_delete" ON notifications FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));

CREATE INDEX IF NOT EXISTS idx_notifications_business ON notifications (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (business_id, read_at) WHERE read_at IS NULL;
