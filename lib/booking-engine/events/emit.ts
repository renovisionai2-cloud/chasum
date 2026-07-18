import type {
  BookingChannel,
  BookingDomainEvent,
  BookingDomainEventType,
} from "@/lib/booking-engine/types";

export type BookingEventHandler = (
  event: BookingDomainEvent,
) => void | Promise<void>;

const handlers = new Set<BookingEventHandler>();
let communicationsBridgeReady = false;

async function ensureCommunicationsBridge() {
  if (communicationsBridgeReady) return;
  communicationsBridgeReady = true;
  try {
    const { registerCommunicationsBookingBridge } = await import(
      "@/lib/communications/events/booking-bridge"
    );
    registerCommunicationsBookingBridge();
  } catch (error) {
    console.error("[booking-engine] communications bridge failed:", error);
  }
}

/** Register a listener (Communications / Chase / realtime). */
export function onBookingEvent(handler: BookingEventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function emitBookingEvent(
  event: BookingDomainEvent,
): Promise<BookingDomainEvent> {
  await ensureCommunicationsBridge();
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
