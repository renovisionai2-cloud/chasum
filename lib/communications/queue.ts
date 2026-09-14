import {
  channelAllowed,
  deferPastQuietHours,
  loadBusinessCommPreferences,
  loadCustomerCommPreferences,
} from "@/lib/communications/preferences";
import { writeCommsAudit } from "@/lib/communications/timeline";
import type { QueueNotificationInput } from "@/lib/communications/types";
import { enqueueJob } from "@/lib/integrations/jobs/queue";
import { isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createServiceClient } from "@/lib/supabase/service";
import { workerReliabilityEnabled } from "@/lib/communications/reliability-config";
import { sendIntentKey } from "@/lib/communications/send-intent";
import { SAFE_RETRY_PREFIX } from "@/lib/integrations/jobs/claim";
import { logger } from "@/lib/observability/logger";

export type QueueResult = {
  ok: boolean;
  jobId?: string;
  error?: string;
  deferred?: boolean;
};

export async function queueNotification(
  input: QueueNotificationInput,
): Promise<QueueResult> {
  if (input.channel === "in_app") {
    return queueInApp(input);
  }

  const prefs = await loadBusinessCommPreferences(input.businessId, true);
  const customerPrefs = input.customerId
    ? await loadCustomerCommPreferences(
        input.businessId,
        input.customerId,
        true,
      )
    : null;

  const allowed = channelAllowed({
    channel: input.channel,
    business: prefs,
    customer: customerPrefs,
    marketing: input.templateKey.startsWith("marketing."),
  });

  if (!allowed) {
    return { ok: false, error: "Channel disabled by preferences." };
  }

  if (input.channel === "sms") {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();
    const { data: biz } = await supabase
      .from("businesses")
      .select("subscription_plan_key, private_alpha_enabled")
      .eq("id", input.businessId)
      .maybeSingle();
    const {
      planIncludesSms,
      SMS_PLAN_UPGRADE_MESSAGE,
      SMS_PROVIDER_MISSING_MESSAGE,
    } = await import("@/lib/billing/plan-features");
    if (
      !planIncludesSms({
        subscription_plan_key: biz?.subscription_plan_key as string | null,
        private_alpha_enabled: Boolean(
          (biz as { private_alpha_enabled?: boolean } | null)
            ?.private_alpha_enabled,
        ),
      })
    ) {
      return { ok: false, error: SMS_PLAN_UPGRADE_MESSAGE };
    }
    const { isSmsDeliverable } = await import(
      "@/lib/integrations/providers/sms"
    );
    if (!isSmsDeliverable()) {
      return { ok: false, error: SMS_PROVIDER_MISSING_MESSAGE };
    }
  }

  let scheduledAt = input.scheduledAt ?? new Date();
  const deferred = isQuietDeferred(
    scheduledAt,
    prefs.quietHoursStart,
    prefs.quietHoursEnd,
  );
  scheduledAt = deferPastQuietHours(
    scheduledAt,
    prefs.quietHoursStart,
    prefs.quietHoursEnd,
  );

  try {
    const jobId = await enqueueJob(
      input.channel === "email" ? "email" : "sms",
      {
        templateKey: input.templateKey,
        appointmentId: input.appointmentId,
        customerId: input.customerId,
        recipient: input.recipient,
        priority: input.priority ?? "normal",
        ...(input.payload ?? {}),
      },
      {
        businessId: input.businessId,
        scheduledAt,
        maxAttempts: input.maxAttempts ?? 3,
      },
    );

    await writeCommsAudit({
      businessId: input.businessId,
      action: "notification.queued",
      channel: input.channel,
      templateKey: input.templateKey,
      recipient: input.recipient,
      entityType: "background_job",
      entityId: jobId,
      summary: `Queued ${input.channel} ${input.templateKey}`,
      metadata: { deferred },
    });

    return { ok: true, jobId, deferred };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Queue failed",
    };
  }
}

function isQuietDeferred(
  at: Date,
  start: string | null,
  end: string | null,
): boolean {
  const deferred = deferPastQuietHours(at, start, end);
  return deferred.getTime() !== at.getTime();
}

async function queueInApp(input: QueueNotificationInput): Promise<QueueResult> {
  const supabase = createServiceClient();
  const title =
    (input.payload?.title as string) ||
    input.templateKey.replace(/\./g, " ");
  const body = (input.payload?.body as string) || "";

  const row: Record<string, unknown> = {
    business_id: input.businessId,
    type: (input.payload?.type as string) || "business",
    channel: "in_app",
    title,
    body,
    metadata: {
      templateKey: input.templateKey,
      ...(input.payload ?? {}),
    },
  };

  if (input.priority) row.priority = input.priority;
  if (input.customerId) row.customer_id = input.customerId;

  const { data, error } = await supabase
    .from("notifications")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    // Retry without new columns
    if (isSoftSchemaFallbackAllowed(error.message) || error.message.includes("priority")) {
      const { data: fallback, error: err2 } = await supabase
        .from("notifications")
        .insert({
          business_id: input.businessId,
          type: row.type,
          channel: "in_app",
          title,
          body,
          metadata: row.metadata,
        })
        .select("id")
        .single();
      if (err2) return { ok: false, error: err2.message };
      return { ok: true, jobId: String(fallback.id) };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, jobId: String(data.id) };
}

export async function cancelNotification(
  businessId: string,
  jobId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("background_jobs")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("business_id", businessId)
    .in("status", ["pending"]);

  if (error) {
    // status enum may not include cancelled — mark failed with note
    if (error.message.includes("cancelled")) {
      const { error: err2 } = await supabase
        .from("background_jobs")
        .update({
          status: "failed",
          error_message: "Cancelled by Communications Platform",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .eq("business_id", businessId)
        .eq("status", "pending");
      if (err2) return { ok: false, error: err2.message };
    } else {
      return { ok: false, error: error.message };
    }
  }

  await writeCommsAudit({
    businessId,
    action: "notification.cancelled",
    entityType: "background_job",
    entityId: jobId,
    summary: `Cancelled job ${jobId}`,
  });

  return { ok: true };
}

export async function retryNotification(
  businessId: string,
  jobId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!workerReliabilityEnabled()) {
    return { ok: false, error: "Notification retries are held pending worker reliability approval." };
  }
  const supabase = createServiceClient();
  const { data: job, error } = await supabase
    .from("background_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !job) {
    return { ok: false, error: error?.message ?? "Job not found." };
  }

  if (job.status !== "failed" ||
      typeof job.error_message !== "string" || !job.error_message.startsWith(SAFE_RETRY_PREFIX) ||
      !Number.isInteger(job.attempts) || !Number.isInteger(job.max_attempts) ||
      job.attempts < 0 || job.attempts >= job.max_attempts ||
      job.cancelled_at != null) {
    return { ok: false, error: "This job is terminal, owned, exhausted, or has no confirmed safe retry evidence." };
  }
  const channel = job.job_type === "email" || job.job_type === "sms"
    ? job.job_type : job.job_type === "reminder" ? job.payload?.channel : null;
  const templateKey = job.job_type === "reminder" ? "appointment.reminder" : job.payload?.templateKey;
  const intentId = job.payload?.sendIntentId;
  if ((channel !== "email" && channel !== "sms") ||
      job.payload?.sendIntentProtocol !== "durable-v1" ||
      typeof templateKey !== "string" || typeof intentId !== "string") {
    return { ok: false, error: "Legacy or unsupported work requires delivery reconciliation before retry." };
  }
  const { data: intent, error: intentError } = await supabase.from("communication_send_intents")
    .select("id,state")
    .eq("business_id", businessId)
    .eq("intent_key", sendIntentKey(intentId, channel, templateKey))
    .maybeSingle();
  if (intentError || intent?.state !== "rejected") {
    return { ok: false, error: "Delivery is accepted, uncertain, or lacks durable confirmed-rejection evidence." };
  }

  const { data: updated, error: upd } = await supabase
    .from("background_jobs")
    .update({
      status: "pending",
      scheduled_at: new Date().toISOString(),
      next_retry_at: null,
      error_message: null,
      completed_at: null,
      cancelled_at: null,
    })
    .eq("id", jobId)
    .eq("business_id", businessId)
    .eq("status", "failed")
    .eq("attempts", job.attempts)
    .eq("max_attempts", job.max_attempts)
    .eq("error_message", job.error_message)
    .eq("payload", JSON.stringify(job.payload))
    .is("cancelled_at", null)
    .select("id");

  if (upd) return { ok: false, error: upd.message };
  if (updated?.length !== 1 || updated[0].id !== jobId) {
    return { ok: false, error: "Job changed during retry approval; no retry was queued." };
  }

  await writeCommsAudit({
    businessId,
    action: "notification.retry",
    entityType: "background_job",
    entityId: jobId,
    summary: `Retry queued for job ${jobId}`,
  }).catch(() => logger.error("worker", "manual_retry_audit_unconfirmed", { businessId, jobId }));

  return { ok: true };
}

/** Exponential backoff: 1m, 5m, 25m (capped). */
export function computeBackoffMs(attempt: number): number {
  const base = 60_000;
  return Math.min(base * Math.pow(5, Math.max(0, attempt - 1)), 25 * 60_000);
}
