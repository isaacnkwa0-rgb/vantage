import { create } from "zustand";

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  imageUrl?: string | null;
  minOrderQty: number;
  maxOrderQty: number | null;
}

type DiscountType = "percent" | "fixed" | null;

interface CartState {
  items: CartItem[];
  discountType: DiscountType;
  discountValue: number;
  // Promo code metadata (null when using manual discount)
  promoCodeId: string | null;
  promoCodeLabel: string | null; // e.g. "SAVE20"
  customerId: string | null;
  customerName: string | null;
  note: string;
  taxEnabled: boolean;
  taxRate: number;
  taxName: string;
  loyaltyPointsToRedeem: number;
  loyaltyRedemptionRate: number;

  // Actions
  addItem: (item: Omit<CartItem, "quantity" | "minOrderQty" | "maxOrderQty"> & { quantity?: number; minOrderQty?: number; maxOrderQty?: number | null }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  setDiscount: (type: DiscountType, value: number) => void;
  setPromoCode: (id: string, label: string, type: "percent" | "fixed", value: number) => void;
  clearPromoCode: () => void;
  setCustomer: (id: string | null, name: string | null) => void;
  setNote: (note: string) => void;
  setTaxConfig: (enabled: boolean, rate: number, name: string) => void;
  setLoyaltyRedemption: (pts: number, rate: number) => void;
  clearCart: () => void;

  // Computed
  subtotal: () => number;
  discountAmount: () => number;
  taxAmount: () => number;
  loyaltyDiscountValue: () => number;
  total: () => number;
  totalCost: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  discountType: null,
  discountValue: 0,
  promoCodeId: null,
  promoCodeLabel: null,
  customerId: null,
  customerName: null,
  note: "",
  taxEnabled: false,
  taxRate: 0,
  taxName: "VAT",
  loyaltyPointsToRedeem: 0,
  loyaltyRedemptionRate: 100,

  addItem: (item) => {
    const min = item.minOrderQty ?? 1;
    const max = item.maxOrderQty ?? null;
    set((state) => {
      const key = item.variantId ?? item.productId;
      const existing = state.items.find((i) => (i.variantId ?? i.productId) === key);
      if (existing) {
        const newQty = existing.quantity + (item.quantity ?? min);
        const clamped = max !== null ? Math.min(newQty, max) : newQty;
        return {
          items: state.items.map((i) =>
            (i.variantId ?? i.productId) === key ? { ...i, quantity: clamped } : i
          ),
        };
      }
      const initialQty = Math.max(min, item.quantity ?? min);
      const clampedInitial = max !== null ? Math.min(initialQty, max) : initialQty;
      return {
        items: [...state.items, { ...item, quantity: clampedInitial, minOrderQty: min, maxOrderQty: max }],
      };
    });
  },

  removeItem: (productId, variantId) => {
    set((state) => ({
      items: state.items.filter((i) =>
        variantId ? i.variantId !== variantId : i.productId !== productId
      ),
    }));
  },

  updateQuantity: (productId, quantity, variantId) => {
    const item = get().items.find((i) =>
      variantId ? i.variantId === variantId : i.productId === productId && !i.variantId
    );
    const min = item?.minOrderQty ?? 1;
    const max = item?.maxOrderQty ?? null;
    if (quantity <= 0 || quantity < min) { get().removeItem(productId, variantId); return; }
    const clamped = max !== null ? Math.min(quantity, max) : quantity;
    set((state) => ({
      items: state.items.map((i) => {
        const match = variantId
          ? i.variantId === variantId
          : i.productId === productId && !i.variantId;
        return match ? { ...i, quantity: clamped } : i;
      }),
    }));
  },

  // Manual discount — clears any applied promo code
  setDiscount: (type, value) =>
    set({ discountType: type, discountValue: value, promoCodeId: null, promoCodeLabel: null }),

  // Apply a validated promo code — replaces any manual discount
  setPromoCode: (id, label, type, value) =>
    set({ promoCodeId: id, promoCodeLabel: label, discountType: type, discountValue: value }),

  // Remove promo code and clear its discount
  clearPromoCode: () =>
    set({ promoCodeId: null, promoCodeLabel: null, discountType: null, discountValue: 0 }),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setNote: (note) => set({ note }),
  setTaxConfig: (enabled, rate, name) => set({ taxEnabled: enabled, taxRate: rate, taxName: name }),
  setLoyaltyRedemption: (pts, rate) => set({ loyaltyPointsToRedeem: pts, loyaltyRedemptionRate: rate }),

  clearCart: () =>
    set((state) => ({
      items: [],
      discountType: null,
      discountValue: 0,
      promoCodeId: null,
      promoCodeLabel: null,
      customerId: null,
      customerName: null,
      note: "",
      loyaltyPointsToRedeem: 0,
      taxEnabled: state.taxEnabled,
      taxRate: state.taxRate,
      taxName: state.taxName,
      loyaltyRedemptionRate: state.loyaltyRedemptionRate,
    })),

  subtotal: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),

  discountAmount: () => {
    const { discountType, discountValue } = get();
    const sub = get().subtotal();
    if (!discountType || discountValue <= 0) return 0;
    if (discountType === "percent") return (sub * discountValue) / 100;
    return Math.min(discountValue, sub);
  },

  taxAmount: () => {
    const { taxEnabled, taxRate } = get();
    if (!taxEnabled || taxRate <= 0) return 0;
    return (get().subtotal() - get().discountAmount()) * taxRate / 100;
  },

  loyaltyDiscountValue: () => {
    const { loyaltyPointsToRedeem, loyaltyRedemptionRate } = get();
    if (!loyaltyPointsToRedeem || !loyaltyRedemptionRate) return 0;
    return loyaltyPointsToRedeem / loyaltyRedemptionRate;
  },

  total: () => {
    const base = get().subtotal() - get().discountAmount() + get().taxAmount();
    return Math.max(0, base - get().loyaltyDiscountValue());
  },

  totalCost: () => get().items.reduce((s, i) => s + i.costPrice * i.quantity, 0),
  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));
