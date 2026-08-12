"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, CheckCheck, Info, AlertTriangle, XCircle, Megaphone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

interface Props {
  initial: Notification[];
  businessId: string;
  businessSlug: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  info:    <Info className="w-4 h-4 text-blue-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  error:   <XCircle className="w-4 h-4 text-red-500" />,
  success: <CheckCheck className="w-4 h-4 text-green-500" />,
  promo:   <Megaphone className="w-4 h-4 text-purple-500" />,
};

const TYPE_BG: Record<string, string> = {
  info:    "bg-blue-50 border-blue-100",
  warning: "bg-amber-50 border-amber-100",
  error:   "bg-red-50 border-red-100",
  success: "bg-green-50 border-green-100",
  promo:   "bg-purple-50 border-purple-100",
};

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function NotificationsClient({ initial, businessId, businessSlug }: Props) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>(initial);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${businessId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `business_id=eq.${businessId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  async function deleteNotification(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function clearAll() {
    await supabase.from("notifications").delete().eq("business_id", businessId);
    setNotifications([]);
  }

  const visible = filter === "unread" ? notifications.filter((n) => !n.read_at) : notifications;
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="flex-1 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize",
              filter === f ? "bg-white text-[#0F172A] shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <Bell className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-semibold text-[#0F172A]">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-xs text-slate-400">
            Alerts for low stock, overdue invoices, and business events appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const icon = TYPE_ICON[n.type] ?? TYPE_ICON.info;
            const bg = TYPE_BG[n.type] ?? TYPE_BG.info;
            const isUnread = !n.read_at;
            const inner = (
              <div className={cn("bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3 group transition hover:shadow-md", isUnread ? "border-l-4 border-l-green-500 border-slate-200" : "border-slate-100")}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border", bg)}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold", isUnread ? "text-[#0F172A]" : "text-slate-600")}>{n.title}</p>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                      {isUnread && (
                        <button onClick={(e) => { e.preventDefault(); markRead(n.id); }} className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition" title="Mark read">
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={(e) => { e.preventDefault(); deleteNotification(n.id); }} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            );

            return n.href ? (
              <Link key={n.id} href={n.href.startsWith("/") ? n.href : `/${businessSlug}/${n.href}`} onClick={() => markRead(n.id)}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
