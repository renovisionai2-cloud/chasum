/**
 * Role & permission catalog for Employee Management.
 * Stored on staff rows today; enforced for multi-staff login later.
 */

export type EmployeeRoleKey =
  | "owner"
  | "admin"
  | "manager"
  | "receptionist"
  | "employee"
  | "staff"
  | "contractor"
  | "custom";

/** Module-aligned permissions + legacy ops keys (both accepted). */
export type PermissionKey =
  | "dashboard:read"
  | "dashboard:write"
  | "calendar:read"
  | "calendar:write"
  | "calendar:manage"
  | "reception:read"
  | "reception:write"
  | "crm:read"
  | "crm:write"
  | "reports:read"
  | "reports:write"
  | "billing:read"
  | "billing:write"
  | "employees:read"
  | "employees:write"
  | "settings:read"
  | "settings:write"
  | "ai_workforce:read"
  | "ai_workforce:write"
  | "developer:read"
  | "developer:write"
  | "appointments:read"
  | "appointments:write"
  | "clients:read"
  | "clients:write"
  | "services:manage"
  | "payroll:read"
  | "payroll:write"
  | "time_clock:use";

export type EmploymentStatus =
  | "active"
  | "onboarding"
  | "on_leave"
  | "terminated"
  | "contractor";

export type PayType = "hourly" | "salary" | "commission" | "hybrid";

export const MODULE_PERMISSIONS: PermissionKey[] = [
  "dashboard:read",
  "dashboard:write",
  "calendar:read",
  "calendar:write",
  "reception:read",
  "reception:write",
  "crm:read",
  "crm:write",
  "reports:read",
  "reports:write",
  "billing:read",
  "billing:write",
  "employees:read",
  "employees:write",
  "settings:read",
  "settings:write",
  "ai_workforce:read",
  "ai_workforce:write",
  "developer:read",
  "developer:write",
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "dashboard:read": "Dashboard — view",
  "dashboard:write": "Dashboard — manage",
  "calendar:read": "Calendar — view",
  "calendar:write": "Calendar — manage",
  "calendar:manage": "Calendar / reception (legacy)",
  "reception:read": "Reception — view",
  "reception:write": "Reception — manage",
  "crm:read": "CRM — view",
  "crm:write": "CRM — manage",
  "reports:read": "Reports — view",
  "reports:write": "Reports — manage",
  "billing:read": "Billing — view",
  "billing:write": "Billing — manage",
  "employees:read": "Employees — view",
  "employees:write": "Employees — manage",
  "settings:read": "Settings — view",
  "settings:write": "Settings — manage",
  "ai_workforce:read": "AI Workforce — view",
  "ai_workforce:write": "AI Workforce — manage",
  "developer:read": "Developer — view",
  "developer:write": "Developer — manage",
  "appointments:read": "View appointments",
  "appointments:write": "Manage appointments",
  "clients:read": "View clients",
  "clients:write": "Manage clients",
  "services:manage": "Manage services",
  "payroll:read": "View payroll",
  "payroll:write": "Edit payroll",
  "time_clock:use": "Use time clock",
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

/** Permissions shown in the Roles UI (module matrix first). */
export const UI_PERMISSIONS: PermissionKey[] = [
  ...MODULE_PERMISSIONS,
  "appointments:read",
  "appointments:write",
  "clients:read",
  "clients:write",
  "services:manage",
  "payroll:read",
  "payroll:write",
  "time_clock:use",
];

const FULL_ACCESS: PermissionKey[] = [...ALL_PERMISSIONS];

const OWNER_MANAGER_CORE: PermissionKey[] = [
  "dashboard:read",
  "dashboard:write",
  "calendar:read",
  "calendar:write",
  "reception:read",
  "reception:write",
  "crm:read",
  "crm:write",
  "reports:read",
  "reports:write",
  "employees:read",
  "employees:write",
  "settings:read",
  "appointments:read",
  "appointments:write",
  "clients:read",
  "clients:write",
  "services:manage",
  "payroll:read",
  "time_clock:use",
  "calendar:manage",
];

export const ROLE_DEFINITIONS: Record<
  Exclude<EmployeeRoleKey, "custom">,
  {
    label: string;
    description: string;
    permissions: PermissionKey[];
  }
> = {
  owner: {
    label: "Owner",
    description: "Full business access including billing and developer tools.",
    permissions: FULL_ACCESS,
  },
  admin: {
    label: "Admin",
    description: "Full business access except ownership transfer.",
    permissions: FULL_ACCESS.filter(
      (p) => p !== "billing:write" && p !== "developer:write",
    ),
  },
  manager: {
    label: "Manager",
    description: "Team, schedule, and client operations.",
    permissions: OWNER_MANAGER_CORE,
  },
  receptionist: {
    label: "Receptionist",
    description: "Front desk booking and client intake.",
    permissions: [
      "dashboard:read",
      "calendar:read",
      "calendar:write",
      "reception:read",
      "reception:write",
      "crm:read",
      "crm:write",
      "appointments:read",
      "appointments:write",
      "clients:read",
      "clients:write",
      "calendar:manage",
      "time_clock:use",
    ],
  },
  employee: {
    label: "Staff",
    description: "Day-to-day provider access.",
    permissions: [
      "dashboard:read",
      "calendar:read",
      "calendar:write",
      "reception:read",
      "appointments:read",
      "appointments:write",
      "clients:read",
      "calendar:manage",
      "time_clock:use",
    ],
  },
  staff: {
    label: "Staff",
    description: "Day-to-day provider access.",
    permissions: [
      "dashboard:read",
      "calendar:read",
      "calendar:write",
      "reception:read",
      "appointments:read",
      "appointments:write",
      "clients:read",
      "calendar:manage",
      "time_clock:use",
    ],
  },
  contractor: {
    label: "Contractor",
    description: "Limited schedule and appointment access.",
    permissions: [
      "dashboard:read",
      "calendar:read",
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

export const VACATION_KIND_LABELS = {
  vacation: "Vacation",
  time_off: "Time off",
  sick: "Sick",
  personal: "Personal",
  other: "Other",
} as const;

export type VacationKind = keyof typeof VACATION_KIND_LABELS;

export function isEmployeeRoleKey(value: unknown): value is EmployeeRoleKey {
  return (
    typeof value === "string" &&
    (value in ROLE_DEFINITIONS || value === "custom")
  );
}

export function isPermissionKey(value: unknown): value is PermissionKey {
  return typeof value === "string" && value in PERMISSION_LABELS;
}

export function permissionsForRole(role: EmployeeRoleKey): PermissionKey[] {
  if (role === "custom") return [];
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

export function composeDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  name?: string | null;
}): string {
  const preferred = input.preferredName?.trim();
  if (preferred) return preferred;
  const parts = [input.firstName?.trim(), input.lastName?.trim()].filter(
    Boolean,
  );
  if (parts.length > 0) return parts.join(" ");
  return input.name?.trim() || "";
}
