import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// One-time migration route — deleted immediately after use
const NONCE = "vantage-mig-9f3j7-xk2m8p";

export async function POST(req: NextRequest) {
  const { nonce, pw } = await req.json();
  if (nonce !== NONCE) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: `postgresql://postgres.iidzwpfjfujfelfacmjo:${encodeURIComponent(pw)}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();

    await client.query(`
      ALTER TABLE store_orders
        ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'paystack';
    `);

    await client.query(`
      DO $mig$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'bank_accounts'
          AND policyname = 'bank_accounts_select_public_storefront'
        ) THEN
          CREATE POLICY bank_accounts_select_public_storefront ON bank_accounts
            FOR SELECT USING (
              is_active = true
              AND is_primary = true
              AND business_id IN (SELECT id FROM businesses WHERE is_active = true)
            );
        END IF;
      END $mig$;
    `);

    client.release();
    await pool.end();

    return NextResponse.json({ ok: true, message: "Migration complete" });
  } catch (err: any) {
    await pool.end().catch(() => {});
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
