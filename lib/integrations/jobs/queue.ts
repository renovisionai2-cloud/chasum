import { createServiceClient } from "@/lib/supabase/service";
import type { JobType } from "@/lib/types/integrations";
import { importReminderJobId, newSendIntentId, scheduledReminderIntentId } from "@/lib/communications/intent-identity";
import { workerReliabilityEnabled } from "@/lib/communications/reliability-config";

export async function enqueueJob(
  jobType: JobType,
  payload: Record<string, unknown>,
  options?: {
    businessId?: string;
    scheduledAt?: Date;
    maxAttempts?: number;
    id?: string;
    duplicateIdIsSuccess?: boolean;
  },
) {
  const supabase = createServiceClient();
  const jobId = options?.id ?? newSendIntentId();
  const durablePayload = { ...payload };
  if (["email", "sms", "reminder"].includes(jobType)) {
    durablePayload.sendIntentId = payload.sendIntentId ?? jobId;
    // Identity alone does not prove an earlier inline send used the ledger.
    // Work created while the feature is disabled stays held for reconciliation.
    delete durablePayload.sendIntentProtocol;
    if (workerReliabilityEnabled()) durablePayload.sendIntentProtocol = "durable-v1";
  }

  const { data, error } = await supabase
    .from("background_jobs")
    .insert({
      id: jobId,
      business_id: options?.businessId ?? null,
      job_type: jobType,
      payload: durablePayload,
      scheduled_at: (options?.scheduledAt ?? new Date()).toISOString(),
      max_attempts: options?.maxAttempts ?? 3,
    })
    .select("id")
    .single();

  if (error) {
    if (options?.id && options.duplicateIdIsSuccess && error.code === "23505") return jobId;
    throw new Error(error.message);
  }
  return data.id as string;
}

export async function enqueueEmailJob(
  businessId: string,
  payload: Record<string, unknown>,
  scheduledAt?: Date,
) {
  return enqueueJob("email", payload, { businessId, scheduledAt });
}

export async function enqueueSmsJob(
  businessId: string,
  payload: Record<string, unknown>,
  scheduledAt?: Date,
) {
  return enqueueJob("sms", payload, { businessId, scheduledAt });
}

export async function enqueueCalendarSyncJob(
  businessId: string,
  connectionId: string,
) {
  return enqueueJob("calendar_sync", { connectionId }, { businessId });
}

export async function enqueueWebhookJob(
  businessId: string,
  event: string,
  data: Record<string, unknown>,
) {
  return enqueueJob("webhook", { event, data }, { businessId });
}

export async function enqueueReminderJobs(
  businessId: string,
  appointmentId: string,
  reminderAt: Date,
  options?: { importRunId?: string },
) {
  const sendIntentId = scheduledReminderIntentId(appointmentId, reminderAt);
  const importMeta = options?.importRunId
    ? { importRunId: options.importRunId, source: "import_reminder_takeover" as const }
    : {};
  const emailJobId = options?.importRunId
    ? importReminderJobId(businessId, options.importRunId, appointmentId, reminderAt, "email")
    : undefined;
  const smsJobId = options?.importRunId
    ? importReminderJobId(businessId, options.importRunId, appointmentId, reminderAt, "sms")
    : undefined;
  await enqueueJob(
    "reminder",
    { appointmentId, channel: "email", sendIntentId, ...importMeta },
    { businessId, scheduledAt: reminderAt, id: emailJobId, duplicateIdIsSuccess: Boolean(emailJobId) },
  );
  await enqueueJob(
    "reminder",
    { appointmentId, channel: "sms", sendIntentId, ...importMeta },
    { businessId, scheduledAt: reminderAt, id: smsJobId, duplicateIdIsSuccess: Boolean(smsJobId) },
  );
}
