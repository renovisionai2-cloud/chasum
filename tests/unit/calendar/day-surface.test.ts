import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DAY_LANE_MIN_PX,
  dayLaneFlexStyle,
  hasFixedCalendarWidthConstraint,
  hasUnassignedAppointmentsOnDay,
  isDayViewIdle,
  isPrimaryCalendarView,
  isSecondaryCalendarView,
  shouldMountReceptionRail,
  shouldShowMorningBrief,
  shouldShowUnassignedLane,
  staffIdsForDayLanes,
} from "@/lib/calendar/day-surface";
import { isWidePortalPath } from "@/lib/dashboard/nav";

describe("Day View operating surface", () => {
  it("treats idle Day View as schedule-first (no booking, appointment, or rail)", () => {
    expect(
      isDayViewIdle({
        view: "day",
        bookingOpen: false,
        appointmentOpen: false,
        receptionPanelOpen: false,
      }),
    ).toBe(true);
    expect(
      isDayViewIdle({
        view: "day",
        bookingOpen: true,
        appointmentOpen: false,
        receptionPanelOpen: false,
      }),
    ).toBe(false);
    expect(
      isDayViewIdle({
        view: "week",
        bookingOpen: false,
        appointmentOpen: false,
        receptionPanelOpen: false,
      }),
    ).toBe(false);
  });

  it("does not mount a persistent Reception rail on Day View", () => {
    expect(
      shouldMountReceptionRail({
        view: "day",
        receptionPanelOpen: true,
        showReceptionPanel: true,
      }),
    ).toBe(false);
    expect(
      shouldMountReceptionRail({
        view: "week",
        receptionPanelOpen: true,
        showReceptionPanel: true,
      }),
    ).toBe(true);
    expect(
      shouldMountReceptionRail({
        view: "week",
        receptionPanelOpen: false,
        showReceptionPanel: true,
      }),
    ).toBe(false);
  });

  it("hides Morning Brief on Day View only", () => {
    expect(shouldShowMorningBrief("day")).toBe(false);
    expect(shouldShowMorningBrief("week")).toBe(true);
  });

  it("keeps Day/Week/Month primary and secondary views reachable", () => {
    expect(isPrimaryCalendarView("day")).toBe(true);
    expect(isPrimaryCalendarView("week")).toBe(true);
    expect(isPrimaryCalendarView("month")).toBe(true);
    expect(isSecondaryCalendarView("agenda")).toBe(true);
    expect(isSecondaryCalendarView("timeline")).toBe(true);
    expect(isSecondaryCalendarView("employees")).toBe(true);
    expect(isSecondaryCalendarView("locations")).toBe(true);
    expect(isSecondaryCalendarView("resource")).toBe(true);
    expect(isPrimaryCalendarView("agenda")).toBe(false);
  });

  it("hides empty Unassigned lane unless filter or existing appointments require it", () => {
    expect(
      shouldShowUnassignedLane({ hasUnassignedAppointments: false }),
    ).toBe(false);
    expect(
      shouldShowUnassignedLane({ hasUnassignedAppointments: true }),
    ).toBe(true);
    expect(
      shouldShowUnassignedLane({
        hasUnassignedAppointments: false,
        staffFilter: "unassigned",
      }),
    ).toBe(true);
  });

  it("detects existing unassigned appointments on the business day", () => {
    const date = new Date("2026-08-05T16:00:00.000Z");
    expect(
      hasUnassignedAppointmentsOnDay(
        [
          {
            staff_id: null,
            start_time: "2026-08-05T18:00:00.000Z",
            status: "confirmed",
          },
        ],
        date,
        "America/Toronto",
      ),
    ).toBe(true);
    expect(
      hasUnassignedAppointmentsOnDay(
        [
          {
            staff_id: "s1",
            start_time: "2026-08-05T18:00:00.000Z",
            status: "confirmed",
          },
        ],
        date,
        "America/Toronto",
      ),
    ).toBe(false);
  });

  it("scopes employee lanes by staff filter", () => {
    expect(
      staffIdsForDayLanes({
        activeStaffIds: ["a", "b"],
        staffFilter: "all",
      }),
    ).toEqual(["a", "b"]);
    expect(
      staffIdsForDayLanes({
        activeStaffIds: ["a", "b"],
        staffFilter: "b",
      }),
    ).toEqual(["b"]);
    expect(
      staffIdsForDayLanes({
        activeStaffIds: ["a", "b"],
        staffFilter: "unassigned",
      }),
    ).toEqual([]);
  });

  it("CalendarClient defaults the reception panel closed and Day View does not mount it", () => {
    const client = readFileSync(
      join(process.cwd(), "components/calendar/calendar-client.tsx"),
      "utf8",
    );
    expect(client).toMatch(/useState\(false\)/);
    expect(client).toMatch(/shouldMountReceptionRail/);
    expect(client).toMatch(/data-day-idle/);
    expect(client).toContain("openNew()");
    expect(client).toContain("openDrawer");
  });

  it("toolbar separates primary views from More secondary/contextual actions", () => {
    const toolbar = readFileSync(
      join(process.cwd(), "components/calendar/calendar-toolbar.tsx"),
      "utf8",
    );
    expect(toolbar).toMatch(/PRIMARY_TABS/);
    expect(toolbar).toMatch(/More calendar actions/);
    expect(toolbar).toMatch(/data-toolbar-hierarchy="primary-secondary"/);
    expect(toolbar).toMatch(/New Appointment/);
    expect(toolbar).not.toMatch(/viewTabs = \[/);
  });
});

describe("Day View density and width", () => {
  it("distributes lanes for 1 / 3 / many employees without a 20rem cap", () => {
    const solo = dayLaneFlexStyle(1);
    const three = dayLaneFlexStyle(3);
    const many = dayLaneFlexStyle(12);
    expect(solo.minWidth).toBe(DAY_LANE_MIN_PX);
    expect(three.minWidth).toBe(DAY_LANE_MIN_PX);
    expect(many.minWidth).toBe(DAY_LANE_MIN_PX);
    expect(solo.maxWidth).toBeNull();
    expect(three.maxWidth).toBeNull();
    expect(many.maxWidth).toBeNull();
    expect(three.flexGrow).toBe(1);
    expect(many.flexShrink).toBe(0);
  });

  it("flags permanent fixed-width calendar constraints", () => {
    expect(hasFixedCalendarWidthConstraint("mx-auto w-full max-w-6xl")).toBe(
      true,
    );
    expect(hasFixedCalendarWidthConstraint("min-w-[12.5rem] max-w-[20rem]")).toBe(
      true,
    );
    expect(hasFixedCalendarWidthConstraint("w-full max-w-none")).toBe(false);
  });

  it("keeps Reception/Calendar on the wide portal shell", () => {
    expect(isWidePortalPath("/dashboard/calendar")).toBe(true);
    expect(isWidePortalPath("/dashboard/calendar?view=day")).toBe(true);
  });

  it("Day View canvas is fluid and lanes are not hard-capped at 20rem", () => {
    const day = readFileSync(
      join(process.cwd(), "components/day-view/day-control-center.tsx"),
      "utf8",
    );
    expect(day).toContain('data-day-canvas="fluid"');
    expect(day).toContain("w-full max-w-none");
    expect(day).not.toMatch(/max-w-\[20rem\]/);
    expect(day).toContain("dayLaneFlexStyle");
  });
});
