/**
 * Booking notification delivery — status summary, immediate flush (Preview-safe),
 * and retry without re-creating appointments.
 */

import {
  getEmailFromAddress,
  getResendApiKey,
  getTwilioConfig,
} from "@/lib/env";
import { planIncludesSms } from "@/lib/billing/plan-features";
import { processJob } from "@/lib/integrations/jobs/processor";
import { enqueueEmailJob, enqueueSmsJob } from "@/lib/integrations/jobs/queue";
import { createServiceClient } from "@/lib/supabase/service";
import { unwrapRelation } from "@/lib/supabase/relations";
import type { BackgroundJob } from "@/lib/types/integrations";
import { logger } from "@/lib/observability/logger";

export type NotificationChannelStatus =
  | "sent"
  | "pending"
  | "failed"
  | "not_enabled"
  | "not_configured"
  | "not_included"
  | "no_recipient"
  | "skipped";

export type BookingNotificationItem = {
  channel: "customer_email" | "customer_sms" | "business_email" | "staff_email";
  status: NotificationChannelStatus;
  label: string;
  detail?: string | null;
  providerMessageId?: string | null;
  canRetry?: boolean;
};

export type BookingNotificationReport = {
  appointmentId: string;
  items: BookingNotificationItem[];
  emailConfigured: boolean;
  smsConfigured: boolean;
  smsPlanIncluded: boolean;
};

function statusLabel(status: NotificationChannelStatus): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "not_enabled":
      return "Not enabled";
    case "not_configured":
      return "Not configured";
    case "not_included":
      return "Not included in plan";
    case "no_recipient":
      return "No recipient";
    case "skipped":
      return "Skipped";
  }
}

export function formatNotificationStatus(
  status: NotificationChannelStatus,
): string {
  return statusLabel(status);
}

/** Provider presence only — never returns secret values. */
export function getNotificationProviderConfigStatus() {
  const emailKey = Boolean(getResendApiKey());
  const sms = Boolean(getTwilioConfig());
  return {
    emailProvider: emailKey ? ("resend" as const) : ("disabled" as const),
    emailFromConfigured: Boolean(getEmailFromAddress()),
    smsProvider: sms ? ("twilio" as const) : ("disabled" as const),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  };
}

async function loadJobsForAppointment(appointmentId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("background_jobs")
    .select("*")
    .in("job_type", ["email", "sms"])
    .filter("payload->>appointmentId", "eq", appointmentId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    // Fallback: recent jobs filtered in memory
    const { data: recent } = await supabase
      .from("background_jobs")
      .select("*")
      .in("job_type", ["email", "sms"])
      .order("created_at", { ascending: false })
      .limit(80);
    return ((recent ?? []) as BackgroundJob[]).filter(
      (j) => (j.payload as { appointmentId?: string }).appointmentId === appointmentId,
    );
  }
  return (data ?? []) as BackgroundJob[];
}

/**
 * Process pending email/SMS jobs for one appointment immediately.
 * Critical on Preview where Vercel Cron does not run.
 */
export async function flushAppointmentNotificationJobs(
  appointmentId: string,
): Promise<number> {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();
  const jobs = await loadJobsForAppointment(appointmentId);
  const pending = jobs.filter(
    (j) =>
      j.status === "pending" &&
      (!j.scheduled_at || j.scheduled_at <= nowIso) &&
      (j.job_type === "email" || j.job_type === "sms"),
  );

  let processed = 0;
  for (const job of pending) {
    await supabase
      .from("background_jobs")
      .update({
        status: "processing",
        started_at: nowIso,
        attempts: (job.attempts ?? 0) + 1,
      })
      .eq("id", job.id);

    try {
      await processJob(job);
      await supabase
        .from("background_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          error_message: null,
          next_retry_at: null,
        })
        .eq("id", job.id);
      processed += 1;
      logger.info("notifications", "flushed_job", {
        appointmentId,
        jobId: job.id,
        jobType: job.job_type,
        templateKey: (job.payload as { templateKey?: string })?.templateKey,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Job failed";
      await supabase
        .from("background_jobs")
        .update({
          status: "failed",
          error_message: message,
          completed_at: new Date().toISOString(),
          next_retry_at: null,
        })
        .eq("id", job.id);
      logger.warn("notifications", "flush_job_failed", {
        appointmentId,
        jobId: job.id,
        jobType: job.job_type,
        error: message,
      });
    }
  }
  return processed;
}

function classifyEmailJob(
  job: BackgroundJob | undefined,
  opts: {
    enabled: boolean;
    configured: boolean;
    hasRecipient: boolean;
    channel: BookingNotificationItem["channel"];
  },
): BookingNotificationItem {
  const label =
    opts.channel === "customer_email"
      ? "Customer email"
      : opts.channel === "business_email"
        ? "Business email"
        : "Staff notification";

  if (!opts.enabled) {
    return { channel: opts.channel, status: "not_enabled", label };
  }
  if (!opts.hasRecipient) {
    return {
      channel: opts.channel,
      status: "no_recipient",
      label,
      detail:
        opts.channel === "customer_email"
          ? "Customer has no email address."
          : "No notification email configured.",
    };
  }
  if (!opts.configured) {
    return {
      channel: opts.channel,
      status: "not_configured",
      label,
      detail: "Email delivery is not configured for this environment.",
      canRetry: false,
    };
  }
  if (!job) {
    return {
      channel: opts.channel,
      status: "pending",
      label,
      detail: "Queued for delivery.",
      canRetry: true,
    };
  }
  if (job.status === "completed") {
    return { channel: opts.channel, status: "sent", label, canRetry: false };
  }
  if (job.status === "failed") {
    return {
      channel: opts.channel,
      status: "failed",
      label,
      detail: job.error_message,
      canRetry: true,
    };
  }
  if (job.status === "pending" || job.status === "processing") {
    return { channel: opts.channel, status: "pending", label, canRetry: true };
  }
  return {
    channel: opts.channel,
    status: "skipped",
    label,
    detail: job.error_message,
  };
}

function classifySmsJob(
  job: BackgroundJob | undefined,
  opts: {
    enabled: boolean;
    configured: boolean;
    planIncluded: boolean;
    hasRecipient: boolean;
  },
): BookingNotificationItem {
  const label = "Customer SMS";
  if (!opts.planIncluded) {
    return {
      channel: "customer_sms",
      status: "not_included",
      label,
      detail: "SMS notifications are not included in the current plan.",
    };
  }
  if (!opts.enabled) {
    return { channel: "customer_sms", status: "not_enabled", label };
  }
  if (!opts.hasRecipient) {
    return {
      channel: "customer_sms",
      status: "no_recipient",
      label,
      detail: "Customer has no mobile number.",
    };
  }
  if (!opts.configured) {
    return {
      channel: "customer_sms",
      status: "not_configured",
      label,
      detail: "SMS notifications are not configured for this business.",
    };
  }
  if (!job) {
    return { channel: "customer_sms", status: "pending", label, canRetry: true };
  }
  if (job.status === "completed") {
    return { channel: "customer_sms", status: "sent", label };
  }
  if (job.status === "failed") {
    return {
      channel: "customer_sms",
      status: "failed",
      label,
      detail: job.error_message,
      canRetry: true,
    };
  }
  return { channel: "customer_sms", status: "pending", label, canRetry: true };
}

export async function buildBookingNotificationReport(
  appointmentId: string,
): Promise<BookingNotificationReport> {
  const supabase = createServiceClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      `
      id, business_id,
      business:businesses(
        email, notification_email,
        email_notifications_enabled, sms_notifications_enabled,
        owner_notifications_enabled, staff_notifications_enabled,
        subscription_plan_key, private_alpha_enabled
      ),
      staff:staff(email),
      customer:customers(email, phone)
    `,
    )
    .eq("id", appointmentId)
    .single();

  const business = unwrapRelation(appointment?.business) as {
    email: string | null;
    notification_email: string | null;
    email_notifications_enabled: boolean | null;
    sms_notifications_enabled: boolean | null;
    owner_notifications_enabled: boolean | null;
    staff_notifications_enabled: boolean | null;
    subscription_plan_key: string | null;
    private_alpha_enabled: boolean | null;
  } | null;
  const customer = unwrapRelation(appointment?.customer) as {
    email: string | null;
    phone: string | null;
  } | null;
  const staff = unwrapRelation(appointment?.staff) as {
    email: string | null;
  } | null;

  const emailEnabled = business?.email_notifications_enabled !== false;
  const smsEnabled = business?.sms_notifications_enabled === true;
  const ownerEnabled = business?.owner_notifications_enabled !== false;
  const staffEnabled = business?.staff_notifications_enabled !== false;
  const emailConfigured = Boolean(getResendApiKey());
  const smsConfigured = Boolean(getTwilioConfig());
  const smsPlanIncluded = planIncludesSms(business);

  const jobs = await loadJobsForAppointment(appointmentId);
  const customerEmailJob = jobs.find(
    (j) =>
      j.job_type === "email" &&
      (j.payload as { templateKey?: string }).templateKey ===
        "appointment.confirmation",
  );
  const businessEmailJob = jobs.find(
    (j) =>
      j.job_type === "email" &&
      (j.payload as { templateKey?: string }).templateKey ===
        "appointment.business",
  );
  const staffEmailJob = jobs.find(
    (j) =>
      j.job_type === "email" &&
      (j.payload as { templateKey?: string }).templateKey ===
        "appointment.staff",
  );
  const customerSmsJob = jobs.find(
    (j) =>
      j.job_type === "sms" &&
      (j.payload as { templateKey?: string }).templateKey ===
        "appointment.confirmation",
  );

  const businessRecipient =
    business?.notification_email?.trim() || business?.email?.trim() || null;

  const items: BookingNotificationItem[] = [
    classifyEmailJob(customerEmailJob, {
      channel: "customer_email",
      enabled: emailEnabled,
      configured: emailConfigured,
      hasRecipient: Boolean(customer?.email?.trim()),
    }),
    classifySmsJob(customerSmsJob, {
      enabled: smsEnabled,
      configured: smsConfigured,
      planIncluded: smsPlanIncluded,
      hasRecipient: Boolean(customer?.phone?.trim()),
    }),
    classifyEmailJob(businessEmailJob, {
      channel: "business_email",
      enabled: emailEnabled && ownerEnabled,
      configured: emailConfigured,
      hasRecipient: Boolean(businessRecipient),
    }),
    classifyEmailJob(staffEmailJob, {
      channel: "staff_email",
      enabled: emailEnabled && staffEnabled,
      configured: emailConfigured,
      hasRecipient: Boolean(staff?.email?.trim()),
    }),
  ];

  return {
    appointmentId,
    items,
    emailConfigured,
    smsConfigured,
    smsPlanIncluded,
  };
}

export async function deliverBookingNotifications(
  appointmentId: string,
): Promise<BookingNotificationReport> {
  await flushAppointmentNotificationJobs(appointmentId);
  return buildBookingNotificationReport(appointmentId);
}

export async function retryBookingNotification(input: {
  appointmentId: string;
  channel: BookingNotificationItem["channel"];
}): Promise<BookingNotificationReport> {
  const supabase = createServiceClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      `
      id, business_id,
      business:businesses(email, notification_email),
      staff:staff(email),
      customer:customers(email, phone)
    `,
    )
    .eq("id", input.appointmentId)
    .single();

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  const businessId = appointment.business_id as string;
  const business = unwrapRelation(appointment.business) as {
    email: string | null;
    notification_email: string | null;
  } | null;
  const customer = unwrapRelation(appointment.customer) as {
    email: string | null;
    phone: string | null;
  } | null;
  const staff = unwrapRelation(appointment.staff) as {
    email: string | null;
  } | null;

  const idempotencyKey = `${input.appointmentId}:${input.channel}:retry:${Date.now()}`;

  if (input.channel === "customer_email") {
    if (!customer?.email) throw new Error("Customer has no email address.");
    await enqueueEmailJob(businessId, {
      appointmentId: input.appointmentId,
      templateKey: "appointment.confirmation",
      idempotencyKey,
    });
  } else if (input.channel === "business_email") {
    const to =
      business?.notification_email?.trim() || business?.email?.trim() || null;
    if (!to) throw new Error("No business notification email configured.");
    await enqueueEmailJob(businessId, {
      appointmentId: input.appointmentId,
      templateKey: "appointment.business",
      recipient: to,
      action: "New appointment booked",
      idempotencyKey,
    });
  } else if (input.channel === "staff_email") {
    if (!staff?.email) throw new Error("Assigned employee has no email.");
    await enqueueEmailJob(businessId, {
      appointmentId: input.appointmentId,
      templateKey: "appointment.staff",
      recipient: staff.email,
      action: "new appointment",
      idempotencyKey,
    });
  } else if (input.channel === "customer_sms") {
    if (!customer?.phone) throw new Error("Customer has no mobile number.");
    await enqueueSmsJob(businessId, {
      appointmentId: input.appointmentId,
      templateKey: "appointment.confirmation",
      idempotencyKey,
    });
  }

  await flushAppointmentNotificationJobs(input.appointmentId);
  return buildBookingNotificationReport(input.appointmentId);
}
