import { createServiceClient } from "@/lib/supabase/service";
import { unwrapRelation } from "@/lib/supabase/relations";
import { sendEmail } from "@/lib/integrations/providers/email";
import { sendSms } from "@/lib/integrations/providers/sms";
import {
  renderConfirmationEmail,
  renderReminderEmail,
  renderCancellationEmail,
  renderRescheduleEmail,
  renderStaffNotificationEmail,
  renderBusinessNotificationEmail,
  renderSmsReminder,
  renderSmsCancellation,
  renderSmsReschedule,
} from "@/lib/integrations/email/templates";
import { syncCalendarConnection } from "@/lib/integrations/calendar/sync";
import { dispatchWebhooks } from "@/lib/integrations/webhooks/dispatch";
import { generateRecurringOccurrences } from "@/lib/integrations/automation/recurring";
import { notifyWaitlistForSlot } from "@/lib/integrations/automation/waitlist";
import type { AppointmentNotificationContext, BackgroundJob } from "@/lib/types/integrations";

async function getAppointmentContext(
  appointmentId: string,
): Promise<AppointmentNotificationContext | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("appointments")
    .select(
      `
      id, business_id, start_time, end_time, status, notes,
      business:businesses(name, notification_email, email_notifications_enabled, sms_notifications_enabled),
      service:services(name),
      staff:staff(name, email),
      customer:customers(name, email, phone)
    `,
    )
    .eq("id", appointmentId)
    .single();

  if (!data) return null;

  const business = unwrapRelation(data.business) as {
    name: string;
    notification_email: string | null;
    email_notifications_enabled: boolean;
    sms_notifications_enabled: boolean;
  } | null;
  const service = unwrapRelation(data.service) as { name: string };
  const staff = unwrapRelation(data.staff) as { name: string; email: string | null };
  const customer = unwrapRelation(data.customer) as {
    name: string;
    email: string;
    phone: string | null;
  };

  if (!business || !service || !staff || !customer) return null;

  return {
    appointmentId: data.id,
    businessId: data.business_id,
    businessName: business.name,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    staffName: staff.name,
    staffEmail: staff.email,
    serviceName: service.name,
    startTime: data.start_time,
    endTime: data.end_time,
    notes: data.notes,
    status: data.status,
  };
}

async function logDelivery(
  businessId: string,
  channel: "email" | "sms",
  recipient: string,
  templateKey: string,
  status: "sent" | "failed" | "skipped",
  appointmentId?: string,
  providerMessageId?: string,
  errorMessage?: string,
) {
  const supabase = createServiceClient();
  await supabase.from("notification_logs").insert({
    business_id: businessId,
    appointment_id: appointmentId ?? null,
    channel,
    recipient,
    template_key: templateKey,
    status,
    provider_message_id: providerMessageId ?? null,
    error_message: errorMessage ?? null,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });
}

async function processEmailJob(payload: Record<string, unknown>) {
  const templateKey = payload.templateKey as string;
  const appointmentId = payload.appointmentId as string;
  const previousStartTime = payload.previousStartTime as string | undefined;
  const ctx = await getAppointmentContext(appointmentId);
  if (!ctx) return;

  let template;
  switch (templateKey) {
    case "appointment.confirmation":
      template = renderConfirmationEmail(ctx);
      break;
    case "appointment.reminder":
      template = renderReminderEmail(ctx);
      break;
    case "appointment.cancellation":
      template = renderCancellationEmail(ctx);
      break;
    case "appointment.reschedule":
      template = renderRescheduleEmail(ctx, previousStartTime ?? ctx.startTime);
      break;
    case "appointment.staff":
      template = renderStaffNotificationEmail(ctx, payload.action as string);
      break;
    case "appointment.business":
      template = renderBusinessNotificationEmail(ctx, payload.action as string);
      break;
    default:
      throw new Error(`Unknown email template: ${templateKey}`);
  }

  const result = await sendEmail({
    to: (payload.recipient as string) ?? ctx.customerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  await logDelivery(
    ctx.businessId,
    "email",
    (payload.recipient as string) ?? ctx.customerEmail,
    template.key,
    result.success ? "sent" : "failed",
    appointmentId,
    result.messageId,
    result.error,
  );
}

async function processSmsJob(payload: Record<string, unknown>) {
  const templateKey = payload.templateKey as string;
  const appointmentId = payload.appointmentId as string;
  const ctx = await getAppointmentContext(appointmentId);
  if (!ctx || !ctx.customerPhone) {
    if (ctx) {
      await logDelivery(ctx.businessId, "sms", "", templateKey, "skipped", appointmentId);
    }
    return;
  }

  let body: string;
  switch (templateKey) {
    case "appointment.reminder":
      body = renderSmsReminder(ctx);
      break;
    case "appointment.cancellation":
      body = renderSmsCancellation(ctx);
      break;
    case "appointment.reschedule":
      body = renderSmsReschedule(ctx);
      break;
    default:
      throw new Error(`Unknown SMS template: ${templateKey}`);
  }

  const result = await sendSms({ to: ctx.customerPhone, body });
  await logDelivery(
    ctx.businessId,
    "sms",
    ctx.customerPhone,
    templateKey,
    result.success ? "sent" : "failed",
    appointmentId,
    result.messageId,
    result.error,
  );
}

async function processReminderJob(payload: Record<string, unknown>) {
  const appointmentId = payload.appointmentId as string;
  const channel = payload.channel as "email" | "sms";
  const templateKey = "appointment.reminder";

  if (channel === "email") {
    await processEmailJob({ appointmentId, templateKey });
  } else {
    await processSmsJob({ appointmentId, templateKey });
  }
}

export async function processJob(job: BackgroundJob): Promise<void> {
  switch (job.job_type) {
    case "email":
      await processEmailJob(job.payload);
      break;
    case "sms":
      await processSmsJob(job.payload);
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
      await processReminderJob(job.payload);
      break;
    case "recurring":
      await generateRecurringOccurrences(job.payload.ruleId as string);
      break;
    case "waitlist_notify":
      await notifyWaitlistForSlot(
        job.business_id!,
        job.payload.appointmentId as string,
      );
      break;
    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }
}

export async function processPendingJobs(limit = 25): Promise<number> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: jobs, error } = await supabase
    .from("background_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .order("scheduled_at")
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!jobs?.length) return 0;

  let processed = 0;

  for (const job of jobs) {
    await supabase
      .from("background_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      })
      .eq("id", job.id);

    try {
      await processJob(job as BackgroundJob);
      await supabase
        .from("background_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", job.id);
      processed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Job failed";
      const failed = job.attempts + 1 >= job.max_attempts;
      await supabase
        .from("background_jobs")
        .update({
          status: failed ? "failed" : "pending",
          error_message: message,
          completed_at: failed ? new Date().toISOString() : null,
        })
        .eq("id", job.id);
    }
  }

  return processed;
}
