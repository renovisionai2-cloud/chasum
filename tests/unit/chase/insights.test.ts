import { describe, expect, it } from "vitest";
import { buildChaseInsights } from "@/lib/chase/insights";
import type { ChaseKpis } from "@/lib/chase/types";

const baseKpis: ChaseKpis = {
  todayRevenue: 0,
  todayAppointments: 3,
  weekBookings: 20,
  staffUtilizationPct: 42,
  availableCapacitySlots: 12,
  noShows: 1,
  cancellationRatePct: 8,
  repeatCustomerRatePct: 40,
  averageBookingValue: 85,
  revenueWeekDeltaPct: -12,
};

describe("Chase insights", () => {
  it("flags revenue declines from grounded KPIs", () => {
    const insights = buildChaseInsights({
      kpis: baseKpis,
      pendingConfirmations: 4,
      outstandingDeposits: 0,
      topServiceName: null,
      topStaffName: null,
      topStaffUtilPct: null,
      quietDayLabel: null,
      vipInactiveCount: 0,
      lowUtilWeekday: null,
    });
    expect(insights.some((i) => i.id === "rev-down")).toBe(true);
  });
});
