"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Store, ExternalLink, ChevronDown, ChevronUp, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface StoreOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string | null;
  total_amount: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  store_order_items: OrderItem[];
}

interface Props {
  orders: StoreOrder[];
  currency: string;
  businessSlug: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Accept Order",
  paid: "Mark as Processing",
  processing: "Mark as Shipped",
  shipped: "Mark as Delivered",
};

const STATUS_FLOW: Record<string, string> = {
  pending: "processing",
  paid: "processing",
  processing: "shipped",
  shipped: "delivered",
};

export function StoreOrdersClient({ orders: initialOrders, currency, businessSlug }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);

  const [orders, setOrders] = useState<StoreOrder[]>(initialOrders);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Request notification permission and subscribe to new orders via Realtime
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const businessId = initialOrders[0]?.id ? undefined : undefined; // fetched from orders
    const channel = supabase
      .channel("store-orders-new")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "store_orders" },
        (payload) => {
          const newOrder = payload.new as StoreOrder;
          setOrders((prev) => [newOrder, ...prev]);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("New Store Order!", {
              body: `${newOrder.customer_name} placed an order — ${formatCurrency(newOrder.total_amount, currency)}`,
              icon: "/favicon.ico",
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const storeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/store/${businessSlug}`;

  async function updateStatus(id: string, status: string) {
    await supabase.from("store_orders").update({ status }).eq("id", id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as StoreOrder["status"] } : o)));
  }

  function copyStoreLink() {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total_amount, 0);

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Store link banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <Store className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-700">Your online store is live</p>
          <p className="text-xs text-green-600 truncate">{storeUrl}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={copyStoreLink} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-50 transition">
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition">
            <ExternalLink className="w-3.5 h-3.5" /> View Store
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-[#0F172A]">{orders.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-blue-600">{orders.filter((o) => o.status === "paid" || o.status === "processing").length}</p>
          <p className="text-xs text-slate-500 mt-0.5">To Fulfil</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-green-600">{fmt(totalRevenue)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Revenue</p>
        </div>
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <Store className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-semibold text-[#0F172A]">No orders yet</p>
          <p className="text-xs text-slate-400">Share your store link to start receiving orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expanded === order.id;
            const nextStatus = STATUS_FLOW[order.status];
            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-bold text-[#0F172A]">{order.order_number}</p>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[order.status])}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {order.customer_name} · {order.customer_email}
                      {order.customer_phone ? ` · ${order.customer_phone}` : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[#0F172A]">{fmt(order.total_amount)}</p>
                    <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50">
                    {/* Items */}
                    <div className="space-y-1">
                      {order.store_order_items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.name} × {item.quantity}</span>
                          <span className="font-semibold text-[#0F172A]">{fmt(item.total)}</span>
                        </div>
                      ))}
                    </div>
                    {order.shipping_address && (
                      <p className="text-xs text-slate-500">Ship to: {order.shipping_address}</p>
                    )}
                    {nextStatus && (
                      <button
                        onClick={() => updateStatus(order.id, nextStatus)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                      >
                        {STATUS_LABELS[order.status] ?? `Mark as ${nextStatus}`}
                      </button>
                    )}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        onClick={() => updateStatus(order.id, "cancelled")}
                        className="ml-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
