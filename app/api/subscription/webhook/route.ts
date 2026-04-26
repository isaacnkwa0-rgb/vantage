import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  // Verify webhook signature
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const supabase = createServiceClient();

  switch (event.event) {
    case "subscription.create":
    case "charge.success": {
      const meta = event.data?.metadata;
      if (meta?.business_id && meta?.plan) {
        await supabase
          .from("businesses")
          .update({ subscription_tier: meta.plan })
          .eq("id", meta.business_id);
      }
      break;
    }

    case "subscription.disable":
    case "subscription.expiring_cards": {
      // Downgrade to free on cancellation
      const meta = event.data?.metadata;
      if (meta?.business_id) {
        await supabase
          .from("businesses")
          .update({ subscription_tier: "free" })
          .eq("id", meta.business_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
