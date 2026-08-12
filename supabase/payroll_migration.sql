-- Staff Payroll

CREATE TABLE IF NOT EXISTS staff (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  name          TEXT        NOT NULL,
  role          TEXT,
  email         TEXT,
  phone         TEXT,
  salary_type   TEXT        NOT NULL DEFAULT 'monthly' CHECK (salary_type IN ('monthly','weekly','daily','hourly')),
  salary_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  bank_name     TEXT,
  account_number TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  joined_at     DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  period_label  TEXT        NOT NULL,
  period_start  DATE        NOT NULL,
  period_end    DATE        NOT NULL,
  total_gross   NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_net     NUMERIC(14,2) NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid')),
  notes         TEXT,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id        UUID        REFERENCES payroll_runs ON DELETE CASCADE NOT NULL,
  staff_id      UUID        REFERENCES staff ON DELETE SET NULL,
  business_id   UUID        REFERENCES businesses ON DELETE CASCADE NOT NULL,
  staff_name    TEXT        NOT NULL,
  gross_pay     NUMERIC(14,2) NOT NULL DEFAULT 0,
  deductions    NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_pay       NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_at       TIMESTAMPTZ,
  notes         TEXT
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;

-- Staff policies
CREATE POLICY "staff_select" ON staff FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "staff_insert" ON staff FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "staff_update" ON staff FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "staff_delete" ON staff FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

-- Payroll run policies
CREATE POLICY "pr_select" ON payroll_runs FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "pr_insert" ON payroll_runs FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pr_update" ON payroll_runs FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pr_delete" ON payroll_runs FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));

-- Payroll entry policies
CREATE POLICY "pe_select" ON payroll_entries FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "pe_insert" ON payroll_entries FOR INSERT
  WITH CHECK (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pe_update" ON payroll_entries FOR UPDATE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
CREATE POLICY "pe_delete" ON payroll_entries FOR DELETE
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner','manager')));
