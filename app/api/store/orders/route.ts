import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

function nextOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const { businessId, businessSlug, customer, items, subtotal, shippingFee, total, paymentMethod } = await req.json();

  if (!businessId || !customer?.email || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const order_number = nextOrderNumber();
  const method: string = paymentMethod === "bank_transfer" ? "bank_transfer" : "paystack";

  const { data: order, error } = await supabase
    .from("store_orders")
    .insert({
      business_id: businessId,
      order_number,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      shipping_address: customer.address || null,
      subtotal: subtotal ?? total,
      shipping_fee: shippingFee ?? 0,
      total_amount: total,
      status: method === "bank_transfer" ? "pending_transfer" : "pending",
      payment_method: method,
    })
    .select("id")
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Insert line items
  await supabase.from("store_order_items").insert(
    items.map((i: { productId: string; name: string; price: number; quantity: number }) => ({
      order_id: order.id,
      product_id: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }))
  );

  // Bank transfer: return order confirmation + bank account details
  if (method === "bank_transfer") {
    const { data: bankAccount } = await supabase
      .from("bank_accounts")
      .select("account_name, bank_name, account_number")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .eq("is_primary", true)
      .maybeSingle();

    return NextResponse.json({
      bankTransfer: true,
      orderNumber: order_number,
      bankDetails: bankAccount ?? null,
    });
  }

  // Paystack: initialize payment
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/store/verify?orderId=${order.id}&slug=${businessSlug}`;
  const amountKobo = Math.round(total * 100);

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: customer.email,
      amount: amountKobo,
      reference: `STORE-${order_number}-${Date.now()}`,
      callback_url: callbackUrl,
      metadata: {
        order_id: order.id,
        order_number,
        customer_name: customer.name,
        business_id: businessId,
      },
    }),
  });

  const payData = await res.json();
  if (!payData.status) {
    return NextResponse.json({ error: payData.message ?? "Payment init failed" }, { status: 500 });
  }

  return NextResponse.json({ authorizationUrl: payData.data.authorization_url });
}
