import { isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createServiceClient } from "@/lib/supabase/service";

/** Mirror outbound communications into CRM timeline (communication_history). */
export async function appendCrmTimeline(input: {
  businessId: string;
  customerId?: string | null;
  appointmentId?: string | null;
  channel: "email" | "sms" | "reminder" | "ai" | "note";
  status: string;
  subject?: string | null;
  body?: string | null;
  recipient?: string | null;
  provider?: string | null;
  providerMessageId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!input.customerId) return;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("communication_history").insert({
      business_id: input.businessId,
      customer_id: input.customerId,
      appointment_id: input.appointmentId ?? null,
      channel: input.channel === "email" || input.channel === "sms"
        ? input.channel
        : input.channel,
      direction: "outbound",
      status: input.status,
      subject: input.subject ?? null,
      body: input.body ?? null,
      recipient: input.recipient ?? null,
      provider: input.provider ?? null,
      provider_message_id: input.providerMessageId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error && !isSoftSchemaFallbackAllowed(error.message)) {
      console.warn("[comms.timeline]", error.message);
    }
  } catch {
    // Never block delivery on timeline write
  }
}

export async function writeCommsAudit(input: {
  businessId: string;
  action: string;
  summary: string;
  channel?: string;
  templateKey?: string;
  recipient?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("communications_audit_log").insert({
      business_id: input.businessId,
      action: input.action,
      channel: input.channel ?? null,
      template_key: input.templateKey ?? null,
      recipient: input.recipient ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? {},
    });
    if (error && !isSoftSchemaFallbackAllowed(error.message)) {
      console.warn("[comms.audit]", error.message);
    }
  } catch {
    // ignore
  }
}
