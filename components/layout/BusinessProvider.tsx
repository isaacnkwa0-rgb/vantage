"use client";

import { useEffect } from "react";
import { useBusinessStore } from "@/store/businessStore";

interface Props {
  business: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    logo_url: string | null;
  };
  role: string;
  children: React.ReactNode;
}

export function BusinessProvider({ business, role, children }: Props) {
  const { setActiveBusiness } = useBusinessStore();

  useEffect(() => {
    // Cast to satisfy store type — we only need the fields we pass
    setActiveBusiness(business as Parameters<typeof setActiveBusiness>[0], role);
  }, [business.id, role]);

  return <>{children}</>;
}
