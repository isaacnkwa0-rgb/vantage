"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  ShoppingBag, X, Package, Phone, Mail, Instagram,
  CheckCircle2, Loader2, Search, ChevronLeft, ChevronRight,
  Landmark, CreditCard, Copy, Check, ChevronDown, ChevronUp, Menu, Layers, Share2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const CURRENCY_FLAGS: Record<string, string> = {
  NGN: "🇳🇬", USD: "🇺🇸", GBP: "🇬🇧", EUR: "🇪🇺",
  GHS: "🇬🇭", KES: "🇰🇪", ZAR: "🇿🇦", EGP: "🇪🇬", CAD: "🇨🇦", AUD: "🇦🇺",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.105 1.518 5.83L.057 23.25c-.07.28.176.533.457.468l5.567-1.44A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.213-3.716.961.99-3.617-.235-.372A9.818 9.818 0 1112 21.818z" />
    </svg>
  );
}

interface Category { id: string; name: string; }

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  selling_price: number;
  stock_quantity: number | null;
  track_inventory: boolean;
  category_id: string | null;
  sku?: string | null;
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
  invoice_accent_color: string | null;
  store_banner_url?: string | null;
  store_welcome_text?: string | null;
  store_all_items_image_url?: string | null;
}

interface BankAccount {
  account_name: string;
  bank_name: string;
  account_number: string;
}

interface BundleItem {
  quantity: number;
  products: { name: string } | null;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  bundle_items: BundleItem[];
}

interface CartItem { product: Product; qty: number; }
interface BundleCartItem { bundle: Bundle; qty: number; }

interface BankTransferResult {
  orderNumber: string;
  bankDetails: BankAccount | null;
  total: number;
}

interface Props {
  business: Business;
  products: Product[];
  categories: Category[];
  bankAccount?: BankAccount | null;
  orderNumber?: string;
  paymentStatus?: string;
  bundles?: Bundle[];
  randomAllItemsImage?: string | null;
}

export function StoreFront({ business, products, categories, bankAccount, orderNumber, paymentStatus, bundles = [], randomAllItemsImage }: Props) {
  const fmt = (n: number) => formatCurrency(n, business.currency);
  const brand = business.invoice_accent_color || "#F2542D";
  const flag = CURRENCY_FLAGS[business.currency] ?? "";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [bundleCart, setBundleCart] = useState<BundleCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "bank_transfer">("paystack");
  const [bankTransferResult, setBankTransferResult] = useState<BankTransferResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0) + bundleCart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.qty * i.product.selling_price, 0) + bundleCart.reduce((s, i) => s + i.qty * i.bundle.price, 0);
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
      const matchesCategory = !selectedCategory || selectedCategory.split(",").includes(p.category_id ?? "");
      return matchesSearch && matchesCategory;
    }),
    [products, search, selectedCategory]
  );

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const pagedProducts = filteredProducts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, selectedCategory]);
  useEffect(() => { setShowFullDesc(false); }, [selectedProduct]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => i.product.id === productId ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0)
    );
  }

  function getQty(productId: string) {
    return cart.find((i) => i.product.id === productId)?.qty ?? 0;
  }

  function isOutOfStock(p: Product) {
    return p.track_inventory && (p.stock_quantity ?? 0) <= 0;
  }

  function addBundleToCart(bundle: Bundle) {
    setBundleCart((prev) => {
      const existing = prev.find((i) => i.bundle.id === bundle.id);
      if (existing) return prev.map((i) => i.bundle.id === bundle.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { bundle, qty: 1 }];
    });
  }

  function updateBundleQty(bundleId: string, delta: number) {
    setBundleCart((prev) =>
      prev.map((i) => i.bundle.id === bundleId ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0)
    );
  }

  function getBundleQty(bundleId: string) {
    return bundleCart.find((i) => i.bundle.id === bundleId)?.qty ?? 0;
  }

  function categoryCount(catId: string): number {
    return products.filter(p => catId.split(",").includes(p.category_id ?? "")).length;
  }

  async function checkout() {
    if (!form.name.trim() || !form.email.trim() || cart.length === 0) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          businessSlug: business.slug,
          customer: form,
          items: [
            ...cart.map((i) => ({ productId: i.product.id, name: i.product.name, price: i.product.selling_price, quantity: i.qty })),
            ...bundleCart.map((i) => ({ productId: null, name: i.bundle.name, price: i.bundle.price, quantity: i.qty })),
          ],
          subtotal: cartSubtotal,
          shippingFee,
          total: cartTotal,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else if (data.bankTransfer) {
        setCheckoutOpen(false);
        setBankTransferResult({ orderNumber: data.orderNumber, bankDetails: data.bankDetails, total: cartTotal });
        setCart([]);
        setBundleCart([]);
      } else {
        toast.error(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setProcessing(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const waLink = business.social_whatsapp
    ? `https://wa.me/${business.social_whatsapp.replace(/\D/g, "")}`
    : null;
  const igLink = business.social_instagram
    ? `https://instagram.com/${business.social_instagram.replace(/^@/, "")}`
    : null;

  const succeeded = paymentStatus === "success";
  const failed = (paymentStatus as string) === "failed";

  function logoMark(size: number) {
    if (business.logo_url) {
      return (
        <Image
          src={business.logo_url}
          alt={business.name}
          width={size}
          height={size}
          className="object-cover flex-shrink-0"
          style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
        />
      );
    }
    return (
      <div
        className="flex items-center justify-center text-white font-extrabold tracking-tight flex-shrink-0"
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.22), backgroundColor: brand, fontSize: Math.round(size * 0.38) }}
      >
        {business.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  function pillStyle(active: boolean) {
    return active
      ? { backgroundColor: brand, color: "#fff", borderColor: brand }
      : { backgroundColor: "#fff", color: "#64748b", borderColor: "#e2e8f0" };
  }

  const allItemsImage = business.store_all_items_image_url ?? randomAllItemsImage ?? products.find(p => p.image_url)?.image_url ?? null;

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── STICKY HEADER ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        {/* Mobile-only top strip: WhatsApp + currency */}
        <div className="md:hidden flex items-center justify-between px-4 h-[40px] border-b border-slate-100 text-[13px]">
          {waLink ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-[#111]">
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
              Contact Us
            </a>
          ) : <span />}
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            {flag && <span>{flag}</span>}
            <span>{business.currency}</span>
          </span>
        </div>

        {/* Mobile row: 3-col grid — hamburger | centered logo | search+cart */}
        <div className="md:hidden grid grid-cols-3 items-center px-3 h-[60px]">
          <div className="flex items-center">
            <button onClick={() => setMenuOpen(true)} className="p-2 text-slate-700">
              <Menu className="w-7 h-7" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.name}
                width={160}
                height={52}
                className="object-contain"
                style={{ height: 52, width: "auto", maxWidth: 180 }}
              />
            ) : (
              <div
                className="flex items-center justify-center text-white font-extrabold tracking-tight flex-shrink-0"
                style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: brand, fontSize: 20 }}
              >
                {business.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setCartOpen(true)} className="relative p-2 text-slate-700">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ minWidth: 17, height: 17, borderRadius: 9, backgroundColor: brand, padding: "0 3px" }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop row */}
        <div className="hidden md:flex max-w-7xl mx-auto px-8 py-3 items-center gap-3">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {logoMark(36)}
            <span className="font-extrabold text-sm text-[#111] tracking-tight">{business.name}</span>
          </div>
          <div className="flex-1 relative mx-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}55`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
              {flag && <span>{flag}</span>}
              <span>{business.currency}</span>
            </span>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-opacity hover:opacity-80"
                style={{ color: brand, borderColor: brand, backgroundColor: `${brand}12` }}>
                <WhatsAppIcon className="w-3.5 h-3.5" />
                Contact Us
              </a>
            )}
            <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ minWidth: 18, height: 18, borderRadius: 9, backgroundColor: brand, padding: "0 4px" }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: 250 }}>
        {/* Background */}
        {business.store_banner_url ? (
          <Image src={business.store_banner_url} alt="" fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${brand}cc 0%, ${brand}88 100%)` }} />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 px-5 pb-[40px] flex flex-col justify-between items-center pt-20">
          {(business.store_welcome_text || business.name) && (
            <h1 className="text-[24px] font-semibold text-white leading-tight text-center w-full">
              {business.store_welcome_text || `Welcome to ${business.name}`}
            </h1>
          )}

          {/* Hardcoded search field */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="mobile-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find Products"
              className="w-full pl-10 pr-4 py-3 bg-white rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none shadow-sm"
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}55`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-5">

        {/* Payment banners */}
        {succeeded && (
          <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700">Order placed successfully!</p>
              {orderNumber && <p className="text-xs text-green-600 mt-0.5">Order #{orderNumber} — confirmation sent to your email.</p>}
            </div>
          </div>
        )}
        {failed && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700">Payment failed. Please try again.</p>
          </div>
        )}

        {/* ── BUNDLES SECTION ── */}
        {bundles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4" style={{ color: brand }} />
              <h2 className="text-base font-bold text-[#111]">Special Bundles</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {bundles.map((bundle) => {
                const bQty = getBundleQty(bundle.id);
                const itemNames = bundle.bundle_items.map((bi) => bi.products?.name).filter(Boolean).join(", ");
                return (
                  <div key={bundle.id} className="flex-shrink-0 w-44 sm:w-52 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-video bg-slate-50 overflow-hidden">
                      {bundle.image_url ? (
                        <Image src={bundle.image_url} alt={bundle.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="w-8 h-8 text-slate-200" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: brand }}>
                        Bundle
                      </span>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1 leading-snug mb-0.5">{bundle.name}</p>
                      {itemNames && (
                        <p className="text-[11px] text-slate-400 mb-1.5 line-clamp-2 leading-snug">{itemNames}</p>
                      )}
                      <p className="text-sm font-bold mb-2" style={{ color: brand }}>{fmt(bundle.price)}</p>
                      <div className="mt-auto">
                        {bQty === 0 ? (
                          <button
                            onClick={() => addBundleToCart(bundle)}
                            className="w-full py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95"
                            style={{ color: brand, borderColor: brand }}
                          >
                            Add To Cart
                          </button>
                        ) : (
                          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: brand }}>
                            <button onClick={() => updateBundleQty(bundle.id, -1)} className="flex-1 py-1 text-base font-bold hover:bg-slate-50 transition" style={{ color: brand }}>−</button>
                            <span className="px-2 py-1 text-xs font-bold flex items-center justify-center border-l border-r" style={{ color: brand, borderColor: brand }}>{bQty}</span>
                            <button onClick={() => updateBundleQty(bundle.id, 1)} className="flex-1 py-1 text-base font-bold text-white transition" style={{ backgroundColor: brand }}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="py-32 text-center">
            <Package className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400">No products available yet.</p>
          </div>
        ) : (
          <>
            {/* ── ALL ITEMS CARD ── */}
            <button
              onClick={() => { setSelectedCategory(null); setSearch(""); }}
              className="w-full mb-4 rounded-2xl overflow-hidden relative text-left shadow-sm"
              style={{ height: 180 }}
            >
              {/* Background image */}
              {allItemsImage ? (
                <Image src={allItemsImage} alt="" fill className="object-cover object-center" />
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${brand}cc 0%, ${brand}66 100%)` }} />
              )}
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Circle check icon top-right */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              {/* Text bottom-left */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                <p className="text-base font-bold text-white">All Items</p>
                <p className="text-xs text-white/80">{products.length} Item{products.length !== 1 ? "s" : ""} Available</p>
              </div>
            </button>

            {/* ── CATEGORY DROPDOWN ── */}
            {categories.length > 0 && (
              <div className="relative mb-4">
                <button
                  onClick={() => setCatDropdownOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-[#111] shadow-sm"
                >
                  <span>{selectedCategory ? (categories.find(c => c.id === selectedCategory)?.name ?? "All") : "All Categories"}</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", catDropdownOpen && "rotate-180")} />
                </button>
                {catDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCatDropdownOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={() => { setSelectedCategory(null); setCatDropdownOpen(false); }}
                        className={cn("w-full text-left px-4 py-3 text-sm font-semibold border-b border-slate-100 transition", !selectedCategory ? "text-white" : "text-[#111] hover:bg-slate-50")}
                        style={!selectedCategory ? { backgroundColor: brand } : {}}
                      >
                        All <span className="opacity-60 ml-1">({products.length})</span>
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setSelectedCategory(cat.id); setCatDropdownOpen(false); }}
                          className={cn("w-full text-left px-4 py-3 text-sm font-semibold border-b border-slate-100 last:border-0 transition", selectedCategory === cat.id ? "text-white" : "text-[#111] hover:bg-slate-50")}
                          style={selectedCategory === cat.id ? { backgroundColor: brand } : {}}
                        >
                          {cat.name} <span className="opacity-60 ml-1">({categoryCount(cat.id)})</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}


            {/* ── PRODUCTS HEADING ── */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111]">
                {selectedCategory ? (categories.find(c => c.id === selectedCategory)?.name ?? "Products") : "All Products"}
                <span className="ml-1.5 text-sm font-normal text-slate-400">({filteredProducts.length})</span>
              </h2>
              {search && (
                <button onClick={() => setSearch("")} className="text-xs text-slate-400 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {pagedProducts.length === 0 ? (
              <div className="py-24 text-center">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No products match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {pagedProducts.map((product) => {
                  const qty = getQty(product.id);
                  const oos = isOutOfStock(product);
                  return (
                    <div key={product.id} className={cn("flex flex-col h-full px-[2px]", oos && "opacity-60")}>
                      {/* Image */}
                      <button onClick={() => setSelectedProduct(product)} className="aspect-square relative bg-slate-100 rounded-xl w-full overflow-hidden block mb-3 flex-shrink-0">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-slate-300" />
                          </div>
                        )}
                        {oos && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </button>

                      {/* SKU/name + price — grows to fill available space */}
                      <div className="flex-1 flex flex-col">
                        <button onClick={() => setSelectedProduct(product)} className="text-left mb-1">
                          <p className="text-xs text-slate-500 line-clamp-1">{product.sku || product.name}</p>
                        </button>
                        <p className="text-sm font-semibold text-[#111]">{fmt(product.selling_price)}</p>
                      </div>

                      {/* Button — pinned to bottom */}
                      {!oos && (
                        <div className="mt-2 pb-2">
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-full py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-[#111] transition active:scale-95"
                            >
                              Add To Cart
                            </button>
                          ) : (
                            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: brand }}>
                              <button onClick={() => updateQty(product.id, -1)} className="flex-1 py-1.5 text-base font-bold hover:bg-slate-50 transition" style={{ color: brand }}>−</button>
                              <span className="px-2 py-1.5 text-xs font-bold flex items-center justify-center border-l border-r" style={{ color: brand, borderColor: brand }}>{qty}</span>
                              <button onClick={() => updateQty(product.id, 1)} className="flex-1 py-1.5 text-base font-bold text-white transition" style={{ backgroundColor: brand }}>+</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => { setPage((p) => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page === 0}
                  className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-white transition"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => { setPage(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="w-9 h-9 rounded-xl text-sm font-semibold border transition"
                    style={pillStyle(page === i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page === totalPages - 1}
                  className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-white transition"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ── FOOTER ── */}
        <footer className="border-t border-slate-200 mt-16 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1 flex flex-col gap-3">
              {logoMark(56)}
              <p className="text-base font-bold text-[#111]">{business.name}</p>
              {business.description && (
                <p className="text-sm text-slate-400 leading-relaxed">{business.description}</p>
              )}
              {(igLink || waLink) && (
                <div className="flex gap-3 mt-1">
                  {igLink && (
                    <a href={igLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-500 transition">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:opacity-70 transition">
                      <WhatsAppIcon className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-[#111] mb-3">Contact Us</p>
              <ul className="space-y-2 text-sm text-slate-500">
                {business.phone && <li className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0" />{business.phone}</li>}
                {business.email && <li className="flex items-start gap-2 break-all"><Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />{business.email}</li>}
                {business.address && <li>{business.address}{business.city ? `, ${business.city}` : ""}</li>}
                {waLink && (
                  <li>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition" style={{ color: brand }}>
                      <WhatsAppIcon className="w-4 h-4" /> WhatsApp Us
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold text-[#111] mb-3">Delivery</p>
              <ul className="space-y-2 text-sm text-slate-500">
                {business.store_shipping_enabled ? (
                  <>
                    <li>Delivery fee: {fmt(business.store_shipping_fee)}</li>
                    {business.store_free_shipping_above && (
                      <li style={{ color: brand }}>Free above {fmt(business.store_free_shipping_above)}</li>
                    )}
                    {business.store_delivery_note && <li className="italic">{business.store_delivery_note}</li>}
                  </>
                ) : (
                  <li className="text-slate-400 italic">Contact us for delivery info</li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold text-[#111] mb-3">Payment Methods</p>
              <ul className="space-y-2 text-sm text-slate-500">
                {["Cards (Mastercard, Visa, Verve)", "Bank Transfers", "Direct Debit"].map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0 text-[10px] font-bold" style={{ backgroundColor: brand }}>✓</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-5">
            <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
            <p>Powered by <span className="font-semibold" style={{ color: brand }}>Stokka</span></p>
          </div>
        </footer>
      </main>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#111]">Your Cart</h3>
              <button onClick={() => setCartOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {cart.length === 0 && bundleCart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-300" />
                <p className="text-sm text-slate-400">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                        {item.product.image_url
                          ? <Image src={item.product.image_url} alt={item.product.name} width={48} height={48} className="object-cover w-full h-full" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111] truncate">{item.product.name}</p>
                        <p className="text-xs" style={{ color: brand }}>{fmt(item.product.selling_price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center hover:bg-slate-200 transition text-sm font-bold text-slate-600">−</button>
                        <span className="text-sm font-bold w-5 text-center text-[#111]">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-md flex items-center justify-center transition text-sm font-bold text-white" style={{ backgroundColor: brand }}>+</button>
                      </div>
                      <p className="text-sm font-bold text-[#111] w-16 text-right">{fmt(item.qty * item.product.selling_price)}</p>
                    </div>
                  ))}
                  {bundleCart.map((item) => (
                    <div key={item.bundle.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                        {item.bundle.image_url
                          ? <Image src={item.bundle.image_url} alt={item.bundle.name} width={48} height={48} className="object-cover w-full h-full" />
                          : <div className="w-full h-full flex items-center justify-center"><Layers className="w-5 h-5 text-slate-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111] truncate">{item.bundle.name}</p>
                        <p className="text-xs" style={{ color: brand }}>{fmt(item.bundle.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => updateBundleQty(item.bundle.id, -1)} className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center hover:bg-slate-200 transition text-sm font-bold text-slate-600">−</button>
                        <span className="text-sm font-bold w-5 text-center text-[#111]">{item.qty}</span>
                        <button onClick={() => updateBundleQty(item.bundle.id, 1)} className="w-6 h-6 rounded-md flex items-center justify-center transition text-sm font-bold text-white" style={{ backgroundColor: brand }}>+</button>
                      </div>
                      <p className="text-sm font-bold text-[#111] w-16 text-right">{fmt(item.qty * item.bundle.price)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-5 space-y-3">
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold text-[#111]">Total</p>
                    <p className="text-lg font-bold" style={{ color: brand }}>{fmt(cartTotal)}</p>
                  </div>
                  <button
                    onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition"
                    style={{ backgroundColor: brand }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CHECKOUT MODAL ── */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111]">Checkout</h3>
              <button onClick={() => setCheckoutOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1">
              {cart.map((i) => (
                <div key={i.product.id} className="flex justify-between text-xs text-slate-600">
                  <span>{i.product.name} × {i.qty}</span>
                  <span className="font-semibold">{fmt(i.qty * i.product.selling_price)}</span>
                </div>
              ))}
              {bundleCart.map((i) => (
                <div key={i.bundle.id} className="flex justify-between text-xs text-slate-600">
                  <span>{i.bundle.name} × {i.qty}</span>
                  <span className="font-semibold">{fmt(i.qty * i.bundle.price)}</span>
                </div>
              ))}
              {business.store_shipping_enabled && (
                <div className="flex justify-between text-xs text-slate-500 border-t border-slate-200 mt-1 pt-1">
                  <span>Delivery fee{shippingFee === 0 ? " (free!)" : ""}</span>
                  <span>{shippingFee === 0 ? "Free" : fmt(shippingFee)}</span>
                </div>
              )}
              {business.store_free_shipping_above && shippingFee > 0 && (
                <p className="text-xs" style={{ color: brand }}>Free delivery on orders above {fmt(business.store_free_shipping_above)}</p>
              )}
              <div className="flex justify-between text-sm font-bold text-[#111] border-t border-slate-200 mt-2 pt-2">
                <span>Total</span>
                <span style={{ color: brand }}>{fmt(cartTotal)}</span>
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}55`)}
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
                  />
                </div>
              ))}
            </div>

            {bankAccount && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "paystack" as const, icon: <CreditCard className="w-4 h-4" />, label: "Pay Online" },
                    { key: "bank_transfer" as const, icon: <Landmark className="w-4 h-4" />, label: "Bank Transfer" },
                  ].map(({ key, icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setPaymentMethod(key)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition"
                      style={
                        paymentMethod === key
                          ? { backgroundColor: brand, color: "#fff", borderColor: brand }
                          : { backgroundColor: "#fff", color: "#64748b", borderColor: "#cbd5e1" }
                      }
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
                {paymentMethod === "bank_transfer" && (
                  <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
                    <p className="font-semibold text-[#111] text-xs mb-1">Transfer to this account after placing your order:</p>
                    <p><span className="text-slate-400">Bank</span> — <span className="font-medium">{bankAccount.bank_name}</span></p>
                    <p><span className="text-slate-400">Account Name</span> — <span className="font-medium">{bankAccount.account_name}</span></p>
                    <p><span className="text-slate-400">Account Number</span> — <span className="font-bold tracking-widest">{bankAccount.account_number}</span></p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={checkout}
              disabled={processing || !form.name.trim() || !form.email.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: brand }}
            >
              {processing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : paymentMethod === "bank_transfer"
                  ? `Place Order — ${fmt(cartTotal)}`
                  : `Pay ${fmt(cartTotal)} Online`}
            </button>
          </div>
        </div>
      )}

      {/* ── BANK TRANSFER SUCCESS MODAL ── */}
      {bankTransferResult && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 space-y-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brand}18` }}>
                <CheckCircle2 className="w-7 h-7" style={{ color: brand }} />
              </div>
              <h3 className="text-lg font-bold text-[#111]">Order Placed!</h3>
              <p className="text-xs text-slate-500">
                Order <span className="font-semibold text-[#111]">#{bankTransferResult.orderNumber}</span> received.
                Complete your payment by transferring <span className="font-semibold" style={{ color: brand }}>{fmt(bankTransferResult.total)}</span> to the account below.
              </p>
            </div>
            {bankTransferResult.bankDetails ? (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transfer Details</p>
                {[
                  { label: "Bank", value: bankTransferResult.bankDetails.bank_name, key: "bank" },
                  { label: "Account Name", value: bankTransferResult.bankDetails.account_name, key: "name" },
                  { label: "Account Number", value: bankTransferResult.bankDetails.account_number, key: "number" },
                ].map(({ label, value, key }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                      <p className={cn("text-sm font-bold text-[#111]", key === "number" && "tracking-widest text-base")}>{value}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(value, key)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition flex-shrink-0"
                    >
                      {copied === key
                        ? <Check className="w-3.5 h-3.5 text-green-500" />
                        : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 text-center">
                Bank account details not available. Please contact the store to complete your payment.
              </div>
            )}
            <p className="text-xs text-slate-400 text-center">
              Your order will be confirmed once payment is received.{" "}
              {business.social_whatsapp && (
                <>Send proof of payment on <a href={`https://wa.me/${business.social_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: brand }}>WhatsApp</a>.</>
              )}
            </p>
            <button
              onClick={() => setBankTransferResult(null)}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition"
              style={{ backgroundColor: brand }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── SIDEBAR MENU ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-white w-[80vw] max-w-xs h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <span className="font-bold text-lg text-[#111] uppercase tracking-wide leading-tight">{business.name}</span>
              <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { setSelectedCategory(null); setMenuOpen(false); }}
                    className="w-full text-left py-3.5 text-[17px] font-semibold text-[#111] border-b border-slate-100 hover:text-slate-500 transition"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setSelectedCategory(null); setMenuOpen(false); }}
                    className="w-full text-left py-3.5 text-[17px] font-semibold text-[#111] border-b border-slate-100 hover:text-slate-500 transition"
                  >
                    Shop
                  </button>
                </li>
                {(business.description || business.phone || business.email || business.address) && (
                  <li>
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left py-3.5 text-[17px] font-semibold text-[#111] border-b border-slate-100 hover:text-slate-500 transition"
                    >
                      About Us
                    </button>
                  </li>
                )}
                {(business.phone || business.email || business.address) && (
                  <li>
                    <p className="py-3.5 text-[17px] font-semibold text-[#111] border-b border-slate-100">More Information</p>
                    <ul className="pl-3 mt-1 space-y-2 py-2">
                      {business.phone && <li className="text-[14px] text-slate-500">{business.phone}</li>}
                      {business.email && <li className="text-[14px] text-slate-500 break-all">{business.email}</li>}
                      {business.address && <li className="text-[14px] text-slate-500">{business.address}{business.city ? `, ${business.city}` : ""}</li>}
                    </ul>
                  </li>
                )}
              </ul>
            </nav>

            {/* Footer */}
            <div className="px-6 pb-8 pt-4 border-t border-slate-100">
              {(waLink || igLink) && (
                <div className="flex items-center gap-4 mb-4">
                  {igLink && (
                    <a href={igLink} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-500 transition">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition" style={{ color: "#25D366" }}>
                      <WhatsAppIcon className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-400">© {new Date().getFullYear()} - {business.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL SHEET ── */}
      {selectedProduct && (() => {
        const oos = isOutOfStock(selectedProduct);
        const qty = getQty(selectedProduct.id);
        const desc = selectedProduct.description ?? "";
        const isLong = desc.length > 150;
        const otherProducts = products.filter(p => p.id !== selectedProduct.id);

        async function handleShare() {
          const url = window.location.href;
          if (navigator.share) {
            try { await navigator.share({ title: selectedProduct!.name, url }); } catch {}
          } else {
            try { await navigator.clipboard.writeText(url); toast.success("Link copied!"); } catch {}
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedProduct(null)} />
            <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">

              {/* Image section */}
              <div className="relative w-full flex-shrink-0 bg-slate-100 overflow-hidden" style={{ height: "clamp(260px, 60vw, 380px)" }}>
                {selectedProduct.image_url ? (
                  <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-slate-200" />
                  </div>
                )}
                {/* Share button — top-left */}
                <button
                  onClick={handleShare}
                  className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
                >
                  <Share2 className="w-4 h-4 text-slate-700" />
                </button>
                {/* Close button — top-right */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
                >
                  <X className="w-4 h-4 text-slate-700" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24">
                {/* SKU / name */}
                <p className="text-xl font-bold text-[#111] mb-1">
                  {selectedProduct.sku || selectedProduct.name}
                </p>
                {/* Price */}
                <p className="text-lg font-bold mb-1" style={{ color: brand }}>
                  {fmt(selectedProduct.selling_price)}
                </p>
                {/* Full name (only shown when SKU is present) */}
                {selectedProduct.sku && (
                  <p className="text-sm text-slate-500 mb-3">{selectedProduct.name}</p>
                )}
                {/* Stock badge */}
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: oos ? "#ef4444" : "#16a34a" }}>
                  {oos ? "Out of Stock" : "In Stock"}
                </span>

                {/* Description */}
                {desc && (
                  <div className="mt-4 mb-1">
                    <p className={cn("text-sm text-slate-500 leading-relaxed", !showFullDesc && isLong && "line-clamp-3")}>
                      {desc}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => setShowFullDesc(v => !v)}
                        className="text-xs font-semibold mt-1.5 flex items-center gap-0.5"
                        style={{ color: brand }}
                      >
                        {showFullDesc
                          ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                          : <><ChevronDown className="w-3.5 h-3.5" /> Show more</>}
                      </button>
                    )}
                  </div>
                )}

                {/* You may also like */}
                {otherProducts.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-bold text-[#111] mb-3">You may also like</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {otherProducts.slice(0, 6).map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className="flex-shrink-0 w-20 text-left"
                        >
                          <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden mb-1 relative">
                            {p.image_url ? (
                              <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] font-semibold text-slate-700 line-clamp-1 leading-snug">
                            {p.sku || p.name}
                          </p>
                          <p className="text-[10px] font-bold text-[#111]">{fmt(p.selling_price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 py-3">
                {oos ? (
                  <p className="text-sm font-bold text-red-500 text-center py-1">Out of Stock</p>
                ) : qty === 0 ? (
                  <div className="flex items-center gap-3">
                    <p className="text-base font-bold flex-shrink-0" style={{ color: brand }}>{fmt(selectedProduct.selling_price)}</p>
                    <button
                      onClick={() => addToCart(selectedProduct)}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition active:scale-95"
                      style={{ backgroundColor: brand }}
                    >
                      Add To Cart
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold" style={{ color: brand }}>{fmt(selectedProduct.selling_price)}</p>
                      <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: brand }}>
                        <button onClick={() => updateQty(selectedProduct.id, -1)} className="px-3 py-1.5 text-lg font-bold hover:bg-slate-50 transition" style={{ color: brand }}>−</button>
                        <span className="px-3 py-1.5 text-sm font-bold border-l border-r" style={{ color: brand, borderColor: brand }}>{qty}</span>
                        <button onClick={() => updateQty(selectedProduct.id, 1)} className="px-3 py-1.5 text-lg font-bold text-white transition" style={{ backgroundColor: brand }}>+</button>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedProduct(null); setCartOpen(true); }}
                      className="w-full py-3 rounded-2xl text-sm font-bold text-white transition"
                      style={{ backgroundColor: brand }}
                    >
                      View Cart · {qty} item{qty !== 1 ? "s" : ""}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
