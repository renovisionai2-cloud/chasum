import ical, { ICalCalendarMethod, ICalEventStatus } from "ical-generator";
import type { AppointmentNotificationContext } from "@/lib/types/integrations";

export function generateIcsFeed(
  businessName: string,
  appointments: Array<{
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    service: { name: string } | null;
    staff: { name: string } | null;
    customer: { name: string } | null;
  }>,
): string {
  const calendar = ical({
    name: `${businessName} — Chasum`,
    method: ICalCalendarMethod.PUBLISH,
    timezone: "UTC",
  });

  for (const appt of appointments) {
    if (appt.status === "cancelled") continue;
    calendar.createEvent({
      id: appt.id,
      start: new Date(appt.start_time),
      end: new Date(appt.end_time),
      summary: `${appt.service?.name ?? "Appointment"} — ${appt.customer?.name ?? "Client"}`,
      description: `Staff: ${appt.staff?.name ?? "TBD"}`,
      status:
        appt.status === "confirmed"
          ? ICalEventStatus.CONFIRMED
          : ICalEventStatus.TENTATIVE,
    });
  }

  return calendar.toString();
}

export function generateSingleEventIcs(ctx: AppointmentNotificationContext): string {
  const calendar = ical({
    name: ctx.businessName,
    method: ICalCalendarMethod.PUBLISH,
    timezone: "UTC",
  });
  calendar.createEvent({
    id: ctx.appointmentId,
    start: new Date(ctx.startTime),
    end: new Date(ctx.endTime),
    summary: `${ctx.serviceName} with ${ctx.staffName}`,
    description: [
      `Client: ${ctx.customerName}`,
      ctx.notes ? `Notes: ${ctx.notes}` : null,
      `Booked via ${ctx.businessName}`,
    ]
      .filter(Boolean)
      .join("\n"),
    status: ICalEventStatus.CONFIRMED,
  });
  return calendar.toString();
}

export function generateAppleIcsSecret(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
