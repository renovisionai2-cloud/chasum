/**
 * Commerce domain events — in-process bus mirroring booking-engine events.
 * Future Summer / Chase subscribe here. No AI behavior in this module.
 */

export type CommerceDomainEventType =
  | "payment.received"
  | "deposit.received"
  | "refund.processed"
  | "invoice.generated"
  | "invoice.paid"
  | "receipt.created"
  | "gift_certificate.sold"
  | "store_credit.adjusted";

export type CommerceDomainEvent = {
  type: CommerceDomainEventType;
  businessId: string;
  customerId?: string | null;
  appointmentId?: string | null;
  entityId?: string | null;
  occurredAt: string;
  payload?: Record<string, unknown>;
};

export type CommerceEventHandler = (
  event: CommerceDomainEvent,
) => void | Promise<void>;

const handlers = new Set<CommerceEventHandler>();

export function onCommerceEvent(handler: CommerceEventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function emitCommerceEvent(
  event: CommerceDomainEvent,
): Promise<CommerceDomainEvent> {
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (error) {
      console.error("[commerce] event handler failed:", error);
    }
  }
  return event;
}

export function createCommerceEvent(input: {
  type: CommerceDomainEventType;
  businessId: string;
  customerId?: string | null;
  appointmentId?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}): CommerceDomainEvent {
  return {
    type: input.type,
    businessId: input.businessId,
    customerId: input.customerId ?? null,
    appointmentId: input.appointmentId ?? null,
    entityId: input.entityId ?? null,
    occurredAt: new Date().toISOString(),
    payload: input.payload,
  };
}
