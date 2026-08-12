-- Appointment / Booking System

CREATE TABLE IF NOT EXISTS appointments (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  customer_id   UUID        REFERENCES customers ON DELETE SET NULL,
  customer_name TEXT        NOT NULL,
  customer_phone TEXT,
  service_name  TEXT        NOT NULL,
  staff_id      UUID,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appt_select" ON appointments FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "appt_insert" ON appointments FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "appt_update" ON appointments FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "appt_delete" ON appointments FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
