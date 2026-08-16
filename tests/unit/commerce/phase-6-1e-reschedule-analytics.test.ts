import { describe, expect, it } from "vitest";
import { buildAppointmentReport, type ReportAppointmentRow } from "@/lib/reports/compute";
import {
  appointmentHadScheduleMove,
  countRescheduledAppointments,
  logRecordsScheduleMove,
} from "@/lib/reports/reschedule-analytics";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TORONTO = { timezone: "America/Toronto", currency: "CAD" };
const START = "2026-08-15T00:30:00.000Z";
const END = "2026-08-15T00:50:00.000Z";
const NOW = new Date("2026-08-15T03:00:00.000Z");
const CREATED = "2026-08-15T00:21:49.555Z";
const LATER_UPDATE = "2026-08-15T14:41:34.159Z";

function anaRow(overrides: Partial<ReportAppointmentRow> = {}): ReportAppointmentRow {
  return {
    id: "ana-appt",
    status: "confirmed",
    start_time: START,
    end_time: END,
    created_at: CREATED,
    updated_at: LATER_UPDATE,
    location_id: "loc-1",
    staff_id: "staff-1",
    customer_id: "cust-1",
    service_id: "svc-1",
    ...overrides,
  };
}

describe("Phase 6.1E reschedule analytics", () => {
  it("does not treat unchanged save / later updated_at as rescheduled", () => {
    const report = buildAppointmentReport([anaRow()], 0, NOW, TORONTO, [
      {
        appointment_id: "ana-appt",
        action: "update",
        before_state: { start_time: START, end_time: END, status: "confirmed" },
        after_state: { start_time: START, end_time: END, status: "confirmed" },
      },
    ]);
    expect(report.rescheduled).toBe(0);
  });

  it("does not treat note or payment updates as rescheduled", () => {
    expect(
      logRecordsScheduleMove({
        appointment_id: "ana-appt",
        action: "update",
        before_state: null,
        after_state: {
          type: "payment.recorded",
          amountCents: 5000,
        },
      }),
    ).toBe(false);
    expect(
      countRescheduledAppointments([anaRow()], [
        {
          appointment_id: "ana-appt",
          action: "update",
          before_state: null,
          after_state: { type: "payment.recorded", amountCents: 19860 },
        },
      ]),
    ).toBe(0);
  });

  it("counts a true start-time change as rescheduled", () => {
    const moved = "2026-08-16T00:30:00.000Z";
    expect(
      appointmentHadScheduleMove("ana-appt", [
        {
          appointment_id: "ana-appt",
          action: "reschedule",
          before_state: { start_time: START, end_time: END },
          after_state: { start_time: moved, end_time: "2026-08-16T00:50:00.000Z" },
        },
      ]),
    ).toBe(true);
    const report = buildAppointmentReport([anaRow()], 0, NOW, TORONTO, [
      {
        appointment_id: "ana-appt",
        action: "reschedule",
        before_state: { start_time: START, end_time: END },
        after_state: { start_time: moved, end_time: "2026-08-16T00:50:00.000Z" },
      },
    ]);
    expect(report.rescheduled).toBe(1);
  });

  it("does not count historical same-slot schedule hold as rescheduled", () => {
    expect(
      logRecordsScheduleMove({
        appointment_id: "ana-appt",
        action: "update",
        before_state: { start_time: START, end_time: END },
        after_state: { start_time: START, end_time: END, status: "confirmed" },
      }),
    ).toBe(false);
  });

  it("legacy updated_at heuristic is no longer used", () => {
    const compute = readFileSync(
      join(process.cwd(), "lib/reports/compute.ts"),
      "utf8",
    );
    expect(compute).not.toContain("60_000");
    expect(compute).toContain("countRescheduledAppointments");
  });
});
