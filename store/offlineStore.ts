import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PendingSale {
  localId: string;
  businessId: string;
  userId: string;
  customerId: string | null;
  customerName: string | null;
  items: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string | null;
    quantity: number;
    unitPrice: number;
    costPrice: number;
  }>;
  subtotal: number;
  discountType: string | null;
  discountValue: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: string;
  paymentReference: string;
  loyaltyPointsToEarn: number;
  loyaltyPointsToRedeem: number;
  createdAt: string;
}

interface OfflineState {
  isOnline: boolean;
  pendingSales: PendingSale[];

  setOnline: (online: boolean) => void;
  addPendingSale: (sale: Omit<PendingSale, "localId">) => void;
  removePendingSale: (localId: string) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      isOnline: true,
      pendingSales: [],

      setOnline: (isOnline) => set({ isOnline }),

      addPendingSale: (sale) =>
        set((state) => ({
          pendingSales: [
            ...state.pendingSales,
            {
              ...sale,
              localId: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            },
          ],
        })),

      removePendingSale: (localId) =>
        set((state) => ({
          pendingSales: state.pendingSales.filter((s) => s.localId !== localId),
        })),
    }),
    { name: "vantage-offline-queue" }
  )
);
