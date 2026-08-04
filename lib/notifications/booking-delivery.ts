/**
 * Booking notification delivery — Preview-safe synchronous confirmation send.
 *
 * Do not leave channels in Pending after this request ends. Enqueued jobs are
 * best-effort audit records; confirmation email/SMS results come from an
 * awaited provider call in the same Server Action.
 */

import { planIncludesSms } from "@/lib/billing/plan-features";
import { sendEmail, sendSMS } from "@/lib/communications/delivery";
import type { AppointmentTemplateContext } from "@/lib/communications/types";
import {
  getEmailFromAddress,
  getResendApiKey,
  getTwilioConfig,
} from "@/lib/env";
import { enqueueEmailJob, enqueueSmsJob } from "@/lib/integrations/jobs/queue";
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

function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
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

async function loadAppointmentNotifyContext(
  appointmentId: string,
): Promise<AppointmentNotifyContext | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
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
    .eq("id", appointmentId)
    .single();

  if (error || !data) {
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

async function alreadySent(
  appointmentId: string,
  templateKey: string,
  recipient: string,
): Promise<{ messageId: string | null } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("notification_logs")
    .select("provider_message_id, status")
    .eq("appointment_id", appointmentId)
    .eq("template_key", templateKey)
    .eq("recipient", recipient)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { messageId: (data.provider_message_id as string | null) ?? null };
}

async function markRelatedJobs(
  appointmentId: string,
  templateKey: string,
  outcome: "completed" | "failed",
  errorMessage?: string | null,
) {
  const supabase = createServiceClient();
  const { data: jobs } = await supabase
    .from("background_jobs")
    .select("id, payload, status")
    .in("job_type", ["email", "sms"])
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(100);

  const matches = (jobs ?? []).filter((job) => {
    const payload = job.payload as {
      appointmentId?: string;
      templateKey?: string;
    };
    return (
      payload.appointmentId === appointmentId &&
      payload.templateKey === templateKey
    );
  });

  for (const job of matches) {
    await supabase
      .from("background_jobs")
      .update({
        status: outcome,
        completed_at: new Date().toISOString(),
        error_message: errorMessage ?? null,
        next_retry_at: null,
      })
      .eq("id", job.id);
  }
}

async function sendChannelEmail(input: {
  channel: BookingNotificationChannel;
  label: string;
  ctx: AppointmentNotifyContext;
  to: string;
  templateKey: string;
  skipPreferenceCheck?: boolean;
  action?: string;
}): Promise<BookingNotificationItem> {
  const appointmentId = input.ctx.appointmentId as string;
  const prior = await alreadySent(
    appointmentId,
    input.templateKey,
    input.to,
  );
  if (prior) {
    return {
      channel: input.channel,
      status: "sent",
      label: input.label,
      providerMessageId: prior.messageId,
      canRetry: false,
      detail: "Already accepted by email provider.",
    };
  }

  logger.info("notifications", "provider_send_start", {
    appointmentId,
    channel: input.channel,
    templateKey: input.templateKey,
    recipient: maskEmail(input.to),
    provider: "resend",
    fromHost: getNotificationProviderConfigStatus().emailFromHost,
  });

  try {
    const result = await sendEmail({
      businessId: input.ctx.businessId,
      to: input.to,
      templateKey: input.templateKey,
      context: {
        ...input.ctx,
        customMessage: input.action,
      },
      customerId: input.ctx.customerId,
      appointmentId,
      skipPreferenceCheck: input.skipPreferenceCheck,
    });

    if (result.skipped) {
      await markRelatedJobs(
        appointmentId,
        input.templateKey,
        "failed",
        result.error ?? "Skipped by preferences.",
      );
      return {
        channel: input.channel,
        status: "skipped",
        label: input.label,
        detail: result.error ?? "Skipped by notification preferences.",
        canRetry: true,
      };
    }

    if (!result.ok) {
      await markRelatedJobs(
        appointmentId,
        input.templateKey,
        "failed",
        result.error ?? "Email send failed.",
      );
      logger.warn("notifications", "provider_send_failed", {
        appointmentId,
        channel: input.channel,
        error: result.error,
        recipient: maskEmail(input.to),
      });
      return {
        channel: input.channel,
        status: "failed",
        label: input.label,
        detail: result.error ?? "Email could not be sent.",
        canRetry: true,
      };
    }

    await markRelatedJobs(
      appointmentId,
      input.templateKey,
      "completed",
    );
    logger.info("notifications", "provider_send_accepted", {
      appointmentId,
      channel: input.channel,
      providerMessageId: result.messageId,
      recipient: maskEmail(input.to),
    });
    return {
      channel: input.channel,
      status: "sent",
      label: input.label,
      providerMessageId: result.messageId ?? null,
      canRetry: false,
      detail: result.messageId
        ? "Accepted by email provider."
        : "Accepted by email provider (no message id).",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed.";
    await markRelatedJobs(
      appointmentId,
      input.templateKey,
      "failed",
      message,
    );
    logger.error("notifications", "provider_send_exception", {
      appointmentId,
      channel: input.channel,
      error: message,
    });
    return {
      channel: input.channel,
      status: "failed",
      label: input.label,
      detail: message,
      canRetry: true,
    };
  }
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
    try {
      const result = await sendSMS({
        businessId: ctx.businessId,
        to: ctx.customerPhone,
        templateKey: "appointment.confirmation",
        context: ctx,
        customerId: ctx.customerId,
        appointmentId,
      });
      if (result.ok) {
        await markRelatedJobs(appointmentId, "appointment.confirmation", "completed");
        items.push({
          channel: "customer_sms",
          status: "sent",
          label: "Customer SMS",
          providerMessageId: result.messageId ?? null,
        });
      } else if (result.skipped) {
        items.push({
          channel: "customer_sms",
          status: "skipped",
          label: "Customer SMS",
          detail: result.error,
          canRetry: true,
        });
      } else {
        items.push({
          channel: "customer_sms",
          status: "failed",
          label: "Customer SMS",
          detail: result.error ?? "SMS could not be sent.",
          canRetry: true,
        });
      }
    } catch (err) {
      items.push({
        channel: "customer_sms",
        status: "failed",
        label: "Customer SMS",
        detail: err instanceof Error ? err.message : "SMS could not be sent.",
        canRetry: true,
      });
    }
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
  appointmentId: string;
  channel: BookingNotificationItem["channel"];
}): Promise<BookingNotificationReport> {
  const ctx = await loadAppointmentNotifyContext(input.appointmentId);
  if (!ctx) throw new Error("Appointment not found.");

  const businessId = ctx.businessId;
  const idempotencyKey = `${input.appointmentId}:${input.channel}:retry:${Date.now()}`;

  if (input.channel === "customer_email") {
    if (!ctx.customerEmail) throw new Error("Customer has no email address.");
    await enqueueEmailJob(businessId, {
      appointmentId: input.appointmentId,
      templateKey: "appointment.confirmation",
      idempotencyKey,
    });
  } else if (input.channel === "business_email") {
    const to = resolveBusinessRecipient(ctx);
    if (!to) throw new Error("No business notification email configured.");
    await enqueueEmailJob(businessId, {
      appointmentId: input.appointmentId,
      templateKey: "appointment.business",
      recipient: to,
      action: "New appointment booked",
      idempotencyKey,
    });
  } else if (input.channel === "staff_email") {
    if (!ctx.staffEmail) throw new Error("Assigned employee has no email.");
    await enqueueEmailJob(businessId, {
      appointmentId: input.appointmentId,
      templateKey: "appointment.staff",
      recipient: ctx.staffEmail,
      action: "new appointment",
      idempotencyKey,
    });
  } else if (input.channel === "customer_sms") {
    if (!ctx.customerPhone) throw new Error("Customer has no mobile number.");
    await enqueueSmsJob(businessId, {
      appointmentId: input.appointmentId,
      templateKey: "appointment.confirmation",
      idempotencyKey,
    });
  }

  // Force a fresh provider attempt by not short-circuiting only when prior
  // success exists — alreadySent still protects true duplicates.
  return deliverBookingNotifications(input.appointmentId);
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
