import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Database } from "@/lib/supabase/types";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type Member = Database["public"]["Tables"]["business_members"]["Row"];

interface BusinessState {
  activeBusiness: Business | null;
  userRole: string | null;
  userBusinesses: Array<{ business: Business; role: string }>;
  selectedLocationId: string | null;
  setActiveBusiness: (business: Business, role: string) => void;
  setUserBusinesses: (
    businesses: Array<{ business: Business; role: string }>
  ) => void;
  setSelectedLocation: (id: string | null) => void;
  clearBusiness: () => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      activeBusiness: null,
      userRole: null,
      userBusinesses: [],
      selectedLocationId: null,
      setActiveBusiness: (business, role) =>
        set({ activeBusiness: business, userRole: role }),
      setUserBusinesses: (businesses) => set({ userBusinesses: businesses }),
      setSelectedLocation: (id) => set({ selectedLocationId: id }),
      clearBusiness: () =>
        set({ activeBusiness: null, userRole: null, userBusinesses: [], selectedLocationId: null }),
    }),
    {
      name: "stokka-business",
      partialize: (state) => ({
        activeBusiness: state.activeBusiness,
        userRole: state.userRole,
        selectedLocationId: state.selectedLocationId,
      }),
    }
  )
);
