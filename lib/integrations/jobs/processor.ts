import { createServiceClient } from "@/lib/supabase/service";
import { unwrapRelation } from "@/lib/supabase/relations";
import {
  computeBackoffMs,
  sendEmail,
  sendSMS,
} from "@/lib/communications";
import type { AppointmentTemplateContext } from "@/lib/communications";
import { generateSingleEventIcs } from "@/lib/integrations/calendar/apple";
import { syncCalendarConnection } from "@/lib/integrations/calendar/sync";
import { dispatchWebhooks } from "@/lib/integrations/webhooks/dispatch";
import { generateRecurringOccurrences } from "@/lib/integrations/automation/recurring";
import { notifyWaitlistForSlot } from "@/lib/integrations/automation/waitlist";
import type { BackgroundJob } from "@/lib/types/integrations";

async function getAppointmentContext(
  appointmentId: string,
): Promise<(AppointmentTemplateContext & { customerId: string | null }) | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("appointments")
    .select(
      `
      id, business_id, customer_id, start_time, end_time, status, notes,
      business:businesses(name, notification_email, email_notifications_enabled, sms_notifications_enabled),
      service:services(name),
      staff:staff(name, email),
      customer:customers(id, name, email, phone)
    `,
    )
    .eq("id", appointmentId)
    .single();

  if (!data) return null;

  const business = unwrapRelation(data.business) as { name: string } | null;
  const service = unwrapRelation(data.service) as { name: string };
  const staff = unwrapRelation(data.staff) as {
    name: string;
    email: string | null;
  };
  const customer = unwrapRelation(data.customer) as {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };

  if (!business || !service || !staff || !customer) return null;

  return {
    appointmentId: data.id,
    businessId: data.business_id,
    businessName: business.name,
    customerId: customer.id ?? data.customer_id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    staffName: staff.name,
    serviceName: service.name,
    startTime: data.start_time,
    endTime: data.end_time,
    notes: data.notes,
  };
}

async function processEmailJob(payload: Record<string, unknown>) {
  const templateKey = payload.templateKey as string;
  const appointmentId = payload.appointmentId as string | undefined;

  // Direct commerce / custom payloads (no appointment)
  if (!appointmentId && payload.directContext) {
    const ctx = payload.directContext as AppointmentTemplateContext;
    const to = (payload.recipient as string) || ctx.customerEmail;
    if (!to) throw new Error("Missing email recipient");
    const result = await sendEmail({
      businessId: ctx.businessId,
      to,
      templateKey,
      context: ctx,
      customerId: ctx.customerId,
      skipPreferenceCheck: Boolean(payload.skipPreferenceCheck),
    });
    if (!result.ok && !result.skipped) {
      throw new Error(result.error ?? "Email send failed");
    }
    return;
  }

  if (!appointmentId) throw new Error("Missing appointmentId");
  const ctx = await getAppointmentContext(appointmentId);
  if (!ctx) return;

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

  if (!result.ok && !result.skipped) {
    throw new Error(result.error ?? "Email send failed");
  }
}

async function processSmsJob(payload: Record<string, unknown>) {
  const templateKey = payload.templateKey as string;
  const appointmentId = payload.appointmentId as string | undefined;

  if (!appointmentId && payload.directContext) {
    const ctx = payload.directContext as AppointmentTemplateContext;
    const to = (payload.recipient as string) || ctx.customerPhone;
    if (!to) return;
    const result = await sendSMS({
      businessId: ctx.businessId,
      to,
      templateKey,
      context: ctx,
      customerId: ctx.customerId,
    });
    if (!result.ok && !result.skipped) {
      throw new Error(result.error ?? "SMS send failed");
    }
    return;
  }

  if (!appointmentId) throw new Error("Missing appointmentId");
  const ctx = await getAppointmentContext(appointmentId);
  if (!ctx || !ctx.customerPhone) return;

  const result = await sendSMS({
    businessId: ctx.businessId,
    to: ctx.customerPhone,
    templateKey,
    context: {
      ...ctx,
      previousStartTime: payload.previousStartTime as string | undefined,
      amountCents: payload.amountCents as number | undefined,
      customMessage: payload.customMessage as string | undefined,
    },
    customerId: ctx.customerId,
    appointmentId,
  });

  if (!result.ok && !result.skipped) {
    throw new Error(result.error ?? "SMS send failed");
  }
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
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: jobs, error } = await supabase
    .from("background_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
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
        started_at: nowIso,
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
          next_retry_at: null,
        })
        .eq("id", job.id);
      processed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Job failed";
      const attempts = job.attempts + 1;
      const failed = attempts >= job.max_attempts;
      const retryAt = new Date(Date.now() + computeBackoffMs(attempts));

      await supabase
        .from("background_jobs")
        .update({
          status: failed ? "failed" : "pending",
          error_message: message,
          completed_at: failed ? new Date().toISOString() : null,
          next_retry_at: failed ? null : retryAt.toISOString(),
          scheduled_at: failed ? job.scheduled_at : retryAt.toISOString(),
        })
        .eq("id", job.id);
    }
  }

  return processed;
}
