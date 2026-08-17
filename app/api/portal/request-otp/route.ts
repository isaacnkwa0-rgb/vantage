import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email, businessSlug } = await req.json();
  if (!email || !businessSlug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createServiceClient();

  // Find business and customer
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("slug", businessSlug)
    .single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("business_id", business.id)
    .eq("email", email.toLowerCase().trim())
    .single();
  if (!customer) return NextResponse.json({ error: "No account found with that email" }, { status: 404 });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  await supabase.from("customer_portal_otps").insert({
    customer_id: customer.id,
    email: email.toLowerCase().trim(),
    otp,
    expires_at: expiresAt,
  });

  await resend.emails.send({
    from: process.env.INVITATION_FROM_EMAIL ?? "noreply@resend.dev",
    to: email,
    subject: `Your ${business.name} portal login code`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#1a9c38">${business.name}</h2>
        <p>Hi ${customer.name},</p>
        <p>Your one-time login code is:</p>
        <div style="background:#f1f5f9;border-radius:8px;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;font-family:monospace">${otp}</div>
        <p style="color:#64748b;font-size:12px">This code expires in 10 minutes.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
