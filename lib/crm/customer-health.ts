/**
 * Customer directory health — derived from directory rows only.
 * Average spend from commerce is NOT available on the directory load path.
 */

import type { CrmDirectoryCustomer } from "@/lib/actions/crm";
import type { CrmStatus } from "@/lib/crm/types";

export type CustomerHealthMetric =
  | { kind: "count"; value: number }
  | { kind: "unavailable"; reason: string };

export type CustomerHealthSummary = {
  active: CustomerHealthMetric;
  newThisMonth: CustomerHealthMetric;
  returningThisMonth: CustomerHealthMetric;
  withBalances: CustomerHealthMetric;
  vip: CustomerHealthMetric;
  inactive: CustomerHealthMetric;
  /** Directory does not load commerce ledger averages — always unavailable here. */
  averageSpend: CustomerHealthMetric;
  observations: string[];
};

export function isPersistedCrmStatus(status: string): boolean {
  return (
    status === "lead" ||
    status === "active" ||
    status === "inactive" ||
    status === "archived" ||
    status === "vip"
  );
}

/** CRM status dropdown options — VIP is preferred as a derived segment via is_vip. */
export const CRM_STATUS_EDIT_OPTIONS: Array<{
  value: Exclude<CrmStatus, "vip"> | "vip";
  label: string;
  note?: string;
}> = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
  {
    value: "vip",
    label: "VIP (legacy status)",
    note: "Prefer the VIP flag / segment; status value kept for stored rows.",
  },
];

export const CRM_STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> =
  [
    { value: "lead", label: "Lead" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
  ];

export function displayCrmStatusLabel(
  status: string | null | undefined,
): string {
  const map: Record<string, string> = {
    lead: "Lead",
    active: "Active",
    inactive: "Inactive",
    vip: "VIP",
    archived: "Archived",
  };
  return map[status ?? "active"] ?? "Active";
}

export function isVipCustomer(customer: {
  is_vip?: boolean | null;
  crm_status?: string | null;
}): boolean {
  return Boolean(customer.is_vip) || customer.crm_status === "vip";
}

function startOfMonthMs(nowMs: number): number {
  const d = new Date(nowMs);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function isInCurrentMonth(iso: string | null | undefined, nowMs: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= startOfMonthMs(nowMs) && t <= nowMs;
}

export function buildCustomerHealthSummary(
  customers: CrmDirectoryCustomer[],
  nowMs = Date.now(),
): CustomerHealthSummary {
  let active = 0;
  let newThisMonth = 0;
  let returningThisMonth = 0;
  let withBalances = 0;
  let vip = 0;
  let inactive = 0;

  for (const c of customers) {
    const status = (c.crm_status ?? "active") as string;
    if (status === "active" || status === "vip") active += 1;
    if (status === "inactive") inactive += 1;
    if (isVipCustomer(c)) vip += 1;
    if (Number(c.outstanding_balance_cents ?? 0) > 0) withBalances += 1;

    if (isInCurrentMonth(c.created_at, nowMs)) newThisMonth += 1;

    const visits = Number(c.visit_count_completed ?? 0);
    if (visits >= 2 && isInCurrentMonth(c.last_visit_at, nowMs)) {
      returningThisMonth += 1;
    }
  }

  const observations: string[] = [];
  if (withBalances > 0) {
    observations.push(
      `${withBalances} customer${withBalances === 1 ? "" : "s"} currently have outstanding balances.`,
    );
  } else {
    observations.push("No customers currently have outstanding balances.");
  }
  if (inactive === 0) {
    observations.push("No inactive customers were found.");
  } else {
    observations.push(
      `${inactive} inactive customer${inactive === 1 ? "" : "s"} on file.`,
    );
  }
  if (vip === 0) {
    observations.push("No customers currently meet the VIP rule.");
  } else {
    observations.push(
      `${vip} VIP customer${vip === 1 ? "" : "s"} on file.`,
    );
  }

  return {
    active: { kind: "count", value: active },
    newThisMonth: { kind: "count", value: newThisMonth },
    returningThisMonth: { kind: "count", value: returningThisMonth },
    withBalances: { kind: "count", value: withBalances },
    vip: { kind: "count", value: vip },
    inactive: { kind: "count", value: inactive },
    averageSpend: {
      kind: "unavailable",
      reason:
        "Directory does not load commerce ledger averages for all customers.",
    },
    observations,
  };
}

export function formatHealthMetric(metric: CustomerHealthMetric): string {
  if (metric.kind === "unavailable") return "Unavailable";
  return String(metric.value);
}
