/**
 * Platform event vocabulary for the AI Business Operating System.
 * Unifies booking + commerce (+ future CRM/employee) types for subscribers.
 * Do not put AI logic here — events only.
 */

import type { BookingDomainEventType } from "@/lib/booking-engine/types";
import type { CommerceDomainEventType } from "@/lib/commerce/events";

export type CrmDomainEventType =
  | "customer.created"
  | "customer.updated"
  | "customer.inactive";

export type WorkforceDomainEventType =
  | "employee.added"
  | "employee.updated"
  | "employee.deactivated";

export type OpsDomainEventType = "revenue.updated";

export type PlatformEventType =
  | BookingDomainEventType
  | CommerceDomainEventType
  | CrmDomainEventType
  | WorkforceDomainEventType
  | OpsDomainEventType;

export type PlatformEvent = {
  type: PlatformEventType;
  businessId: string;
  occurredAt: string;
  entityId?: string | null;
  customerId?: string | null;
  appointmentId?: string | null;
  channel?: string | null;
  payload?: Record<string, unknown>;
};

export type PlatformEventHandler = (
  event: PlatformEvent,
) => void | Promise<void>;

const handlers = new Set<PlatformEventHandler>();
let bridgesReady = false;

async function ensureBridges() {
  if (bridgesReady) return;
  bridgesReady = true;
  try {
    const { onBookingEvent } = await import("@/lib/booking-engine/events/emit");
    onBookingEvent(async (event) => {
      await emitPlatformEvent({
        type: event.type,
        businessId: event.businessId,
        occurredAt: event.occurredAt,
        appointmentId: event.appointmentId,
        channel: event.channel,
        payload: event.payload,
      });
    });
  } catch (error) {
    console.error("[os] booking event bridge failed:", error);
  }
  try {
    const { onCommerceEvent } = await import("@/lib/commerce/events");
    onCommerceEvent(async (event) => {
      await emitPlatformEvent({
        type: event.type,
        businessId: event.businessId,
        occurredAt: event.occurredAt,
        customerId: event.customerId,
        appointmentId: event.appointmentId,
        entityId: event.entityId,
        payload: event.payload,
      });
    });
  } catch (error) {
    console.error("[os] commerce event bridge failed:", error);
  }
}

export function onPlatformEvent(handler: PlatformEventHandler): () => void {
  void ensureBridges();
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function emitPlatformEvent(
  event: PlatformEvent,
): Promise<PlatformEvent> {
  await ensureBridges();
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (error) {
      console.error("[os] platform event handler failed:", error);
    }
  }
  return event;
}

/** Catalog of event types future AI (Summer / Chase) will consume. */
export const PLATFORM_EVENT_CATALOG: ReadonlyArray<{
  type: PlatformEventType;
  description: string;
}> = [
  { type: "appointment.created", description: "New appointment booked" },
  { type: "appointment.cancelled", description: "Appointment cancelled" },
  { type: "appointment.completed", description: "Appointment completed" },
  { type: "payment.received", description: "Payment recorded" },
  { type: "deposit.received", description: "Deposit recorded" },
  { type: "invoice.generated", description: "Invoice created" },
  { type: "gift_certificate.sold", description: "Gift certificate issued" },
  { type: "customer.created", description: "Customer profile created" },
  { type: "customer.inactive", description: "Customer marked inactive" },
  { type: "employee.added", description: "Employee added to workforce" },
  { type: "revenue.updated", description: "Recognized revenue changed" },
];
