/**
 * CRM role permissions — align with employee permission catalog.
 * Owner always has full access today; staff login will enforce later.
 */

export type CrmPermission =
  | "clients:read"
  | "clients:write"
  | "clients:notes"
  | "clients:documents"
  | "clients:communications"
  | "clients:marketing"
  | "clients:insights";

export const CRM_PERMISSION_LABELS: Record<CrmPermission, string> = {
  "clients:read": "View CRM profiles",
  "clients:write": "Edit CRM profiles",
  "clients:notes": "Manage CRM notes",
  "clients:documents": "Manage CRM documents",
  "clients:communications": "Use communication tools",
  "clients:marketing": "Edit marketing & loyalty fields",
  "clients:insights": "View customer insights",
};

/** Owner-scoped gate until multi-staff login lands. */
export function canAccessCrm(
  _permission: CrmPermission,
  isBusinessOwner: boolean,
): boolean {
  return isBusinessOwner;
}
