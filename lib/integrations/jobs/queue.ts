import { createServiceClient } from "@/lib/supabase/service";
import type { JobType } from "@/lib/types/integrations";

export async function enqueueJob(
  jobType: JobType,
  payload: Record<string, unknown>,
  options?: {
    businessId?: string;
    scheduledAt?: Date;
    maxAttempts?: number;
  },
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("background_jobs")
    .insert({
      business_id: options?.businessId ?? null,
      job_type: jobType,
      payload,
      scheduled_at: (options?.scheduledAt ?? new Date()).toISOString(),
      max_attempts: options?.maxAttempts ?? 3,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
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
) {
  await enqueueJob(
    "reminder",
    { appointmentId, channel: "email" },
    { businessId, scheduledAt: reminderAt },
  );
  await enqueueJob(
    "reminder",
    { appointmentId, channel: "sms" },
    { businessId, scheduledAt: reminderAt },
  );
}
