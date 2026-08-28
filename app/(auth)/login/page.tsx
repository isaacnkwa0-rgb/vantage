"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.8 45 355.2 45 345.4c0-177.3 115.4-271.6 228.7-271.6 60.7 0 111.3 39.8 149.7 39.8 36.5 0 93.5-42.4 162.9-42.4 13.1 0 108.2 1.3 170.5 82.6zm-160.2-181.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (authError) { setError(authError.message); return; }

    const { data: membership } = await supabase
      .from("business_members")
      .select("businesses(slug)")
      .eq("user_id", authData.user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    const biz = membership?.businesses as unknown as { slug: string } | { slug: string }[] | null;
    const slug = Array.isArray(biz) ? biz[0]?.slug : biz?.slug;
    router.push(slug ? `/${slug}/dashboard` : "/onboarding");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-5">
      {/* Back */}
      <div className="pt-12 pb-2">
        <Link href="/register" className="flex items-center gap-1 text-[#1a9c38] text-sm font-medium">
          ‹ Back
        </Link>
      </div>

      {/* Heading */}
      <div className="mt-8 mb-8">
        <h1 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">Welcome back</h1>
        <p className="text-slate-500 text-[14px]">Login and start managing your business like a pro</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 flex-1">
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder="Email Address"
          className="w-full h-10 px-4 border border-slate-300 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
        />
        {errors.email && <p className="text-red-500 text-xs -mt-1">{errors.email.message}</p>}

        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          className="w-full h-10 px-4 border border-slate-300 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
        />
        {errors.password && <p className="text-red-500 text-xs -mt-1">{errors.password.message}</p>}

        <div>
          <Link href="/forgot-password" className="text-[#1a9c38] text-[14px] font-semibold">
            Forgot Password?
          </Link>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[14px] transition flex items-center justify-center gap-2 disabled:opacity-60 !mt-6"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3 !mt-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Apple */}
        <button
          type="button"
          className="w-full h-10 flex items-center justify-center gap-3 border border-slate-900 rounded-[4px] text-[14px] font-semibold text-slate-900 hover:bg-slate-50 transition"
        >
          <AppleIcon />
          Sign in with Apple
        </button>

        {/* Google */}
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="w-full h-10 flex items-center justify-center gap-3 border border-slate-300 rounded-[4px] text-[14px] font-semibold text-slate-900 hover:bg-slate-50 transition disabled:opacity-60"
        >
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
          Sign in with Google
        </button>

        <p className="text-center text-[14px] text-slate-500 !mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/register?step=email-form" className="text-[#1a9c38] font-semibold">Sign up</Link>
        </p>
      </form>

      {/* Footer */}
      <p className="text-center text-[11px] text-slate-400 leading-relaxed py-8 px-4">
        By continuing, I agree to the{" "}
        <Link href="/terms" className="text-[#1a9c38]">General Terms of Use</Link>,{" "}
        <Link href="/terms/merchant" className="text-[#1a9c38]">Merchant Terms of Use</Link>{" "}
        &amp;{" "}
        <Link href="/privacy" className="text-[#1a9c38]">General Privacy Policy</Link>{" "}
        of Vantage
      </p>
    </div>
  );
}
