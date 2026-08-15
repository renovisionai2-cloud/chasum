import { formatStaffFacingInstant } from "@/lib/business/datetime";
import {
  buildAppointmentReport,
  buildCustomerReport,
  buildEmployeeReports,
  buildLocationReports,
  buildRevenueBreakdown,
  type ReportAppointmentRow,
  type ReportCustomerRow,
  type ReportPaymentRow,
} from "@/lib/reports/compute";
import {
  BOOKING_ENGINE_MUTATION_REVALIDATE_PATHS,
  CALENDAR_MUTATION_REVALIDATE_PATHS,
  REPORTS_DASHBOARD_PATH,
} from "@/lib/reports/revalidate-paths";
import { describe, expect, it } from "vitest";

const TORONTO = { timezone: "America/Toronto", currency: "CAD" };
/** Friday Aug 14, 2026 8:30 PM Eastern = 00:30 UTC Aug 15 */
const START = "2026-08-15T00:30:00.000Z";
const END = "2026-08-15T00:50:00.000Z";
/** Still Friday evening in Toronto */
const NOW = new Date("2026-08-15T03:00:00.000Z");

function bookedVisit(
  overrides: Partial<ReportAppointmentRow> = {},
): ReportAppointmentRow {
  return {
    id: "appt-1",
    status: "confirmed",
    start_time: START,
    end_time: END,
    location_id: "loc-1",
    staff_id: "staff-1",
    customer_id: "cust-1",
    service_id: "svc-1",
    price_cents: 22000,
    tax_cents: 2860,
    amount_paid_cents: 5000,
    payment_status: "deposit_paid",
    service: { name: "Early Ultrasound", price: 220, duration_minutes: 20 },
    staff: { id: "staff-1", name: "Bobita Singh" },
    customer: { id: "cust-1", name: "Ana Ramoersad", created_at: "2025-01-10T12:00:00.000Z" },
    location: { id: "loc-1", name: "Main" },
    ...overrides,
  };
}

describe("Phase 6.1B reports business timezone", () => {
  it("buckets booking trend, peak day, and peak hour in business time", () => {
    const report = buildAppointmentReport([bookedVisit()], 0, NOW, TORONTO);
    expect(report.bookingTrends.some((p) => p.label === "08-14")).toBe(true);
    expect(report.bookingTrends.some((p) => p.label === "08-15")).toBe(false);
    expect(report.peakDays.map((p) => p.label)).toEqual(["Fri"]);
    expect(report.peakHours[0]?.label).toBe("20:00");
  });

  it("does not UTC-bucket revenue daily keys across the Eastern evening", () => {
    const revenue = buildRevenueBreakdown([bookedVisit()], NOW, TORONTO);
    expect(revenue.daily.some((p) => p.label === "08-14")).toBe(true);
    expect(revenue.daily.some((p) => p.label === "08-15")).toBe(false);
  });
});

describe("Phase 6.1B employee and location recognized value", () => {
  it("uses tax-exclusive appointment price, not amount_paid deposit cash", () => {
    const employees = buildEmployeeReports(
      [bookedVisit()],
      [{ id: "staff-1", name: "Bobita Singh", is_active: true }],
      NOW,
      TORONTO,
    );
    expect(employees[0]?.revenue).toBe(220);
    expect(employees[0]?.completed).toBe(0);
    expect(employees[0]?.productivity).toBe(1);
  });

  it("counts completed only when status is completed", () => {
    const employees = buildEmployeeReports(
      [bookedVisit({ status: "completed" })],
      [{ id: "staff-1", name: "Bobita Singh", is_active: true }],
      NOW,
      TORONTO,
    );
    expect(employees[0]?.completed).toBe(1);
    expect(employees[0]?.revenue).toBe(220);
  });

  it("uses the same recognized appointment value for location revenue", () => {
    const locations = buildLocationReports(
      [bookedVisit()],
      [{ id: "loc-1", name: "Main" }],
      new Map([["loc-1", 1]]),
      NOW,
      TORONTO,
    );
    expect(locations[0]?.revenue).toBe(220);
    expect(locations[0]?.appointments).toBe(1);
    expect(locations[0]?.customers).toBe(1);
  });
});

describe("Phase 6.1B customer metric definitions", () => {
  const customers: ReportCustomerRow[] = [
    {
      id: "cust-1",
      name: "Ana Ramoersad",
      created_at: "2025-01-10T12:00:00.000Z",
      last_activity_at: START,
    },
  ];

  it("does not treat prior-customer-booked-this-month as repeat completed visits", () => {
    const report = buildCustomerReport(customers, [bookedVisit()], [], NOW, TORONTO);
    expect(report.returningCustomers).toBe(0);
  });

  it("counts repeat completed visits only after 2+ completed appointments", () => {
    const report = buildCustomerReport(
      customers,
      [
        bookedVisit({ id: "a", status: "completed", start_time: "2026-07-01T16:00:00.000Z" }),
        bookedVisit({ id: "b", status: "completed" }),
      ],
      [],
      NOW,
      TORONTO,
    );
    expect(report.returningCustomers).toBe(1);
  });

  it("averages recorded payment events when present (legacy customer_payment_events)", () => {
    const payments: ReportPaymentRow[] = [
      {
        amount_cents: 5000,
        status: "paid",
        occurred_at: START,
        customer_id: "cust-1",
      },
    ];
    const report = buildCustomerReport(
      customers,
      [bookedVisit()],
      payments,
      NOW,
      TORONTO,
    );
    expect(report.lifetimeValueAvg).toBe(50);
    expect(report.topCustomers[0]?.value).toBe(50);
    expect(report.retentionRate).toBe(100);
  });
});

describe("Phase 6.1B report propagation", () => {
  it("revalidates Reports after calendar and booking-engine mutations", () => {
    expect(CALENDAR_MUTATION_REVALIDATE_PATHS).toContain(REPORTS_DASHBOARD_PATH);
    expect(BOOKING_ENGINE_MUTATION_REVALIDATE_PATHS).toContain(
      REPORTS_DASHBOARD_PATH,
    );
  });
});

describe("Phase 6.1B communications timestamps", () => {
  it("formats stored UTC instants in business timezone without changing the source", () => {
    expect(
      formatStaffFacingInstant("2026-08-15T00:21:54.106+00:00", "America/Toronto"),
    ).toBe("Aug 14, 2026 · 8:21 PM");
  });
});
