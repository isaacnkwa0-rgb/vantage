"use client";

import { useState } from "react";
import { ShoppingCart, Package, Menu } from "lucide-react";
import { ProductSearchPanel } from "./ProductSearchPanel";
import { CartPanel } from "./CartPanel";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";

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
        <h2 className="font-bold text-[#0F172A] flex-1">Point of Sale</h2>
      </div>

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
        {/* Left: Product search */}
        <div className={`flex-1 flex-col overflow-hidden border-r border-slate-200 ${mobilePanel === "cart" ? "hidden lg:flex" : "flex"}`}>
          <ProductSearchPanel products={products} currency={business.currency} />
        </div>

        {/* Right: Cart */}
        <div className={`flex-col flex-shrink-0 bg-white w-full lg:w-96 ${mobilePanel === "products" ? "hidden lg:flex" : "flex"}`}>
          <CartPanel
            customers={customers}
            currency={business.currency}
            businessId={business.id}
            taxEnabled={business.tax_enabled}
            taxRate={business.tax_rate}
            taxName={business.tax_name}
            onCheckout={() => setShowPayment(true)}
          />
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          business={business}
          userId={userId}
          customers={customers}
          onClose={() => setShowPayment(false)}
          onSuccess={(sale) => {
            setShowPayment(false);
            setCompletedSale(sale);
          }}
        />
      )}

      {/* Receipt modal */}
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
