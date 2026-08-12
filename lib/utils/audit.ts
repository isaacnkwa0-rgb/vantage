import { createClient } from "@/lib/supabase/client";

export type AuditAction =
  | "sale.created" | "sale.returned"
  | "product.created" | "product.updated" | "product.deleted"
  | "customer.created" | "customer.updated" | "customer.deleted"
  | "invoice.created" | "invoice.updated" | "invoice.paid" | "invoice.cancelled"
  | "quote.created" | "quote.updated" | "quote.accepted" | "quote.rejected" | "quote.converted"
  | "expense.created" | "expense.deleted"
  | "bundle.created" | "bundle.updated" | "bundle.deleted"
  | "shift.opened" | "shift.closed"
  | "discount.created" | "discount.deleted";

interface AuditParams {
  businessId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityName?: string;
  meta?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams) {
  const supabase = createClient();
  await supabase.from("audit_logs").insert({
    business_id: params.businessId,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    entity_name: params.entityName ?? null,
    meta: params.meta ?? null,
  });
}
