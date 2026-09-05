"use client";

import { useState } from "react";
import {
  Plus, Mail, MessageSquare, MessageCircle, Send, Loader2,
  X, Check, Clock, AlertCircle, Users, ExternalLink, Search, Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tag { id: string; name: string; color: string; }

interface Campaign {
  id: string;
  name: string;
  channel: "email" | "sms" | "whatsapp";
  subject: string | null;
  message: string;
  target_type: string;
  target_tag_id: string | null;
  target_min_spent: number | null;
  status: "draft" | "sending" | "sent" | "failed";
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
}

interface Props {
  campaigns: Campaign[];
  tags: Tag[];
  businessId: string;
  userId: string;
  businessName: string;
  whatsappNumber: string | null;
  emailReachCount: number;
  phoneReachCount: number;
}

const CHANNEL_CONFIG = {
  email:    { label: "Email",    Icon: Mail,          color: "text-blue-600",   bg: "bg-blue-50" },
  sms:      { label: "SMS",      Icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50" },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle, color: "text-green-600",  bg: "bg-green-50" },
};

const STATUS_CONFIG = {
  draft:   { label: "Draft",   bg: "bg-slate-100",   text: "text-slate-600" },
  sending: { label: "Sending", bg: "bg-amber-50",    text: "text-amber-700" },
  sent:    { label: "Sent",    bg: "bg-emerald-50",  text: "text-emerald-700" },
  failed:  { label: "Failed",  bg: "bg-red-50",      text: "text-red-600" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const EMPTY_FORM = {
  channel: "email" as Campaign["channel"],
  name: "",
  subject: "",
  message: "",
  target_type: "all",
  target_tag_id: "",
  target_min_spent: "",
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

export function CampaignsClient({ campaigns: initialCampaigns, tags, businessId, userId, businessName, whatsappNumber, emailReachCount, phoneReachCount }: Props) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [channelTab, setChannelTab] = useState<Campaign["channel"]>("email");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const filtered = campaigns.filter((c) =>
    c.channel === channelTab &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || (c.subject ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  function openForm() {
    setForm({ ...EMPTY_FORM, channel: channelTab });
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setError(null);
  }

  async function saveDraft() {
    if (!form.name.trim() || !form.message.trim()) { setError("Name and message are required"); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.from("campaigns").insert({
      business_id: businessId,
      created_by: userId,
      channel: form.channel,
      name: form.name.trim(),
      subject: form.subject.trim() || null,
      message: form.message.trim(),
      target_type: form.target_type,
      target_tag_id: form.target_tag_id || null,
      target_min_spent: form.target_min_spent ? parseFloat(form.target_min_spent) : null,
    }).select().single();
    if (err || !data) { setError(err?.message ?? "Failed to save"); setSaving(false); return; }
    setCampaigns((prev) => [data as Campaign, ...prev]);
    closeForm();
    setSaving(false);
  }

  async function sendCampaign(campaign: Campaign) {
    setSending(campaign.id);
    setSendResult(null);
    const endpoint = campaign.channel === "email" ? "/api/campaigns/email" : "/api/campaigns/sms";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: campaign.id }),
    });
    const data = await res.json();
    setSending(null);
    if (!res.ok) { setError(data.error ?? "Send failed"); return; }
    setSendResult({ sent: data.sent, failed: data.failed });
    router.refresh();
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign?")) return;
    const supabase = createClient();
    await supabase.from("campaigns").delete().eq("id", id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  const reach = channelTab === "email" ? emailReachCount : phoneReachCount;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-x-hidden">

      {/* Channel tabs */}
      <div className="flex border-b border-slate-100 flex-shrink-0">
        {(["email", "sms", "whatsapp"] as const).map((ch) => {
          const { label, Icon } = CHANNEL_CONFIG[ch];
          return (
            <button
              key={ch}
              onClick={() => { setChannelTab(ch); setSearch(""); setShowForm(false); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold border-b-2 -mb-px transition",
                channelTab === ch
                  ? "border-[#1a9c38] text-[#1a9c38]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {channelTab === "whatsapp" ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-6 space-y-3">
          <WhatsAppBroadcast businessId={businessId} businessName={businessName} phoneReachCount={phoneReachCount} />
        </div>
      ) : (
        <>
          {/* Search + New */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <div className="flex gap-2 items-stretch h-11">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full h-full pl-9 pr-4 border border-slate-200 rounded-[8px] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a9c38] transition"
                />
              </div>
              {!showForm && (
                <button
                  onClick={openForm}
                  className="h-full flex items-center gap-1.5 px-3 bg-[#1a9c38] hover:bg-green-700 text-white rounded-[8px] text-[13px] font-semibold transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              )}
            </div>
          </div>

          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-3">

            {/* Inline form */}
            {showForm && (
              <div className="border border-slate-200 rounded-[12px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-[13px] font-semibold text-[#0F172A]">
                    New {CHANNEL_CONFIG[form.channel].label} Campaign
                  </span>
                  <button onClick={closeForm} className="p-1 text-slate-400 hover:text-slate-600 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-4 pt-4 pb-3 space-y-4">
                  <SectionDivider label="Campaign" />
                  <div className="space-y-3">
                    <Field label="Campaign name *">
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Ramadan Sale Announcement"
                        className={innerCls}
                      />
                    </Field>
                    {form.channel === "email" && (
                      <Field label="Email subject *">
                        <input
                          value={form.subject}
                          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                          placeholder="e.g. Exclusive sale just for you!"
                          className={innerCls}
                        />
                      </Field>
                    )}
                    <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-[#1a9c38] transition">
                      <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">
                        Message * <span className="text-slate-400 font-normal">({form.message.length}/160)</span>
                      </legend>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        rows={4}
                        placeholder={form.channel === "email" ? "Write your email message..." : "Write your SMS message (160 chars = 1 SMS)"}
                        className={`${innerCls} resize-none`}
                      />
                    </fieldset>
                  </div>

                  <SectionDivider label="Audience" />
                  <div className="space-y-2">
                    {[
                      { value: "all",        label: "All customers" },
                      { value: "tag",        label: "By tag" },
                      { value: "debtors",    label: "Customers with outstanding balance" },
                      { value: "high_value", label: "High-value customers (by spend)" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="target"
                          value={opt.value}
                          checked={form.target_type === opt.value}
                          onChange={() => setForm((f) => ({ ...f, target_type: opt.value }))}
                          className="accent-[#1a9c38]"
                        />
                        <span className="text-[13px] text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                    {form.target_type === "tag" && (
                      <Field label="Select tag">
                        <select
                          value={form.target_tag_id}
                          onChange={(e) => setForm((f) => ({ ...f, target_tag_id: e.target.value }))}
                          className={`${innerCls} -ml-0.5`}
                        >
                          <option value="">— Choose tag —</option>
                          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </Field>
                    )}
                    {form.target_type === "high_value" && (
                      <Field label="Minimum total spent">
                        <input
                          type="number"
                          value={form.target_min_spent}
                          onChange={(e) => setForm((f) => ({ ...f, target_min_spent: e.target.value }))}
                          placeholder="e.g. 50000"
                          className={innerCls}
                        />
                      </Field>
                    )}
                  </div>

                  {error && (
                    <p className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-[8px]">{error}</p>
                  )}
                </div>

                <div className="px-4 pb-4 flex gap-3">
                  <button
                    onClick={closeForm}
                    className="py-2.5 px-4 border border-slate-200 rounded-[8px] text-[14px] text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveDraft}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50 shadow-sm shadow-green-900/20"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Campaign
                  </button>
                </div>
              </div>
            )}

            {/* Send result */}
            {sendResult && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-[8px] text-[13px] font-semibold">
                <Check className="w-4 h-4 flex-shrink-0" />
                Sent {sendResult.sent} messages{sendResult.failed > 0 ? ` · ${sendResult.failed} failed` : ""}
              </div>
            )}
            {error && !showForm && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-[8px] text-[13px]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Reach hint */}
            {!showForm && (
              <p className="text-[12px] text-slate-400 px-0.5">
                <span className="font-semibold text-slate-600">{reach}</span> contacts reachable via {channelTab === "email" ? "email" : "SMS"}
              </p>
            )}

            {/* Campaign list */}
            {filtered.length === 0 && !showForm ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  {channelTab === "email"
                    ? <Mail className="w-9 h-9 text-slate-300" />
                    : <MessageSquare className="w-9 h-9 text-slate-300" />}
                </div>
                <p className="text-[16px] font-bold text-slate-800">
                  {search ? "No campaigns found" : `No ${CHANNEL_CONFIG[channelTab].label} campaigns yet`}
                </p>
                <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs">
                  {search ? "Try a different search" : "Create your first campaign to reach your customers"}
                </p>
              </div>
            ) : filtered.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="bg-white rounded-[8px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {filtered.map((campaign) => {
                    const { Icon, color, bg } = CHANNEL_CONFIG[campaign.channel];
                    const statusCfg = STATUS_CONFIG[campaign.status];
                    const isSending = sending === campaign.id;
                    const date = campaign.sent_at ?? campaign.created_at;
                    const canSend = campaign.status !== "sent" && campaign.status !== "sending";

                    return (
                      <div key={campaign.id} className="px-4 py-4">
                        {/* Main row */}
                        <div className="flex items-start gap-3">
                          <div className={cn("w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5", bg)}>
                            <Icon className={cn("w-4 h-4", color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[15px] text-slate-900 leading-none truncate max-w-[160px]">{campaign.name}</span>
                              <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", statusCfg.bg, statusCfg.text)}>
                                {statusCfg.label}
                              </span>
                            </div>
                            {campaign.subject && (
                              <p className="text-[13px] text-slate-400 mt-0.5 truncate">{campaign.subject}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[12px] text-slate-400" suppressHydrationWarning>{shortDate(date)}</span>
                              {campaign.status === "sent" && (
                                <span className="flex items-center gap-1 text-[12px] text-slate-400">
                                  <Users className="w-3 h-3" />
                                  {campaign.sent_count} sent
                                  {campaign.failed_count > 0 && <span className="text-red-400 ml-1">· {campaign.failed_count} failed</span>}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="flex items-center gap-2 mt-3 pl-[52px]">
                          {canSend && (
                            <button
                              onClick={() => sendCampaign(campaign)}
                              disabled={isSending}
                              className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                            >
                              {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Send
                            </button>
                          )}
                          {campaign.status !== "sending" && (
                            <button
                              onClick={() => deleteCampaign(campaign.id)}
                              className="flex items-center gap-1.5 text-[13px] font-semibold text-red-500 px-3 py-1.5 rounded-lg transition active:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function WhatsAppBroadcast({ businessId, businessName, phoneReachCount }: { businessId: string; businessName: string; phoneReachCount: number }) {
  const [message, setMessage] = useState(`Hi {name}, this is ${businessName}. `);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<{ name: string; phone: string }[] | null>(null);

  async function generateLinks() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("customers")
      .select("name, phone")
      .eq("business_id", businessId)
      .not("phone", "is", null);
    setCustomers((data ?? []) as { name: string; phone: string }[]);
    setLoading(false);
  }

  function buildLink(customer: { name: string; phone: string }) {
    const text = message.replace("{name}", customer.name.split(" ")[0]);
    let phone = customer.phone.replace(/\s+/g, "");
    if (phone.startsWith("0")) phone = "234" + phone.slice(1);
    if (phone.startsWith("+")) phone = phone.slice(1);
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  const innerCls = "w-full text-sm bg-transparent focus:outline-none text-[#0F172A] placeholder:text-slate-400 pt-0.5 pb-1";

  return (
    <div className="space-y-3">
      <div className="border border-slate-200 rounded-[12px] p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-[14px] text-[#0F172A]">WhatsApp Broadcast</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Compose a message and open WhatsApp for each customer individually.
            </p>
          </div>
        </div>

        <fieldset className="border border-slate-200 rounded-[8px] px-3 pt-0 pb-2 focus-within:border-[#1a9c38] transition">
          <legend className="text-[11px] font-medium text-slate-600 px-1 ml-0.5 leading-none">
            Message template <span className="text-slate-400 font-normal">(use {"{name}"} for first name)</span>
          </legend>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className={`${innerCls} resize-none`}
          />
        </fieldset>

        <button
          onClick={generateLinks}
          disabled={loading || !message.trim()}
          className="w-full flex items-center justify-center gap-2 bg-[#1a9c38] hover:bg-green-700 text-white py-2.5 rounded-[8px] text-[14px] font-semibold transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          Generate {phoneReachCount} WhatsApp links
        </button>
      </div>

      {customers && (
        <div className="border border-slate-200 rounded-[12px] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[13px] font-semibold text-slate-600">{customers.length} links — tap each to open WhatsApp</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto no-scrollbar">
            {customers.map((c, i) => (
              <a
                key={i}
                href={buildLink(c)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition active:bg-slate-100"
              >
                <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center text-green-700 font-bold text-[14px] flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0F172A]">{c.name}</p>
                  <p className="text-[12px] text-slate-400">{c.phone}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
