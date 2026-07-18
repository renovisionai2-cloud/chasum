/**
 * Bridge Booking Engine domain events → Communications Platform.
 * All booking channels (staff, Summer, public, API) go through this — never send providers directly.
 */

import { onBookingEvent } from "@/lib/booking-engine/events/emit";
import type { BookingDomainEventType } from "@/lib/booking-engine/types";

let registered = false;

export function registerCommunicationsBookingBridge(): void {
  if (registered) return;
  registered = true;

  onBookingEvent(async (event) => {
    const { handleAppointmentEvent } = await import(
      "@/lib/integrations/notifications/orchestrator"
    );

    let mapped:
      | "created"
      | "confirmed"
      | "cancelled"
      | "rescheduled"
      | "updated"
      | null = null;

    switch (event.type as BookingDomainEventType) {
      case "appointment.created":
        mapped =
          event.payload?.status === "confirmed" ? "confirmed" : "created";
        break;
      case "appointment.cancelled":
        mapped = "cancelled";
        break;
      case "appointment.rescheduled":
        mapped = "rescheduled";
        break;
      case "appointment.updated":
      case "appointment.completed":
      case "appointment.checked_in":
      case "appointment.no_show":
        mapped = "updated";
        break;
      default:
        mapped = null;
    }

    if (!mapped) return;

    const previousStartTime =
      typeof event.payload?.previousStartTime === "string"
        ? event.payload.previousStartTime
        : typeof event.payload?.previous_start_time === "string"
          ? event.payload.previous_start_time
          : undefined;

    await handleAppointmentEvent(event.appointmentId, mapped, {
      previousStartTime,
    });
  });
}
