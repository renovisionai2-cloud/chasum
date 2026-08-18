import { createServiceClient } from "@/lib/supabase/service";
import { unwrapRelation } from "@/lib/supabase/relations";
import {
  enqueueEmailJob,
  enqueueSmsJob,
  enqueueCalendarSyncJob,
  enqueueWebhookJob,
  enqueueReminderJobs,
} from "@/lib/integrations/jobs/queue";
import {
  pushAppointmentToCalendars,
  deleteAppointmentFromCalendars,
} from "@/lib/integrations/calendar/sync";
import { planIncludesSms } from "@/lib/billing/plan-features";
import { getResendApiKey, getTwilioConfig } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import type { NotificationType } from "@/lib/types/integrations";

type AppointmentEvent =
  | "created"
  | "confirmed"
  | "cancelled"
  | "rescheduled"
  | "updated";

async function createInAppNotification(
  businessId: string,
  type: NotificationType,
  title: string,
  body: string,
  metadata: Record<string, unknown>,
) {
  const supabase = createServiceClient();
  await supabase.from("notifications").insert({
    business_id: businessId,
    type,
    channel: "in_app",
    title,
    body,
    metadata,
  });
}

async function getBusinessNotificationSettings(businessId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      `name, email, notification_email,
       email_notifications_enabled, sms_notifications_enabled,
       owner_notifications_enabled, staff_notifications_enabled,
       reminder_hours_before, subscription_plan_key, private_alpha_enabled`,
    )
    .eq("id", businessId)
    .single();
  return data;
}

function resolveBusinessNotifyEmail(settings: {
  notification_email?: string | null;
  email?: string | null;
} | null): string | null {
  const override = settings?.notification_email?.trim();
  if (override) return override;
  const fallback = settings?.email?.trim();
  return fallback || null;
}

/**
 * Queue in-app + email/SMS jobs for an appointment lifecycle event.
 * Delivery is async (cron) unless the caller flushes jobs immediately.
 */
export async function handleAppointmentEvent(
  appointmentId: string,
  event: AppointmentEvent,
  options?: { previousStartTime?: string },
) {
  const supabase = createServiceClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      `
      id, business_id, staff_id, start_time, end_time, status,
      service:services(name),
      staff:staff(name, email),
      customer:customers(name, email, phone)
    `,
    )
    .eq("id", appointmentId)
    .single();

  if (!appointment) return;

  const businessId = appointment.business_id;
  const settings = await getBusinessNotificationSettings(businessId);
  const service = unwrapRelation(appointment.service) as { name: string } | null;
  const customer = unwrapRelation(appointment.customer) as {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  const staff = unwrapRelation(appointment.staff) as {
    name: string;
    email: string | null;
  } | null;

  const customerName = customer?.name ?? "Customer";
  const serviceName = service?.name ?? "Appointment";
  const staffName = staff?.name ?? "To be assigned";

  const titleMap: Record<AppointmentEvent, string> = {
    created: "New appointment",
    confirmed: "Appointment confirmed",
    cancelled: "Appointment cancelled",
    rescheduled: "Appointment rescheduled",
    updated: "Appointment updated",
  };

  await createInAppNotification(
    businessId,
    event === "cancelled"
      ? "cancellation"
      : event === "rescheduled"
        ? "reschedule"
        : "confirmation",
    titleMap[event],
    `${customerName} — ${serviceName} with ${staffName}`,
    { appointmentId, event },
  );

  const emailEnabled = settings?.email_notifications_enabled !== false;
  const smsEnabled = settings?.sms_notifications_enabled === true;
  const ownerEnabled = settings?.owner_notifications_enabled !== false;
  const staffEnabled = settings?.staff_notifications_enabled !== false;
  const emailConfigured = Boolean(getResendApiKey());
  const smsConfigured = Boolean(getTwilioConfig());
  const smsOnPlan = planIncludesSms(settings);

  if (emailEnabled) {
    const templateMap: Record<AppointmentEvent, string | null> = {
      created: "appointment.confirmation",
      confirmed: "appointment.confirmation",
      cancelled: "appointment.cancellation",
      rescheduled: "appointment.reschedule",
      updated: null,
    };

    const templateKey = templateMap[event];
    if (templateKey && customer?.email) {
      await enqueueEmailJob(businessId, {
        appointmentId,
        templateKey,
        previousStartTime: options?.previousStartTime,
        idempotencyKey: `${appointmentId}:${templateKey}:customer:${event}`,
      });
    } else if (templateKey && !customer?.email) {
      logger.info("notifications", "skip_customer_email_no_recipient", {
        appointmentId,
        event,
      });
    }

    if (staffEnabled && staff?.email && event !== "updated") {
      await enqueueEmailJob(businessId, {
        appointmentId,
        templateKey: "appointment.staff",
        recipient: staff.email,
        action: titleMap[event],
        idempotencyKey: `${appointmentId}:appointment.staff:${staff.email}:${event}`,
      });
    }

    const businessTo = resolveBusinessNotifyEmail(settings);
    if (ownerEnabled && businessTo && event !== "updated") {
      await enqueueEmailJob(businessId, {
        appointmentId,
        templateKey: "appointment.business",
        recipient: businessTo,
        action: titleMap[event],
        bookingSource: "reception",
        idempotencyKey: `${appointmentId}:appointment.business:${businessTo}:${event}`,
      });
    } else if (ownerEnabled && !businessTo && event !== "updated") {
      logger.info("notifications", "skip_business_email_no_recipient", {
        appointmentId,
        event,
        emailConfigured,
      });
    }
  }

  if (smsEnabled && smsOnPlan && smsConfigured) {
    const smsMap: Record<AppointmentEvent, string | null> = {
      created: "appointment.confirmation",
      confirmed: "appointment.confirmation",
      cancelled: "appointment.cancellation",
      rescheduled: "appointment.reschedule",
      updated: null,
    };
    const smsKey = smsMap[event];
    if (smsKey && customer?.phone) {
      await enqueueSmsJob(businessId, {
        appointmentId,
        templateKey: smsKey,
        idempotencyKey: `${appointmentId}:${smsKey}:sms:${event}`,
      });
    }
  } else if (smsEnabled && !smsOnPlan) {
    logger.info("notifications", "skip_sms_plan", { appointmentId, event });
  } else if (smsEnabled && !smsConfigured) {
    logger.info("notifications", "skip_sms_not_configured", {
      appointmentId,
      event,
    });
  }

  if (event === "created" || event === "confirmed") {
    const reminderHours = settings?.reminder_hours_before ?? 24;
    const reminderAt = new Date(appointment.start_time);
    reminderAt.setHours(reminderAt.getHours() - reminderHours);
    if (reminderAt > new Date()) {
      await enqueueReminderJobs(businessId, appointmentId, reminderAt);
    }
  }

  const webhookEventMap: Record<AppointmentEvent, string> = {
    created: "appointment.created",
    confirmed: "appointment.created",
    cancelled: "appointment.cancelled",
    rescheduled: "appointment.rescheduled",
    updated: "appointment.updated",
  };

  await enqueueWebhookJob(businessId, webhookEventMap[event], {
    appointmentId,
    startTime: appointment.start_time,
    endTime: appointment.end_time,
    status: appointment.status,
  });

  const { data: connections } = await supabase
    .from("calendar_connections")
    .select("id")
    .eq("business_id", businessId)
    .eq("sync_enabled", true);

  for (const conn of connections ?? []) {
    await enqueueCalendarSyncJob(businessId, conn.id);
  }

  if (event === "cancelled") {
    await deleteAppointmentFromCalendars(appointmentId);
  } else {
    await pushAppointmentToCalendars(appointmentId);
  }
}
