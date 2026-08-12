"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { Share2, Users, CheckCircle2, Clock, Gift, ToggleLeft, ToggleRight, X } from "lucide-react";
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

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  converted: "bg-blue-100 text-blue-700",
  rewarded: "bg-green-100 text-green-700",
};

export function ReferralsClient({ program: initialProgram, referrals, currency, businessId }: Props) {
  const supabase = createClient();
  const fmt = (n: number) => formatCurrency(n, currency);

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
  const rewarded = referrals.filter((r) => r.status === "rewarded").length;

  return (
    <div className="flex-1 p-5 space-y-5">
      {/* Program config */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0F172A]">Program Settings</h3>
          <button
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            className="text-slate-400 hover:text-green-600 transition"
          >
            {form.is_active
              ? <ToggleRight className="w-8 h-8 text-green-600" />
              : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Program Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reward Type</label>
            <select
              value={form.reward_type}
              onChange={(e) => setForm({ ...form, reward_type: e.target.value as ReferralProgram["reward_type"] })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="discount">Discount (%)</option>
              <option value="credit">Store Credit</option>
              <option value="gift_card">Gift Card</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Reward Value {form.reward_type === "discount" ? "(%)" : `(${currency})`}
            </label>
            <input
              type="number"
              min="0"
              value={form.reward_value}
              onChange={(e) => setForm({ ...form, reward_value: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
          Customers get a unique referral code when they join. When a new customer uses their code and makes a purchase, the referrer earns the reward above.
        </div>

        <button
          onClick={saveProgram}
          disabled={saving}
          className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : program ? "Update Program" : "Enable Program"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="font-numeric text-xl font-bold text-[#0F172A]">{referrals.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Referrals</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="font-numeric text-xl font-bold text-blue-600">{converted}</p>
          <p className="text-xs text-slate-500 mt-0.5">Converted</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="font-numeric text-xl font-bold text-green-600">{rewarded}</p>
          <p className="text-xs text-slate-500 mt-0.5">Rewarded</p>
        </div>
      </div>

      {/* Referrals table */}
      {referrals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <Share2 className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-semibold text-[#0F172A]">No referrals yet</p>
          <p className="text-xs text-slate-400">Customers with referral codes will appear here once they refer someone</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Referrer</th>
                <th className="text-left px-5 py-3">Referred</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3 font-mono text-sm font-bold text-[#0F172A]">{r.referral_code}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{r.referrer?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{r.referred?.name ?? <span className="text-slate-300">Pending</span>}</td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
