export type PlanTier = "free" | "starter" | "pro";

export interface PlanLimits {
  maxProducts: number;        // -1 = unlimited
  maxStaff: number;
  maxLocations: number;
  maxInvoicesPerMonth: number; // -1 = unlimited
  loyaltyProgram: boolean;
  barcodeScanning: boolean;
  offlineMode: boolean;
  expensesTracking: boolean;
  fullReports: boolean;
  advancedAnalytics: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxProducts: 50,
    maxStaff: 1,
    maxLocations: 1,
    maxInvoicesPerMonth: 5,
    loyaltyProgram: false,
    barcodeScanning: false,
    offlineMode: false,
    expensesTracking: false,
    fullReports: false,
    advancedAnalytics: false,
  },
  starter: {
    maxProducts: -1,
    maxStaff: 3,
    maxLocations: 1,
    maxInvoicesPerMonth: -1,
    loyaltyProgram: true,
    barcodeScanning: true,
    offlineMode: true,
    expensesTracking: true,
    fullReports: true,
    advancedAnalytics: false,
  },
  pro: {
    maxProducts: -1,
    maxStaff: -1,
    maxLocations: -1,
    maxInvoicesPerMonth: -1,
    loyaltyProgram: true,
    barcodeScanning: true,
    offlineMode: true,
    expensesTracking: true,
    fullReports: true,
    advancedAnalytics: true,
  },
};

export const PLAN_PRICING = {
  starter: { monthly: 12, annual: 99, monthlyNGN: 6000, annualNGN: 50000 },
  pro:     { monthly: 29, annual: 249, monthlyNGN: 15000, annualNGN: 120000 },
};

// Paystack plan codes — set these after creating plans in your Paystack dashboard
export const PAYSTACK_PLAN_CODES = {
  starter_monthly: process.env.PAYSTACK_PLAN_STARTER_MONTHLY ?? "",
  starter_annual:  process.env.PAYSTACK_PLAN_STARTER_ANNUAL ?? "",
  pro_monthly:     process.env.PAYSTACK_PLAN_PRO_MONTHLY ?? "",
  pro_annual:      process.env.PAYSTACK_PLAN_PRO_ANNUAL ?? "",
};

export function getPlanLimits(tier: string): PlanLimits {
  return PLAN_LIMITS[(tier as PlanTier) ?? "free"] ?? PLAN_LIMITS.free;
}

export function canUseFeature(tier: string, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(tier);
  const val = limits[feature];
  return typeof val === "boolean" ? val : (val as number) !== 0;
}
