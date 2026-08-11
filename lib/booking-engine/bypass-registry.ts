/**
 * Chapter 5 Phase 5.3 — safe surface-bypass inventory.
 * Classify application-level mutation paths. Do not weaken RLS for purity.
 */

export const BYPASS_STATUSES = [
  "CONVERGED",
  "PARTIAL",
  "INTENTIONALLY_RETAINED",
  "FUTURE",
] as const;

export type BypassStatus = (typeof BYPASS_STATUSES)[number];

export type BypassRecord = {
  id: string;
  surface: string;
  mutation: string;
  status: BypassStatus;
  reason: string;
};

/**
 * Authoritative Phase 5.3 classification.
 * Enriched RPC payloads / resource productization / optional staff are out of scope.
 */
export const BOOKING_MUTATION_BYPASSES: BypassRecord[] = [
  {
    id: "staff-reception-create-update-cancel",
    surface: "staff/reception",
    mutation: "create / update / cancel / reschedule / resize",
    status: "CONVERGED",
    reason:
      "Calendar, Booking Workspace, and appointment actions already call BookingFacade via server actions.",
  },
  {
    id: "portal-cancel",
    surface: "customer portal",
    mutation: "cancel",
    status: "CONVERGED",
    reason:
      "Token + customer ownership checked first; cancel then runs cancelBooking (service client) so events/logging match the facade without using a staff session.",
  },
  {
    id: "api-v1-delete-cancel",
    surface: "API v1",
    mutation: "DELETE / cancelled PATCH",
    status: "CONVERGED",
    reason:
      "API-key auth already established; cancelBooking runs with the service client so RLS is not asked to represent an API key.",
  },
  {
    id: "api-v1-create-update",
    surface: "API v1",
    mutation: "POST / non-cancel PATCH",
    status: "PARTIAL",
    reason:
      "Still uses service-client insert/update after validate_appointment_slot. BookingFacade.create binds to the user-session client and cannot safely represent API-key auth without a broader client-injection change.",
  },
  {
    id: "public-named-create",
    surface: "public booking",
    mutation: "create_public_appointment",
    status: "INTENTIONALLY_RETAINED",
    reason:
      "SECURITY DEFINER RPC granted to anon/authenticated: resolves location, validates the slot, and inserts atomically. BookingFacade.create uses the cookie session client and cannot reproduce anon public authorization without weakening RLS.",
  },
  {
    id: "public-unassigned-create",
    surface: "public booking",
    mutation: "createBooking",
    status: "CONVERGED",
    reason:
      "Unassigned public create already goes through createBooking and remains gated by optional-staff rules.",
  },
  {
    id: "summer-mutations",
    surface: "Summer",
    mutation: "create / update / cancel / preview",
    status: "CONVERGED",
    reason: "Summer adapter calls BookingFacade only.",
  },
  {
    id: "calendar-undo",
    surface: "calendar undo",
    mutation: "direct snapshot restore",
    status: "FUTURE",
    reason:
      "Undo restores a change-log snapshot. Not a booking create/cancel path; left for a later undo contract.",
  },
];

export function bypassById(id: string): BypassRecord | undefined {
  return BOOKING_MUTATION_BYPASSES.find((row) => row.id === id);
}

export function bypassesWithStatus(status: BypassStatus): BypassRecord[] {
  return BOOKING_MUTATION_BYPASSES.filter((row) => row.status === status);
}
