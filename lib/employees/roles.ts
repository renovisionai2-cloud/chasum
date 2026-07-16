/**
 * Role & permission catalog for Employee Management.
 * Stored on staff rows today; enforced for multi-staff login later.
 */

export type EmployeeRoleKey =
  | "admin"
  | "manager"
  | "employee"
  | "receptionist"
  | "contractor";

export type PermissionKey =
  | "appointments:read"
  | "appointments:write"
  | "clients:read"
  | "clients:write"
  | "calendar:manage"
  | "services:manage"
  | "employees:read"
  | "employees:write"
  | "payroll:read"
  | "payroll:write"
  | "settings:read"
  | "settings:write"
  | "reports:read"
  | "time_clock:use";

export type EmploymentStatus =
  | "active"
  | "onboarding"
  | "on_leave"
  | "terminated"
  | "contractor";

export type PayType = "hourly" | "salary" | "commission" | "hybrid";

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "appointments:read": "View appointments",
  "appointments:write": "Manage appointments",
  "clients:read": "View clients",
  "clients:write": "Manage clients",
  "calendar:manage": "Manage calendar / reception",
  "services:manage": "Manage services",
  "employees:read": "View employees",
  "employees:write": "Manage employees",
  "payroll:read": "View payroll",
  "payroll:write": "Edit payroll",
  "settings:read": "View settings",
  "settings:write": "Edit settings",
  "reports:read": "View reports",
  "time_clock:use": "Use time clock",
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

export const ROLE_DEFINITIONS: Record<
  EmployeeRoleKey,
  {
    label: string;
    description: string;
    permissions: PermissionKey[];
  }
> = {
  admin: {
    label: "Admin",
    description: "Full business access except ownership transfer.",
    permissions: [...ALL_PERMISSIONS],
  },
  manager: {
    label: "Manager",
    description: "Team, schedule, and client operations.",
    permissions: [
      "appointments:read",
      "appointments:write",
      "clients:read",
      "clients:write",
      "calendar:manage",
      "services:manage",
      "employees:read",
      "payroll:read",
      "settings:read",
      "reports:read",
      "time_clock:use",
    ],
  },
  employee: {
    label: "Employee",
    description: "Day-to-day provider access.",
    permissions: [
      "appointments:read",
      "appointments:write",
      "clients:read",
      "calendar:manage",
      "time_clock:use",
    ],
  },
  receptionist: {
    label: "Receptionist",
    description: "Front desk booking and client intake.",
    permissions: [
      "appointments:read",
      "appointments:write",
      "clients:read",
      "clients:write",
      "calendar:manage",
      "time_clock:use",
    ],
  },
  contractor: {
    label: "Contractor",
    description: "Limited schedule and appointment access.",
    permissions: [
      "appointments:read",
      "clients:read",
      "calendar:manage",
      "time_clock:use",
    ],
  },
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  onboarding: "Onboarding",
  on_leave: "On leave",
  terminated: "Terminated",
  contractor: "Contractor",
};

export const PAY_TYPE_LABELS: Record<PayType, string> = {
  hourly: "Hourly",
  salary: "Salary",
  commission: "Commission",
  hybrid: "Hybrid",
};

export function isEmployeeRoleKey(value: unknown): value is EmployeeRoleKey {
  return (
    typeof value === "string" &&
    value in ROLE_DEFINITIONS
  );
}

export function isPermissionKey(value: unknown): value is PermissionKey {
  return typeof value === "string" && value in PERMISSION_LABELS;
}

export function permissionsForRole(role: EmployeeRoleKey): PermissionKey[] {
  return [...ROLE_DEFINITIONS[role].permissions];
}

export function parsePermissions(raw: unknown): PermissionKey[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isPermissionKey);
}

/** Owner always passes; staff permissions checked when multi-staff login ships. */
export function hasPermission(
  permissions: PermissionKey[],
  required: PermissionKey,
): boolean {
  return permissions.includes(required);
}
