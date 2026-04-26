import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

const PLAN_CODES: Record<string, string> = {
  starter_monthly: process.env.PAYSTACK_PLAN_STARTER_MONTHLY ?? "",
  starter_annual:  process.env.PAYSTACK_PLAN_STARTER_ANNUAL ?? "",
  pro_monthly:     process.env.PAYSTACK_PLAN_PRO_MONTHLY ?? "",
  pro_annual:      process.env.PAYSTACK_PLAN_PRO_ANNUAL ?? "",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, billing, businessId, email } = await req.json();
  if (!plan || !billing || !businessId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const planCode = PLAN_CODES[`${plan}_${billing}`];
  if (!planCode) {
    return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/verify?businessId=${businessId}&plan=${plan}`;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email ?? user.email,
      plan: planCode,
      callback_url: callbackUrl,
      metadata: {
        business_id: businessId,
        plan,
        billing,
        user_id: user.id,
      },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Paystack error" }, { status: 500 });
  }

  return NextResponse.json({ authorizationUrl: data.data.authorization_url });
}
