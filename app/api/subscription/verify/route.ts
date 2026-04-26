import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const reference = searchParams.get("reference");
  const businessId = searchParams.get("businessId");
  const plan = searchParams.get("plan");

  if (!reference || !businessId || !plan) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const data = await res.json();

  if (!data.status || data.data?.status !== "success") {
    // Payment failed — redirect to billing with error
    const business = await getBusinessSlug(businessId);
    return NextResponse.redirect(
      new URL(`/${business}/settings?tab=billing&error=payment_failed`, req.url)
    );
  }

  // Update subscription tier
  const supabase = createServiceClient();
  await supabase
    .from("businesses")
    .update({ subscription_tier: plan })
    .eq("id", businessId);

  const business = await getBusinessSlug(businessId);
  return NextResponse.redirect(
    new URL(`/${business}/settings?tab=billing&success=1`, req.url)
  );
}

async function getBusinessSlug(businessId: string): Promise<string> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", businessId)
    .single();
  return data?.slug ?? "";
}
