/**
 * Optional / unassigned employee persistence (migration 034).
 *
 * Keep disabled until 034 is approved on a safe database. When enabled via env,
 * reception and public booking may save staff_id = null.
 */

export const OPTIONAL_STAFF_PERSISTENCE_ENABLED =
  process.env.CHASUM_OPTIONAL_STAFF_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_CHASUM_OPTIONAL_STAFF_ENABLED === "true";

/** Reception / staff UI — never mention migrations or schema. */
export const RECEPTION_EMPLOYEE_REQUIRED_MESSAGE =
  "Please select an employee to complete this booking. Assign-later booking will be available after the scheduling update is activated.";

/** Customer-facing public booking. */
export const PUBLIC_ANY_STAFF_UNAVAILABLE_MESSAGE =
  "Please choose a team member to finish booking. Booking with any available staff will be available soon.";

export function isUnassignedStaffSelection(
  staffId: string | null | undefined,
): boolean {
  const value = staffId?.trim() ?? "";
  return value === "" || value === "unassigned";
}

/** Returns a user-friendly error when unassigned persistence is unavailable. */
export function unassignedStaffBlockedMessage(
  channel: "staff" | "reception" | "public" | "summer" | "api" = "staff",
): string | null {
  if (OPTIONAL_STAFF_PERSISTENCE_ENABLED) return null;
  if (channel === "public" || channel === "summer") {
    return PUBLIC_ANY_STAFF_UNAVAILABLE_MESSAGE;
  }
  return RECEPTION_EMPLOYEE_REQUIRED_MESSAGE;
}

export function assertNamedStaffRequired(
  staffId: string | null | undefined,
  channel: "staff" | "reception" | "public" | "summer" | "api" = "staff",
): string | null {
  if (!isUnassignedStaffSelection(staffId)) return null;
  return unassignedStaffBlockedMessage(channel);
}
