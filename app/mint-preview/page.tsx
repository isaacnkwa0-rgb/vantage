const SHADES = [
  { n: 1, hex: "#f9fefb", name: "barely mint" },
  { n: 2, hex: "#f7fef9", name: "whisper mint" },
  { n: 3, hex: "#f5fef8", name: "soft mint" },
  { n: 4, hex: "#f2fef5", name: "light mint" },
  { n: 5, hex: "#f0fef4", name: "airy mint" },
  { n: 6, hex: "#edfff3", name: "fresh mint" },
  { n: 7, hex: "#ebfef1", name: "cool mint" },
  { n: 8, hex: "#e8fdef", name: "clear mint" },
];

export default function MintPreview() {
  return (
    <div className="min-h-screen bg-[#F5F6F8] px-4 py-10 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-1">Very Light Mint Shades</p>
      {SHADES.map((s) => (
        <div key={s.n} style={{ background: s.hex }} className="rounded-2xl px-4 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-slate-700">{s.n}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800">{s.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.hex}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
