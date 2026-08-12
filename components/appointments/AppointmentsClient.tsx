"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, User, X, Check, Phone } from "lucide-react";
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

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-500",
  no_show: "bg-amber-100 text-amber-700",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AppointmentsClient({ appointments: initialAppts, members, customers, businessId, weekStart: initialWeekStart }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [appts, setAppts] = useState<Appointment[]>(initialAppts);
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    service_name: "",
    staff_id: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "10:00",
    notes: "",
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function prevWeek() {
    const newStart = addDays(weekStart, -7);
    setWeekStart(newStart);
    router.push(`?week=${newStart}`, { scroll: false });
  }

  function nextWeek() {
    const newStart = addDays(weekStart, 7);
    setWeekStart(newStart);
    router.push(`?week=${newStart}`, { scroll: false });
  }

  function apptDay(a: Appointment) {
    return a.start_time.split("T")[0];
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
      setShowCreate(false);
      setForm({ customer_name: "", customer_phone: "", service_name: "", staff_id: "", date: new Date().toISOString().split("T")[0], start_time: "09:00", end_time: "10:00", notes: "" });
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: Appointment["status"]) {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  const dayAppts = (day: string) => appts.filter((a) => apptDay(a) === day);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex-1 p-5 space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-semibold text-[#0F172A]">
            {new Date(weekStart + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
            {new Date(addDays(weekStart, 6) + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button onClick={nextWeek} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Week calendar */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const dayApptList = dayAppts(day);
          const isToday = day === today;
          return (
            <div key={day} className={cn("bg-white rounded-xl border shadow-sm min-h-[120px] p-2", isToday ? "border-green-400 ring-1 ring-green-300" : "border-slate-200")}>
              <div className="text-center mb-2">
                <p className="text-xs font-semibold text-slate-500">{DAYS[i]}</p>
                <p className={cn("text-sm font-bold", isToday ? "text-green-600" : "text-[#0F172A]")}>
                  {new Date(day + "T00:00:00").getDate()}
                </p>
              </div>
              <div className="space-y-1">
                {dayApptList.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedDay(a.id === selectedDay ? null : a.id)}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded-lg text-xs font-medium truncate transition",
                      STATUS_STYLES[a.status]
                    )}
                  >
                    {formatTime(a.start_time)} {a.customer_name}
                  </button>
                ))}
                {dayApptList.length > 3 && (
                  <p className="text-xs text-slate-400 text-center">+{dayApptList.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointment list for the week */}
      {appts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">This Week's Appointments</p>
          </div>
          <div className="divide-y divide-slate-50">
            {appts.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0F172A]">{a.customer_name}</p>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_STYLES[a.status])}>{a.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(a.start_time)} – {formatTime(a.end_time)}</span>
                    <span>{a.service_name}</span>
                    {a.customer_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.customer_phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {a.status === "scheduled" && (
                    <button onClick={() => updateStatus(a.id, "confirmed")} title="Confirm" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(a.status === "scheduled" || a.status === "confirmed") && (
                    <>
                      <button onClick={() => updateStatus(a.id, "completed")} title="Complete" className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition">Done</button>
                      <button onClick={() => updateStatus(a.id, "cancelled")} title="Cancel" className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {appts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No appointments this week</p>
          <p className="text-xs text-slate-400">Book an appointment to get started</p>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Book Appointment</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {customers.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Existing Customer (optional)</label>
                  <select onChange={(e) => selectCustomer(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">— Walk-in / New —</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
                <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="+234..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Service *</label>
                <input value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} placeholder="e.g. Haircut, Massage, Consultation" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              {members.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Staff</label>
                  <select value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">— Any —</option>
                    {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name ?? m.user_id}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={createAppt} disabled={saving || !form.customer_name.trim() || !form.service_name.trim()} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {saving ? "Booking..." : "Book"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
