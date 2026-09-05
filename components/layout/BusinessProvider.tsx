"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  useEffect(() => {
    setActiveBusiness(business as Parameters<typeof setActiveBusiness>[0], role);
  }, [business.id, role]);

  // Save current path so middleware can restore it on root redirect
  useEffect(() => {
    if (pathname && pathname !== "/") {
      document.cookie = `last_path=${encodeURIComponent(pathname)}; path=/; max-age=86400; SameSite=Lax`;
    }
  }, [pathname]);

  return <>{children}</>;
}
