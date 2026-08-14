import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// One-time migration route — deleted immediately after use
const NONCE = "vantage-mig-9f3j7-xk2m8p";
const REF = "iidzwpfjfujfelfacmjo";
const REGIONS = [
  "aws-0-eu-central-1",
  "aws-0-us-east-1",
  "aws-0-us-west-1",
  "aws-0-ap-southeast-1",
  "aws-0-eu-west-1",
  "aws-0-ap-northeast-1",
];

async function tryConnect(connStr: string) {
  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  const client = await pool.connect();
  return { pool, client };
}

export async function POST(req: NextRequest) {
  const { nonce, pw } = await req.json();
  if (nonce !== NONCE) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const encodedPw = encodeURIComponent(pw);
  const tried: string[] = [];
  let connected: { pool: Pool; client: any } | null = null;

  for (const region of REGIONS) {
    const connStr = `postgresql://postgres.${REF}:${encodedPw}@${region}.pooler.supabase.com:6543/postgres`;
    tried.push(region);
    try {
      connected = await tryConnect(connStr);
      break;
    } catch {
      // try next region
    }
  }

  if (!connected) {
    return NextResponse.json({ error: "Could not connect via any region", tried }, { status: 500 });
  }

  const { pool, client } = connected;
  try {
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
    client.release();
    await pool.end().catch(() => {});
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
