"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/onboarding";

    async function handleCallback() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: membership } = await supabase
          .from("business_members")
          .select("businesses(slug)")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();

        const biz = membership?.businesses as unknown as { slug: string } | null;
        const slug = Array.isArray(biz) ? biz[0]?.slug : biz?.slug;
        router.replace(slug ? `/${slug}/dashboard` : next);
        return;
      }

      router.replace("/login?error=auth_callback_failed");
    }

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-slate-500 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
