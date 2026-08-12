const { Client } = require("pg");
const fs = require("fs");

const client = new Client({
  host: "aws-0-eu-west-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.iidzwpfjfujfelfacmjo",
  password: "Mex=Zikky226",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  "store_orders_migration.sql",
  "store_shipping_migration.sql",
  "analytics_columns_migration.sql",
  "multicurrency_migration.sql",
  "gift_cards_migration.sql",
  "referrals_migration.sql",
  "customer_portal_migration.sql",
  "recurring_billing_migration.sql",
  "barcode_products_migration.sql",
  "notifications_migration.sql",
  "bank_accounts_migration.sql",
  "payroll_migration.sql",
];

(async () => {
  await client.connect();
  console.log("Connected to Supabase.\n");
  let ok = 0, fail = 0;
  for (const file of migrations) {
    const sql = fs.readFileSync(`supabase/${file}`, "utf8");
    try {
      await client.query(sql);
      console.log(`✓  ${file}`);
      ok++;
    } catch (e) {
      console.error(`✗  ${file} — ${e.message}`);
      fail++;
    }
  }
  await client.end();
  console.log(`\nDone: ${ok} succeeded, ${fail} failed.`);
})();
