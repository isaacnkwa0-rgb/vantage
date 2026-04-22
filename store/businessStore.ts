import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Database } from "@/lib/supabase/types";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type Member = Database["public"]["Tables"]["business_members"]["Row"];

interface BusinessState {
  activeBusiness: Business | null;
  userRole: string | null;
  userBusinesses: Array<{ business: Business; role: string }>;
  setActiveBusiness: (business: Business, role: string) => void;
  setUserBusinesses: (
    businesses: Array<{ business: Business; role: string }>
  ) => void;
  clearBusiness: () => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      activeBusiness: null,
      userRole: null,
      userBusinesses: [],
      setActiveBusiness: (business, role) =>
        set({ activeBusiness: business, userRole: role }),
      setUserBusinesses: (businesses) => set({ userBusinesses: businesses }),
      clearBusiness: () =>
        set({ activeBusiness: null, userRole: null, userBusinesses: [] }),
    }),
    {
      name: "vantage-business",
      partialize: (state) => ({
        activeBusiness: state.activeBusiness,
        userRole: state.userRole,
      }),
    }
  )
);
