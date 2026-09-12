"use client";

import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  destructive = true,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="font-bold text-[#0F172A] text-[15px]">{title}</p>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{message}</p>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-slate-200 rounded-[10px] text-[14px] font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={[
              "flex-1 py-2.5 rounded-[10px] text-[14px] font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2",
              destructive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-[#1a9c38] hover:bg-green-700 text-white",
            ].join(" ")}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
