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
      "name, notification_email, email_notifications_enabled, sms_notifications_enabled, reminder_hours_before",
    )
    .eq("id", businessId)
    .single();
  return data;
}

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
      customer:customers(name, email)
    `,
    )
    .eq("id", appointmentId)
    .single();

  if (!appointment) return;

  const businessId = appointment.business_id;
  const settings = await getBusinessNotificationSettings(businessId);
  const service = unwrapRelation(appointment.service) as { name: string };
  const customer = unwrapRelation(appointment.customer) as { name: string; email: string };
  const staff = unwrapRelation(appointment.staff) as { name: string; email: string | null };

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
    `${customer.name} — ${service.name} with ${staff.name}`,
    { appointmentId, event },
  );

  if (settings?.email_notifications_enabled) {
    const templateMap: Record<AppointmentEvent, string | null> = {
      created: "appointment.confirmation",
      confirmed: "appointment.confirmation",
      cancelled: "appointment.cancellation",
      rescheduled: "appointment.reschedule",
      updated: null,
    };

    const templateKey = templateMap[event];
    if (templateKey) {
      await enqueueEmailJob(businessId, {
        appointmentId,
        templateKey,
        previousStartTime: options?.previousStartTime,
      });
    }

    if (staff.email && event !== "updated") {
      await enqueueEmailJob(businessId, {
        appointmentId,
        templateKey: "appointment.staff",
        recipient: staff.email,
        action: titleMap[event].toLowerCase(),
      });
    }

    if (settings.notification_email) {
      await enqueueEmailJob(businessId, {
        appointmentId,
        templateKey: "appointment.business",
        recipient: settings.notification_email,
        action: titleMap[event],
      });
    }
  }

  if (settings?.sms_notifications_enabled) {
    const smsMap: Record<AppointmentEvent, string | null> = {
      created: null,
      confirmed: null,
      cancelled: "appointment.cancellation",
      rescheduled: "appointment.reschedule",
      updated: null,
    };
    const smsKey = smsMap[event];
    if (smsKey) {
      await enqueueSmsJob(businessId, { appointmentId, templateKey: smsKey });
    }
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
