/**
 * Explicit appointment persistence strategy for createBooking.
 *
 * Default is session/RLS-protected insert. Privileged public writes must pass
 * a constructed public_rpc strategy — never inferred from intent.channel.
 */

import type { DurableBookingExpectedSnapshot } from "@/lib/booking-engine/types";

export type SessionBookingPersistence = {
  kind: "session";
};

export type PublicRpcBookingPersistence = {
  kind: "public_rpc";
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
};

const DURABLE_OPERATION_AUTHORITY = Symbol("durable-operation-authority");

export type DurableOperationAppointmentRpcArgs = {
  p_business_id: string;
  p_operation_id: string;
  p_actor_id: string;
  p_customer_id: string;
  p_location_id: string;
  p_service_id: string;
  p_staff_id: string | null;
  p_requested_start: string;
  p_requested_end: string;
  p_requested_status: string;
  p_duration_minutes: number;
  p_appointment_notes: string | null;
  p_room_id: string | null;
  p_resource_ids: readonly string[];
  p_package_id: string | null;
  p_package_name: string | null;
  p_subtotal_cents: number;
  p_tax_cents: number;
  p_deposit_required_cents: number;
};

export type DurableOperationAppointmentWriter = (
  args: DurableOperationAppointmentRpcArgs,
) => Promise<{
  data: unknown;
  error: { message: string } | null;
}>;

export type DurableOperationBookingPersistence = {
  kind: "durable_operation";
  expected: DurableBookingExpectedSnapshot;
  writeAppointment: DurableOperationAppointmentWriter;
  readonly authority: typeof DURABLE_OPERATION_AUTHORITY;
};

export type BookingPersistenceStrategy =
  | SessionBookingPersistence
  | PublicRpcBookingPersistence
  | DurableOperationBookingPersistence;

export function sessionBookingPersistence(): SessionBookingPersistence {
  return { kind: "session" };
}

export function durableOperationBookingPersistence(
  expected: DurableBookingExpectedSnapshot,
  writeAppointment: DurableOperationAppointmentWriter,
): DurableOperationBookingPersistence {
  Object.freeze(expected.resourceIds);
  Object.freeze(expected);
  return Object.freeze({
    kind: "durable_operation",
    expected,
    writeAppointment,
    authority: DURABLE_OPERATION_AUTHORITY,
  });
}

export function isPublicRpcPersistence(
  persistence: BookingPersistenceStrategy,
): persistence is PublicRpcBookingPersistence {
  return persistence.kind === "public_rpc";
}

export function isDurableOperationPersistence(
  persistence: BookingPersistenceStrategy,
): persistence is DurableOperationBookingPersistence {
  return (
    persistence.kind === "durable_operation" &&
    persistence.authority === DURABLE_OPERATION_AUTHORITY
  );
}
