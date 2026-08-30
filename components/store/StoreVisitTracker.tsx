"use client";

import { useEffect } from "react";

export function StoreVisitTracker({ businessId }: { businessId: string }) {
  useEffect(() => {
    fetch("/api/store/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    }).catch(() => {});
  }, [businessId]);

  return null;
}
