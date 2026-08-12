import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await req.json();
  if (!campaignId) return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });

  const svc = createServiceClient();

  const { data: campaign } = await svc
    .from("campaigns")
    .select("*, businesses(id, name, currency)")
    .eq("id", campaignId)
    .single();

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.channel !== "email") return NextResponse.json({ error: "Not an email campaign" }, { status: 400 });

  // Build recipient query
  let query = svc
    .from("customers")
    .select("id, name, email")
    .eq("business_id", campaign.business_id)
    .not("email", "is", null);

  if (campaign.target_type === "tag" && campaign.target_tag_id) {
    const { data: taggedIds } = await svc
      .from("customer_tag_assignments")
      .select("customer_id")
      .eq("tag_id", campaign.target_tag_id);
    const ids = (taggedIds ?? []).map((r: any) => r.customer_id);
    if (ids.length === 0) {
      await svc.from("campaigns").update({ status: "sent", sent_count: 0, sent_at: new Date().toISOString() }).eq("id", campaignId);
      return NextResponse.json({ sent: 0 });
    }
    query = query.in("id", ids);
  } else if (campaign.target_type === "debtors") {
    query = query.gt("credit_balance", 0);
  } else if (campaign.target_type === "high_value" && campaign.target_min_spent) {
    query = query.gte("total_spent", campaign.target_min_spent);
  }

  const { data: customers } = await query;
  if (!customers || customers.length === 0) {
    await svc.from("campaigns").update({ status: "sent", sent_count: 0, sent_at: new Date().toISOString() }).eq("id", campaignId);
    return NextResponse.json({ sent: 0 });
  }

  await svc.from("campaigns").update({ status: "sending" }).eq("id", campaignId);

  const fromEmail = process.env.INVITATION_FROM_EMAIL ?? "noreply@vantage.app";
  const bizName = (campaign.businesses as any)?.name ?? "Your Business";
  let sent = 0;
  let failed = 0;

  // Send in batches of 50 to avoid rate limits
  const batchSize = 50;
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((c: any) =>
        resend.emails.send({
          from: `${bizName} <${fromEmail}>`,
          to: c.email,
          subject: campaign.subject ?? `Message from ${bizName}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#0f172a">${campaign.subject ?? `Message from ${bizName}`}</h2>
            <div style="white-space:pre-wrap;color:#374151;line-height:1.6">${campaign.message.replace(/\n/g, "<br>")}</div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px">This message was sent by ${bizName} via VANTAGE.</p>
          </div>`,
        })
      )
    );
    sent += results.filter((r) => r.status === "fulfilled").length;
    failed += results.filter((r) => r.status === "rejected").length;
  }

  await svc.from("campaigns").update({
    status: "sent",
    sent_count: sent,
    failed_count: failed,
    sent_at: new Date().toISOString(),
  }).eq("id", campaignId);

  return NextResponse.json({ sent, failed });
}
