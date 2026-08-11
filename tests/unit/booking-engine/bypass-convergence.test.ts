import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BOOKING_MUTATION_BYPASSES,
  bypassById,
  bypassesWithStatus,
} from "@/lib/booking-engine/bypass-registry";
import { BOOKING_ADAPTER_STATUS } from "@/lib/booking-engine/adapters/status";

describe("Phase 5.3 safe BookingFacade convergence", () => {
  it("classifies every known bypass and retains public named create", () => {
    expect(BOOKING_MUTATION_BYPASSES.length).toBeGreaterThanOrEqual(6);
    expect(bypassById("portal-cancel")?.status).toBe("CONVERGED");
    expect(bypassById("api-v1-delete-cancel")?.status).toBe("CONVERGED");
    expect(bypassById("staff-reception-create-update-cancel")?.status).toBe(
      "CONVERGED",
    );
    expect(bypassById("public-named-create")?.status).toBe(
      "INTENTIONALLY_RETAINED",
    );
    expect(bypassById("api-v1-create-update")?.status).toBe("PARTIAL");
    expect(bypassesWithStatus("INTENTIONALLY_RETAINED").map((row) => row.id)).toContain(
      "public-named-create",
    );
  });

  it("portal cancel verifies ownership then calls cancelBooking", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/actions/booking-engine.ts"),
      "utf8",
    );
    expect(source).toContain("portalCancelAppointment");
    expect(source).toContain("cancelBooking");
    expect(source).toContain("customer_id !== session.customer.id");
    expect(source).toContain("channel: \"public\"");
  });

  it("API v1 DELETE cancels through cancelBooking after API-key auth", () => {
    const source = readFileSync(
      join(process.cwd(), "app/api/v1/appointments/[id]/route.ts"),
      "utf8",
    );
    expect(source).toContain("cancelBooking");
    expect(source).toContain('channel: "api"');
    expect(source).toContain("requireApiAuth");
  });

  it("public named booking still uses create_public_appointment", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/actions/public-booking.ts"),
      "utf8",
    );
    expect(source).toContain("create_public_appointment");
    expect(source).toContain("createBooking");
  });

  it("does not mark API adapter as fully ACTIVE", () => {
    expect(BOOKING_ADAPTER_STATUS.api).toBe("PARTIAL");
    expect(BOOKING_ADAPTER_STATUS.staff).toBe("ACTIVE");
  });

  it("Week/Month planning views do not treat empty cells as available slots", () => {
    const week = readFileSync(
      join(process.cwd(), "components/calendar/week-planning-view.tsx"),
      "utf8",
    );
    const month = readFileSync(
      join(process.cwd(), "components/calendar/month-planning-view.tsx"),
      "utf8",
    );
    expect(week).not.toContain("TimeSlotDropZone");
    expect(month).not.toContain("TimeSlotDropZone");
    expect(week).not.toContain("getHours");
    expect(month).not.toContain("startOfWeek");
    expect(week).toContain("No appointments");
    expect(week).toContain("isNarrow");
    expect(month).toContain("isNarrow");
  });

  it("calendar Week/Month open exact management and date-only planning", () => {
    const client = readFileSync(
      join(process.cwd(), "components/calendar/calendar-client.tsx"),
      "utf8",
    );
    expect(client).toContain("onSelectAppointment={openEdit}");
    expect(client).toContain("openPlanDay");
    expect(client).toContain("setBookingDraft({ date: civilDate })");
    expect(client).toMatch(
      /<WeekPlanningView[\s\S]*?onPlanDay=\{openPlanDay\}[\s\S]*?\/>/,
    );
    expect(client).not.toMatch(
      /<WeekPlanningView[\s\S]*?onSelectSlot=\{openNew\}/,
    );
    expect(client).toContain("DayControlCenter");
    expect(client).toContain("filterAppointmentsForBoard");
    expect(client).toContain("boardFilters.staffId");
    expect(client).toContain("inspectDay");
    expect(client).toContain('setView("day")');
  });
});
