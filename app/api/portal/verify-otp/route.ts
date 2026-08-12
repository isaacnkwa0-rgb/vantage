import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { email, otp, businessSlug } = await req.json();
  if (!email || !otp || !businessSlug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("business_id", business.id)
    .eq("email", email.toLowerCase().trim())
    .single();
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const { data: otpRecord } = await supabase
    .from("customer_portal_otps")
    .select("id, expires_at, used")
    .eq("customer_id", customer.id)
    .eq("otp", otp)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!otpRecord) return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });

  // Mark OTP used
  await supabase.from("customer_portal_otps").update({ used: true }).eq("id", otpRecord.id);

  // Return a session token (customer ID encoded — production would use a signed JWT)
  const token = Buffer.from(JSON.stringify({ customerId: customer.id, businessId: business.id, exp: Date.now() + 86400000 })).toString("base64url");

  return NextResponse.json({ token, customerName: customer.name });
}
