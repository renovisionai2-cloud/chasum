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

  const { error: upd } = await supabase
    .from("background_jobs")
    .update({
      status: "pending",
      scheduled_at: new Date().toISOString(),
      next_retry_at: null,
      error_message: null,
      completed_at: null,
      cancelled_at: null,
    })
    .eq("id", jobId);

  if (upd) return { ok: false, error: upd.message };

  await writeCommsAudit({
    businessId,
    action: "notification.retry",
    entityType: "background_job",
    entityId: jobId,
    summary: `Retry queued for job ${jobId}`,
  });

  return { ok: true };
}

/** Exponential backoff: 1m, 5m, 25m (capped). */
export function computeBackoffMs(attempt: number): number {
  const base = 60_000;
  return Math.min(base * Math.pow(5, Math.max(0, attempt - 1)), 25 * 60_000);
}
