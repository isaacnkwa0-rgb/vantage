"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, ChevronDown, Clock, X, Check, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  service_name: string;
  staff_id: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string | null;
}

interface Member {
  user_id: string;
  profiles: { full_name: string } | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface Props {
  appointments: Appointment[];
  members: Member[];
  customers: Customer[];
  businessId: string;
  weekStart: string;
}

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  scheduled:  { label: "Scheduled",  pill: "bg-blue-100 text-blue-700" },
  confirmed:  { label: "Confirmed",  pill: "bg-primary-soft text-primary" },
  completed:  { label: "Completed",  pill: "bg-slate-100 text-slate-600" },
  cancelled:  { label: "Cancelled",  pill: "bg-red-100 text-red-500" },
  no_show:    { label: "No Show",    pill: "bg-amber-100 text-amber-700" },
};

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
  "bg-indigo-100 text-indigo-600",
];

function avatarColor(name: string) {
  return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().split("T")[0];
}

function parseDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function apptDay(a: Appointment) {
  return a.start_time.split("T")[0];
}

export function AppointmentsClient({ appointments: initialAppts, members, customers, businessId, weekStart: initialWeekStart }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];
  const [appts, setAppts] = useState<Appointment[]>(initialAppts);
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [selectedDay, setSelectedDay] = useState(today);
  const [showCreate, setShowCreate] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    service_name: "",
    staff_id: "",
    date: today,
    start_time: "09:00",
    end_time: "10:00",
    notes: "",
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function prevWeek() {
    const newStart = addDays(weekStart, -7);
    setWeekStart(newStart);
    setSelectedDay(newStart);
    router.push(`?week=${newStart}`, { scroll: false });
  }

  function nextWeek() {
    const newStart = addDays(weekStart, 7);
    setWeekStart(newStart);
    setSelectedDay(newStart);
    router.push(`?week=${newStart}`, { scroll: false });
  }

  function selectCustomer(customerId: string) {
    const c = customers.find((x) => x.id === customerId);
    if (c) setForm((f) => ({ ...f, customer_name: c.name, customer_phone: c.phone ?? "" }));
  }

  async function createAppt() {
    if (!form.customer_name.trim() || !form.service_name.trim()) return;
    setSaving(true);
    const start = `${form.date}T${form.start_time}:00`;
    const end = `${form.date}T${form.end_time}:00`;
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        business_id: businessId,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        service_name: form.service_name.trim(),
        staff_id: form.staff_id || null,
        start_time: start,
        end_time: end,
        status: "scheduled",
        notes: form.notes.trim() || null,
      })
      .select()
      .single();
    if (!error && data) {
      setAppts((prev) => [...prev, data as Appointment].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setSelectedDay(form.date);
      setShowCreate(false);
      setForm({ customer_name: "", customer_phone: "", service_name: "", staff_id: "", date: today, start_time: "09:00", end_time: "10:00", notes: "" });
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: Appointment["status"]) {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  const dayAppts = weekDays.reduce<Record<string, Appointment[]>>((acc, d) => {
    acc[d] = appts.filter((a) => apptDay(a) === d);
    return acc;
  }, {});

  const selectedAppts = dayAppts[selectedDay] ?? [];

  const weekLabel = (() => {
    const s = parseDay(weekStart);
    const e = parseDay(addDays(weekStart, 6));
    return `${MONTHS_SHORT[s.getUTCMonth()]} ${s.getUTCDate()} – ${MONTHS_SHORT[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
  })();

  return (
    <div className="flex-1 flex flex-col bg-[#f8faf9] overflow-hidden">

      {/* Week nav header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 active:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-[13px] font-semibold text-slate-700">{weekLabel}</span>
          <button
            onClick={nextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 active:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-11 flex items-center gap-1.5 px-3 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {/* Day dropdown trigger */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex-shrink-0">
        <button
          onClick={() => setShowDayPicker(true)}
          className="w-full flex items-center justify-between px-4 h-11 bg-slate-50 rounded-xl border border-slate-200 active:bg-slate-100 transition-colors"
        >
          <span className="text-[14px] font-semibold text-slate-800">
            {(() => { const d = parseDay(selectedDay); return `${DAYS_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`; })()}
            {selectedDay === today && <span className="ml-2 text-[11px] font-semibold text-primary">Today</span>}
          </span>
          <div className="flex items-center gap-2">
            {(dayAppts[selectedDay]?.length ?? 0) > 0 && (
              <span className="text-[11px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                {dayAppts[selectedDay].length}
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </button>
      </div>

      {/* Day picker bottom sheet */}
      {showDayPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={() => setShowDayPicker(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl px-5 pt-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-slate-900">Select Day</h3>
              <button onClick={() => setShowDayPicker(false)} className="p-1.5 rounded-xl text-slate-400 active:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {weekDays.map((day) => {
                const isSelected = day === selectedDay;
                const isToday = day === today;
                const count = dayAppts[day]?.length ?? 0;
                const d = parseDay(day);
                return (
                  <button
                    key={day}
                    onClick={() => { setSelectedDay(day); setShowDayPicker(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors",
                      isSelected ? "bg-primary-soft" : "active:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0",
                        isSelected ? "bg-primary text-on-primary" : isToday ? "bg-primary-soft text-primary" : "bg-slate-100 text-slate-600"
                      )}>
                        {d.getUTCDate()}
                      </div>
                      <div className="text-left">
                        <p className={cn("text-[14px] font-semibold", isSelected ? "text-primary" : "text-slate-800")}>
                          {DAYS_SHORT[d.getUTCDay()]}
                          {isToday && <span className="ml-2 text-[11px] font-medium text-primary">Today</span>}
                        </p>
                        <p className="text-[12px] text-slate-400">
                          {MONTHS_LONG[d.getUTCMonth()]} {d.getUTCDate()}
                        </p>
                      </div>
                    </div>
                    {count > 0 ? (
                      <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full", isSelected ? "bg-primary-soft text-primary" : "bg-slate-100 text-slate-600")}>
                        {count} appt{count !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      isSelected && <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Appointments list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {selectedAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-16 text-center">
            <div className="w-14 h-14 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm">
              <CalendarDays className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[14px] font-semibold text-slate-700">No appointments</p>
            <p className="text-[13px] text-slate-400">
              {selectedDay === today ? "Nothing booked for today" : (() => { const d = parseDay(selectedDay); return `Nothing booked for ${DAYS_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`; })()}
            </p>
            <button
              onClick={() => { setForm((f) => ({ ...f, date: selectedDay })); setShowCreate(true); }}
              className="mt-1 px-5 py-2.5 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[13px] font-semibold transition active:scale-95"
            >
              Add Appointment
            </button>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 px-1">
              {(() => { const d = parseDay(selectedDay); return `${DAYS_SHORT[d.getUTCDay()]}, ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}`; })()}
              {"  ·  "}{selectedAppts.length} appointment{selectedAppts.length !== 1 ? "s" : ""}
            </p>
            {selectedAppts.map((a) => {
              const cfg = STATUS_CONFIG[a.status];
              const initials = a.customer_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Main row */}
                  <div className="flex items-start gap-3 px-4 py-4">
                    {/* Avatar */}
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0", avatarColor(a.customer_name))}>
                      {initials}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-slate-900">{a.customer_name}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", cfg.pill)}>{cfg.label}</span>
                      </div>
                      <p className="text-[13px] text-slate-600 mt-0.5">{a.service_name}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[12px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(a.start_time)} – {formatTime(a.end_time)}
                        </span>
                        {a.customer_phone && (
                          <span className="flex items-center gap-1 text-[12px] text-slate-400">
                            <Phone className="w-3.5 h-3.5" />
                            {a.customer_phone}
                          </span>
                        )}
                      </div>
                      {a.notes && (
                        <p className="text-[12px] text-slate-400 mt-1 italic">"{a.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {(a.status === "scheduled" || a.status === "confirmed") && (
                    <div className="flex border-t border-slate-100">
                      {a.status === "scheduled" && (
                        <button
                          onClick={() => updateStatus(a.id, "confirmed")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-primary active:bg-primary-soft transition-colors border-r border-slate-100"
                        >
                          <Check className="w-4 h-4" />
                          Confirm
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(a.id, "completed")}
                        className="flex-1 flex items-center justify-center py-3 text-[13px] font-semibold text-slate-600 active:bg-slate-50 transition-colors border-r border-slate-100"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => updateStatus(a.id, "cancelled")}
                        className="flex-1 flex items-center justify-center py-3 text-[13px] font-semibold text-red-500 active:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Create bottom sheet */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl px-5 pt-5 pb-10 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">Add Appointment</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-xl text-slate-400 active:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {customers.length > 0 && (
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Existing Customer</label>
                  <select
                    onChange={(e) => selectCustomer(e.target.value)}
                    className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Walk-in / New customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Customer Name *</label>
                <input
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Phone</label>
                <input
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="+234..."
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Service *</label>
                <input
                  value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  placeholder="e.g. Haircut, Consultation"
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {members.length > 0 && (
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Assigned Staff</label>
                  <select
                    value={form.staff_id}
                    onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                    className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Any staff</option>
                    {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name ?? m.user_id}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3.5 border border-slate-200 text-slate-600 rounded-xl text-[14px] font-semibold active:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAppt}
                disabled={saving || !form.customer_name.trim() || !form.service_name.trim()}
                className="flex-1 py-3.5 bg-primary hover:bg-ember-deep text-on-primary rounded-[8px] text-[14px] font-semibold transition active:scale-95 disabled:opacity-50"
              >
                {saving ? "Booking..." : "Book"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
