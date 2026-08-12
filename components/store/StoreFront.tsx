"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, X, Package, MapPin, Phone, Mail, Instagram, CheckCircle2, Loader2, Store } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  selling_price: number;
  stock_quantity: number | null;
  track_inventory: boolean;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  social_whatsapp: string | null;
  social_instagram: string | null;
  store_shipping_enabled: boolean;
  store_shipping_fee: number;
  store_free_shipping_above: number | null;
  store_delivery_note: string | null;
}

interface CartItem {
  product: Product;
  qty: number;
}

interface Props {
  business: Business;
  products: Product[];
  orderNumber?: string;
  paymentStatus?: string;
}

export function StoreFront({ business, products, orderNumber, paymentStatus }: Props) {
  const fmt = (n: number) => formatCurrency(n, business.currency);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [processing, setProcessing] = useState(false);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.qty * i.product.selling_price, 0);
  const shippingFee =
    business.store_shipping_enabled
      ? business.store_free_shipping_above && cartSubtotal >= business.store_free_shipping_above
        ? 0
        : business.store_shipping_fee
      : 0;
  const cartTotal = cartSubtotal + shippingFee;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  }

  function getQty(productId: string) {
    return cart.find((i) => i.product.id === productId)?.qty ?? 0;
  }

  function isOutOfStock(p: Product) {
    return p.track_inventory && (p.stock_quantity ?? 0) <= 0;
  }

  async function checkout() {
    if (!form.name.trim() || !form.email.trim() || cart.length === 0) return;
    setProcessing(true);

    const res = await fetch("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        businessSlug: business.slug,
        customer: form,
        items: cart.map((i) => ({ productId: i.product.id, name: i.product.name, price: i.product.selling_price, quantity: i.qty })),
        subtotal: cartSubtotal,
        shippingFee,
        total: cartTotal,
      }),
    });

    const data = await res.json();
    setProcessing(false);
    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
    }
  }

  const succeeded = paymentStatus === "success";
  const failed = (paymentStatus as string) === "failed";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <Image src={business.logo_url} alt={business.name} width={40} height={40} className="rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-base font-extrabold text-[#0F172A] tracking-tight">{business.name}</h1>
              {business.city && <p className="text-xs text-slate-400">{business.city}</p>}
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Success / failure banners */}
        {succeeded && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700">Order placed successfully!</p>
              {orderNumber && <p className="text-xs text-green-600 mt-0.5">Order #{orderNumber} — a confirmation will be sent to your email.</p>}
            </div>
          </div>
        )}
        {failed && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700">Payment failed. Please try again.</p>
          </div>
        )}

        {/* Hero / description */}
        {business.description && (
          <div className="text-center py-4">
            <p className="text-slate-500 text-sm max-w-xl mx-auto">{business.description}</p>
          </div>
        )}

        {/* Products */}
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No products available yet.</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-[#0F172A]">Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const qty = getQty(product.id);
                const oos = isOutOfStock(product);
                return (
                  <div key={product.id} className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col", oos && "opacity-60")}>
                    {/* Image */}
                    <div className="aspect-square bg-slate-100 relative">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <p className="text-sm font-semibold text-[#0F172A] leading-tight">{product.name}</p>
                      {product.description && <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>}
                      <div className="mt-auto">
                        <p className="font-numeric font-bold text-green-700 text-base">{fmt(product.selling_price)}</p>
                        {oos ? (
                          <span className="text-xs text-red-500 font-medium">Out of stock</span>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="mt-2 w-full py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <div className="mt-2 flex items-center gap-2 justify-between">
                            <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold text-[#0F172A]">{qty}</span>
                            <button onClick={() => updateQty(product.id, 1)} className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center hover:bg-green-700 transition">
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer info */}
        <footer className="border-t border-slate-200 pt-8 grid sm:grid-cols-3 gap-4 text-sm text-slate-500">
          {business.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />{business.address}{business.city ? `, ${business.city}` : ""}</p>}
          {business.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0 text-slate-400" />{business.phone}</p>}
          {business.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0 text-slate-400" />{business.email}</p>}
        </footer>
      </main>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0F172A]">Your Cart</h3>
              <button onClick={() => setCartOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <ShoppingCart className="w-10 h-10 text-slate-300" />
                <p className="text-sm text-slate-400">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.product.image_url
                          ? <Image src={item.product.image_url} alt={item.product.name} width={48} height={48} className="object-cover w-full h-full" />
                          : <Package className="w-5 h-5 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-400">{fmt(item.product.selling_price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center hover:bg-slate-200 transition">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center hover:bg-green-700 transition">
                          <Plus className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <p className="font-numeric text-sm font-bold text-[#0F172A] w-16 text-right">{fmt(item.qty * item.product.selling_price)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0F172A]">Total</p>
                    <p className="font-numeric text-lg font-bold text-green-700">{fmt(cartTotal)}</p>
                  </div>
                  <button
                    onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-sm"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Checkout</h3>
              <button onClick={() => setCheckoutOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order summary */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-1">
              {cart.map((i) => (
                <div key={i.product.id} className="flex justify-between text-xs text-slate-600">
                  <span>{i.product.name} × {i.qty}</span>
                  <span className="font-numeric font-semibold">{fmt(i.qty * i.product.selling_price)}</span>
                </div>
              ))}
              {business.store_shipping_enabled && (
                <div className="flex justify-between text-xs text-slate-500 border-t border-slate-200 mt-1 pt-1">
                  <span>Delivery fee{shippingFee === 0 ? " (free!)" : ""}</span>
                  <span className="font-numeric">{shippingFee === 0 ? "Free" : fmt(shippingFee)}</span>
                </div>
              )}
              {business.store_free_shipping_above && shippingFee > 0 && (
                <p className="text-xs text-green-600">Free delivery on orders above {fmt(business.store_free_shipping_above)}</p>
              )}
              <div className="flex justify-between text-sm font-bold text-[#0F172A] border-t border-slate-200 mt-2 pt-2">
                <span>Total</span>
                <span className="font-numeric text-green-700">{fmt(cartTotal)}</span>
              </div>
              {business.store_delivery_note && (
                <p className="text-xs text-slate-400 italic">{business.store_delivery_note}</p>
              )}
            </div>

            <div className="space-y-3">
              {[
                { label: "Full Name *", key: "name", type: "text", placeholder: "John Doe" },
                { label: "Email Address *", key: "email", type: "email", placeholder: "you@email.com" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "+234..." },
                { label: "Delivery Address", key: "address", type: "text", placeholder: "Street, City" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={checkout}
              disabled={processing || !form.name.trim() || !form.email.trim()}
              className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ${fmt(cartTotal)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
