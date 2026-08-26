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
    const supabase = createClient();

    async function handleCallback() {
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/onboarding";

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
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
        }
      }

      // Implicit flow: tokens may be in URL hash; check session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: membership } = await supabase
          .from("business_members")
          .select("businesses(slug)")
          .eq("user_id", session.user.id)
          .eq("is_active", true)
          .limit(1)
          .single();

        const biz = membership?.businesses as unknown as { slug: string } | null;
        const slug = Array.isArray(biz) ? biz[0]?.slug : biz?.slug;
        router.replace(slug ? `/${slug}/dashboard` : "/onboarding");
        return;
      }

      router.replace("/login?error=auth_callback_failed");
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a9c38]" />
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
