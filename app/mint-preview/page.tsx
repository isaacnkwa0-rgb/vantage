const HERO = "#fafefb";

const SHADES = [
  { n: 1, hex: "#f5f7f6" },
  { n: 2, hex: "#f2f5f3" },
  { n: 3, hex: "#eff3f1" },
  { n: 4, hex: "#ecf0ee" },
  { n: 5, hex: "#e8edea" },
  { n: 6, hex: "#f4f7f5" },
  { n: 7, hex: "#f0f4f2" },
  { n: 8, hex: "#edf1ef" },
];

export default function MintPreview() {
  return (
    <div className="min-h-screen bg-white px-4 py-10 space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 px-1">Hero</p>
      <div style={{ background: HERO }} className="rounded-[8px] px-4 py-5 flex items-center gap-3 mb-6">
        <span className="text-[13px] font-semibold text-slate-700">Hero — {HERO}</span>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 px-1">Mint-grey banner options</p>
      {SHADES.map((s) => (
        <div key={s.n} style={{ background: s.hex }} className="rounded-[8px] px-4 py-5 flex items-center gap-3">
          <span className="text-[13px] font-bold text-slate-700 w-5">{s.n}</span>
          <span className="text-[13px] text-slate-500">{s.hex}</span>
        </div>
      ))}
    </div>
  );
}
