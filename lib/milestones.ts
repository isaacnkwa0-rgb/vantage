export interface MilestoneDef {
  key: string;
  label: string;
  emoji: string;
  value: number;
  category: "revenue" | "sales";
}

export type ComputedMilestone = MilestoneDef & {
  status: "achieved" | "next" | "future";
  progress: number;
  current: number;
};

export const REVENUE_MILESTONES: MilestoneDef[] = [
  { key: "rev_100k",  label: "First 100K",    emoji: "🌱", value: 100_000,    category: "revenue" },
  { key: "rev_500k",  label: "Half Million",   emoji: "🔥", value: 500_000,    category: "revenue" },
  { key: "rev_1m",    label: "First Million",  emoji: "💎", value: 1_000_000,  category: "revenue" },
  { key: "rev_5m",    label: "5 Million Club", emoji: "🚀", value: 5_000_000,  category: "revenue" },
  { key: "rev_10m",   label: "10 Million",     emoji: "👑", value: 10_000_000, category: "revenue" },
  { key: "rev_50m",   label: "50 Million",     emoji: "🏆", value: 50_000_000, category: "revenue" },
];

export const SALES_MILESTONES: MilestoneDef[] = [
  { key: "sales_1",    label: "First Sale",  emoji: "🎯", value: 1,    category: "sales" },
  { key: "sales_10",   label: "10 Sales",    emoji: "⚡", value: 10,   category: "sales" },
  { key: "sales_50",   label: "50 Sales",    emoji: "🌟", value: 50,   category: "sales" },
  { key: "sales_100",  label: "100 Sales",   emoji: "💫", value: 100,  category: "sales" },
  { key: "sales_500",  label: "500 Sales",   emoji: "🔮", value: 500,  category: "sales" },
  { key: "sales_1000", label: "1,000 Sales", emoji: "🏆", value: 1000, category: "sales" },
];

export const TOTAL_MILESTONES = REVENUE_MILESTONES.length + SALES_MILESTONES.length;

export function computeMilestones(defs: MilestoneDef[], current: number): ComputedMilestone[] {
  let nextFound = false;
  return defs.map((m) => {
    if (current >= m.value) return { ...m, status: "achieved", progress: 100, current };
    if (!nextFound) {
      nextFound = true;
      return { ...m, status: "next", progress: Math.min(99, (current / m.value) * 100), current };
    }
    return { ...m, status: "future", progress: 0, current: 0 };
  });
}
