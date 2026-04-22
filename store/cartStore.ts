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
}

type DiscountType = "percent" | "fixed" | null;

interface CartState {
  items: CartItem[];
  discountType: DiscountType;
  discountValue: number;
  customerId: string | null;
  customerName: string | null;
  note: string;
  taxEnabled: boolean;
  taxRate: number;
  taxName: string;

  // Actions
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string
  ) => void;
  setDiscount: (type: DiscountType, value: number) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  setNote: (note: string) => void;
  setTaxConfig: (enabled: boolean, rate: number, name: string) => void;
  clearCart: () => void;

  // Computed (derived from items + discount + tax)
  subtotal: () => number;
  discountAmount: () => number;
  taxAmount: () => number;
  total: () => number;
  totalCost: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  discountType: null,
  discountValue: 0,
  customerId: null,
  customerName: null,
  note: "",
  taxEnabled: false,
  taxRate: 0,
  taxName: "VAT",

  addItem: (item) => {
    set((state) => {
      const key = item.variantId ?? item.productId;
      const existing = state.items.find(
        (i) => (i.variantId ?? i.productId) === key
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            (i.variantId ?? i.productId) === key
              ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
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
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => {
        const match = variantId
          ? i.variantId === variantId
          : i.productId === productId && !i.variantId;
        return match ? { ...i, quantity } : i;
      }),
    }));
  },

  setDiscount: (type, value) => set({ discountType: type, discountValue: value }),
  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setNote: (note) => set({ note }),
  setTaxConfig: (enabled, rate, name) => set({ taxEnabled: enabled, taxRate: rate, taxName: name }),

  clearCart: () =>
    set((state) => ({
      items: [],
      discountType: null,
      discountValue: 0,
      customerId: null,
      customerName: null,
      note: "",
      // Preserve tax config across sales
      taxEnabled: state.taxEnabled,
      taxRate: state.taxRate,
      taxName: state.taxName,
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

  total: () => get().subtotal() - get().discountAmount() + get().taxAmount(),

  totalCost: () =>
    get().items.reduce((s, i) => s + i.costPrice * i.quantity, 0),

  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));
