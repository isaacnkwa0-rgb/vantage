-- Customer Tags & Segmentation

CREATE TABLE IF NOT EXISTS customer_tags (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#64748b',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

CREATE TABLE IF NOT EXISTS customer_tag_assignments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers    ON DELETE CASCADE NOT NULL,
  tag_id      UUID REFERENCES customer_tags ON DELETE CASCADE NOT NULL,
  UNIQUE(customer_id, tag_id)
);

ALTER TABLE customer_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ctags_select" ON customer_tags FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "ctags_insert" ON customer_tags FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "ctags_update" ON customer_tags FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "ctags_delete" ON customer_tags FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

CREATE POLICY "ctag_assign_select" ON customer_tag_assignments FOR SELECT
  USING (tag_id IN (SELECT id FROM customer_tags));
CREATE POLICY "ctag_assign_insert" ON customer_tag_assignments FOR INSERT
  WITH CHECK (tag_id IN (SELECT id FROM customer_tags));
CREATE POLICY "ctag_assign_delete" ON customer_tag_assignments FOR DELETE
  USING (tag_id IN (SELECT id FROM customer_tags));
