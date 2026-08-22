import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChaseOpsWorkspace } from "@/components/chase/chase-ops-workspace";
import { ChaseCrmPanel } from "@/components/crm/chase-crm-panel";
import { CustomerInsightsPanel } from "@/components/crm/customer-insights";
import { EmployeePerformanceDashboard } from "@/components/employees/employee-performance";
import { BusinessBrief } from "@/components/reception/business-brief";
import { CHASE_FORECAST_HOOKS } from "@/lib/chase/forecast";
import type { ChaseOperationsSnapshot } from "@/lib/chase/types";
import { formatMoneyCents, formatMoneyDollars } from "@/lib/commerce/money";
import type { ChaseCrmAnalytics } from "@/lib/crm/ai-knowledge";
import type { CrmInsights } from "@/lib/crm/types";
import type { EmployeePerformance } from "@/lib/employees/types";

const root = process.cwd();
function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: import("react").ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const TENANT_MONEY_SURFACES = [
  "components/business/business-hub.tsx",
  "components/chase/chase-ops-workspace.tsx",
  "components/crm/chase-crm-panel.tsx",
  "components/crm/customer-insights.tsx",
  "components/employees/employee-performance.tsx",
  "components/reception/business-brief.tsx",
];

const performance: EmployeePerformance = {
  completedAppointments: 4,
  upcomingAppointments: 1,
  cancelledAppointments: 0,
  noShowAppointments: 0,
  lifetimeRevenue: 248.6,
  completionRate: 100,
  noShowRate: 0,
};

const insights: CrmInsights = {
  lifetimeRevenue: 248.6,
  totalAppointments: 4,
  completedAppointments: 4,
  averageSpend: 62.15,
  noShowRate: 0,
  cancellationRate: 0,
  noShowCount: 0,
  cancellationCount: 0,
  upcomingCount: 1,
  preferredEmployeeName: null,
  preferredServiceName: null,
  preferredLocationName: null,
  lastVisit: null,
  nextAppointment: null,
};

function chaseSnapshot(currency: string): ChaseOperationsSnapshot {
  return {
    businessId: "biz-1",
    businessName: "Northshore",
    currency,
    generatedAt: "2026-08-22T12:00:00.000Z",
    enabled: true,
    kpis: {
      todayRevenue: 120,
      todayAppointments: 3,
      weekBookings: 12,
      staffUtilizationPct: 40,
      availableCapacitySlots: 8,
      noShows: 0,
      cancellationRatePct: 0,
      repeatCustomerRatePct: 50,
      averageBookingValue: 85,
      revenueWeekDeltaPct: null,
    },
    insights: [],
    alerts: [],
    customers: {
      newCustomers: 1,
      returningCustomers: 2,
      retentionRatePct: 50,
      lifetimeValueAvg: 248.6,
      inactive: [],
      overdueFollowUp: [],
      highValue: [],
      averageVisitFrequency: null,
    },
    employees: { rows: [] },
    bookings: {
      peakHours: [],
      quietHours: [],
      busyDays: [],
      popularServices: [],
      popularEmployees: [],
      bookingLeadTimeDaysAvg: null,
      completed: 4,
      cancelled: 0,
      noShows: 0,
    },
    summer: {
      bookingsCompleted: 0,
      reschedules: 0,
      cancellations: 0,
      creates: 0,
      note: "Quiet day.",
    },
    upcomingClosures: [],
    forecast: CHASE_FORECAST_HOOKS,
    pendingConfirmations: 0,
    outstandingDeposits: 0,
    commerce: {
      revenueTodayCents: 12000,
      revenueWeekCents: 48000,
      revenueMonthCents: 24860,
      outstandingInvoicesCents: 0,
      outstandingDepositsCents: 0,
      outstandingDepositsCount: 0,
      outstandingAppointmentBalancesCents: 0,
      refundsTrendCents: 0,
      averageTransactionCents: 12000,
      averageCustomerValueCents: 24860,
    },
    communications: {
      sentToday: 0,
      failedToday: 0,
      deliverySuccessRate: null,
      smsFailures: 0,
      unsentQueued: 0,
      bounceOrFailRate: null,
    },
  };
}

const crmAnalytics: ChaseCrmAnalytics = {
  currency: "cad",
  overdueFollowUp: [],
  highValue: [{ id: "c1", name: "Jane", lifetimeSpend: 248.6, visits: 4 }],
  inactive: [],
  retention: {
    activeCustomers: 3,
    vipCount: 1,
    repeatBookingRate: 40,
    averageLifetimeSpend: 248.6,
  },
};

describe("Tenant operational currency", () => {
  it("uses the canonical formatter for CAD and a non-dollar currency", () => {
    const cad = formatMoneyCents(24860, "cad");
    const eur = formatMoneyCents(24860, "eur");
    expect(cad).toContain("248.60");
    expect(eur).toContain("248.60");
    expect(eur).toMatch(/€|EUR/);
    expect(formatMoneyDollars(248.6, "cad")).toBe(cad);
    expect(formatMoneyDollars(248.6, "gbp")).toMatch(/£|GBP/);
  });

  it("does not hardcode a `$` money helper on tenant operational surfaces", () => {
    for (const path of TENANT_MONEY_SURFACES) {
      const src = read(path);
      expect(src).not.toMatch(/function dollars\(/);
      expect(src).not.toMatch(/return `\$\$\{/);
      expect(src).not.toMatch(/`\$\$\{.*\.toFixed/);
      expect(src).toMatch(/formatMoney(Cents|Dollars)/);
    }
  });

  it("renders employee lifetime revenue in CAD and EUR", () => {
    const { rerender } = render(
      <EmployeePerformanceDashboard performance={performance} currency="cad" />,
    );
    expect(screen.getByText(formatMoneyDollars(248.6, "cad"))).toBeInTheDocument();
    rerender(
      <EmployeePerformanceDashboard performance={performance} currency="eur" />,
    );
    expect(screen.getByText(formatMoneyDollars(248.6, "eur"))).toBeInTheDocument();
  });

  it("renders customer list value in tenant currency", () => {
    render(<CustomerInsightsPanel insights={insights} currency="cad" />);
    expect(screen.getByText(formatMoneyDollars(248.6, "cad"))).toBeInTheDocument();
    expect(
      screen.getAllByText((_, node) =>
        Boolean(node?.textContent?.includes(formatMoneyDollars(62.15, "cad"))),
      ).length,
    ).toBeGreaterThan(0);
  });

  it("renders Chase commerce cents with tenant currency", () => {
    render(<ChaseOpsWorkspace snapshot={chaseSnapshot("cad")} />);
    expect(
      screen.getAllByText(formatMoneyCents(24860, "cad")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(formatMoneyDollars(120, "cad")).length).toBeGreaterThan(
      0,
    );
  });

  it("renders Chase CRM spend without a hardcoded dollar prefix", () => {
    render(<ChaseCrmPanel analytics={crmAnalytics} currency="eur" />);
    expect(
      screen.getAllByText(formatMoneyDollars(248.6, "eur")).length,
    ).toBeGreaterThan(0);
  });

  it("renders reception brief revenue with tenant currency", () => {
    render(
      <BusinessBrief
        brief={{
          todayAppointments: 2,
          todayRevenue: 120,
          customersToday: 2,
          openTimeSlots: 4,
          pendingConfirmations: 0,
          currency: "gbp",
        }}
      />,
    );
    expect(screen.getByText(formatMoneyDollars(120, "gbp"))).toBeInTheDocument();
  });
});
