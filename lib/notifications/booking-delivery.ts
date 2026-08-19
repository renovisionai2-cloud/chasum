/**
 * Booking notification delivery — Preview-safe synchronous confirmation send.
 *
 * Do not leave channels in Pending after this request ends. Enqueued jobs are
 * best-effort audit records; confirmation email/SMS results come from an
 * awaited provider call in the same Server Action.
 */

import { planIncludesSms } from "@/lib/billing/plan-features";
import { recordedDeliveryStatus } from "@/lib/commerce/document-delivery-truth";
import { businessRefundNotificationAction } from "@/lib/notifications/refund-notification-action";
import {
  historicalApplicableChannelStatus,
} from "@/lib/notifications/booking-channel-status";
import { sendRefundBusinessNotification, sendRefundConfirmationEmail } from "@/lib/commerce/refund-email";
import { sendEmail, sendSMS } from "@/lib/communications/delivery";
import type { AppointmentTemplateContext } from "@/lib/communications/types";
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
import { formatStaffFacingInstant } from "@/lib/business/datetime";
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
  /** Assigned employee profile for no-recipient staff email. */
  staffProfileId?: string | null;
};

export type BookingNotificationReport = {
  appointmentId: string;
  items: BookingNotificationItem[];
  emailConfigured: boolean;
  smsConfigured: boolean;
  smsPlanIncluded: boolean;
  /** First send vs resend for the channel just attempted. */
  attemptKind?: "first" | "resend";
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
  staffId: string | null;
  subscriptionPlanKey: string | null;
  privateAlphaEnabled: boolean | null;
};

/** Shared appointment email context (financials + branding inputs). */
export async function loadAppointmentNotifyContext(
  appointmentId: string,
): Promise<AppointmentNotifyContext | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id, business_id, customer_id, staff_id, start_time, end_time, status, notes,
      price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents,
      payment_status,
      business:businesses(
        name, email, notification_email, timezone,
        email_notifications_enabled, sms_notifications_enabled,
        owner_notifications_enabled, staff_notifications_enabled,
        subscription_plan_key, private_alpha_enabled
      ),
      service:services(name),
      staff:staff(id, name, email),
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
    id?: string;
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
  const collectibleMoney = await import("@/lib/commerce/money-contract");
  const collectible = collectibleMoney.appointmentCollectibleMoneyFromStamps({
    price_cents: data.price_cents,
    tax_cents: data.tax_cents,
    deposit_cents: data.deposit_cents,
    amount_paid_cents: data.amount_paid_cents,
    amount_refunded_cents: data.amount_refunded_cents,
    payment_status: data.payment_status,
    status: data.status,
  });
  const remainingBalanceCents =
    appointmentTotalCents != null
      ? collectible.collectibleRemainingBalanceCents
      : null;
  const depositDueNowCents = collectible.collectibleDepositDueNowCents;

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

  const { PAYMENT_METHOD_LABELS } = await import("@/lib/commerce/types");
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

  const paymentStatusLabel =
    collectibleMoney.appointmentCollectionFacingLabel({
      price_cents: data.price_cents,
      tax_cents: data.tax_cents,
      deposit_cents: data.deposit_cents,
      amount_paid_cents: data.amount_paid_cents,
      amount_refunded_cents: data.amount_refunded_cents,
      payment_status: data.payment_status,
      status: data.status,
    });

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
    staffId: staff?.id ?? (data as { staff_id?: string | null }).staff_id ?? null,
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
    depositPaidCents: collectible.netPaidCents,
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
  /** When true, send even if a prior successful log exists (human resend). */
  forceResend?: boolean;
}): Promise<BookingNotificationItem> {
  const appointmentId = input.ctx.appointmentId as string;
  if (!input.forceResend) {
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
        canRetry: true,
        detail: "Already accepted by email provider.",
      };
    }
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
      canRetry: true,
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
        action: "New appointment booked",
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

function emptyCancelReport(
  appointmentId: string,
  emailConfigured: boolean,
  smsConfigured: boolean,
  detail: string,
): BookingNotificationReport {
  return {
    appointmentId,
    emailConfigured,
    smsConfigured,
    smsPlanIncluded: false,
    items: [
      {
        channel: "customer_email",
        status: "failed",
        label: "Customer cancellation email",
        detail,
        canRetry: true,
      },
      {
        channel: "business_email",
        status: "failed",
        label: "Business cancellation email",
        detail,
        canRetry: true,
      },
      {
        channel: "customer_sms",
        status: "not_requested",
        label: "Customer SMS",
      },
      {
        channel: "staff_email",
        status: "not_requested",
        label: "Staff notification",
      },
    ],
  };
}

/**
 * Awaited inline customer cancellation email — same request as cancelAppointment.
 * Job enqueue from appointment.cancelled remains best-effort; cron must not be
 * required for Preview delivery. Does not mention refunds.
 */
export async function deliverCancellationNotifications(
  appointmentId: string,
): Promise<BookingNotificationReport> {
  const emailConfigured = Boolean(getResendApiKey());
  const smsConfigured = Boolean(getTwilioConfig());
  const ctx = await loadAppointmentNotifyContext(appointmentId);

  if (!ctx) {
    return emptyCancelReport(
      appointmentId,
      emailConfigured,
      smsConfigured,
      "Could not load appointment for cancellation email.",
    );
  }

  const businessTo = resolveBusinessRecipient(ctx);
  const items: BookingNotificationItem[] = [];

  if (!ctx.customerEmail) {
    items.push({
      channel: "customer_email",
      status: "no_recipient",
      label: "Customer cancellation email",
      detail: "Customer has no email address.",
    });
  } else if (!emailConfigured) {
    items.push({
      channel: "customer_email",
      status: "not_configured",
      label: "Customer cancellation email",
      detail: "Email delivery is not configured for this environment.",
    });
  } else {
    items.push(
      await sendChannelEmail({
        channel: "customer_email",
        label: "Customer cancellation email",
        ctx,
        to: ctx.customerEmail,
        templateKey: "appointment.cancellation",
        skipPreferenceCheck: true,
      }),
    );
  }

  if (!ctx.emailEnabled || !ctx.ownerEnabled) {
    items.push({
      channel: "business_email",
      status: "not_enabled",
      label: "Business cancellation email",
    });
  } else if (!businessTo) {
    items.push({
      channel: "business_email",
      status: "no_recipient",
      label: "Business cancellation email",
      detail: "No business notification email configured.",
    });
  } else if (!emailConfigured) {
    items.push({
      channel: "business_email",
      status: "not_configured",
      label: "Business cancellation email",
      detail: "Email delivery is not configured for this environment.",
    });
  } else {
    items.push(
      await sendChannelEmail({
        channel: "business_email",
        label: "Business cancellation email",
        ctx,
        to: businessTo,
        templateKey: "appointment.business",
        skipPreferenceCheck: true,
        action: "Appointment cancelled",
      }),
    );
  }

  items.push({
    channel: "customer_sms",
    status: "not_requested",
    label: "Customer SMS",
  });
  items.push({
    channel: "staff_email",
    status: "not_requested",
    label: "Staff notification",
  });

  for (const item of items) {
    if (item.status === "pending") {
      item.status = "failed";
      item.detail =
        item.detail ??
        "Email could not be sent before the request completed.";
      item.canRetry = true;
    }
  }

  logger.info("notifications", "inline_cancellation_delivery_complete", {
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
    smsPlanIncluded: planIncludesSms({
      subscription_plan_key: ctx.subscriptionPlanKey,
      private_alpha_enabled: ctx.privateAlphaEnabled,
    }),
  };
}

export function cancellationCustomerEmailNote(
  report: BookingNotificationReport,
): string {
  const customer = report.items.find((i) => i.channel === "customer_email");
  if (customer?.status === "sent") return " Customer confirmation sent.";
  if (customer?.status === "no_recipient") {
    return " Customer email could not be sent (no email on file).";
  }
  if (
    customer?.status === "failed" ||
    customer?.status === "not_configured" ||
    customer?.status === "skipped"
  ) {
    return " Customer email could not be sent.";
  }
  return "";
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
  const emailConfigured = Boolean(getResendApiKey());
  const smsConfigured = Boolean(getTwilioConfig());
  const ctx = await loadAppointmentNotifyContext(input.appointmentId);
  if (!ctx) throw new Error("Appointment not found.");

  const smsPlanIncluded = planIncludesSms({
    subscription_plan_key: ctx.subscriptionPlanKey,
    private_alpha_enabled: ctx.privateAlphaEnabled,
  });
  const businessTo = resolveBusinessRecipient(ctx);
  const items: BookingNotificationItem[] = [];
  let attemptKind: BookingNotificationReport["attemptKind"];

  if (input.channel === "customer_email") {
    if (!ctx.customerEmail) throw new Error("Customer has no email address.");
    if (!emailConfigured) throw new Error("Email delivery is not configured.");
    attemptKind = (await alreadySent(
      input.appointmentId,
      "appointment.confirmation",
      ctx.customerEmail,
    ))
      ? "resend"
      : "first";
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
    attemptKind = (await alreadySent(
      input.appointmentId,
      "appointment.business",
      businessTo,
    ))
      ? "resend"
      : "first";
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
    attemptKind = (await alreadySent(
      input.appointmentId,
      "appointment.staff",
      ctx.staffEmail,
    ))
      ? "resend"
      : "first";
    items.push(
      await sendChannelEmail({
        channel: "staff_email",
        label: "Staff notification",
        ctx,
        to: ctx.staffEmail,
        templateKey: "appointment.staff",
        skipPreferenceCheck: true,
        action: "New appointment booked",
        forceResend: true,
      }),
    );
  } else if (input.channel === "customer_sms") {
    if (!smsPlanIncluded || !smsConfigured) {
      throw new Error("Not configured");
    }
    if (!ctx.customerPhone?.trim()) {
      throw new Error("Customer has no mobile number.");
    }
    // Fall back to full delivery path for SMS channel.
    return deliverBookingNotifications(input.appointmentId);
  } else if (
    input.channel === "customer_refund_email" ||
    input.channel === "business_refund_email"
  ) {
    const supabase = createServiceClient();
    const { data: refundRow } = await supabase
      .from("commerce_refunds")
      .select("id, metadata")
      .eq("business_id", ctx.businessId)
      .eq("appointment_id", input.appointmentId)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!refundRow?.id) {
      throw new Error("No refund on this appointment.");
    }
    const result =
      input.channel === "customer_refund_email"
        ? await sendRefundConfirmationEmail({
            businessId: ctx.businessId,
            refundId: String(refundRow.id),
          })
        : await sendRefundBusinessNotification({
            businessId: ctx.businessId,
            refundId: String(refundRow.id),
            forceResend: true,
          });
    const status: BookingNotificationItem["status"] =
      result.status === "sent"
        ? "sent"
        : result.status === "unavailable"
          ? "no_recipient"
          : result.status === "skipped"
            ? "skipped"
            : "failed";
    const attemptKind =
      input.channel === "business_refund_email"
        ? result.sendKind === "resend"
          ? "resend"
          : "first"
        : undefined;
    const businessAction =
      input.channel === "business_refund_email"
        ? businessRefundNotificationAction({
            refundExists: true,
            status,
            hasRecipient: status !== "no_recipient",
            emailConfigured,
          })
        : null;
    items.push({
      channel: input.channel,
      status,
      label:
        input.channel === "customer_refund_email"
          ? "Customer refund confirmation"
          : "Business refund notification",
      detail: result.error ?? null,
      canRetry:
        input.channel === "business_refund_email"
          ? businessAction?.canRetry ?? status === "failed"
          : status === "failed",
    });
    return {
      appointmentId: input.appointmentId,
      items,
      emailConfigured,
      smsConfigured,
      smsPlanIncluded,
      attemptKind,
    };
  } else {
    throw new Error("Unknown notification channel.");
  }

  return {
    appointmentId: input.appointmentId,
    items,
    emailConfigured,
    smsConfigured,
    smsPlanIncluded,
    attemptKind,
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
  const staffTime = (iso: string | null | undefined) =>
    iso ? formatStaffFacingInstant(iso, ctx.timezone) : null;

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
      if (recipient && String(l.recipient).toLowerCase() !== recipient.toLowerCase())
        return false;
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
      status: historicalApplicableChannelStatus(log?.status),
      label: "Customer confirmation email",
      detail: log
        ? [log.recipient, log.sentAt ? `Last attempt ${staffTime(log.sentAt)}` : null, log.detail]
            .filter(Boolean)
            .join(" · ")
        : `No customer confirmation was recorded for this appointment. Recipient ${ctx.customerEmail}`,
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
      status: historicalApplicableChannelStatus(log?.status),
      label: "Business confirmation email",
      detail: log
        ? [log.recipient, log.sentAt ? `Last attempt ${staffTime(log.sentAt)}` : null, log.detail]
            .filter(Boolean)
            .join(" · ")
        : `No business confirmation was recorded for this appointment. Recipient ${businessTo}`,
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
        receiptRow.issued_at
          ? `Issued ${formatStaffFacingInstant(receiptRow.issued_at, ctx.timezone)}`
          : null,
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
      staffProfileId: ctx.staffId,
    });
  } else {
    const log = latestFor("appointment.staff", ctx.staffEmail);
    items.push({
      channel: "staff_email",
      status: historicalApplicableChannelStatus(log?.status),
      label: "Staff notification",
      detail: log
        ? [log.recipient, log.sentAt ? `Last attempt ${staffTime(log.sentAt)}` : null, log.detail]
            .filter(Boolean)
            .join(" · ")
        : `No staff notification was recorded for this appointment. Recipient ${ctx.staffEmail}`,
      canRetry: emailConfigured,
    });
  }

  const { data: refundRows } = await supabase
    .from("commerce_refunds")
    .select("id, metadata, created_at")
    .eq("business_id", ctx.businessId)
    .eq("appointment_id", appointmentId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(10);
  const latestRefund = refundRows?.[0] ?? null;
  const refundMeta =
    latestRefund?.metadata &&
    typeof latestRefund.metadata === "object" &&
    !Array.isArray(latestRefund.metadata)
      ? (latestRefund.metadata as Record<string, unknown>)
      : {};

  function refundChannelStatus(input: {
    logStatus: string | null;
    rowStatus: string | null;
    hasRecipient: boolean;
  }): BookingNotificationItem["status"] {
    const recorded = recordedDeliveryStatus({
      hasRecipient: input.hasRecipient,
      logStatus: input.logStatus,
      rowEmailStatus: input.rowStatus,
    });
    if (recorded === "sent") return "sent";
    if (recorded === "failed") return "failed";
    if (recorded === "no_recipient") return "no_recipient";
    if (recorded === "queued") return "pending";
    return "not_requested";
  }

  if (!latestRefund) {
    items.push({
      channel: "customer_refund_email",
      status: "not_applicable",
      label: "Customer refund confirmation",
      detail: "No refund has been processed for this appointment.",
      canRetry: false,
    });
    items.push({
      channel: "business_refund_email",
      status: "not_applicable",
      label: "Business refund notification",
      detail: "No refund has been processed for this appointment.",
      canRetry: false,
    });
  } else {
    const customerRefundLog = latestFor(
      "commerce.refund",
      ctx.customerEmail,
    );
    const customerRefundStatus = refundChannelStatus({
      logStatus: customerRefundLog?.status ?? null,
      rowStatus: refundMeta.email_status ? String(refundMeta.email_status) : null,
      hasRecipient: Boolean(ctx.customerEmail),
    });
    items.push({
      channel: "customer_refund_email",
      status: customerRefundStatus,
      label: "Customer refund confirmation",
      detail: customerRefundLog
        ? [
            customerRefundLog.recipient,
            customerRefundLog.sentAt
              ? `Last attempt ${staffTime(customerRefundLog.sentAt)}`
              : null,
            customerRefundLog.detail,
          ]
            .filter(Boolean)
            .join(" · ")
        : ctx.customerEmail
          ? `Recipient ${ctx.customerEmail}`
          : "Customer has no email address.",
      canRetry: customerRefundStatus === "failed" && emailConfigured,
    });

    const businessRefundLog = latestFor(
      "commerce.refund.business",
      businessTo,
    );
    const businessRefundStatus = refundChannelStatus({
      logStatus: businessRefundLog?.status ?? null,
      rowStatus: refundMeta.business_email_status
        ? String(refundMeta.business_email_status)
        : null,
      hasRecipient: Boolean(businessTo),
    });
    const businessRefundAction = businessRefundNotificationAction({
      refundExists: true,
      status: businessRefundStatus,
      hasRecipient: Boolean(businessTo),
      emailConfigured,
    });
    items.push({
      channel: "business_refund_email",
      status: businessRefundStatus,
      label: "Business refund notification",
      detail: businessRefundLog
        ? [
            businessRefundLog.recipient,
            businessRefundLog.sentAt
              ? `Last attempt ${staffTime(businessRefundLog.sentAt)}`
              : null,
            businessRefundLog.detail,
          ]
            .filter(Boolean)
            .join(" · ")
        : businessTo
          ? `Recipient ${businessTo}`
          : "No business notification email configured.",
      canRetry: businessRefundAction.canRetry,
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
      status: "not_recorded",
      label: "Customer SMS",
      detail: `No customer SMS was recorded for this appointment. Recipient ${ctx.customerPhone}`,
      canRetry: true,
    });
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
