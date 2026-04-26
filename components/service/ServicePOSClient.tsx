"use client";

import { useState } from "react";
import { Scissors, ShoppingCart, Menu } from "lucide-react";
import { ServiceSearchPanel } from "./ServiceSearchPanel";
import { CartPanel } from "@/components/pos/CartPanel";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";

interface Service {
  id: string;
  name: string;
  selling_price: number;
  cost_price: number;
  image_url: string | null;
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
  services: Service[];
  customers: Customer[];
  business: Business;
  userId: string;
}

export function ServicePOSClient({ services, customers, business, userId }: Props) {
  const [showPayment, setShowPayment] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"services" | "session">("services");
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { toggleSidebar } = useUIStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile header with hamburger */}
      <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-[#0F172A] flex-1">Record Service</h2>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden flex flex-shrink-0 bg-white border-b border-slate-200">
        <button
          onClick={() => setMobilePanel("services")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition ${
            mobilePanel === "services" ? "border-green-600 text-green-600" : "border-transparent text-slate-500"
          }`}
        >
          <Scissors className="w-4 h-4" />
          Services
        </button>
        <button
          onClick={() => setMobilePanel("session")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition relative ${
            mobilePanel === "session" ? "border-green-600 text-green-600" : "border-transparent text-slate-500"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Session
          {cartCount > 0 && (
            <span className="absolute top-2 right-[calc(50%-28px)] min-w-[18px] h-[18px] bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Service selector */}
        <div className={`flex-1 flex-col overflow-hidden border-r border-slate-200 ${mobilePanel === "session" ? "hidden lg:flex" : "flex"}`}>
          <ServiceSearchPanel services={services} currency={business.currency} />
        </div>

        {/* Right: Session/Cart */}
        <div className={`flex-col flex-shrink-0 bg-white w-full lg:w-96 ${mobilePanel === "services" ? "hidden lg:flex" : "flex"}`}>
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
            mode="service"
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
