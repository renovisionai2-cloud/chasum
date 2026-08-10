/**
 * Adapter maturity for Chapter 5 Phase 5.0.
 *
 * ACTIVE  — safe to use; routes through BookingFacade
 * PARTIAL — contract present; some surfaces still bypass or under-tag channel
 * FUTURE  — intent-only / not wired for production writes
 */

export type BookingAdapterStatus = "ACTIVE" | "PARTIAL" | "FUTURE";

export const BOOKING_ADAPTER_STATUS = {
  /** Calendar / Booking Workspace / staff actions — ACTIVE */
  staff: "ACTIVE",
  /**
   * Reception MODE of Calendar.
   * Intent builders ready; many create paths still pass channel "staff".
   */
  reception: "PARTIAL",
  /**
   * Public preview via facade; named-staff create may still use
   * create_public_appointment RPC (documented bypass — do not invent slots).
   */
  public: "PARTIAL",
  /**
   * Summer wrappers call BookingFacade only.
   * New Summer write activation is not part of Phase 5.0 product enablement.
   */
  summer: "ACTIVE",
  /** Intent builders only — API v1 route may still bypass; convergence is Phase 5.1+. */
  api: "FUTURE",
} as const satisfies Record<string, BookingAdapterStatus>;
