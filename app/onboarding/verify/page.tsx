"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail } from "lucide-react";

function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyingRef = useRef(false);
  const otpSentRef = useRef(false);

  useEffect(() => {
    if (otpSentRef.current) return;
    otpSentRef.current = true;
    sendOtp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendOtp() {
    setIsSending(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { router.push("/login"); return; }
    setEmail(user.email);
    await supabase.auth.signInWithOtp({ email: user.email, options: { shouldCreateUser: false } });
    setIsSending(false);
    setCooldown(60);
    // focus first box after send
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  async function verify(digits: string[]) {
    const token = digits.join("");
    if (token.length < 6 || verifyingRef.current) return;
    verifyingRef.current = true;
    setIsVerifying(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (verifyError) {
      setError("Invalid or expired code. Please try again.");
      setIsVerifying(false);
      verifyingRef.current = false;
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return;
    }
    router.push(`/onboarding/plan?slug=${slug}`);
  }

  function handleDigit(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) verify(next);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = Array(6).fill("") as string[];
    text.split("").forEach((ch, i) => { next[i] = ch; });
    setCode(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) verify(next);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">

          {/* Icon */}
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Mail className="w-7 h-7 text-[#1a9c38]" />
          </div>

          <h1 className="text-[22px] font-bold text-slate-900 leading-snug mb-2 text-center">
            Verify your email
          </h1>

          {isSending ? (
            <div className="flex items-center justify-center gap-2 text-slate-400 text-[14px] mt-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending verification code...
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-[14px] text-center leading-relaxed mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-slate-800 font-semibold text-[14px] text-center mb-8">{email}</p>

              {/* OTP boxes */}
              <div className="flex gap-3 justify-center mb-2" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={isVerifying}
                    className="w-12 h-12 text-center text-[20px] font-bold border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#1a9c38] focus:border-transparent disabled:opacity-50"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-[13px] text-center mt-2 mb-1">{error}</p>
              )}

              <p className="text-[13px] text-slate-400 text-center mt-4 mb-8">
                Didn&apos;t get it?{" "}
                {cooldown > 0 ? (
                  <span>Resend in {cooldown}s</span>
                ) : (
                  <button onClick={sendOtp} className="text-[#1a9c38] font-semibold">
                    Resend code
                  </button>
                )}
              </p>

              <button
                onClick={() => verify(code)}
                disabled={isVerifying || code.some((d) => !d)}
                className="w-full h-11 bg-[#1a9c38] hover:bg-green-700 text-white font-bold rounded-[4px] text-[15px] transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                {isVerifying ? "Verifying..." : "Continue"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPageWrapper() {
  return (
    <Suspense>
      <VerifyPage />
    </Suspense>
  );
}
