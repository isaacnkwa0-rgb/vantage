export const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent & Utilities", icon: "🏠" },
  { value: "salaries", label: "Salaries & Wages", icon: "👥" },
  { value: "inventory", label: "Inventory & Stock", icon: "📦" },
  { value: "marketing", label: "Marketing & Ads", icon: "📢" },
  { value: "transport", label: "Transport & Delivery", icon: "🚚" },
  { value: "equipment", label: "Equipment & Tools", icon: "🔧" },
  { value: "services", label: "Professional Services", icon: "💼" },
  { value: "maintenance", label: "Maintenance & Repairs", icon: "🔨" },
  { value: "taxes", label: "Taxes & Levies", icon: "🧾" },
  { value: "other", label: "Other", icon: "📋" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];
