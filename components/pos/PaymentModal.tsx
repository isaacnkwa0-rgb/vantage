"use client";

import { useState } from "react";
import { X, Loader2, Banknote, CreditCard, ArrowLeftRight, BookOpen, WifiOff } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useOfflineStore } from "@/store/offlineStore";
import { formatCurrency } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";

interface Business {
  id: string;
  name: string;
  currency: string;
  phone: string | null;
  address: string | null;
}

interface Props {
  business: Business;
  userId: string;
  customers: Array<{ id: string; name: string; phone: string | null; loyalty_points?: number }>;
  loyaltyEnabled: boolean;
  loyaltyPointsPerDollar: number;
  onClose: () => void;
  onSuccess: (sale: any) => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { value: "credit", label: "Credit", icon: BookOpen },
];

export function PaymentModal({ business, userId, customers, loyaltyEnabled, loyaltyPointsPerDollar, onClose, onSuccess }: Props) {
  const {
    items, discountType, discountValue, discountAmount, customerId, customerName,
    subtotal, taxAmount, total, clearCart, loyaltyPointsToRedeem,
  } = useCartStore();

  const { addPendingSale } = useOfflineStore();

  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [amountPaid, setAmountPaid] = useState(total().toFixed(2));
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tot = total();
  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - tot);
  const fmt = (n: number) => formatCurrency(n, business.currency);
  const isCredit = paymentMethod === "credit";
  const pointsToEarn = loyaltyEnabled && customerId && !isCredit ? Math.floor(tot * loyaltyPointsPerDollar) : 0;

  async function handleCharge() {
    if (isCredit && !customerId) {
      setError("Select a customer to record a credit sale");
      return;
    }
    if (paid < tot && paymentMethod === "cash") {
      setError("Amount paid cannot be less than total");
      return;
    }
    setError(null);
    setLoading(true);

    const sub = subtotal();
    const disc = discountAmount();
    const taxAmt = taxAmount();
    const customerObj = customers.find((c) => c.id === customerId);

    // Offline path — queue the sale for later sync
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
        taxAmount: taxAmt,
        total: tot,
        amountPaid: isCredit ? 0 : paid,
        changeAmount: isCredit ? 0 : change,
        paymentMethod,
        paymentReference: reference,
        loyaltyPointsToEarn: pointsToEarn,
        loyaltyPointsToRedeem,
        createdAt: new Date().toISOString(),
      });

      const offlineId = `OFFLINE-${Date.now()}`;
      clearCart();
      onSuccess({
        id: offlineId,
        sale_number: offlineId,
        total_amount: tot,
        amount_paid: isCredit ? 0 : paid,
        change_amount: isCredit ? 0 : change,
        payment_method: paymentMethod,
        subtotal: sub,
        discount_amount: disc,
        tax_amount: taxAmt,
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

    const { data: saleNumData } = await supabase
      .rpc("generate_sale_number", { p_business_id: business.id });

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
        tax_amount: taxAmt,
        total_amount: tot,
        amount_paid: isCredit ? 0 : paid,
        change_amount: isCredit ? 0 : change,
        payment_method: paymentMethod,
        payment_reference: reference || null,
        payment_status: isCredit ? "unpaid" : "paid",
        served_by: userId,
      })
      .select()
      .single();

    if (saleErr || !sale) {
      setError(saleErr?.message ?? "Failed to record sale");
      setLoading(false);
      return;
    }

    const { error: itemsErr } = await supabase.from("sale_items").insert(
      items.map((item) => ({
        sale_id: sale.id,
        business_id: business.id,
        product_id: item.productId,
        variant_id: item.variantId ?? null,
        product_name: item.name,
        variant_name: item.variantName ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.costPrice,
        line_total: item.unitPrice * item.quantity,
      }))
    );

    if (itemsErr) {
      setError(itemsErr.message);
      setLoading(false);
      return;
    }

    if (isCredit && customerId) {
      const { data: cust } = await supabase
        .from("customers").select("credit_balance").eq("id", customerId).single();
      await supabase.from("customers").update({
        credit_balance: (cust?.credit_balance ?? 0) + tot,
      }).eq("id", customerId);
    }

    if (loyaltyEnabled && customerId && !isCredit) {
      const { data: cust } = await supabase
        .from("customers").select("loyalty_points").eq("id", customerId).single();
      const newPoints = Math.max(0, (cust?.loyalty_points ?? 0) + pointsToEarn - loyaltyPointsToRedeem);
      await supabase.from("customers").update({ loyalty_points: newPoints }).eq("id", customerId);
    }

    clearCart();
    onSuccess({
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-[#0F172A]">Collect Payment</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!navigator.onLine && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-3 py-2 rounded-lg">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              Offline — sale will be saved locally and synced when connected.
            </div>
          )}

          <div className="bg-[#0F172A] rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm">Amount Due</p>
            <p className="font-numeric text-3xl font-bold text-white mt-1">{fmt(tot)}</p>
            {discountAmount() > 0 && (
              <p className="text-emerald-400 text-xs mt-1">Discount: -{fmt(discountAmount())}</p>
            )}
            {loyaltyEnabled && pointsToEarn > 0 && (
              <p className="text-amber-400 text-xs mt-1">+{pointsToEarn} loyalty pts to earn</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[#0F172A] mb-2">Payment Method</p>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 border-2 rounded-xl text-xs font-medium transition ${
                    paymentMethod === m.value
                      ? "border-green-600 bg-green-600 text-white shadow-md shadow-green-200"
                      : "border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600"
                  }`}
                >
                  <m.icon className="w-5 h-5" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {isCredit && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-3 py-2 rounded-lg">
              {customerId
                ? `Sale will be recorded as unpaid — added to ${customers.find((c) => c.id === customerId)?.name ?? "customer"}'s balance.`
                : "Select a customer above before using Credit payment."}
            </div>
          )}

          {paymentMethod === "cash" && (
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Amount Received
              </label>
              <input
                type="number"
                step="0.01"
                min={tot}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-lg font-numeric font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
              />
              {change > 0 && (
                <div className="mt-2 bg-emerald-50 text-emerald-700 text-sm font-semibold px-3 py-2 rounded-lg text-center">
                  Change: <span className="font-numeric">{fmt(change)}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod !== "cash" && !isCredit && (
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Reference / Transaction ID{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. TXN123456"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <button
            onClick={handleCharge}
            disabled={loading}
            className="w-full bg-gradient-to-b from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-4 rounded-xl transition text-base flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green-300/50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Processing..." : `Confirm Payment ${fmt(tot)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
