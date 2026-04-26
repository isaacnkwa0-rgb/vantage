"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Package, Menu, WifiOff, RefreshCw } from "lucide-react";
import { ProductSearchPanel } from "./ProductSearchPanel";
import { CartPanel } from "./CartPanel";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import { useOfflineStore } from "@/store/offlineStore";
import { createClient } from "@/lib/supabase/client";

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
}

interface CompletedSale {
  id: string;
  sale_number: string;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  created_at: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  items: Array<{
    product_name: string;
    variant_name?: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

interface Props {
  products: Product[];
  customers: Customer[];
  business: Business;
  userId: string;
}

export function POSClient({ products, customers, business, userId }: Props) {
  const [showPayment, setShowPayment] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"products" | "cart">("products");
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { toggleSidebar } = useUIStore();
  const { pendingSales, removePendingSale, setOnline } = useOfflineStore();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); setOnline(true); };
    const handleOffline = () => { setIsOnline(false); setOnline(false); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  const syncPendingSales = useCallback(async () => {
    if (pendingSales.length === 0 || syncing) return;
    setSyncing(true);
    const supabase = createClient();

    for (const sale of pendingSales) {
      try {
        const { data: saleNumData } = await supabase
          .rpc("generate_sale_number", { p_business_id: sale.businessId });
        const saleNumber = saleNumData ?? `INV-${Date.now()}`;

        const { data: insertedSale, error: saleErr } = await supabase
          .from("sales")
          .insert({
            business_id: sale.businessId,
            customer_id: sale.customerId,
            sale_number: saleNumber,
            subtotal: sale.subtotal,
            discount_type: sale.discountType,
            discount_value: sale.discountValue,
            discount_amount: sale.discountAmount,
            tax_amount: sale.taxAmount,
            total_amount: sale.total,
            amount_paid: sale.amountPaid,
            change_amount: sale.changeAmount,
            payment_method: sale.paymentMethod,
            payment_reference: sale.paymentReference || null,
            payment_status: sale.paymentMethod === "credit" ? "unpaid" : "paid",
            served_by: sale.userId,
          })
          .select()
          .single();

        if (saleErr || !insertedSale) continue;

        await supabase.from("sale_items").insert(
          sale.items.map((item) => ({
            sale_id: insertedSale.id,
            business_id: sale.businessId,
            product_id: item.productId,
            variant_id: item.variantId ?? null,
            product_name: item.productName,
            variant_name: item.variantName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            cost_price: item.costPrice,
            line_total: item.unitPrice * item.quantity,
          }))
        );

        if (sale.paymentMethod === "credit" && sale.customerId) {
          const { data: cust } = await supabase
            .from("customers").select("credit_balance").eq("id", sale.customerId).single();
          await supabase.from("customers").update({
            credit_balance: (cust?.credit_balance ?? 0) + sale.total,
          }).eq("id", sale.customerId);
        }

        if (business.loyalty_enabled && sale.customerId && sale.paymentMethod !== "credit") {
          const { data: cust } = await supabase
            .from("customers").select("loyalty_points").eq("id", sale.customerId).single();
          const newPoints = Math.max(
            0,
            (cust?.loyalty_points ?? 0) + sale.loyaltyPointsToEarn - sale.loyaltyPointsToRedeem
          );
          await supabase.from("customers").update({ loyalty_points: newPoints }).eq("id", sale.customerId);
        }

        removePendingSale(sale.localId);
      } catch {
        // Leave failed sales in queue to retry
      }
    }

    setSyncing(false);
  }, [pendingSales, syncing, business.loyalty_enabled, removePendingSale]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSales.length > 0) {
      syncPendingSales();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-[#0F172A] flex-1">Point of Sale</h2>
        {pendingSales.length > 0 && (
          <button
            onClick={syncPendingSales}
            disabled={syncing || !isOnline}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg transition hover:bg-orange-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {pendingSales.length} pending
          </button>
        )}
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-orange-500 text-white text-sm font-medium py-2 px-4 flex-shrink-0">
          <WifiOff className="w-4 h-4" />
          You&apos;re offline — sales are saved locally and will sync automatically.
        </div>
      )}

      {/* Pending sync banner (online but unsyced) */}
      {isOnline && pendingSales.length > 0 && (
        <div className="hidden lg:flex items-center justify-between bg-amber-50 border-b border-amber-200 text-amber-700 text-sm px-4 py-2 flex-shrink-0">
          <span className="font-medium">{pendingSales.length} offline sale{pendingSales.length > 1 ? "s" : ""} pending sync</span>
          <button
            onClick={syncPendingSales}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
      )}

      {/* Mobile tab bar */}
      <div className="lg:hidden flex flex-shrink-0 bg-white border-b border-slate-200">
        <button
          onClick={() => setMobilePanel("products")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition ${
            mobilePanel === "products" ? "border-green-600 text-green-600" : "border-transparent text-slate-500"
          }`}
        >
          <Package className="w-4 h-4" />
          Products
        </button>
        <button
          onClick={() => setMobilePanel("cart")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition relative ${
            mobilePanel === "cart" ? "border-green-600 text-green-600" : "border-transparent text-slate-500"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Cart
          {cartCount > 0 && (
            <span className="absolute top-2 right-[calc(50%-28px)] min-w-[18px] h-[18px] bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 flex-col overflow-hidden border-r border-slate-200 ${mobilePanel === "cart" ? "hidden lg:flex" : "flex"}`}>
          <ProductSearchPanel products={products} currency={business.currency} />
        </div>

        <div className={`flex-col flex-shrink-0 bg-white w-full lg:w-96 ${mobilePanel === "products" ? "hidden lg:flex" : "flex"}`}>
          <CartPanel
            customers={customers}
            currency={business.currency}
            businessId={business.id}
            taxEnabled={business.tax_enabled}
            taxRate={business.tax_rate}
            taxName={business.tax_name}
            loyaltyEnabled={business.loyalty_enabled}
            loyaltyPointsPerDollar={business.loyalty_points_per_dollar}
            loyaltyRedemptionRate={business.loyalty_redemption_rate}
            onCheckout={() => setShowPayment(true)}
          />
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          business={business}
          userId={userId}
          customers={customers}
          loyaltyEnabled={business.loyalty_enabled}
          loyaltyPointsPerDollar={business.loyalty_points_per_dollar}
          onClose={() => setShowPayment(false)}
          onSuccess={(sale) => {
            setShowPayment(false);
            setCompletedSale(sale);
          }}
        />
      )}

      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          business={business}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}
