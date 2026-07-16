export type {
  Department,
  EmployeePerformance,
  EmployeeProfile,
  StaffActivityEvent,
  StaffLocationAssignment,
} from "@/lib/employees/types";

export {
  ALL_PERMISSIONS,
  EMPLOYMENT_STATUS_LABELS,
  PAY_TYPE_LABELS,
  PERMISSION_LABELS,
  ROLE_DEFINITIONS,
  hasPermission,
  isEmployeeRoleKey,
  parsePermissions,
  permissionsForRole,
} from "@/lib/employees/roles";

export {
  getEmployeeProfile,
  listDepartments,
  logStaffActivity,
} from "@/lib/employees/service";
