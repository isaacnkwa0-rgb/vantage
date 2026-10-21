"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Store,
  Clock, CreditCard, Package, Truck, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, MapPin, Search, Phone, Mail, SlidersHorizontal,
} from "lucide-react";
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

const STATUS_CONFIG: Record<string, {
  label: string; bg: string; text: string;
  iconBg: string; iconColor: string; Icon: React.ElementType;
}> = {
  pending:    { label: "Pending",    bg: "bg-amber-50",   text: "text-amber-700",   iconBg: "bg-amber-50",   iconColor: "text-amber-500",  Icon: Clock         },
  paid:       { label: "Paid",       bg: "bg-blue-50",    text: "text-blue-700",    iconBg: "bg-blue-50",    iconColor: "text-blue-500",   Icon: CreditCard    },
  processing: { label: "Processing", bg: "bg-violet-50",  text: "text-violet-700",  iconBg: "bg-violet-50",  iconColor: "text-violet-500", Icon: Package       },
  shipped:    { label: "Shipped",    bg: "bg-indigo-50",  text: "text-indigo-700",  iconBg: "bg-indigo-50",  iconColor: "text-indigo-500", Icon: Truck         },
  delivered:  { label: "Delivered",  bg: "bg-primary-soft", text: "text-primary", iconBg: "bg-primary-soft", iconColor: "text-success",Icon: CheckCircle2  },
  cancelled:  { label: "Cancelled",  bg: "bg-red-50",     text: "text-red-600",     iconBg: "bg-red-50",     iconColor: "text-red-400",    Icon: XCircle       },
};

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  pending:    { next: "processing", label: "Accept Order"       },
  paid:       { next: "processing", label: "Start Processing"   },
  processing: { next: "shipped",    label: "Mark as Shipped"    },
  shipped:    { next: "delivered",  label: "Mark as Delivered"  },
};

const FILTER_TABS = [
  { key: "all",       label: "All"       },
  { key: "pending",   label: "Pending"   },
  { key: "active",    label: "Active"    },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type FilterKey = typeof FILTER_TABS[number]["key"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function StoreOrdersClient({ orders: initialOrders, currency, businessSlug }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency);

  const [orders, setOrders]     = useState<StoreOrder[]>(initialOrders);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<FilterKey>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const supabase = createClient();
    const channel = supabase
      .channel("store-orders-new")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_orders" }, (payload) => {
        const o = payload.new as StoreOrder;
        setOrders((prev) => [o, ...prev]);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New Store Order!", {
            body: `${o.customer_name} placed an order — ${formatCurrency(o.total_amount, currency)}`,
            icon: "/favicon.ico",
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id + status);
    const supabase = createClient();
    await supabase.from("store_orders").update({ status }).eq("id", id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as StoreOrder["status"] } : o)));
    setUpdating(null);
  }

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ? true :
      filter === "active" ? ["paid", "processing", "shipped"].includes(o.status) :
      o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount   = orders.filter((o) => o.status === "pending").length;
  const activeCount    = orders.filter((o) => ["paid","processing","shipped"].includes(o.status)).length;
  const totalRevenue   = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total_amount, 0);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-4">

      {/* Stats */}
      <div className="border border-slate-200 rounded-[8px] px-4 py-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-slate-500">Total Revenue</p>
        <p className="text-[20px] font-extrabold text-primary leading-none">{fmt(totalRevenue)}</p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 items-stretch h-11">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full h-full pl-9 pr-4 border border-slate-200 rounded-[8px] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
        </div>
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              "h-full flex items-center gap-1.5 px-3 border rounded-[8px] text-[13px] font-semibold transition",
              filter !== "all"
                ? "border-primary text-primary bg-primary-soft"
                : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {FILTER_TABS.find((t) => t.key === filter)?.label ?? "All"}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-[10px] shadow-lg z-20 overflow-hidden py-1">
              {FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setFilterOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-[13px] font-medium transition",
                    filter === key
                      ? "bg-primary-soft text-primary font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Store className="w-9 h-9 text-slate-300" />
          </div>
          <p className="text-[16px] font-bold text-slate-800">
            {search || filter !== "all" ? "No orders found" : "No orders yet"}
          </p>
          <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
            {search || filter !== "all" ? "Try a different search or filter" : "Share your store link to start receiving orders"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {filtered.map((order) => {
              const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const { Icon } = sc;
              const isExpanded = expanded === order.id;
              const flow = STATUS_FLOW[order.status];

              return (
                <div key={order.id}>
                  {/* Summary row — tappable */}
                  <div
                    className="px-4 py-4 flex items-start gap-3 cursor-pointer active:bg-slate-50 transition"
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    <div className={cn("w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5", sc.iconBg)}>
                      <Icon className={cn("w-4 h-4", sc.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-[13px] text-[#0F172A] tracking-wide">{order.order_number}</span>
                          <span className={cn("text-[12px] font-semibold flex-shrink-0", sc.text)}>{sc.label}</span>
                        </div>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                      </div>
                      <p className="text-[14px] font-semibold text-slate-800 mt-0.5 leading-tight">{order.customer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[14px] font-bold text-[#0F172A]">{fmt(order.total_amount)}</span>
                        <span className="text-[12px] text-slate-400" suppressHydrationWarning>· {shortDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">

                      {/* Customer info */}
                      <div className="space-y-1.5">
                        {order.customer_email && (
                          <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-primary transition">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />{order.customer_email}
                          </a>
                        )}
                        {order.customer_phone && (
                          <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-primary transition">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />{order.customer_phone}
                          </a>
                        )}
                        {order.shipping_address && (
                          <p className="flex items-start gap-2 text-[13px] text-slate-500">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{order.shipping_address}
                          </p>
                        )}
                      </div>

                      {/* Items */}
                      <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
                        {order.store_order_items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2.5">
                            <div>
                              <p className="text-[13px] font-medium text-[#0F172A]">{item.name}</p>
                              <p className="text-[12px] text-slate-400">× {item.quantity} · {fmt(item.price)} each</p>
                            </div>
                            <span className="text-[14px] font-bold text-[#0F172A]">{fmt(item.total)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50">
                          <span className="text-[13px] font-semibold text-slate-600">Total</span>
                          <span className="text-[15px] font-extrabold text-[#0F172A]">{fmt(order.total_amount)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <div className="flex items-center gap-2">
                          {flow && (
                            <button
                              onClick={() => updateStatus(order.id, flow.next)}
                              disabled={updating === order.id + flow.next}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition disabled:opacity-50 shadow-sm shadow-ember/20"
                            >
                              {flow.label}
                            </button>
                          )}
                          <button
                            onClick={() => updateStatus(order.id, "cancelled")}
                            disabled={updating === order.id + "cancelled"}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-[8px] text-[13px] font-semibold transition disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
