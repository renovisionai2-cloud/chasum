/**
 * Booking notification delivery — synchronous provider truth and queue reconciliation.
 *
 * Provider acceptance and queue finalization are separate results. Enabled
 * delivery shares a durable send occurrence with the asynchronously queued twin.
 */

import { planIncludesSms } from "@/lib/billing/plan-features";
import { sendEmail, sendSMS } from "@/lib/communications/delivery";
import type { AppointmentTemplateContext, SendResult } from "@/lib/communications/types";
import { initialBookingIntentId, newSendIntentId } from "@/lib/communications/intent-identity";
import { workerReliabilityEnabled } from "@/lib/communications/reliability-config";
import { inspectSendIntent, inspectUnresolvedSendIntent } from "@/lib/communications/send-intent";
import {
  getEmailFromAddress,
  getResendApiKey,
  getTwilioConfig,
} from "@/lib/env";
import {
  formatNotificationStatus,
  type BookingNotificationChannel,
  type NotificationChannelStatus,
} from "@/lib/notifications/status-labels";
import { logger } from "@/lib/observability/logger";
import { unwrapRelation } from "@/lib/supabase/relations";
import { createServiceClient } from "@/lib/supabase/service";

export type { NotificationChannelStatus, BookingNotificationChannel };
export { formatNotificationStatus };

export type BookingNotificationItem = {
  channel: BookingNotificationChannel;
  status: NotificationChannelStatus;
  label: string;
  detail?: string | null;
  providerMessageId?: string | null;
  canRetry?: boolean;
  jobId?: string | null;
  deliveryState?: SendResult["deliveryState"];
  reconciliationRequired?: boolean;
  duplicateSuppressed?: boolean;
  intentId?: string;
};

export type BookingNotificationReport = {
  appointmentId: string;
  items: BookingNotificationItem[];
  emailConfigured: boolean;
  smsConfigured: boolean;
  smsPlanIncluded: boolean;
};

const STALE_PENDING_MS = 60_000;

/** Provider presence only — never returns secret values. */
export function getNotificationProviderConfigStatus() {
  return {
    emailProvider: getResendApiKey() ? ("resend" as const) : ("disabled" as const),
    emailFromConfigured: Boolean(getEmailFromAddress()),
    emailFromHost: (() => {
      const from = getEmailFromAddress();
      const match = from.match(/@([^>\s]+)/);
      return match?.[1] ?? null;
    })(),
    smsProvider: getTwilioConfig() ? ("twilio" as const) : ("disabled" as const),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  };
}

type AppointmentNotifyContext = AppointmentTemplateContext & {
  customerId: string | null;
  businessEmail: string | null;
  notificationEmail: string | null;
  emailEnabled: boolean;
  smsEnabled: boolean;
  ownerEnabled: boolean;
  staffEnabled: boolean;
  staffEmail: string | null;
  subscriptionPlanKey: string | null;
  privateAlphaEnabled: boolean | null;
};

/** Shared appointment email context (financials + branding inputs). */
export async function loadAppointmentNotifyContext(
  appointmentId: string,
  expectedBusinessId?: string,
): Promise<AppointmentNotifyContext | null> {
  const supabase = createServiceClient();
  let query = supabase
    .from("appointments")
    .select(
      `
      id, business_id, customer_id, start_time, end_time, status, notes,
      price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents,
      payment_status,
      business:businesses(
        name, email, notification_email, timezone,
        email_notifications_enabled, sms_notifications_enabled,
        owner_notifications_enabled, staff_notifications_enabled,
        subscription_plan_key, private_alpha_enabled
      ),
      service:services(name),
      staff:staff(name, email),
      customer:customers(id, name, email, phone),
      location:locations(name, timezone)
    `,
    )
    .eq("id", appointmentId);
  if (expectedBusinessId) query = query.eq("business_id", expectedBusinessId);
  const { data, error } = await query.single();

  if (error || !data || (expectedBusinessId && data.business_id !== expectedBusinessId)) {
    logger.warn("notifications", "appointment_context_missing", {
      appointmentId,
      error: error?.message,
    });
    return null;
  }

  const business = unwrapRelation(data.business) as {
    name: string;
    email: string | null;
    notification_email: string | null;
    timezone?: string | null;
    email_notifications_enabled: boolean | null;
    sms_notifications_enabled: boolean | null;
    owner_notifications_enabled: boolean | null;
    staff_notifications_enabled: boolean | null;
    subscription_plan_key: string | null;
    private_alpha_enabled: boolean | null;
  } | null;
  const service = unwrapRelation(data.service) as { name: string } | null;
  const staff = unwrapRelation(data.staff) as {
    name: string;
    email: string | null;
  } | null;
  const customer = unwrapRelation(data.customer) as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  const location = unwrapRelation(
    (data as { location?: unknown }).location,
  ) as { name: string; timezone?: string | null } | null;

  if (!business || !customer) return null;

  const serviceName = service?.name || "Appointment";
  const subtotalCents =
    data.price_cents != null ? Number(data.price_cents) : null;
  const taxCents = Math.max(0, Number(data.tax_cents ?? 0));
  const appointmentTotalCents =
    subtotalCents != null ? subtotalCents + taxCents : null;
  const depositRequiredCents = Math.max(0, Number(data.deposit_cents ?? 0));
  const amountPaidCents = Math.max(0, Number(data.amount_paid_cents ?? 0));
  const amountRefundedCents = Math.max(
    0,
    Number(data.amount_refunded_cents ?? 0),
  );
  const netPaid = Math.max(0, amountPaidCents - amountRefundedCents);
  const remainingBalanceCents =
    appointmentTotalCents != null
      ? Math.max(0, appointmentTotalCents - netPaid)
      : null;
  const { resolveDepositDueNowCents } = await import(
    "@/lib/commerce/booking-financials"
  );
  const { depositDueNowCents } = resolveDepositDueNowCents({
    depositRequiredCents,
    netPaidCents: netPaid,
  });

  let taxRateBps: number | null = null;
  let taxLabel: string | null = null;
  try {
    const { data: taxRows } = await supabase
      .from("tax_rates")
      .select("name, rate_bps, inclusive, is_default, is_active")
      .eq("business_id", data.business_id)
      .eq("is_active", true);
    const rates = [...(taxRows ?? [])].sort((a, b) =>
      String(a.name ?? "").localeCompare(String(b.name ?? "")),
    );
    const preferred =
      rates.find((r) => r.is_default) ?? rates[0] ?? null;
    if (preferred) {
      taxRateBps = Math.max(0, Number(preferred.rate_bps ?? 0));
      taxLabel = String(preferred.name ?? "Tax");
    }
  } catch {
    /* optional enrichment */
  }
  if (
    taxRateBps == null &&
    subtotalCents != null &&
    subtotalCents > 0 &&
    taxCents > 0
  ) {
    taxRateBps = Math.round((taxCents * 10_000) / subtotalCents);
  }

  const { PAYMENT_METHOD_LABELS, APPOINTMENT_PAYMENT_STATUS_LABELS } =
    await import("@/lib/commerce/types");
  let paymentMethodLabel: string | null = null;
  try {
    const { data: txRows } = await supabase
      .from("commerce_transactions")
      .select("method, status, amount_cents, created_at")
      .eq("business_id", data.business_id)
      .eq("appointment_id", data.id)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(5);
    const latest = txRows?.[0];
    if (latest?.method) {
      const method = String(latest.method);
      paymentMethodLabel =
        method in PAYMENT_METHOD_LABELS
          ? PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]
          : method;
    }
  } catch {
    /* optional enrichment */
  }

  const paymentStatus = String(data.payment_status ?? "unpaid");
  const paymentStatusLabel =
    paymentStatus in APPOINTMENT_PAYMENT_STATUS_LABELS
      ? APPOINTMENT_PAYMENT_STATUS_LABELS[
          paymentStatus as keyof typeof APPOINTMENT_PAYMENT_STATUS_LABELS
        ]
      : paymentStatus;

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
    customerEmail: customer.email?.trim() || "",
    customerPhone: customer.phone,
    staffName: staff?.name ?? "To be assigned",
    staffEmail: staff?.email?.trim() || null,
    serviceName,
    startTime: data.start_time,
    endTime: data.end_time,
    timezone,
    locationTimezone,
    businessTimezone,
    locationName: location?.name?.trim() || null,
    notes: data.notes,
    amountCents: appointmentTotalCents,
    subtotalCents,
    taxCents: subtotalCents != null ? taxCents : null,
    taxRateBps,
    taxLabel,
    appointmentTotalCents,
    depositRequiredCents,
    depositPaidCents: netPaid,
    depositDueNowCents,
    remainingBalanceCents,
    paymentMethodLabel,
    paymentStatusLabel,
    businessEmail: business.email?.trim() || null,
    notificationEmail: business.notification_email?.trim() || null,
    emailEnabled: business.email_notifications_enabled !== false,
    smsEnabled: business.sms_notifications_enabled === true,
    ownerEnabled: business.owner_notifications_enabled !== false,
    staffEnabled: business.staff_notifications_enabled !== false,
    subscriptionPlanKey: business.subscription_plan_key,
    privateAlphaEnabled: business.private_alpha_enabled,
  };
}

function resolveBusinessRecipient(ctx: AppointmentNotifyContext): string | null {
  return ctx.notificationEmail || ctx.businessEmail || null;
}

type InlineSendInput = {
  channel: BookingNotificationChannel;
  label: string;
  ctx: AppointmentNotifyContext;
  to: string;
  templateKey: string;
  skipPreferenceCheck?: boolean;
  action?: string;
  forceResend?: boolean;
  sendIntentId?: string;
};

async function alreadySent(input: InlineSendInput, channel: "email" | "sms") {
  const { data, error } = await createServiceClient()
    .from("notification_logs")
    .select("provider_message_id")
    .eq("business_id", input.ctx.businessId)
    .eq("channel", channel)
    .eq("appointment_id", input.ctx.appointmentId!)
    .eq("template_key", input.templateKey)
    .eq("recipient", input.to)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Delivery evidence lookup failed: ${error.message}`);
  return data ? { messageId: data.provider_message_id as string | undefined } : null;
}

/** Only this tenant/channel/occurrence's pending twin can be reconciled inline. */
export async function markRelatedJobs(
  input: InlineSendInput,
  channel: "email" | "sms",
  sendIntentId: string,
  outcome: "completed" | "failed",
  errorMessage?: string,
): Promise<{ reconciliationRequired: boolean }> {
  // An explicit resend creates its own intent, not another attempt of old jobs.
  if (input.forceResend) return { reconciliationRequired: false };
  const reliable = workerReliabilityEnabled();
  const supabase = createServiceClient();
  const payloadMatch = {
    appointmentId: input.ctx.appointmentId,
    templateKey: input.templateKey,
    ...(reliable ? { sendIntentId } : {}),
  };
  try {
    const { data: jobs, error } = await supabase.from("background_jobs")
      .select("id, payload, status")
      .eq("business_id", input.ctx.businessId)
      .eq("job_type", channel)
      .contains("payload", payloadMatch);
    if (error) throw new Error(`Queue twin lookup failed: ${error.message}`);
    const matches = (jobs ?? []).filter((job) => {
      const p = job.payload as Record<string, unknown>;
      // Old customer jobs omitted recipient; only the same loaded tenant's
      // customer address can supply that old implicit destination.
      const recipient = p.recipient ??
        (channel === "sms" ? input.ctx.customerPhone :
          input.templateKey === "appointment.confirmation" ? input.ctx.customerEmail : null);
      return recipient === input.to;
    });
    if (!matches.length) throw new Error("No matching queue twin was found");
    let unsettled = false;
    for (const job of matches) {
      if (job.status === outcome) continue;
      // Never finalize or fail a processing job owned by a worker, or revive a
      // terminal job. Its durable delivery intent prevents another provider call.
      if (job.status !== "pending") { unsettled = true; continue; }
      const { data: updated, error: updateError } = await supabase.from("background_jobs")
        .update({
          status: outcome,
          completed_at: new Date().toISOString(),
          error_message: errorMessage ?? null,
          // Before 029 the disabled-worker compatibility path must not request
          // missing columns. The enabled worker requires the governed migration.
          ...(reliable ? { next_retry_at: null } : {}),
        })
        .eq("id", job.id)
        .eq("business_id", input.ctx.businessId)
        .eq("job_type", channel)
        .eq("status", "pending")
        .contains("payload", { ...payloadMatch, ...((job.payload as Record<string, unknown>).recipient != null
          ? { recipient: input.to } : {}) })
        .select("id");
      if (updateError) throw new Error(`Queue twin update failed: ${updateError.message}`);
      if (updated?.length !== 1) throw new Error("Queue twin ownership changed during reconciliation");
    }
    if (unsettled) throw new Error("Queue twin is processing or has another terminal disposition");
    return { reconciliationRequired: false };
  } catch (error) {
    logger.error("notifications", "queue_reconciliation_required", {
      businessId: input.ctx.businessId,
      appointmentId: input.ctx.appointmentId,
      channel,
      sendIntentId,
      outcome,
      error: error instanceof Error ? error.message : "Queue reconciliation failed",
    });
    return { reconciliationRequired: true };
  }
}

async function acceptedInlineResult(
  input: InlineSendInput, channel: "email" | "sms", sendIntentId: string, result: SendResult,
): Promise<BookingNotificationItem> {
  const base = { channel: input.channel, label: input.label };
    // This is deliberately outside the provider try/catch. Bookkeeping cannot
    // turn an accepted message into a failed-send retry prompt.
    const queue = await markRelatedJobs(input, channel, sendIntentId, "completed");
    const reconciliationRequired = Boolean(result.reconciliationRequired || queue.reconciliationRequired);
    logger.info("notifications", "provider_send_accepted", {
      businessId: input.ctx.businessId, appointmentId: input.ctx.appointmentId,
      channel, sendIntentId, providerMessageId: result.messageId,
      reconciliationRequired, duplicateSuppressed: Boolean(result.duplicateSuppressed),
    });
    return { ...base, status: "sent", providerMessageId: result.messageId,
      deliveryState: "accepted", reconciliationRequired,
      duplicateSuppressed: result.duplicateSuppressed, intentId: result.intentId,
      canRetry: !reconciliationRequired,
      detail: reconciliationRequired ? "Accepted by provider; queue reconciliation requires review. Do not resend."
        : "Accepted by provider." };
}

async function sendInlineChannel(input: InlineSendInput, channel: "email" | "sms"): Promise<BookingNotificationItem> {
  const reliable = workerReliabilityEnabled();
  const sendIntentId = input.sendIntentId ?? (input.forceResend
    ? newSendIntentId() : initialBookingIntentId(input.ctx.appointmentId!));
  const base = { channel: input.channel, label: input.label };
  let result: SendResult;
  if (reliable && input.forceResend) {
    const unresolved = await inspectUnresolvedSendIntent({ businessId: input.ctx.businessId,
      channel, templateKey: input.templateKey, to: input.to,
      entityType: "appointment", entityId: input.ctx.appointmentId! });
    if (unresolved) return { ...base, status: "failed", deliveryState: unresolved.deliveryState,
      reconciliationRequired: true, canRetry: false, intentId: unresolved.intentId,
      detail: "An earlier send is in progress or uncertain. Reconcile before requesting another send." };
  }
  // Established durable truth precedes mutable queue/log/protocol evidence.
  // Failed reconciliation must never turn already accepted delivery into failure.
  if (reliable) {
    const recorded = await inspectSendIntent({
      businessId: input.ctx.businessId, channel, templateKey: input.templateKey,
      to: input.to, reliability: { intentId: sendIntentId, source: "inline", entityType: "appointment", entityId: input.ctx.appointmentId! },
    });
    if (recorded?.success) return acceptedInlineResult(input, channel, sendIntentId,
      { ...recorded, ok: true });
    if (recorded) return { ...base, status: "failed", deliveryState: recorded.deliveryState,
      reconciliationRequired: true, canRetry: false, intentId: recorded.intentId,
      detail: "Delivery outcome requires reconciliation. No new send attempted." };
  }
  if (reliable && !input.forceResend) {
    try {
      const { data: twins, error } = await createServiceClient().from("background_jobs")
        .select("payload")
        .eq("business_id", input.ctx.businessId)
        .eq("job_type", channel)
        .contains("payload", { appointmentId: input.ctx.appointmentId, templateKey: input.templateKey });
      if (error) throw new Error("Queue protocol evidence unavailable");
      if ((twins ?? []).some((job) => {
        const p = job.payload as Record<string, unknown>;
        const recipient = p.recipient ?? (channel === "sms" ? input.ctx.customerPhone :
          input.templateKey === "appointment.confirmation" ? input.ctx.customerEmail : null);
        return recipient === input.to && p.sendIntentProtocol !== "durable-v1";
      })) throw new Error("Legacy send occurrence requires reconciliation before delivery");
      // A pre-activation inline send may have succeeded even when enqueueing
      // failed. A legacy sent log is evidence to HOLD, never evidence to create
      // a new send or silently adopt historical delivery into the ledger.
      const previousDelivery = await alreadySent(input, channel);
      if (previousDelivery) throw new Error("Prior provider acceptance has no matching accepted durable intent");
    } catch (error) {
      logger.error("notifications", "inline_protocol_reconciliation_required", {
        businessId: input.ctx.businessId, appointmentId: input.ctx.appointmentId,
        channel, sendIntentId, error: error instanceof Error ? error.message : "Protocol check failed",
      });
      return { ...base, status: "failed", deliveryState: "not_attempted",
        reconciliationRequired: true, canRetry: false,
        detail: "Earlier delivery evidence requires review. No new send attempted." };
    }
  }
  // Legacy pre-migration inline operation still checks every evidence query.
  // Enabled operation uses the durable occurrence guard, never an all-time log
  // match that could suppress a distinct reschedule or manual resend.
  if (!reliable && !input.forceResend) {
    try {
      const prior = await alreadySent(input, channel);
      if (prior) {
        const queue = await markRelatedJobs(input, channel, sendIntentId, "completed");
        return { ...base, status: "sent", providerMessageId: prior.messageId,
          deliveryState: "accepted", duplicateSuppressed: true, ...queue,
          canRetry: !queue.reconciliationRequired,
          detail: "Already accepted by provider." };
      }
    } catch (error) {
      logger.error("notifications", "delivery_evidence_unavailable", {
        businessId: input.ctx.businessId, appointmentId: input.ctx.appointmentId, channel,
        error: error instanceof Error ? error.message : "Evidence lookup failed",
      });
      return { ...base, status: "failed", deliveryState: "not_attempted",
        reconciliationRequired: true, canRetry: false,
        detail: "Delivery evidence is unavailable. No send attempted; review required." };
    }
  }
  try {
    const args = {
      businessId: input.ctx.businessId, to: input.to, templateKey: input.templateKey,
      context: { ...input.ctx, customMessage: input.action },
      customerId: input.ctx.customerId, appointmentId: input.ctx.appointmentId,
      skipPreferenceCheck: input.skipPreferenceCheck,
      ...(reliable ? { reliability: { intentId: sendIntentId, source: "inline" as const, entityType: "appointment" as const, entityId: input.ctx.appointmentId! } } : {}),
    };
    result = channel === "email" ? await sendEmail(args) : await sendSMS(args);
  } catch (error) {
    // An exception alone cannot prove the provider rejected the request.
    logger.error("notifications", "provider_outcome_unknown", {
      businessId: input.ctx.businessId, appointmentId: input.ctx.appointmentId,
      channel, sendIntentId, error: error instanceof Error ? error.message : "Send interrupted",
    });
    return { ...base, status: "failed", deliveryState: "unknown",
      reconciliationRequired: true, canRetry: false,
      detail: "Delivery outcome is uncertain. Review required before another send." };
  }
  if (result.ok) return acceptedInlineResult(input, channel, sendIntentId, result);
  const unknown = result.deliveryState === "unknown" || Boolean(result.reconciliationRequired);
  const retrySafe = reliable ? result.retrySafe === true : !unknown;
  const queue = unknown ? { reconciliationRequired: true }
    : await markRelatedJobs(input, channel, sendIntentId, "failed", result.error);
  return { ...base, status: result.skipped ? "skipped" : "failed",
    deliveryState: result.deliveryState ?? (result.skipped ? "not_attempted" : "rejected"),
    reconciliationRequired: Boolean(queue.reconciliationRequired || unknown),
    intentId: result.intentId, canRetry: retrySafe && !unknown && !queue.reconciliationRequired,
    detail: unknown ? "Delivery outcome requires reconciliation. Do not resend."
      : result.error ?? "Provider did not accept the message." };
}

async function sendChannelEmail(input: InlineSendInput): Promise<BookingNotificationItem> {
  return sendInlineChannel(input, "email");
}

/**
 * Awaited inline delivery for booking confirmation. Never returns Pending.
 */
export async function deliverBookingNotifications(
  appointmentId: string,
): Promise<BookingNotificationReport> {
  const emailConfigured = Boolean(getResendApiKey());
  const smsConfigured = Boolean(getTwilioConfig());
  const ctx = await loadAppointmentNotifyContext(appointmentId);

  if (!ctx) {
    return {
      appointmentId,
      emailConfigured,
      smsConfigured,
      smsPlanIncluded: false,
      items: [
        {
          channel: "customer_email",
          status: "failed",
          label: "Customer email",
          detail: "Could not load appointment for notification delivery.",
          canRetry: true,
        },
        {
          channel: "customer_sms",
          status: "failed",
          label: "Customer SMS",
          detail: "Could not load appointment for notification delivery.",
          canRetry: false,
        },
        {
          channel: "business_email",
          status: "failed",
          label: "Business email",
          detail: "Could not load appointment for notification delivery.",
          canRetry: true,
        },
        {
          channel: "staff_email",
          status: "failed",
          label: "Staff notification",
          detail: "Could not load appointment for notification delivery.",
          canRetry: false,
        },
      ],
    };
  }

  const smsPlanIncluded = planIncludesSms({
    subscription_plan_key: ctx.subscriptionPlanKey,
    private_alpha_enabled: ctx.privateAlphaEnabled,
  });
  const businessTo = resolveBusinessRecipient(ctx);
  const items: BookingNotificationItem[] = [];

  // Customer email
  if (!ctx.emailEnabled) {
    items.push({
      channel: "customer_email",
      status: "not_enabled",
      label: "Customer email",
    });
  } else if (!ctx.customerEmail) {
    items.push({
      channel: "customer_email",
      status: "no_recipient",
      label: "Customer email",
      detail: "Customer has no email address.",
    });
  } else if (!emailConfigured) {
    items.push({
      channel: "customer_email",
      status: "not_configured",
      label: "Customer email",
      detail: "Email delivery is not configured for this environment.",
    });
  } else {
    items.push(
      await sendChannelEmail({
        channel: "customer_email",
        label: "Customer email",
        ctx,
        to: ctx.customerEmail,
        templateKey: "appointment.confirmation",
      }),
    );
  }

  // Customer SMS
  if (!smsPlanIncluded) {
    items.push({
      channel: "customer_sms",
      status: "not_included",
      label: "Customer SMS",
      detail: "SMS notifications are not included in the current plan.",
    });
  } else if (!ctx.smsEnabled) {
    items.push({
      channel: "customer_sms",
      status: "not_enabled",
      label: "Customer SMS",
    });
  } else if (!ctx.customerPhone?.trim()) {
    items.push({
      channel: "customer_sms",
      status: "no_recipient",
      label: "Customer SMS",
      detail: "Customer has no mobile number.",
    });
  } else if (!smsConfigured) {
    items.push({
      channel: "customer_sms",
      status: "not_configured",
      label: "Customer SMS",
      detail: "SMS notifications are not configured for this business.",
    });
  } else {
    items.push(await sendInlineChannel({
      channel: "customer_sms", label: "Customer SMS", ctx,
      to: ctx.customerPhone.trim(), templateKey: "appointment.confirmation",
    }, "sms"));
  }

  // Business email
  if (!ctx.emailEnabled || !ctx.ownerEnabled) {
    items.push({
      channel: "business_email",
      status: "not_enabled",
      label: "Business email",
    });
  } else if (!businessTo) {
    items.push({
      channel: "business_email",
      status: "no_recipient",
      label: "Business email",
      detail: "No business notification email configured.",
    });
  } else if (!emailConfigured) {
    items.push({
      channel: "business_email",
      status: "not_configured",
      label: "Business email",
      detail: "Email delivery is not configured for this environment.",
    });
  } else {
    items.push(
      await sendChannelEmail({
        channel: "business_email",
        label: "Business email",
        ctx,
        to: businessTo,
        templateKey: "appointment.business",
        skipPreferenceCheck: true,
        action: "New appointment booked",
      }),
    );
  }

  // Staff email
  if (!ctx.emailEnabled || !ctx.staffEnabled) {
    items.push({
      channel: "staff_email",
      status: "not_enabled",
      label: "Staff notification",
    });
  } else if (!ctx.staffEmail) {
    items.push({
      channel: "staff_email",
      status: "no_recipient",
      label: "Staff notification",
      detail: "Assigned employee has no email address.",
    });
  } else if (!emailConfigured) {
    items.push({
      channel: "staff_email",
      status: "not_configured",
      label: "Staff notification",
      detail: "Email delivery is not configured for this environment.",
    });
  } else {
    items.push(
      await sendChannelEmail({
        channel: "staff_email",
        label: "Staff notification",
        ctx,
        to: ctx.staffEmail,
        templateKey: "appointment.staff",
        skipPreferenceCheck: true,
        action: "new appointment",
      }),
    );
  }

  // Never leave Pending after inline delivery.
  for (const item of items) {
    if (item.status === "pending") {
      item.status = "failed";
      item.detail =
        item.detail ??
        "Email could not be sent before the request completed.";
      item.canRetry = true;
    }
  }

  logger.info("notifications", "inline_delivery_complete", {
    appointmentId,
    results: items.map((i) => ({
      channel: i.channel,
      status: i.status,
      providerMessageId: i.providerMessageId ?? null,
    })),
  });

  return {
    appointmentId,
    items,
    emailConfigured,
    smsConfigured,
    smsPlanIncluded,
  };
}

/** @deprecated Prefer deliverBookingNotifications — kept for retry helpers. */
export async function flushAppointmentNotificationJobs(
  appointmentId: string,
): Promise<number> {
  const report = await deliverBookingNotifications(appointmentId);
  return report.items.filter((i) => i.status === "sent").length;
}

export async function buildBookingNotificationReport(
  appointmentId: string,
): Promise<BookingNotificationReport> {
  // Re-run definitive delivery path (idempotent via notification_logs).
  return deliverBookingNotifications(appointmentId);
}

export async function retryBookingNotification(input: {
  businessId: string;
  appointmentId: string;
  channel: BookingNotificationItem["channel"];
}): Promise<BookingNotificationReport> {
  const emailConfigured = Boolean(getResendApiKey());
  const smsConfigured = Boolean(getTwilioConfig());
  const ctx = await loadAppointmentNotifyContext(input.appointmentId, input.businessId);
  if (!ctx) throw new Error("Appointment not found.");

  const smsPlanIncluded = planIncludesSms({
    subscription_plan_key: ctx.subscriptionPlanKey,
    private_alpha_enabled: ctx.privateAlphaEnabled,
  });
  const businessTo = resolveBusinessRecipient(ctx);
  const items: BookingNotificationItem[] = [];

  if (input.channel === "customer_email") {
    if (!ctx.customerEmail) throw new Error("Customer has no email address.");
    if (!emailConfigured) throw new Error("Email delivery is not configured.");
    items.push(
      await sendChannelEmail({
        channel: "customer_email",
        label: "Customer confirmation email",
        ctx,
        to: ctx.customerEmail,
        templateKey: "appointment.confirmation",
        forceResend: true,
      }),
    );
  } else if (input.channel === "business_email") {
    if (!businessTo) throw new Error("No business notification email configured.");
    if (!emailConfigured) throw new Error("Email delivery is not configured.");
    items.push(
      await sendChannelEmail({
        channel: "business_email",
        label: "Business confirmation email",
        ctx,
        to: businessTo,
        templateKey: "appointment.business",
        skipPreferenceCheck: true,
        action: "New appointment booked",
        forceResend: true,
      }),
    );
  } else if (input.channel === "staff_email") {
    if (!ctx.staffEmail) {
      throw new Error("No recipient — assigned employee has no email address.");
    }
    if (!emailConfigured) throw new Error("Email delivery is not configured.");
    items.push(
      await sendChannelEmail({
        channel: "staff_email",
        label: "Staff notification",
        ctx,
        to: ctx.staffEmail,
        templateKey: "appointment.staff",
        skipPreferenceCheck: true,
        action: "new appointment",
        forceResend: true,
      }),
    );
  } else if (input.channel === "customer_sms") {
    if (!smsPlanIncluded || !smsConfigured) {
      throw new Error("Not configured");
    }
    if (!ctx.smsEnabled) throw new Error("SMS is disabled for this business.");
    if (!ctx.customerPhone?.trim()) {
      throw new Error("Customer has no mobile number.");
    }
    items.push(await sendInlineChannel({
      channel: "customer_sms", label: "Customer SMS", ctx,
      to: ctx.customerPhone.trim(), templateKey: "appointment.confirmation", forceResend: true,
    }, "sms"));
  } else {
    throw new Error("Unknown notification channel.");
  }

  return {
    appointmentId: input.appointmentId,
    items,
    emailConfigured,
    smsConfigured,
    smsPlanIncluded,
  };
}

/**
 * Read-only communication status for Edit Booking — does not send mail.
 */
export async function loadAppointmentCommunicationStatus(
  appointmentId: string,
): Promise<BookingNotificationReport> {
  const emailConfigured = Boolean(getResendApiKey());
  const smsConfigured = Boolean(getTwilioConfig());
  const ctx = await loadAppointmentNotifyContext(appointmentId);
  const supabase = createServiceClient();

  if (!ctx) {
    return {
      appointmentId,
      emailConfigured,
      smsConfigured,
      smsPlanIncluded: false,
      items: [],
    };
  }

  const smsPlanIncluded = planIncludesSms({
    subscription_plan_key: ctx.subscriptionPlanKey,
    private_alpha_enabled: ctx.privateAlphaEnabled,
  });
  const businessTo = resolveBusinessRecipient(ctx);

  const { data: logs } = await supabase
    .from("notification_logs")
    .select(
      "template_key, recipient, status, error_message, provider_message_id, sent_at, created_at",
    )
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false })
    .limit(40);

  function latestFor(
    templateKey: string,
    recipient?: string | null,
  ): {
    status: string;
    detail: string | null;
    sentAt: string | null;
    recipient: string | null;
  } | null {
    const row = (logs ?? []).find((l) => {
      if (String(l.template_key) !== templateKey) return false;
      if (recipient && String(l.recipient) !== recipient) return false;
      return true;
    });
    if (!row) return null;
    return {
      status: String(row.status ?? "failed"),
      detail: (row.error_message as string | null) ?? null,
      sentAt: (row.sent_at as string | null) ?? (row.created_at as string | null),
      recipient: (row.recipient as string | null) ?? null,
    };
  }

  function mapLogStatus(
    raw: string,
  ): BookingNotificationItem["status"] {
    if (raw === "sent" || raw === "delivered") return "sent";
    if (raw === "skipped") return "skipped";
    if (raw === "pending" || raw === "queued" || raw === "sending") return "pending";
    return "failed";
  }

  const items: BookingNotificationItem[] = [];

  // Customer confirmation
  if (!ctx.customerEmail) {
    items.push({
      channel: "customer_email",
      status: "no_recipient",
      label: "Customer confirmation email",
      detail: "Customer has no email address.",
      canRetry: false,
    });
  } else {
    const log = latestFor("appointment.confirmation", ctx.customerEmail);
    items.push({
      channel: "customer_email",
      status: log ? mapLogStatus(log.status) : "not_applicable",
      label: "Customer confirmation email",
      detail: log
        ? [log.recipient, log.sentAt ? `Last attempt ${log.sentAt}` : null, log.detail]
            .filter(Boolean)
            .join(" · ")
        : `Recipient ${ctx.customerEmail}`,
      canRetry: Boolean(ctx.customerEmail) && emailConfigured,
    });
  }

  // Business confirmation
  if (!businessTo) {
    items.push({
      channel: "business_email",
      status: "no_recipient",
      label: "Business confirmation email",
      detail: "No business notification email configured.",
      canRetry: false,
    });
  } else {
    const log = latestFor("appointment.business", businessTo);
    items.push({
      channel: "business_email",
      status: log ? mapLogStatus(log.status) : "not_applicable",
      label: "Business confirmation email",
      detail: log
        ? [log.recipient, log.sentAt ? `Last attempt ${log.sentAt}` : null, log.detail]
            .filter(Boolean)
            .join(" · ")
        : `Recipient ${businessTo}`,
      canRetry: emailConfigured,
    });
  }

  // Payment receipt
  const { data: receipt } = await supabase
    .from("commerce_receipts")
    .select("id, receipt_number, email_status, issued_at, amount_cents")
    .eq("business_id", ctx.businessId)
    .eq("customer_id", ctx.customerId)
    .order("issued_at", { ascending: false })
    .limit(20);

  // Prefer receipt linked via appointment transactions
  const { data: txs } = await supabase
    .from("commerce_transactions")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("business_id", ctx.businessId)
    .eq("status", "succeeded")
    .limit(20);
  const txIds = new Set((txs ?? []).map((t) => String(t.id)));
  let receiptRow: {
    id: string;
    receipt_number?: string;
    email_status?: string;
    issued_at?: string;
  } | null = null;
  if (txIds.size > 0) {
    const { data: linked } = await supabase
      .from("commerce_receipts")
      .select("id, receipt_number, email_status, issued_at, transaction_id")
      .eq("business_id", ctx.businessId)
      .in("transaction_id", [...txIds])
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    receiptRow = linked;
  }
  if (!receiptRow && receipt?.[0]) {
    receiptRow = receipt[0];
  }

  if (!receiptRow) {
    items.push({
      channel: "payment_receipt",
      status: "not_applicable",
      label: "Payment receipt",
      detail: "No successful payment receipt for this appointment.",
      canRetry: false,
    });
  } else {
    const st = String(receiptRow.email_status ?? "not_sent");
    items.push({
      channel: "payment_receipt",
      status:
        st === "sent"
          ? "sent"
          : st === "queued"
            ? "pending"
            : st === "failed"
              ? "failed"
              : "not_requested",
      label: "Payment receipt",
      detail: [
        receiptRow.receipt_number ? `Receipt ${receiptRow.receipt_number}` : null,
        ctx.customerEmail ? `To ${ctx.customerEmail}` : null,
        receiptRow.issued_at ? `Issued ${receiptRow.issued_at}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      canRetry: Boolean(ctx.customerEmail),
    });
  }

  // Staff
  if (!ctx.staffEmail) {
    items.push({
      channel: "staff_email",
      status: "no_recipient",
      label: "Staff notification",
      detail: "No recipient — assigned employee has no email address.",
      canRetry: false,
    });
  } else {
    const log = latestFor("appointment.staff", ctx.staffEmail);
    items.push({
      channel: "staff_email",
      status: log ? mapLogStatus(log.status) : "not_applicable",
      label: "Staff notification",
      detail: log
        ? [log.recipient, log.sentAt ? `Last attempt ${log.sentAt}` : null, log.detail]
            .filter(Boolean)
            .join(" · ")
        : `Recipient ${ctx.staffEmail}`,
      canRetry: emailConfigured,
    });
  }

  // SMS
  if (!smsPlanIncluded || !smsConfigured) {
    items.push({
      channel: "customer_sms",
      status: "not_configured",
      label: "Customer SMS",
      detail: "Not configured",
      canRetry: false,
    });
  } else if (!ctx.customerPhone?.trim()) {
    items.push({
      channel: "customer_sms",
      status: "no_recipient",
      label: "Customer SMS",
      detail: "Customer has no mobile number.",
      canRetry: false,
    });
  } else {
    items.push({
      channel: "customer_sms",
      status: "not_applicable",
      label: "Customer SMS",
      detail: `Recipient ${ctx.customerPhone}`,
      canRetry: true,
    });
  }

  if (workerReliabilityEnabled()) {
    const targets: Record<BookingNotificationChannel, { channel: "email" | "sms"; templateKey: string; to?: string | null }> = {
      customer_email: { channel: "email", templateKey: "appointment.confirmation", to: ctx.customerEmail },
      customer_sms: { channel: "sms", templateKey: "appointment.confirmation", to: ctx.customerPhone?.trim() },
      business_email: { channel: "email", templateKey: "appointment.business", to: businessTo },
      staff_email: { channel: "email", templateKey: "appointment.staff", to: ctx.staffEmail },
      payment_receipt: { channel: "email", templateKey: "commerce.receipt", to: ctx.customerEmail },
    };
    await Promise.all(items.map(async (item) => {
      const target = targets[item.channel];
      if (item.channel === "payment_receipt" && item.status === "pending") {
        item.canRetry = false; item.reconciliationRequired = true; item.deliveryState = "unknown";
      }
      if (!target.to || (item.channel === "payment_receipt" && !receiptRow)) return;
      const unresolved = await inspectUnresolvedSendIntent({ businessId: ctx.businessId,
        channel: target.channel, templateKey: target.templateKey, to: target.to,
        entityType: item.channel === "payment_receipt" ? "receipt" : "appointment",
        entityId: item.channel === "payment_receipt" ? receiptRow!.id : appointmentId });
      if (unresolved) {
        item.canRetry = false; item.reconciliationRequired = true;
        item.deliveryState = unresolved.deliveryState;
        item.detail = "An earlier send is in progress or uncertain. Reconcile before requesting another send.";
      }
    }));
  }

  return {
    appointmentId,
    items,
    emailConfigured,
    smsConfigured,
    smsPlanIncluded,
  };
}

/** Mark jobs stuck in pending/processing past the threshold as failed. */
export async function failStaleNotificationJobs(
  olderThanMs = STALE_PENDING_MS,
): Promise<number> {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - olderThanMs).toISOString();
  const { data: jobs } = await supabase
    .from("background_jobs")
    .select("id, created_at, status")
    .in("job_type", ["email", "sms"])
    .in("status", ["pending", "processing"])
    .lte("created_at", cutoff)
    .limit(50);

  let updated = 0;
  for (const job of jobs ?? []) {
    await supabase
      .from("background_jobs")
      .update({
        status: "failed",
        error_message: "Stalled — delivery did not complete in time.",
        completed_at: new Date().toISOString(),
        next_retry_at: null,
      })
      .eq("id", job.id);
    updated += 1;
  }
  return updated;
}
