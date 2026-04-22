export const ROLES = ["owner", "manager", "cashier", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  CREATE_SALE: ["owner", "manager", "cashier"],
  MANAGE_PRODUCTS: ["owner", "manager"],
  DELETE_PRODUCTS: ["owner"],
  ADJUST_STOCK: ["owner", "manager"],
  MANAGE_CUSTOMERS: ["owner", "manager", "cashier"],
  VIEW_CUSTOMERS: ["owner", "manager", "cashier"],
  DELETE_CUSTOMERS: ["owner"],
  LOG_EXPENSES: ["owner", "manager"],
  VIEW_EXPENSES: ["owner", "manager", "cashier"],
  DELETE_EXPENSES: ["owner"],
  VIEW_REPORTS: ["owner", "manager"],
  EXPORT_REPORTS: ["owner"],
  VIEW_ANALYTICS: ["owner", "manager"],
  EDIT_BUSINESS: ["owner", "manager"],
  MANAGE_STAFF: ["owner"],
  VIEW_BILLING: ["owner"],
  APPLY_DISCOUNT: ["owner", "manager", "cashier"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}
