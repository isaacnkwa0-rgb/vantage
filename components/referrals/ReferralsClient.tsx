"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Share2, Gift, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferralProgram {
  id: string;
  name: string;
  reward_type: "discount" | "credit" | "gift_card";
  reward_value: number;
  is_active: boolean;
}

interface Referral {
  id: string;
  referral_code: string;
  status: "pending" | "converted" | "rewarded";
  created_at: string;
  converted_at: string | null;
  referrer: { name: string } | null;
  referred: { name: string } | null;
}

interface Props {
  program: ReferralProgram | null;
  referrals: Referral[];
  currency: string;
  businessId: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: "Pending",   bg: "bg-amber-50",   text: "text-amber-700" },
  converted: { label: "Converted", bg: "bg-blue-50",    text: "text-blue-700" },
  rewarded:  { label: "Rewarded",  bg: "bg-emerald-50", text: "text-emerald-700" },
};

const innerCls = "w-full text-sm bg-transparent focus:outline-none text-[#0F172A] placeholder:text-slate-400 pt-0.5 pb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-[#1a9c38] transition">
      <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">{label}</legend>
      {children}
    </fieldset>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export function ReferralsClient({ program: initialProgram, referrals, currency, businessId }: Props) {
  const [program, setProgram] = useState<ReferralProgram | null>(initialProgram);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initialProgram?.name ?? "Referral Program",
    reward_type: (initialProgram?.reward_type ?? "discount") as ReferralProgram["reward_type"],
    reward_value: String(initialProgram?.reward_value ?? 0),
    is_active: initialProgram?.is_active ?? true,
  });

  async function saveProgram() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      business_id: businessId,
      name: form.name,
      reward_type: form.reward_type,
      reward_value: parseFloat(form.reward_value) || 0,
      is_active: form.is_active,
    };
    if (program) {
      const { data } = await supabase.from("referral_programs").update(payload).eq("id", program.id).select().single();
      if (data) setProgram(data as ReferralProgram);
    } else {
      const { data } = await supabase.from("referral_programs").insert(payload).select().single();
      if (data) setProgram(data as ReferralProgram);
    }
    setSaving(false);
  }

  const converted = referrals.filter((r) => r.status !== "pending").length;
  const rewarded  = referrals.filter((r) => r.status === "rewarded").length;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-4">

      {/* Program settings card */}
      <div className="border border-slate-200 rounded-[12px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="text-[13px] font-semibold text-[#0F172A]">Program Settings</span>
          <button
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            className="transition"
          >
            {form.is_active
              ? <ToggleRight className="w-8 h-8 text-[#1a9c38]" />
              : <ToggleLeft  className="w-8 h-8 text-slate-400" />}
          </button>
        </div>

        <div className="px-4 pt-4 pb-3 space-y-4">
          <SectionDivider label="Reward" />
          <div className="space-y-3">
            <Field label="Program name">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Referral Program"
                className={innerCls}
              />
            </Field>
            <Field label="Reward type">
              <select
                value={form.reward_type}
                onChange={(e) => setForm((f) => ({ ...f, reward_type: e.target.value as ReferralProgram["reward_type"] }))}
                className={`${innerCls} -ml-0.5`}
              >
                <option value="discount">Discount (%)</option>
                <option value="credit">Store Credit</option>
                <option value="gift_card">Gift Card</option>
              </select>
            </Field>
            <Field label={`Reward value ${form.reward_type === "discount" ? "(%)" : `(${currency})`}`}>
              <input
                type="number"
                min="0"
                value={form.reward_value}
                onChange={(e) => setForm((f) => ({ ...f, reward_value: e.target.value }))}
                placeholder="0"
                className={innerCls}
              />
            </Field>
          </div>
          <p className="text-[12px] text-slate-400 leading-relaxed">
            Customers get a unique referral code. When someone uses their code and makes a purchase, the referrer earns the reward above.
          </p>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={saveProgram}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-green-900/20"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {program ? "Update Program" : "Enable Program"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-slate-200 rounded-[8px] p-3 text-center">
          <p className="text-[20px] font-extrabold text-[#0F172A]">{referrals.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total</p>
        </div>
        <div className="border border-slate-200 rounded-[8px] p-3 text-center">
          <p className="text-[20px] font-extrabold text-blue-600">{converted}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Converted</p>
        </div>
        <div className="border border-slate-200 rounded-[8px] p-3 text-center">
          <p className="text-[20px] font-extrabold text-[#1a9c38]">{rewarded}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rewarded</p>
        </div>
      </div>

      {/* Referrals list */}
      {referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Share2 className="w-9 h-9 text-slate-300" />
          </div>
          <p className="text-[16px] font-bold text-slate-800">No referrals yet</p>
          <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
            Customers with referral codes will appear here once they refer someone
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            {referrals.length} referral{referrals.length !== 1 ? "s" : ""}
          </p>
          <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {referrals.map((r) => {
              const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
              return (
                <div key={r.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-50 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <Gift className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[14px] text-[#0F172A]">{r.referral_code}</span>
                        <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", sc.bg, sc.text)}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-500 mt-0.5">
                        {r.referrer?.name ?? "Unknown"}
                        {" → "}
                        {r.referred?.name ?? <span className="text-slate-300">awaiting</span>}
                      </p>
                      <span className="text-[12px] text-slate-400 mt-0.5 block" suppressHydrationWarning>
                        {shortDate(r.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
