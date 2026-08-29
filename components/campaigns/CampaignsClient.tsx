"use client";

import { useState } from "react";
import { Plus, Mail, MessageSquare, MessageCircle, Send, Loader2, X, Check, Clock, AlertCircle, Users, ExternalLink } from "lucide-react";
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
  email:     { label: "Email",     Icon: Mail,           color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  sms:       { label: "SMS",       Icon: MessageSquare,  color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  whatsapp:  { label: "WhatsApp",  Icon: MessageCircle,  color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
};

const STATUS_CONFIG = {
  draft:   { label: "Draft",   color: "text-slate-600 bg-slate-100" },
  sending: { label: "Sending", color: "text-amber-700 bg-amber-100" },
  sent:    { label: "Sent",    color: "text-emerald-700 bg-emerald-100" },
  failed:  { label: "Failed",  color: "text-red-700 bg-red-100" },
};

const EMPTY_FORM = {
  channel: "email" as Campaign["channel"],
  name: "",
  subject: "",
  message: "",
  target_type: "all",
  target_tag_id: "",
  target_min_spent: "",
};

export function CampaignsClient({ campaigns: initialCampaigns, tags, businessId, userId, businessName, whatsappNumber, emailReachCount, phoneReachCount }: Props) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [channelTab, setChannelTab] = useState<Campaign["channel"]>("email");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const filtered = campaigns.filter((c) => c.channel === channelTab);

  function openForm(channel: Campaign["channel"]) {
    setForm({ ...EMPTY_FORM, channel });
    setError(null);
    setShowForm(true);
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
    setShowForm(false);
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
    const supabase = createClient();
    await supabase.from("campaigns").delete().eq("id", id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  const reach = channelTab === "email" ? emailReachCount : phoneReachCount;

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-[#0F172A]">{campaigns.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Campaigns</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-emerald-600">
            {campaigns.reduce((s, c) => s + c.sent_count, 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Messages Sent</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-blue-600">{emailReachCount + phoneReachCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Reachable Contacts</p>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {(["email", "sms", "whatsapp"] as const).map((ch) => {
          const { label, Icon } = CHANNEL_CONFIG[ch];
          return (
            <button
              key={ch}
              onClick={() => setChannelTab(ch)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition",
                channelTab === ch ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* WhatsApp tab — special case, no campaign table */}
      {channelTab === "whatsapp" ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A]">WhatsApp Integration</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Send messages via WhatsApp. For individual messages, payment link and invoice buttons open your WhatsApp automatically. For broadcasts, compose a message below and click the links to send to each customer.
                </p>
              </div>
            </div>
          </div>
          <WhatsAppBroadcast businessId={businessId} businessName={businessName} phoneReachCount={phoneReachCount} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-[#0F172A]">{reach}</span> contacts reachable via {channelTab === "email" ? "email" : "SMS"}
            </p>
            <button
              onClick={() => openForm(channelTab)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm shadow-green-300/40"
            >
              <Plus className="w-4 h-4" />
              New {CHANNEL_CONFIG[channelTab].label} Campaign
            </button>
          </div>

          {sendResult && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
              <Check className="w-4 h-4" />
              Sent {sendResult.sent} messages{sendResult.failed > 0 ? ` · ${sendResult.failed} failed` : ""}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {channelTab === "email" ? <Mail className="w-14 h-14 text-slate-200 mb-4" /> : <MessageSquare className="w-14 h-14 text-slate-200 mb-4" />}
              <p className="text-slate-600 font-medium">No {CHANNEL_CONFIG[channelTab].label} campaigns yet</p>
              <p className="text-slate-400 text-sm mt-1">Create your first campaign to reach your customers</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50 overflow-hidden">
              {filtered.map((campaign) => {
                const { Icon, color, bg } = CHANNEL_CONFIG[campaign.channel];
                const statusCfg = STATUS_CONFIG[campaign.status];
                const isSending = sending === campaign.id;
                return (
                  <div key={campaign.id} className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50 transition group">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F172A] text-sm">{campaign.name}</p>
                      {campaign.subject && <p className="text-xs text-slate-400 truncate">{campaign.subject}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                        {campaign.status === "sent" && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />{campaign.sent_count} sent
                            {campaign.failed_count > 0 && <span className="text-red-400"> · {campaign.failed_count} failed</span>}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {campaign.sent_at
                            ? new Date(campaign.sent_at).toLocaleDateString()
                            : new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      {campaign.status !== "sent" && campaign.status !== "sending" && (
                        <button
                          onClick={() => sendCampaign(campaign)}
                          disabled={isSending}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Send
                        </button>
                      )}
                      {campaign.status !== "sending" && (
                        <button
                          onClick={() => { if (confirm("Delete this campaign?")) deleteCampaign(campaign.id); }}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create campaign form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-bold text-[#0F172A]">
                New {CHANNEL_CONFIG[form.channel].label} Campaign
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Campaign name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ramadan Sale Announcement"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {form.channel === "email" && (
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Email subject *</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Exclusive sale just for you!"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  Message *
                  <span className="font-normal text-slate-400 ml-2">{form.message.length}/160{form.channel === "sms" ? " chars" : ""}</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={5}
                  placeholder={form.channel === "email"
                    ? "Write your email message here..."
                    : form.channel === "sms"
                    ? "Write your SMS message (160 chars = 1 SMS)"
                    : "Write your WhatsApp message..."}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Target audience</label>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All customers" },
                    { value: "tag", label: "By tag" },
                    { value: "debtors", label: "Customers with outstanding balance" },
                    { value: "high_value", label: "High-value customers (by spend)" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="target"
                        value={opt.value}
                        checked={form.target_type === opt.value}
                        onChange={() => setForm((f) => ({ ...f, target_type: opt.value }))}
                        className="accent-green-600"
                      />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {form.target_type === "tag" && (
                  <select
                    value={form.target_tag_id}
                    onChange={(e) => setForm((f) => ({ ...f, target_tag_id: e.target.value }))}
                    className="mt-2 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a tag</option>
                    {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}

                {form.target_type === "high_value" && (
                  <input
                    type="number"
                    value={form.target_min_spent}
                    onChange={(e) => setForm((f) => ({ ...f, target_min_spent: e.target.value }))}
                    placeholder="Minimum total spent (e.g. 50000)"
                    className="mt-2 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button
                  onClick={saveDraft}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// WhatsApp broadcast component
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-1">
          Message template <span className="text-slate-400 font-normal">(use {"{name}"} for first name)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>
      <button
        onClick={generateLinks}
        disabled={loading || !message.trim()}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
        Generate {phoneReachCount} WhatsApp links
      </button>

      {customers && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          <p className="text-xs text-slate-400 font-semibold">{customers.length} links — click each to open WhatsApp</p>
          {customers.map((c, i) => (
            <a
              key={i}
              href={buildLink(c)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition group"
            >
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A]">{c.name}</p>
                <p className="text-xs text-slate-400">{c.phone}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-green-600 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
