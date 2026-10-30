/**
 * Neon migration runner.
 * Reads all supabase/*.sql files, strips Supabase-specific content, runs them in order.
 */
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SUPABASE = join(ROOT, "supabase");

const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_mrjLSIHnGY53@ep-shiny-forest-b43s69no-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: DB_URL, max: 1 });

// ── SQL injected before any files (just extensions) ──────────────────────────
const PREAMBLE = `CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

// ── SQL injected after schema.sql (needs businesses/customers/"user" to exist) ─
const INVOICES_SQL = `
CREATE TABLE IF NOT EXISTS invoices (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID        NOT NULL REFERENCES businesses ON DELETE CASCADE,
  customer_id         UUID        REFERENCES customers ON DELETE SET NULL,
  invoice_number      TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'draft',
  issue_date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE,
  subtotal            NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid         NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes               TEXT,
  bank_details        TEXT,
  client_name         TEXT,
  client_phone        TEXT,
  client_email        TEXT,
  client_address      TEXT,
  payment_link_token  UUID        DEFAULT gen_random_uuid(),
  created_by          UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID        NOT NULL REFERENCES invoices ON DELETE CASCADE,
  description   TEXT        NOT NULL,
  quantity      NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total    NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION generate_invoice_number(p_business_id UUID)
RETURNS TEXT AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM invoices WHERE business_id = p_business_id;
  RETURN 'INV-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// ── Ordered list of SQL files (use null to inject INVOICES_SQL inline) ──────
const FILES = [
  "neon-migration.sql",
  "schema.sql",
  null, // ← invoices + invoice_items + generate_invoice_number injected here
  "locations_and_storage.sql",
  "suppliers_migration.sql",
  "purchase_orders_migration.sql",
  "loyalty_migration.sql",
  "barcode_products_migration.sql",
  "returns_migration.sql",
  "discount_codes_migration.sql",
  "quotes_migration.sql",
  "moq_migration.sql",
  "bundles_migration.sql",
  "customer_tags_migration.sql",
  "cash_shifts_migration.sql",
  "audit_log_migration.sql",
  "payment_links_migration.sql",
  "campaigns_migration.sql",
  "commissions_migration.sql",
  "sales_targets_migration.sql",
  "tiered_pricing_migration.sql",
  "appointments_migration.sql",
  "cashbook_migration.sql",
  "credit_notes_migration.sql",
  "store_orders_migration.sql",
  "store_shipping_migration.sql",
  "analytics_columns_migration.sql",
  "multicurrency_migration.sql",
  "gift_cards_migration.sql",
  "referrals_migration.sql",
  "customer_portal_migration.sql",
  "recurring_billing_migration.sql",
  "notifications_migration.sql",
  "bank_accounts_migration.sql",
  "payroll_migration.sql",
  "p3_all_migrations.sql",
  "custom_domain_migration.sql",
  "storefront_public_rls_migration.sql",
  "bank_transfer_checkout_migration.sql",
  "branding_migration.sql",
  "store_visits_migration.sql",
  "maintenance_mode_migration.sql",
  "migrations/20260901152857_maintenance_mode.sql",
  "migrations/20260902000000_pos_channel_and_profile_features.sql",
  "migrations/20260905153715_invoice_client_phone.sql",
  "migrations/20260905180000_quote_client_phone.sql",
  "migrations/20260912000000_store_hero_fields.sql",
];

// ── Patterns that indicate a Supabase-only statement ─────────────────────────
// Note: auth.users references in CREATE TABLE get replaced before this check.
const SUPABASE_PATTERNS = [
  /\bauth\.uid\(\)/i,
  /\bauth\.role\(\)/i,
  /\bauth\.users\b/i,
  /\bstorage\.objects\b/i,
  /\bstorage\.buckets\b/i,
  /^CREATE\s+POLICY\b/i,
  /^DROP\s+POLICY\b/i,
  /^ALTER\s+POLICY\b/i,
  /ENABLE\s+ROW\s+LEVEL\s+SECURITY/i,
  /DISABLE\s+ROW\s+LEVEL\s+SECURITY/i,
];

function isSupabaseStatement(stmt) {
  return SUPABASE_PATTERNS.some((re) => re.test(stmt.trim()));
}

// Replace Supabase auth references in CREATE TABLE statements with compatible equivalents
function preprocessSql(sql) {
  return sql
    // auth.users FK → profiles (same UUID type; all app FKs reference profiles not the raw auth user)
    .replace(/REFERENCES\s+auth\.users\s*(\([^)]*\))?/gi, 'REFERENCES profiles(id)')
    // gen_random_bytes with encode → use pgcrypto (extension enabled in preamble)
    ;
}

// ── Split SQL into individual statements ─────────────────────────────────────
function splitStatements(sql) {
  const statements = [];
  let cur = "";
  let inDollar = false;
  let dollarTag = "";
  let i = 0;

  while (i < sql.length) {
    if (!inDollar) {
      const dollarMatch = sql.slice(i).match(/^(\$[^$]*\$)/);
      if (dollarMatch) {
        dollarTag = dollarMatch[1];
        inDollar = true;
        cur += dollarTag;
        i += dollarTag.length;
        continue;
      }
      if (sql[i] === "-" && sql[i + 1] === "-") {
        while (i < sql.length && sql[i] !== "\n") i++;
        cur += "\n";
        continue;
      }
      if (sql[i] === ";") {
        const stmt = cur.trim();
        if (stmt) statements.push(stmt);
        cur = "";
        i++;
        continue;
      }
    } else {
      if (sql.slice(i).startsWith(dollarTag)) {
        cur += dollarTag;
        i += dollarTag.length;
        inDollar = false;
        dollarTag = "";
        continue;
      }
    }
    cur += sql[i];
    i++;
  }
  if (cur.trim()) statements.push(cur.trim());
  return statements;
}

// ── Execute a block of SQL text ───────────────────────────────────────────────
async function runBlock(client, label, sql) {
  const processed = preprocessSql(sql);
  const statements = splitStatements(processed);
  let ok = 0, skipped = 0, errors = 0;

  for (const stmt of statements) {
    if (!stmt || stmt.startsWith("--")) continue;
    if (isSupabaseStatement(stmt)) { skipped++; continue; }

    try {
      await client.query(stmt);
      ok++;
    } catch (err) {
      if (
        err.code === "42710" ||
        err.code === "42P07" ||
        err.code === "42701" ||
        err.code === "23505" ||
        (err.message && err.message.includes("already exists"))
      ) {
        ok++;
      } else {
        console.error(`    ✗ ERROR in ${label}:\n      ${err.message}\n      SQL: ${stmt.slice(0, 120)}`);
        errors++;
      }
    }
  }
  return { ok, skipped, errors };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  let totalOk = 0, totalSkip = 0, totalErr = 0;

  try {
    // Run preamble first (pgcrypto + invoices table)
    console.log("  Running preamble (pgcrypto + invoices tables)...");
    const pre = await runBlock(client, "preamble", PREAMBLE);
    console.log(`  ✓ preamble${"".padEnd(47)} ok=${pre.ok} skip=${pre.skipped} err=${pre.errors}`);
    totalOk += pre.ok; totalSkip += pre.skipped; totalErr += pre.errors;

    for (const file of FILES) {
      // null sentinel = inject invoices SQL
      if (file === null) {
        const { ok, skipped, errors } = await runBlock(client, "[invoices tables]", INVOICES_SQL);
        console.log(`  ✓ ${"[invoices tables]".padEnd(55)} ok=${ok} skip=${skipped} err=${errors}`);
        totalOk += ok; totalSkip += skipped; totalErr += errors;
        continue;
      }

      const filePath = join(SUPABASE, file);
      let sql;
      try { sql = readFileSync(filePath, "utf8"); }
      catch { console.log(`  ⚠  MISSING: ${file}`); continue; }

      const { ok, skipped, errors } = await runBlock(client, file, sql);
      console.log(`  ✓ ${file.padEnd(55)} ok=${ok} skip=${skipped} err=${errors}`);
      totalOk += ok; totalSkip += skipped; totalErr += errors;
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Done. executed=${totalOk}  skipped(supabase)=${totalSkip}  errors=${totalErr}`);
  if (totalErr > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
