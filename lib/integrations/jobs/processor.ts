import { createServiceClient } from "@/lib/supabase/service";
import { unwrapRelation } from "@/lib/supabase/relations";
import {
  computeBackoffMs,
  sendEmail,
  sendSMS,
} from "@/lib/communications";
import { PermanentDeliverySkip, isPermanentDeliverySkip } from "@/lib/communications/errors";
import type { AppointmentTemplateContext } from "@/lib/communications";
import type { SendResult } from "@/lib/communications/types";
import type { SendReliabilityContext } from "@/lib/communications/send-intent";
import { workerReliabilityEnabled, workerWebhooksEnabled } from "@/lib/communications/reliability-config";
import { logger } from "@/lib/observability/logger";
import {
  claimBackgroundJob,
  finalizeClaimedJob,
  RECONCILIATION_REQUIRED_PREFIX,
  SAFE_RETRY_PREFIX,
  WORKER_CLAIM_PREFIX,
  type ClaimedBackgroundJob,
  type JobFinalization,
} from "@/lib/integrations/jobs/claim";
import { generateSingleEventIcs } from "@/lib/integrations/calendar/apple";
import { syncCalendarConnection } from "@/lib/integrations/calendar/sync";
import { dispatchWebhooks } from "@/lib/integrations/webhooks/dispatch";
import { generateRecurringOccurrences } from "@/lib/integrations/automation/recurring";
import { notifyWaitlistForSlot } from "@/lib/integrations/automation/waitlist";
import type { BackgroundJob } from "@/lib/types/integrations";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class SafeJobRetry extends Error {}
class JobReconciliationRequired extends Error {}

function jobReliability(job: BackgroundJob): SendReliabilityContext {
  if (job.payload.sendIntentProtocol !== "durable-v1" ||
      typeof job.payload.sendIntentId !== "string" || !UUID.test(job.payload.sendIntentId)) {
    // Old queue/log evidence does not establish whether an inline send occurred.
    // The historical repair and review of residual legacy work are separate gates.
    throw new JobReconciliationRequired("legacy_send_intent_missing");
  }
  return {
    intentId: job.payload.sendIntentId,
    jobId: job.id,
    attempt: job.attempts,
    source: "worker",
  };
}

function requireBusiness(job: BackgroundJob): string {
  if (!job.business_id || !UUID.test(job.business_id)) {
    throw new JobReconciliationRequired("job_business_missing");
  }
  if (job.payload.businessId != null && job.payload.businessId !== job.business_id) {
    throw new JobReconciliationRequired("payload_tenant_mismatch");
  }
  return job.business_id;
}

async function verifyContextTenant(
  job: BackgroundJob,
  context: AppointmentTemplateContext,
): Promise<void> {
  const businessId = requireBusiness(job);
  if (context.businessId !== businessId ||
      (job.payload.customerId != null && job.payload.customerId !== context.customerId)) {
    throw new JobReconciliationRequired("context_tenant_mismatch");
  }
  if (context.customerId) {
    const { data, error } = await createServiceClient().from("customers")
      .select("id,business_id")
      .eq("id", context.customerId)
      .eq("business_id", businessId)
      .maybeSingle();
    if (error || !data || data.business_id !== businessId) {
      throw new JobReconciliationRequired("customer_tenant_unverified");
    }
  }
}

function requireDeliveryOutcome(result: SendResult, job: BackgroundJob): void {
  if (result.ok) {
    if (result.reconciliationRequired) {
      logger.warn("worker", "accepted_delivery_bookkeeping_unconfirmed", {
        jobId: job.id,
        businessId: job.business_id,
        intentId: result.intentId,
      });
    }
    return;
  }
  if (result.skipped && result.deliveryState !== "unknown" && !result.reconciliationRequired) {
    throw new PermanentDeliverySkip("delivery_skipped_before_provider");
  }
  if (result.retrySafe === true && result.deliveryState !== "unknown" && !result.reconciliationRequired) {
    throw new SafeJobRetry("provider_confirmed_not_accepted");
  }
  throw new JobReconciliationRequired("provider_outcome_unconfirmed_or_retry_unsafe");
}

/** Keep commerce receipt email_status in sync with delivery outcome. */
async function syncCommerceReceiptEmailStatus(
  payload: Record<string, unknown>,
  status: "sent" | "failed",
  job: BackgroundJob,
): Promise<void> {
  if (payload.templateKey !== "commerce.receipt") return;
  const receiptId =
    (payload.receiptId as string | undefined) ||
    ((payload.directContext as { receiptId?: string } | undefined)?.receiptId ??
      null);
  const businessId =
    (payload.directContext as { businessId?: string } | undefined)?.businessId ??
    null;
  if (!receiptId || !businessId) return;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("commerce_receipts")
    .update({
      email_status: status,
      emailed_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", receiptId)
    .eq("business_id", businessId)
    .select("id");
  if (error || data?.length !== 1) {
    // Provider truth is already known. Receipt bookkeeping must never change it
    // into a delivery failure or make the worker submit the message again.
    logger.error("worker", "receipt_delivery_bookkeeping_unconfirmed", {
      jobId: job.id,
      businessId: job.business_id,
      accepted: status === "sent",
      databaseCode: error?.code ?? null,
      affectedRows: data?.length ?? null,
    });
  }
}

async function getAppointmentContext(
  appointmentId: string,
  businessId: string,
): Promise<(AppointmentTemplateContext & { customerId: string | null }) | null> {
  // Prefer shared notify context so business/staff emails include current deposit state.
  const { loadAppointmentNotifyContext } = await import(
    "@/lib/notifications/booking-delivery"
  );
  const rich = await loadAppointmentNotifyContext(appointmentId, businessId);
  if (rich) {
    return {
      ...rich,
      customerId: rich.customerId ?? null,
    };
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id, business_id, customer_id, start_time, end_time, status, notes,
      business:businesses(name, timezone, notification_email, email_notifications_enabled, sms_notifications_enabled),
      service:services(name),
      staff:staff(name, email),
      customer:customers(id, name, email, phone),
      location:locations(name, timezone)
    `,
    )
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .single();

  if (error) throw new JobReconciliationRequired("appointment_context_read_unconfirmed");
  if (!data) return null;

  const business = unwrapRelation(data.business) as {
    name: string;
    timezone?: string | null;
  } | null;
  const service = unwrapRelation(data.service) as { name: string } | null;
  const staff = unwrapRelation(data.staff) as {
    name: string;
    email: string | null;
  } | null;
  const customer = unwrapRelation(data.customer) as {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  const location = unwrapRelation(
    (data as { location?: unknown }).location,
  ) as { name: string; timezone?: string | null } | null;

  // Staff may be unassigned — still deliver customer/business mail.
  if (!business || !service || !customer) return null;

  const { resolveAppointmentEmailTimezone } = await import(
    "@/lib/communications/appointment-datetime"
  );
  const locationTimezone = location?.timezone?.trim() || null;
  const businessTimezone = business.timezone?.trim() || null;
  const timezone = resolveAppointmentEmailTimezone({
    locationTimezone,
    businessTimezone,
  });

  return {
    appointmentId: data.id,
    businessId: data.business_id,
    businessName: business.name,
    customerId: customer.id ?? data.customer_id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    staffName: staff?.name ?? "To be assigned",
    serviceName: service.name,
    startTime: data.start_time,
    endTime: data.end_time,
    timezone,
    locationTimezone,
    businessTimezone,
    locationName: location?.name?.trim() || null,
    notes: data.notes,
  };
}

async function processEmailJob(job: BackgroundJob, payload = job.payload) {
  const reliability = jobReliability(job);
  const businessId = requireBusiness(job);
  const templateKey = payload.templateKey as string;
  const appointmentId = payload.appointmentId as string | undefined;

  // Direct commerce / custom payloads (no appointment)
  if (!appointmentId && payload.directContext) {
    const ctx = payload.directContext as AppointmentTemplateContext;
    await verifyContextTenant(job, ctx);
    const topReceiptId = payload.receiptId;
    const nestedReceiptId = (payload.directContext as { receiptId?: unknown }).receiptId;
    if (topReceiptId != null && nestedReceiptId != null && topReceiptId !== nestedReceiptId) {
      throw new JobReconciliationRequired("receipt_identity_conflict");
    }
    const to = (payload.recipient as string) || ctx.customerEmail;
    if (!to) throw new Error("Missing email recipient");
    const result = await sendEmail({
      businessId: ctx.businessId,
      to,
      templateKey,
      context: ctx,
      customerId: ctx.customerId,
      skipPreferenceCheck: Boolean(payload.skipPreferenceCheck),
      reliability,
    });
    if (result.ok || (result.deliveryState !== "unknown" && !result.reconciliationRequired &&
        (result.retrySafe === true || result.skipped))) {
      await syncCommerceReceiptEmailStatus(payload, result.ok ? "sent" : "failed", job)
        .catch(() => logger.error("worker", "receipt_delivery_bookkeeping_exception", {
          jobId: job.id, businessId, accepted: result.ok,
        }));
    }
    requireDeliveryOutcome(result, job);
    return;
  }

  if (!appointmentId) throw new Error("Missing appointmentId");
  const ctx = await getAppointmentContext(appointmentId, businessId);
  if (!ctx) {
    throw new PermanentDeliverySkip(
      "Could not load appointment for email (missing customer, service, or staff).",
    );
  }
  await verifyContextTenant(job, ctx);
  if (!ctx.customerEmail && !(payload.recipient as string | undefined)) {
    throw new PermanentDeliverySkip(
      "Customer has no email address — confirmation email was not sent.",
    );
  }

  const previousStartTime = payload.previousStartTime as string | undefined;
  const action = payload.action as string | undefined;

  const result = await sendEmail({
    businessId: ctx.businessId,
    to: (payload.recipient as string) ?? ctx.customerEmail!,
    templateKey,
    context: {
      ...ctx,
      previousStartTime,
      customMessage: action,
    },
    customerId: ctx.customerId,
    appointmentId,
    reliability,
    attachments:
      templateKey === "appointment.confirmation" ||
      templateKey === "appointment.staff" ||
      templateKey === "appointment.business" ||
      templateKey === "appointment.reschedule"
        ? [
            {
              filename: "appointment.ics",
              content: Buffer.from(
                generateSingleEventIcs({
                  appointmentId: ctx.appointmentId!,
                  businessId: ctx.businessId,
                  businessName: ctx.businessName,
                  customerName: ctx.customerName,
                  customerEmail: ctx.customerEmail ?? "",
                  customerPhone: ctx.customerPhone ?? null,
                  staffName: ctx.staffName,
                  staffEmail: null,
                  serviceName: ctx.serviceName,
                  startTime: ctx.startTime,
                  endTime: ctx.endTime ?? ctx.startTime,
                  notes: ctx.notes ?? null,
                  status: "confirmed",
                }),
              ).toString("base64"),
              contentType: "text/calendar; charset=utf-8",
            },
          ]
        : undefined,
  });

  requireDeliveryOutcome(result, job);
}

async function processSmsJob(job: BackgroundJob, payload = job.payload) {
  const reliability = jobReliability(job);
  const businessId = requireBusiness(job);
  const templateKey = payload.templateKey as string;
  const appointmentId = payload.appointmentId as string | undefined;

  if (!appointmentId && payload.directContext) {
    const ctx = payload.directContext as AppointmentTemplateContext;
    await verifyContextTenant(job, ctx);
    const to = (payload.recipient as string) || ctx.customerPhone;
    if (!to) {
      throw new PermanentDeliverySkip(
        "Missing SMS recipient — customer has no phone number.",
      );
    }
    const result = await sendSMS({
      businessId: ctx.businessId,
      to,
      templateKey,
      context: ctx,
      customerId: ctx.customerId,
      skipPreferenceCheck: Boolean(payload.skipPreferenceCheck),
      reliability,
    });
    requireDeliveryOutcome(result, job);
    return;
  }

  if (!appointmentId) throw new Error("Missing appointmentId");
  const ctx = await getAppointmentContext(appointmentId, businessId);
  if (!ctx) {
    throw new PermanentDeliverySkip(
      "Could not load appointment for SMS (missing customer, service, or staff).",
    );
  }
  await verifyContextTenant(job, ctx);
  if (!ctx.customerPhone) {
    throw new PermanentDeliverySkip(
      "Customer has no phone number — SMS was not sent.",
    );
  }

  const result = await sendSMS({
    businessId: ctx.businessId,
    to: (payload.recipient as string) ?? ctx.customerPhone,
    templateKey,
    context: {
      ...ctx,
      previousStartTime: payload.previousStartTime as string | undefined,
      amountCents: payload.amountCents as number | undefined,
      customMessage: payload.customMessage as string | undefined,
    },
    customerId: ctx.customerId,
    appointmentId,
    reliability,
  });

  requireDeliveryOutcome(result, job);
}

async function processReminderJob(job: BackgroundJob) {
  const payload = job.payload;
  const appointmentId = payload.appointmentId as string;
  const channel = payload.channel as "email" | "sms";
  const templateKey = "appointment.reminder";

  if (channel === "email") {
    await processEmailJob(job, { ...payload, appointmentId, templateKey });
  } else if (channel === "sms") {
    await processSmsJob(job, { ...payload, appointmentId, templateKey });
  } else {
    throw new JobReconciliationRequired("reminder_channel_invalid");
  }
}

export async function processJob(job: BackgroundJob): Promise<void> {
  if (!workerReliabilityEnabled()) throw new Error("Background worker is held: reliability is not enabled.");
  if (job.status !== "processing" || !job.started_at || !job.error_message?.startsWith(WORKER_CLAIM_PREFIX)) {
    throw new Error("Background job must be atomically claimed before execution.");
  }
  switch (job.job_type) {
    case "email":
      await processEmailJob(job);
      break;
    case "sms":
      await processSmsJob(job);
      break;
    case "calendar_sync":
      await syncCalendarConnection(job.payload.connectionId as string);
      break;
    case "webhook":
      await dispatchWebhooks(
        job.business_id!,
        job.payload.event as string,
        job.payload.data as Record<string, unknown>,
      );
      break;
    case "reminder":
      await processReminderJob(job);
      break;
    case "recurring":
      await generateRecurringOccurrences(job.payload.ruleId as string);
      break;
    case "waitlist_notify":
      await notifyWaitlistForSlot(
        job.business_id!,
        job.payload.appointmentId as string,
        job.id,
      );
      break;
    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }
}

/**
 * Execute one already-claimed job and fence its finalization.
 * Callers must claim a specific row; this never scans the pending queue.
 */
export async function processClaimedJob(
  client: ReturnType<typeof createServiceClient>,
  job: ClaimedBackgroundJob,
): Promise<boolean> {
  if (!workerReliabilityEnabled()) throw new Error("Background worker is held: reliability is not enabled.");
  let succeeded = false;
  let finalization: JobFinalization;
  try {
    await processJob(job);
    succeeded = true;
    finalization = {
      status: "completed",
      completed_at: new Date().toISOString(),
      error_message: null,
      next_retry_at: null,
    };
  } catch (err) {
    const permanent = isPermanentDeliverySkip(err);
    const transactionalSend = job.job_type === "email" || job.job_type === "sms" || job.job_type === "reminder";
    // This hotfix governs transactional delivery. Other integrations retain
    // their existing bounded retry contract; their side-effect idempotency
    // requires separate work and is not certified by the send-intent guard.
    const retrySafe = err instanceof SafeJobRetry;
    const retry = (transactionalSend ? retrySafe : !permanent) && job.attempts < job.max_attempts;
    const reason = err instanceof SafeJobRetry || err instanceof JobReconciliationRequired
      ? err.message
      : permanent ? "delivery_skipped_before_provider" : "execution_outcome_unconfirmed";
    const marker = retrySafe
      ? SAFE_RETRY_PREFIX
      : permanent ? "delivery_skipped:" : RECONCILIATION_REQUIRED_PREFIX;
    const retryAt = new Date(Date.now() + computeBackoffMs(job.attempts));
    finalization = {
      status: retry ? "pending" : "failed",
      error_message: transactionalSend ? `${marker}${reason}` : err instanceof Error ? err.message : "Job failed",
      completed_at: retry ? null : new Date().toISOString(),
      next_retry_at: retry ? retryAt.toISOString() : null,
      scheduled_at: retry ? retryAt.toISOString() : job.scheduled_at,
    };
    logger.warn("worker", retry ? "job_retry_scheduled" : "job_held_or_failed", {
      jobId: job.id,
      businessId: job.business_id,
      attempt: job.attempts,
      intentId: job.payload.sendIntentId ?? null,
      reason,
      retrySafe: transactionalSend ? retrySafe : null,
      retryPolicy: transactionalSend ? "confirmed_delivery_rejection_only" : "baseline_noncommunication",
      maxAttempts: job.max_attempts,
    });
  }
  // Deliberately outside the execution catch. A failed completion write must
  // not get converted into a pending retry after the provider accepted.
  await finalizeClaimedJob(client, job, finalization);
  return succeeded;
}

export async function selectPendingJobCandidates(
  client: ReturnType<typeof createServiceClient>,
  limit = 25,
  now = new Date(),
): Promise<BackgroundJob[]> {
  const nowIso = now.toISOString();
  let query = client
    .from("background_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order("scheduled_at")
    .limit(limit);
  if (!workerWebhooksEnabled()) {
    query = query.neq("job_type", "webhook");
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as BackgroundJob[];
}

export async function processPendingJobs(limit = 25): Promise<number> {
  // Default-off also keeps deployment before 029/new intent schema inert.
  if (!workerReliabilityEnabled()) throw new Error("Background worker is held: reliability is not enabled.");
  const supabase = createServiceClient();
  const jobs = await selectPendingJobCandidates(supabase, limit);
  if (!jobs.length) return 0;

  let processed = 0;

  for (const candidate of jobs) {
    const job = await claimBackgroundJob(supabase, candidate);
    if (!job) continue;
    if (await processClaimedJob(supabase, job)) processed += 1;
  }

  return processed;
}
