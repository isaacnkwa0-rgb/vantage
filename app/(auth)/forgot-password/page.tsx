"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, Mail } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });
    if (resetError) { setError(resetError.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
          We sent a password reset link to your email. Click it to set a new password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-[#1a9c38] font-semibold text-sm">
          Back to sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 pt-12 pb-4">
        <Link
          href="/login"
          className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full w-fit"
        >
          ‹ Back
        </Link>
      </div>

      <div className="flex-1 px-5 pt-8 pb-10">
        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
          <Mail className="w-6 h-6 text-[#1a9c38]" />
        </div>

        <h2 className="text-[26px] font-bold text-slate-900 leading-snug mb-1">
          Forgot your password?
        </h2>
        <p className="text-slate-400 text-[14px] mb-8">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="Email Address*"
              className="w-full h-11 px-4 border border-slate-200 rounded-[4px] text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] transition flex items-center justify-center gap-2 disabled:opacity-60 !mt-6"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-[14px] text-slate-400 mt-6">
          Remembered it?{" "}
          <Link href="/login" className="text-[#1a9c38] font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
