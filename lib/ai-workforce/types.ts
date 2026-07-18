export type AiEmployeeStatus = "online" | "working" | "idle";

export type AiEmployeeId =
  | "summer"
  | "chase"
  | "emma"
  | "alex"
  | "maya"
  | "leo"
  | "sophia"
  | "noah";

export type AiEmployee = {
  id: AiEmployeeId;
  slug: AiEmployeeId;
  name: string;
  role: string;
  shortRole: string;
  status: AiEmployeeStatus;
  tasksCompletedToday: number;
  summary: string;
  responsibilities: string[];
  futureCapabilities: string[];
  metrics: { label: string; value: string; hint: string }[];
  accent: "primary" | "spark" | "success" | "warning";
};

export type AiActivityKind =
  | "system"
  | "recommendation"
  | "automation"
  | "handoff"
  | "insight";

export type AiActivityItem = {
  id: string;
  employeeId: AiEmployeeId;
  kind: AiActivityKind;
  title: string;
  description: string;
  createdAt: string;
  /** Preview-only until live AI events are wired. */
  preview?: boolean;
};

export const AI_EMPLOYEE_STATUS_LABELS: Record<AiEmployeeStatus, string> = {
  online: "Online",
  working: "Working",
  idle: "Idle",
};
