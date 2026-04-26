"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Minus, ShoppingBag, Tag, UserCheck, X, ChevronDown, Star } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  loyalty_points: number;
}

interface Props {
  customers: Customer[];
  currency: string;
  businessId: string;
  taxEnabled: boolean;
  taxRate: number;
  taxName: string;
  loyaltyEnabled: boolean;
  loyaltyPointsPerDollar: number;
  loyaltyRedemptionRate: number;
  onCheckout: () => void;
  mode?: "selling" | "service";
}

export function CartPanel({
  customers, currency, businessId, taxEnabled, taxRate, taxName,
  loyaltyEnabled, loyaltyPointsPerDollar, loyaltyRedemptionRate,
  onCheckout, mode = "selling",
}: Props) {
  const router = useRouter();
  const {
    items, removeItem, updateQuantity, setDiscount, setCustomer,
    discountType, discountValue, customerId, customerName,
    subtotal, discountAmount, taxAmount, loyaltyDiscountValue, total,
    clearCart, setTaxConfig, setLoyaltyRedemption, loyaltyPointsToRedeem,
  } = useCartStore();

  useEffect(() => {
    setTaxConfig(taxEnabled, taxRate, taxName);
  }, [taxEnabled, taxRate, taxName, setTaxConfig]);

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(discountValue.toString());
  const [discountTypeInput, setDiscountTypeInput] = useState<"percent" | "fixed">(discountType ?? "percent");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  const fmt = (n: number) => formatCurrency(n, currency);
  const sub = subtotal();
  const disc = discountAmount();
  const tax = taxAmount();
  const loyaltyDisc = loyaltyDiscountValue();
  const tot = total();

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const availablePoints = selectedCustomer?.loyalty_points ?? 0;
  const pointsToEarn = loyaltyEnabled && customerId ? Math.floor(tot * loyaltyPointsPerDollar) : 0;
  const maxRedeemablePoints = Math.min(availablePoints, Math.floor((sub - disc + tax) * loyaltyRedemptionRate));
  const canRedeem = loyaltyEnabled && availablePoints >= loyaltyRedemptionRate && !!customerId;

  function toggleLoyaltyRedemption() {
    if (loyaltyPointsToRedeem > 0) {
      setLoyaltyRedemption(0, loyaltyRedemptionRate);
    } else {
      setLoyaltyRedemption(maxRedeemablePoints, loyaltyRedemptionRate);
    }
  }

  // Reset loyalty redemption when customer changes
  useEffect(() => {
    setLoyaltyRedemption(0, loyaltyRedemptionRate);
  }, [customerId, loyaltyRedemptionRate, setLoyaltyRedemption]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone ?? "").includes(customerSearch)
  );

  function applyDiscount() {
    const val = parseFloat(discountInput) || 0;
    setDiscount(val > 0 ? discountTypeInput : null, val);
    setShowDiscount(false);
  }

  async function addNewCustomer() {
    if (!newCustomerName.trim()) return;
    setAddingCustomer(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("customers")
      .insert({ business_id: businessId, name: newCustomerName.trim(), phone: newCustomerPhone || null })
      .select("id, name, loyalty_points")
      .single();
    if (data) {
      setCustomer(data.id, data.name);
      setShowAddCustomer(false);
      setShowCustomerSearch(false);
    }
    setAddingCustomer(false);
    router.refresh();
  }

  const isService = mode === "service";

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-4 border-b border-slate-200">
          <h2 className="font-bold text-[#0F172A]">{isService ? "Session" : "Cart"}</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <ShoppingBag className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">{isService ? "No services added" : "Cart is empty"}</p>
          <p className="text-slate-400 text-sm mt-1">{isService ? "Tap a service to add it" : "Tap a product to add it"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 className="font-bold text-[#0F172A]">
          {isService ? "Session" : "Cart"} <span className="text-green-500">({items.reduce((s, i) => s + i.quantity, 0)})</span>
        </h2>
        <button onClick={clearCart} className="text-xs text-red-500 hover:underline">
          Clear all
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {items.map((item) => (
          <div key={item.variantId ?? item.productId} className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A] truncate">{item.name}</p>
                {item.variantName && <p className="text-xs text-slate-400">{item.variantName}</p>}
                <p className="font-numeric text-sm text-green-600 font-semibold mt-0.5">{fmt(item.unitPrice)}</p>
              </div>
              <button
                onClick={() => removeItem(item.productId, item.variantId)}
                className="p-1 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                  className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:border-green-400 transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-numeric text-sm font-semibold w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                  className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:border-green-400 transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <span className="font-numeric text-sm font-bold text-[#0F172A]">
                {fmt(item.unitPrice * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Customer + Discount + Loyalty */}
      <div className="px-3 py-2 space-y-2 border-t border-slate-100">
        {/* Customer selector */}
        <div className="relative">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
            onKeyDown={(e) => e.key === "Enter" && setShowCustomerSearch((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-left hover:border-green-400 transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className={customerId ? "text-[#0F172A] font-medium" : "text-slate-400"}>
              {customerId ? customerName : isService ? "Add client (optional)" : "Add customer (optional)"}
            </span>
            {customerId ? (
              <button
                onClick={(e) => { e.stopPropagation(); setCustomer(null, null); }}
                className="ml-auto p-0.5 rounded hover:bg-slate-200 transition"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <ChevronDown className="ml-auto w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          {showCustomerSearch && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
              <div className="p-2 border-b border-slate-100">
                <input
                  autoFocus
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCustomer(c.id, c.name); setShowCustomerSearch(false); setCustomerSearch(""); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-slate-50 text-left text-sm"
                >
                  <div>
                    <span className="font-medium text-[#0F172A]">{c.name}</span>
                    {c.phone && <span className="text-slate-400 text-xs ml-2">{c.phone}</span>}
                  </div>
                  {loyaltyEnabled && c.loyalty_points > 0 && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                      ⭐ {c.loyalty_points} pts
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowAddCustomer(true)}
                className="w-full px-3 py-2.5 text-sm text-green-500 font-medium hover:bg-green-50 flex items-center gap-2 border-t border-slate-100"
              >
                + Add new customer
              </button>
            </div>
          )}
        </div>

        {/* Loyalty points row (shown when customer selected and loyalty enabled) */}
        {customerId && loyaltyEnabled && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700">{availablePoints} pts available</p>
                <p className="text-[10px] text-amber-600">+{pointsToEarn} pts on this sale</p>
              </div>
            </div>
            {canRedeem && (
              <button
                onClick={toggleLoyaltyRedemption}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-lg font-semibold transition flex-shrink-0",
                  loyaltyPointsToRedeem > 0
                    ? "bg-amber-500 text-white"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                )}
              >
                {loyaltyPointsToRedeem > 0
                  ? `✓ -{fmt(loyaltyDisc)}`
                  : `Redeem (-${fmt(maxRedeemablePoints / loyaltyRedemptionRate)})`}
              </button>
            )}
          </div>
        )}

        {/* Add customer mini form */}
        {showAddCustomer && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-green-700">Quick add customer</p>
            <input
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="Customer name *"
              className="w-full px-2.5 py-1.5 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
            <input
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full px-2.5 py-1.5 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddCustomer(false)} className="flex-1 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg bg-white">Cancel</button>
              <button onClick={addNewCustomer} disabled={addingCustomer} className="flex-1 py-1.5 text-xs text-white bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-60">
                {addingCustomer ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        {/* Discount */}
        {!showDiscount ? (
          <button
            onClick={() => setShowDiscount(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition"
          >
            <Tag className="w-4 h-4" />
            {disc > 0 ? `Discount applied: -${fmt(disc)}` : "Add discount"}
          </button>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <select
                value={discountTypeInput}
                onChange={(e) => setDiscountTypeInput(e.target.value as "percent" | "fixed")}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="percent">%</option>
                <option value="fixed">Fixed</option>
              </select>
              <input
                type="number"
                min="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0"
                className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-numeric"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDiscount(null, 0); setShowDiscount(false); }} className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-500">Remove</button>
              <button onClick={applyDiscount} className="flex-1 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">Apply</button>
            </div>
          </div>
        )}
      </div>

      {/* Totals + Checkout */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-200 space-y-1.5">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Subtotal</span>
          <span className="font-numeric">{fmt(sub)}</span>
        </div>
        {disc > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discount</span>
            <span className="font-numeric">-{fmt(disc)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-sm text-amber-600">
            <span>{taxName} ({taxRate}%)</span>
            <span className="font-numeric">+{fmt(tax)}</span>
          </div>
        )}
        {loyaltyDisc > 0 && (
          <div className="flex justify-between text-sm text-amber-500">
            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Loyalty</span>
            <span className="font-numeric">-{fmt(loyaltyDisc)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-[#0F172A] pt-1 border-t border-slate-100">
          <span>Total</span>
          <span className="font-numeric text-green-600">{fmt(tot)}</span>
        </div>

        <button
          onClick={onCheckout}
          className="w-full mt-2 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3.5 rounded-xl transition text-base shadow-lg shadow-green-300/50 active:scale-[0.98]"
        >
          Charge {fmt(tot)}
        </button>
      </div>
    </div>
  );
}
