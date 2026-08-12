import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const orderId = searchParams.get("orderId");
  const slug = searchParams.get("slug");

  if (!reference || !orderId || !slug) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/store/${slug ?? ""}?status=failed`);
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const data = await res.json();

  if (!data.status || data.data?.status !== "success") {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/store/${slug}?status=failed`);
  }

  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("store_orders")
    .update({ status: "paid", payment_ref: reference })
    .eq("id", orderId)
    .select("order_number")
    .single();

  const orderNumber = order?.order_number ?? "";

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/store/${slug}?status=success&order=${orderNumber}`
  );
}
