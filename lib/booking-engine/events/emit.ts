import type {
  BookingChannel,
  BookingDomainEvent,
  BookingDomainEventType,
} from "@/lib/booking-engine/types";

export type BookingEventHandler = (
  event: BookingDomainEvent,
) => void | Promise<void>;

const handlers = new Set<BookingEventHandler>();

/** Register a listener (notifications / Chase / realtime will subscribe later). */
export function onBookingEvent(handler: BookingEventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function emitBookingEvent(
  event: BookingDomainEvent,
): Promise<BookingDomainEvent> {
  // Infrastructure only — no notification side effects yet.
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (error) {
      console.error("[booking-engine] event handler failed:", error);
    }
  }
  return event;
}

export function createBookingEvent(input: {
  type: BookingDomainEventType;
  businessId: string;
  appointmentId: string;
  channel: BookingChannel;
  payload?: Record<string, unknown>;
}): BookingDomainEvent {
  return {
    type: input.type,
    businessId: input.businessId,
    appointmentId: input.appointmentId,
    channel: input.channel,
    occurredAt: new Date().toISOString(),
    payload: input.payload,
  };
}
