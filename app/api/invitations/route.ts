import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { business_id, email, role } = await req.json();

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({ business_id, email: email.toLowerCase(), role, invited_by: user.id })
    .select("token")
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: error?.message ?? "Failed to create invitation" }, { status: 500 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", business_id)
    .single();

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const { error: emailError } = await resend.emails.send({
    from: process.env.INVITATION_FROM_EMAIL ?? "noreply@vantage.app",
    to: email,
    subject: `You're invited to join ${business?.name ?? "a business"} on VANTAGE`,
    html: `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:40px 20px;margin:0;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="width:44px;height:44px;background:#16a34a;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
      <span style="color:white;font-size:20px;font-weight:800;">V</span>
    </div>
    <h1 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 10px;">You've been invited!</h1>
    <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 28px;">
      <strong style="color:#0f172a;">${business?.name ?? "A business"}</strong> has invited you to join their team on <strong>VANTAGE</strong> as a
      <strong style="color:#16a34a;">${roleLabel}</strong>.
    </p>
    <a href="${inviteUrl}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;font-weight:600;font-size:14px;padding:13px 30px;border-radius:10px;margin-bottom:28px;">
      Accept Invitation →
    </a>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
    <p style="color:#94a3b8;font-size:12px;margin:0;">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
  });

  if (emailError) {
    console.error("Invitation email failed:", emailError);
  }

  return NextResponse.json({ ok: true });
}
