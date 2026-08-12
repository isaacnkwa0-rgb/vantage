import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await req.json();
  if (!campaignId) return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });

  const termiiKey = process.env.TERMII_API_KEY;
  const termiiSender = process.env.TERMII_SENDER_ID ?? "VANTAGE";
  if (!termiiKey) return NextResponse.json({ error: "SMS not configured — add TERMII_API_KEY to environment variables" }, { status: 503 });

  const svc = createServiceClient();

  const { data: campaign } = await svc
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.channel !== "sms") return NextResponse.json({ error: "Not an SMS campaign" }, { status: 400 });

  // Build recipient query
  let query = svc
    .from("customers")
    .select("id, name, phone")
    .eq("business_id", campaign.business_id)
    .not("phone", "is", null);

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

  let sent = 0;
  let failed = 0;

  for (const customer of customers) {
    // Normalise phone: ensure it has country code (assume +234 if starts with 0)
    let phone = (customer.phone as string).replace(/\s+/g, "");
    if (phone.startsWith("0")) phone = "234" + phone.slice(1);
    if (phone.startsWith("+")) phone = phone.slice(1);

    try {
      const res = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          from: termiiSender,
          sms: campaign.message,
          type: "plain",
          channel: "generic",
          api_key: termiiKey,
        }),
      });
      const data = await res.json();
      if (data.code === "ok" || res.ok) sent++; else failed++;
    } catch {
      failed++;
    }
  }

  await svc.from("campaigns").update({
    status: "sent",
    sent_count: sent,
    failed_count: failed,
    sent_at: new Date().toISOString(),
  }).eq("id", campaignId);

  return NextResponse.json({ sent, failed });
}
