"use client";

const shades = [
  { hex: "#f0f9f4", label: "1 — Current (most visible)" },
  { hex: "#f3faf6", label: "2" },
  { hex: "#f5fbf8", label: "3" },
  { hex: "#f7fcf9", label: "4" },
  { hex: "#f9fdfb", label: "5" },
  { hex: "#fafefb", label: "6" },
  { hex: "#fbfefc", label: "7 — Barely noticeable" },
  { hex: "#fdfffe", label: "8 — Almost white" },
];

export default function MintPreview() {
  return (
    <div className="p-5 bg-white min-h-screen">
      <p className="text-[13px] text-slate-500 mb-5 font-medium">
        Tell me the number that matches Bumpa:
      </p>
      <div className="space-y-3">
        {shades.map((s) => (
          <div key={s.hex} className="rounded-[4px] overflow-hidden border border-slate-200">
            <div style={{ backgroundColor: s.hex }} className="h-14 flex items-center px-4">
              <span className="text-[14px] font-bold text-slate-700">{s.label}</span>
            </div>
            <div className="bg-white px-4 py-1">
              <span className="text-[11px] text-slate-400 font-mono">{s.hex}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
