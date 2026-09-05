"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronDown, Tag, ScanLine, Plus, Minus, Trash2, X, Search,
  Loader2, Package, UserCheck, ChevronRight, Check,
  Banknote, CreditCard, ArrowLeftRight, BookOpen, WifiOff, Store, Globe,
} from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok, FaXTwitter } from "react-icons/fa6";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useOfflineStore } from "@/store/offlineStore";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { logAudit } from "@/lib/utils/audit";
import { cn } from "@/lib/utils";
import { ReceiptModal } from "./ReceiptModal";
import { BarcodeScanner } from "./BarcodeScanner";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  image_url: string | null;
  sku: string | null;
  barcode: string | null;
  categories: { name: string; color: string } | null;
  min_order_qty: number;
  max_order_qty: number | null;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  bundle_items: Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
    products: { cost_price: number } | null;
  }>;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  loyalty_points: number;
}

interface Business {
  id: string;
  name: string;
  currency: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  tax_enabled: boolean;
  tax_rate: number;
  tax_name: string;
  loyalty_enabled: boolean;
  loyalty_points_per_dollar: number;
  loyalty_redemption_rate: number;
  receipt_footer?: string | null;
  receipt_tagline?: string | null;
  receipt_show_logo?: boolean | null;
  social_instagram?: string | null;
  social_twitter?: string | null;
  social_whatsapp?: string | null;
}

interface Props {
  products: Product[];
  bundles: Bundle[];
  customers: Customer[];
  business: Business;
  userId: string;
}

type SalesChannel = "physical" | "whatsapp" | "instagram" | "facebook" | "tiktok" | "jiji" | "jumia" | "trova" | "twitter" | "others";
type PaymentStatus = "paid" | "unpaid" | "partial";
type PaymentMethod = "cash" | "card" | "transfer" | "credit";

type ChannelLogo =
  | { type: "icon"; component: React.ElementType; color: string }
  | { type: "img"; url: string }
  | { type: "letter"; letter: string; bg: string; color: string };

const CHANNELS: { value: SalesChannel; label: string; logo: ChannelLogo }[] = [
  { value: "physical",  label: "Physical",  logo: { type: "icon", component: Store,       color: "#64748b" } },
  { value: "whatsapp",  label: "WhatsApp",  logo: { type: "icon", component: FaWhatsapp,  color: "#25D366" } },
  { value: "instagram", label: "Instagram", logo: { type: "icon", component: FaInstagram, color: "#E1306C" } },
  { value: "facebook",  label: "Facebook",  logo: { type: "icon", component: FaFacebook,  color: "#1877F2" } },
  { value: "tiktok",    label: "TikTok",    logo: { type: "icon", component: FaTiktok,    color: "#010101" } },
  { value: "jiji",      label: "Jiji",      logo: { type: "img",  url: "https://www.google.com/s2/favicons?domain=jiji.ng&sz=64" } },
  { value: "jumia",     label: "Jumia",     logo: { type: "img",  url: "https://www.google.com/s2/favicons?domain=jumia.com.ng&sz=64" } },
  { value: "trova",     label: "Trova",     logo: { type: "img",  url: "https://www.google.com/s2/favicons?domain=trova.ng&sz=64" } },
  { value: "twitter",   label: "Twitter",   logo: { type: "icon", component: FaXTwitter,  color: "#000000" } },
  { value: "others",    label: "Others",    logo: { type: "icon", component: Globe,        color: "#64748b" } },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { value: "credit", label: "Credit", icon: BookOpen },
];

export function MobilePOSForm({ products, bundles, customers, business, userId }: Props) {
  const router = useRouter();

  const {
    items, addItem, updateQuantity, removeItem, clearCart,
    customerId, customerName, setCustomer,
    subtotal, discountAmount, taxAmount, total, loyaltyPointsToRedeem,
    setTaxConfig, discountType, discountValue, promoCodeId,
  } = useCartStore();

  const { addPendingSale } = useOfflineStore();

  // Form state
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [channel, setChannel] = useState<SalesChannel>("physical");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [partialAmount, setPartialAmount] = useState("");
  const [reference, setReference] = useState("");

  // UI state
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ name: string; found: boolean } | null>(null);

  // Quick-add customer
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  useEffect(() => {
    setTaxConfig(business.tax_enabled, business.tax_rate, business.tax_name);
  }, [business.tax_enabled, business.tax_rate, business.tax_name, setTaxConfig]);

  const sub = subtotal();
  const disc = discountAmount();
  const tax = taxAmount();
  const tot = total();
  const fmt = (n: number) => formatCurrency(n, business.currency);
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const pointsToEarn =
    business.loyalty_enabled && customerId && paymentStatus !== "unpaid"
      ? Math.floor(tot * business.loyalty_points_per_dollar)
      : 0;

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.barcode ?? "").includes(q)
    );
  });

  const filteredBundles = bundles.filter(
    (b) => b.is_active && b.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone ?? "").includes(customerSearch)
  );

  const cartProductIds = new Set(items.map((i) => i.productId));

  function addProduct(product: Product) {
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.selling_price,
      costPrice: product.cost_price,
      imageUrl: product.image_url,
      minOrderQty: product.min_order_qty ?? 1,
      maxOrderQty: product.max_order_qty ?? null,
    });
  }

  function addBundle(bundle: Bundle) {
    const costPrice = bundle.bundle_items.reduce(
      (s, bi) => s + (bi.products?.cost_price ?? 0) * bi.quantity,
      0
    );
    addItem({
      productId: bundle.id,
      name: bundle.name,
      unitPrice: bundle.price,
      costPrice,
      imageUrl: bundle.image_url,
      minOrderQty: 1,
      maxOrderQty: null,
      isBundle: true,
      bundleId: bundle.id,
      bundleComponents: bundle.bundle_items.map((bi) => ({
        productId: bi.product_id,
        variantId: bi.variant_id ?? undefined,
        quantity: bi.quantity,
      })),
    });
  }

  function handleCameraScan(barcode: string) {
    setShowScanner(false);
    const match = products.find((p) => p.barcode === barcode || p.sku === barcode);
    if (match) {
      addProduct(match);
      setScanFeedback({ name: match.name, found: true });
    } else {
      setScanFeedback({ name: barcode, found: false });
    }
    setTimeout(() => setScanFeedback(null), 3000);
  }

  async function handleAddCustomer() {
    if (!newCustomerName.trim()) return;
    setAddingCustomer(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("customers")
      .insert({ business_id: business.id, name: newCustomerName.trim(), phone: newCustomerPhone || null })
      .select("id, name")
      .single();
    if (data) {
      setCustomer(data.id, data.name);
      setShowAddCustomer(false);
      setShowCustomerPicker(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
    }
    setAddingCustomer(false);
  }

  async function handleRecordSale() {
    if (items.length === 0) {
      setError("Add at least one product to record a sale");
      return;
    }
    if (paymentStatus === "unpaid" && !customerId) {
      setError("Select a customer to record an unpaid sale");
      return;
    }
    if (paymentStatus === "partial" && (!partialAmount || parseFloat(partialAmount) <= 0)) {
      setError("Enter the amount paid for a partial payment");
      return;
    }
    setError(null);
    setSubmitting(true);

    const paid =
      paymentStatus === "unpaid" ? 0
      : paymentStatus === "partial" ? parseFloat(partialAmount)
      : tot;
    const change = Math.max(0, paid - tot);
    const method = paymentStatus === "unpaid" ? "credit" : paymentMethod;
    const dbPaymentStatus = paymentStatus === "paid" ? "paid" : "unpaid";
    const customerObj = customers.find((c) => c.id === customerId);

    // Offline path
    if (!navigator.onLine) {
      addPendingSale({
        businessId: business.id,
        userId,
        customerId,
        customerName: customerObj?.name ?? customerName ?? null,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          productName: i.name,
          variantName: i.variantName ?? null,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          costPrice: i.costPrice,
        })),
        subtotal: sub,
        discountType,
        discountValue,
        discountAmount: disc,
        taxAmount: tax,
        total: tot,
        amountPaid: paid,
        changeAmount: change,
        paymentMethod: method,
        paymentReference: reference,
        loyaltyPointsToEarn: pointsToEarn,
        loyaltyPointsToRedeem,
        channel,
        orderDate,
        createdAt: new Date().toISOString(),
      });
      const offlineId = `OFFLINE-${Date.now()}`;
      clearCart();
      setSubmitting(false);
      setCompletedSale({
        id: offlineId,
        sale_number: offlineId,
        total_amount: tot,
        amount_paid: paid,
        change_amount: change,
        payment_method: method,
        subtotal: sub,
        discount_amount: disc,
        tax_amount: tax,
        created_at: new Date().toISOString(),
        customer_name: customerObj?.name ?? customerName ?? null,
        customer_phone: customerObj?.phone ?? null,
        items: items.map((i) => ({
          product_name: i.name,
          variant_name: i.variantName ?? null,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          line_total: i.unitPrice * i.quantity,
        })),
        _offline: true,
      });
      return;
    }

    // Online path
    const supabase = createClient();
    const { data: saleNumData } = await supabase.rpc("generate_sale_number", { p_business_id: business.id });
    const saleNumber = saleNumData ?? `INV-${Date.now()}`;

    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert({
        business_id: business.id,
        customer_id: customerId ?? null,
        sale_number: saleNumber,
        subtotal: sub,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: disc,
        tax_amount: tax,
        total_amount: tot,
        amount_paid: paid,
        change_amount: change,
        payment_method: method,
        payment_reference: reference || null,
        payment_status: dbPaymentStatus,
        discount_code_id: promoCodeId ?? null,
        served_by: userId,
        channel,
        order_date: orderDate || null,
      })
      .select()
      .single();

    if (saleErr || !sale) {
      setError(saleErr?.message ?? "Failed to record sale");
      setSubmitting(false);
      return;
    }

    await supabase.from("sale_items").insert(
      items.map((item) => ({
        sale_id: sale.id,
        business_id: business.id,
        product_id: item.isBundle ? null : item.productId,
        variant_id: item.isBundle ? null : (item.variantId ?? null),
        bundle_id: item.isBundle ? (item.bundleId ?? null) : null,
        product_name: item.name,
        variant_name: item.variantName ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.costPrice,
        line_total: item.unitPrice * item.quantity,
      }))
    );

    for (const bi of items.filter((i) => i.isBundle && i.bundleId)) {
      await supabase.rpc("deduct_bundle_stock", { p_bundle_id: bi.bundleId, p_cart_qty: bi.quantity });
    }

    if (paymentStatus === "unpaid" && customerId) {
      const { data: cust } = await supabase.from("customers").select("credit_balance").eq("id", customerId).single();
      await supabase.from("customers").update({ credit_balance: (cust?.credit_balance ?? 0) + tot }).eq("id", customerId);
    }

    if (promoCodeId) {
      await supabase.rpc("increment_promo_uses", { p_code_id: promoCodeId });
    }

    if (business.loyalty_enabled && customerId && paymentStatus !== "unpaid") {
      const { data: cust } = await supabase.from("customers").select("loyalty_points").eq("id", customerId).single();
      const newPoints = Math.max(0, (cust?.loyalty_points ?? 0) + pointsToEarn - loyaltyPointsToRedeem);
      await supabase.from("customers").update({ loyalty_points: newPoints }).eq("id", customerId);
    }

    logAudit({
      businessId: business.id, userId,
      action: "sale.created", entityType: "sale",
      entityId: sale.id, entityName: sale.sale_number,
      meta: { total: tot, method },
    });

    clearCart();
    setSubmitting(false);
    setCompletedSale({
      ...sale,
      customer_name: customerObj?.name ?? customerName ?? null,
      customer_phone: customerObj?.phone ?? null,
      items: items.map((i) => ({
        product_name: i.name,
        variant_name: i.variantName ?? null,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        line_total: i.unitPrice * i.quantity,
      })),
    });
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#fafefb] flex items-center px-4 h-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-0.5 text-[#1a9c38] text-[15px] font-medium flex-shrink-0 w-16"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="flex-1 text-center font-semibold text-[#0F172A]">Record a sale</h1>
        <div className="w-16 flex justify-end">
          <button
            onClick={handleRecordSale}
            disabled={submitting}
            className="flex items-center gap-1 text-[#1a9c38] text-[15px] font-medium"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto">

        {/* Offline notice */}
        {typeof window !== "undefined" && !navigator.onLine && (
          <div className="flex items-center gap-2 bg-orange-500 text-white text-xs font-medium px-4 py-2">
            <WifiOff className="w-3.5 h-3.5" />
            You&apos;re offline — sale will sync when reconnected
          </div>
        )}

        {/* Order Date */}
        <div className="mx-4 mt-6">
          <div className="relative">
            <label className="absolute -top-2 left-3 px-1 bg-white text-[11px] text-slate-400 font-medium z-10">
              Order Date
            </label>
            {/* Hidden native date input covers the whole field to trigger picker on tap */}
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20"
            />
            {/* Custom display */}
            <div className="w-full bg-white border border-slate-300 rounded-[4px] px-4 pr-10 h-10 text-sm text-[#0F172A] flex items-center pointer-events-none">
              {new Date(orderDate + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
          </div>
        </div>

        {/* Customer */}
        <div className="mx-4 mt-6 border border-slate-300 rounded-[4px]">
          <button
            onClick={() => setShowCustomerPicker(true)}
            className="w-full flex items-center gap-3 px-4 h-10 text-left active:bg-slate-50 transition"
          >
            <UserCheck className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <span className={cn("flex-1 text-sm", customerId ? "font-medium text-[#0F172A]" : "text-slate-400")}>
              {customerId ? selectedCustomer?.name ?? customerName : "Select customer (optional)"}
            </span>
            {customerId ? (
              <button
                onClick={(e) => { e.stopPropagation(); setCustomer(null, null); }}
                className="p-1 rounded-full hover:bg-slate-100 transition flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Sales Channel */}
        <div className="bg-white mt-4 mx-4 border border-slate-200 rounded-[8px] px-4 py-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">Sales Channel</p>
          <div className="grid grid-cols-5 gap-2 gap-y-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch.value}
                onClick={() => setChannel(ch.value)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-lg border-2 transition",
                  channel === ch.value
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 bg-white"
                )}
              >
                {ch.logo.type === "icon" && (
                  <ch.logo.component size={20} color={ch.logo.color} />
                )}
                {ch.logo.type === "img" && (
                  <img src={ch.logo.url} alt={ch.label} className="w-5 h-5 object-contain rounded-sm" />
                )}
                {ch.logo.type === "letter" && (
                  <span className="w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center" style={{ background: ch.logo.bg, color: ch.logo.color }}>
                    {ch.logo.letter}
                  </span>
                )}
                <span className={cn("text-[10px] font-medium leading-tight", channel === ch.value ? "text-green-700" : "text-slate-400")}>
                  {ch.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="mt-4 px-4 py-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Products</p>

          {/* Action buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowProductPicker(true)}
              className="flex-1 flex items-center justify-center gap-2 h-10 border-2 border-green-500 text-green-600 rounded-[4px] text-sm font-semibold hover:bg-green-50 transition active:scale-[0.98]"
            >
              <Tag className="w-4 h-4" />
              Select Item
            </button>
            <button
              onClick={() => setShowScanner(true)}
              title="Scan barcode"
              className="flex items-center justify-center gap-2 px-4 h-10 border-2 border-slate-200 text-slate-500 rounded-[4px] hover:border-slate-300 transition"
            >
              <ScanLine className="w-4 h-4" />
            </button>
          </div>

          {/* Scan feedback */}
          {scanFeedback && (
            <div className={cn(
              "flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-sm font-medium",
              scanFeedback.found
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-600 border border-red-200"
            )}>
              {scanFeedback.found
                ? <><Check className="w-4 h-4 flex-shrink-0" /><span>{scanFeedback.name} added</span></>
                : <><Package className="w-4 h-4 flex-shrink-0" /><span>Not found: {scanFeedback.name}</span></>}
            </div>
          )}

          {/* Item list */}
          {items.length === 0 ? (
            <div className="py-6 text-center">
              <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No items added yet</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.variantId ?? item.productId} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{item.name}</p>
                    {item.variantName && <p className="text-xs text-slate-400">{item.variantName}</p>}
                    <p className="text-sm font-semibold text-green-600 mt-0.5">
                      {fmt(item.unitPrice * item.quantity)}
                      {item.quantity > 1 && (
                        <span className="text-xs text-slate-400 font-normal ml-1">({fmt(item.unitPrice)} each)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - (item.minOrderQty ?? 1), item.variantId)}
                      className="w-7 h-7 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:border-red-300 hover:text-red-500 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + (item.minOrderQty ?? 1), item.variantId)}
                      disabled={item.maxOrderQty !== null && item.quantity >= item.maxOrderQty}
                      className="w-7 h-7 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:border-green-400 transition disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Totals summary */}
              <div className="pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal ({cartCount} item{cartCount !== 1 ? "s" : ""})</span>
                  <span>{fmt(sub)}</span>
                </div>
                {disc > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span><span>-{fmt(disc)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>{business.tax_name} ({business.tax_rate}%)</span>
                    <span>+{fmt(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-[#0F172A] pt-1 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-green-600">{fmt(tot)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="bg-white mt-2 border-y border-slate-200 px-4 py-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Payment Status</p>

          <div className="flex gap-2 mb-3">
            {(["paid", "unpaid", "partial"] as PaymentStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setPaymentStatus(status)}
                className={cn(
                  "flex-1 h-8 rounded-[4px] text-xs font-medium border-2 transition",
                  paymentStatus === status
                    ? status === "paid"
                      ? "bg-green-600 border-green-600 text-white"
                      : status === "unpaid"
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-amber-500 border-amber-500 text-white"
                    : status === "unpaid"
                    ? "border-slate-200 text-red-500 bg-white"
                    : "border-slate-200 text-slate-500 bg-white"
                )}
              >
                {status === "partial" ? "Partial" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* PAID: payment method */}
          {paymentStatus === "paid" && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Payment Method</p>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-2.5 rounded-[4px] border-2 text-xs font-medium transition",
                      paymentMethod === m.value
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-slate-200 text-slate-600 hover:border-green-300"
                    )}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}
                  </button>
                ))}
              </div>
              {paymentMethod === "credit" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-700">
                    {customerId
                      ? `Added to ${selectedCustomer?.name ?? customerName}'s credit balance`
                      : "Select a customer above for credit sales"}
                  </p>
                </div>
              )}
              {(paymentMethod === "card" || paymentMethod === "transfer") && (
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Reference / Transaction ID (optional)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
            </div>
          )}

          {/* PARTIAL: amount paid + method */}
          {paymentStatus === "partial" && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Amount Paid</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder={`Enter amount (total: ${fmt(tot)})`}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.filter((m) => m.value !== "credit").map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-2.5 rounded-[4px] border-2 text-xs font-medium transition",
                      paymentMethod === m.value
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-slate-200 text-slate-600"
                    )}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* UNPAID: explanation */}
          {paymentStatus === "unpaid" && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-700 font-medium">
                {customerId
                  ? `Sale will be added to ${selectedCustomer?.name ?? customerName}'s credit balance`
                  : "Select a customer above to record an unpaid sale"}
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 mb-1 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>

      {/* Sticky CTA */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3">
        <button
          onClick={handleRecordSale}
          disabled={submitting}
          className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[15px] flex items-center justify-center gap-2 transition disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {submitting
            ? "Recording..."
            : items.length > 0
            ? `Record sale · ${fmt(tot)}`
            : "Record sale"}
        </button>
      </div>

      {/* Product picker bottom sheet */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="flex-1 bg-black/40"
            onClick={() => { setShowProductPicker(false); setProductSearch(""); }}
          />
          <div className="bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: "78vh" }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0">
              <p className="flex-1 font-bold text-[#0F172A]">Select Item</p>
              <button
                onClick={() => { setShowProductPicker(false); setProductSearch(""); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredBundles.length === 0 && filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="text-slate-400 text-sm">No products found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredBundles.map((bundle) => {
                    const inCart = cartProductIds.has(bundle.id);
                    return (
                      <button
                        key={bundle.id}
                        onClick={() => addBundle(bundle)}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition", inCart ? "bg-violet-50" : "hover:bg-slate-50")}
                      >
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          {bundle.image_url
                            ? <Image src={bundle.image_url} alt={bundle.name} width={40} height={40} className="object-cover w-full h-full rounded-lg" />
                            : <Package className="w-5 h-5 text-violet-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">{bundle.name}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Bundle</span>
                        </div>
                        <p className="text-sm font-bold text-violet-600 flex-shrink-0">{fmt(bundle.price)}</p>
                        {inCart && <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>}
                      </button>
                    );
                  })}
                  {filteredProducts.map((product) => {
                    const inCart = cartProductIds.has(product.id);
                    const outOfStock = product.stock_quantity === 0;
                    return (
                      <button
                        key={product.id}
                        onClick={() => !outOfStock && addProduct(product)}
                        disabled={outOfStock}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition",
                          outOfStock ? "opacity-40 cursor-not-allowed" : inCart ? "bg-green-50" : "hover:bg-slate-50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                          {product.image_url
                            ? <Image src={product.image_url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                            : <Package className="w-5 h-5 text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">{product.name}</p>
                          <p className="text-xs text-slate-400">{outOfStock ? "Out of stock" : `${product.stock_quantity} left`}</p>
                        </div>
                        <p className="text-sm font-bold text-green-600 flex-shrink-0">{fmt(product.selling_price)}</p>
                        {inCart && <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => { setShowProductPicker(false); setProductSearch(""); }}
                className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm"
              >
                Done{cartCount > 0 ? ` · ${cartCount} item${cartCount !== 1 ? "s" : ""}` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer picker bottom sheet */}
      {showCustomerPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="flex-1 bg-black/40"
            onClick={() => { setShowCustomerPicker(false); setCustomerSearch(""); setShowAddCustomer(false); }}
          />
          <div className="bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: "72vh" }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0">
              <p className="flex-1 font-bold text-[#0F172A]">Select Customer</p>
              <button
                onClick={() => { setShowCustomerPicker(false); setCustomerSearch(""); setShowAddCustomer(false); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {showAddCustomer ? (
              <div className="p-4 space-y-2 flex-shrink-0">
                <p className="text-sm font-semibold text-green-700">Quick add customer</p>
                <input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Customer name *"
                  className="w-full px-3 py-2 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                />
                <input
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="w-full px-3 py-2 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAddCustomer(false); setNewCustomerName(""); setNewCustomerPhone(""); }}
                    className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomer}
                    disabled={addingCustomer || !newCustomerName.trim()}
                    className="flex-1 py-2 text-sm text-white bg-green-600 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {addingCustomer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {addingCustomer ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {customerId && (
                  <button
                    onClick={() => { setCustomer(null, null); setShowCustomerPicker(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Remove customer</span>
                  </button>
                )}
                <div className="divide-y divide-slate-100">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCustomer(c.id, c.name); setShowCustomerPicker(false); setCustomerSearch(""); }}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50", customerId === c.id && "bg-green-50")}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">{c.name}</p>
                        {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                      </div>
                      {business.loyalty_enabled && c.loyalty_points > 0 && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                          ⭐ {c.loyalty_points} pts
                        </span>
                      )}
                      {customerId === c.id && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400">No customers found</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-green-600 font-medium hover:bg-green-50 border-t border-slate-100"
                >
                  <Plus className="w-4 h-4" />
                  Add new customer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barcode scanner */}
      {showScanner && (
        <BarcodeScanner onScan={handleCameraScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Receipt modal on sale success */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          business={business}
          onClose={() => {
            setCompletedSale(null);
            setPartialAmount("");
            setReference("");
            setPaymentStatus("paid");
            setPaymentMethod("cash");
            setChannel("physical");
          }}
        />
      )}
    </div>
  );
}
