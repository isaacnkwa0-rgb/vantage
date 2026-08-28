"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, Lock } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: data.password });
    if (updateError) { setError(updateError.message); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Password updated!</h2>
        <p className="text-slate-500 text-sm">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-5 pt-16 pb-10">
        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-6 h-6 text-[#1a9c38]" />
        </div>

        <h2 className="text-[22px] font-bold text-slate-900 leading-snug mb-1">
          Set a new password
        </h2>
        <p className="text-slate-400 text-[14px] mb-8">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
              placeholder="New password*"
              className="w-full h-10 px-4 border border-slate-200 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <input
              {...register("confirm")}
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password*"
              className="w-full h-10 px-4 border border-slate-200 rounded-[4px] text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent"
            />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[14px] transition flex items-center justify-center gap-2 disabled:opacity-60 !mt-6"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
