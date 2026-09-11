/**
 * Explicit appointment persistence strategy for createBooking.
 *
 * Default is session/RLS-protected insert. Privileged public writes must pass
 * a constructed public_rpc strategy — never inferred from intent.channel.
 */

export type SessionBookingPersistence = {
  kind: "session";
};

export type PublicRpcBookingPersistence = {
  kind: "public_rpc";
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
};

export type BookingPersistenceStrategy =
  | SessionBookingPersistence
  | PublicRpcBookingPersistence;

export function sessionBookingPersistence(): SessionBookingPersistence {
  return { kind: "session" };
}

export function isPublicRpcPersistence(
  persistence: BookingPersistenceStrategy,
): persistence is PublicRpcBookingPersistence {
  return persistence.kind === "public_rpc";
}
