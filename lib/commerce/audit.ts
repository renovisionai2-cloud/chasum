import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError, logQueryError } from "@/lib/supabase/errors";

export async function writeCommerceAudit(input: {
  businessId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("commerce_audit_log").insert({
      business_id: input.businessId,
      actor_id: input.actorId ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      summary: input.summary,
      before_state: input.beforeState ?? null,
      after_state: input.afterState ?? null,
    });
    if (error) {
      if (isMissingSchemaError(error.message)) return;
      logQueryError("commerce.audit", error.message);
    }
  } catch {
    // Never block financial writes on audit failure
  }
}
