"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  ShoppingCart, Plus, Minus, X, Package, Phone, Mail, Instagram,
  CheckCircle2, Loader2, Store, Search, CreditCard, Building2, Smartphone,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.105 1.518 5.83L.057 23.25c-.07.28.176.533.457.468l5.567-1.44A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.213-3.716.961.99-3.617-.235-.372A9.818 9.818 0 1112 21.818z" />
    </svg>
  );
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  selling_price: number;
  stock_quantity: number | null;
  track_inventory: boolean;
  category_id: string | null;
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
  categories: Category[];
  orderNumber?: string;
  paymentStatus?: string;
}

export function StoreFront({ business, products, categories, orderNumber, paymentStatus }: Props) {
  const fmt = (n: number) => formatCurrency(n, business.currency);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.qty * i.product.selling_price, 0);
  const shippingFee =
    business.store_shipping_enabled
      ? business.store_free_shipping_above && cartSubtotal >= business.store_free_shipping_above
        ? 0
        : business.store_shipping_fee
      : 0;
  const cartTotal = cartSubtotal + shippingFee;

  const filteredProducts = useMemo(() =>
    products.filter((p) => {
      const matchesSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    }),
    [products, search, selectedCategory]
  );

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

  const waLink = business.social_whatsapp
    ? `https://wa.me/${business.social_whatsapp.replace(/\D/g, "")}`
    : null;

  const igLink = business.social_instagram
    ? `https://instagram.com/${business.social_instagram.replace(/^@/, "")}`
    : null;

  const succeeded = paymentStatus === "success";
  const failed = (paymentStatus as string) === "failed";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {/* Logo + Name */}
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

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                Contact Us
              </a>
            )}
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{business.currency}</span>
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
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Banners */}
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

        {/* Description */}
        {business.description && (
          <div className="text-center py-2">
            <p className="text-slate-500 text-sm max-w-xl mx-auto">{business.description}</p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find Products"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
          />
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No products available yet.</p>
          </div>
        ) : (
          <>
            {/* Heading + category filter */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-bold text-[#0F172A]">Products</h2>
              {categories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1 justify-end">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full border transition",
                      !selectedCategory
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-green-400"
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full border transition",
                        selectedCategory === cat.id
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-green-400"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No products match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const qty = getQty(product.id);
                  const oos = isOutOfStock(product);
                  return (
                    <div key={product.id} className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col", oos && "opacity-60")}>
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
            )}
          </>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-8 mt-4">
          <div className="grid sm:grid-cols-3 gap-8">
            {/* Store identity + socials */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {business.logo_url ? (
                  <Image src={business.logo_url} alt={business.name} width={32} height={32} className="rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="font-bold text-sm text-[#0F172A]">{business.name}</span>
              </div>
              {business.description && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{business.description}</p>
              )}
              <div className="flex items-center gap-3">
                {igLink && (
                  <a href={igLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-500 transition">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-green-500 transition">
                    <WhatsAppIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Learn More */}
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide mb-3">Learn More</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                {business.store_shipping_enabled && (
                  <li>
                    Delivery fee:{" "}
                    {business.store_free_shipping_above
                      ? `${fmt(business.store_shipping_fee)} · free above ${fmt(business.store_free_shipping_above)}`
                      : fmt(business.store_shipping_fee)}
                  </li>
                )}
                {business.store_delivery_note && <li className="italic">{business.store_delivery_note}</li>}
                {business.phone && (
                  <li className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 flex-shrink-0" />{business.phone}
                  </li>
                )}
                {business.email && (
                  <li className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 flex-shrink-0" />{business.email}
                  </li>
                )}
                {business.address && (
                  <li>{business.address}{business.city ? `, ${business.city}` : ""}</li>
                )}
              </ul>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide mb-3">Supported Payment Methods</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  Cards (Mastercard, Visa, Verve)
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  Bank Transfers
                </li>
                <li className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  USSD / Direct Debit
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <p>© {new Date().getFullYear()} {business.name}</p>
            <p>Powered by <span className="font-semibold text-green-600">VANTAGE</span></p>
          </div>
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
