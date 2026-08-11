/**
 * Phase 5.2 Day View operating-surface rules.
 * Schedule-first: contextual workspaces must not permanently compress the calendar.
 */

import { isSameBusinessCalendarDay } from "@/lib/business/datetime";
import type { CalendarView } from "@/lib/types/booking";

export const PRIMARY_CALENDAR_VIEWS = ["day", "week", "month"] as const;
export const SECONDARY_CALENDAR_VIEWS = [
  "agenda",
  "timeline",
  "employees",
  "locations",
  "resource",
] as const;

export type PrimaryCalendarView = (typeof PRIMARY_CALENDAR_VIEWS)[number];
export type SecondaryCalendarView = (typeof SECONDARY_CALENDAR_VIEWS)[number];

export function isPrimaryCalendarView(
  view: CalendarView,
): view is PrimaryCalendarView {
  return (PRIMARY_CALENDAR_VIEWS as readonly string[]).includes(view);
}

export function isSecondaryCalendarView(
  view: CalendarView,
): view is SecondaryCalendarView {
  return (SECONDARY_CALENDAR_VIEWS as readonly string[]).includes(view);
}

/**
 * Idle Day View = no booking/appointment workspace and no reception rail.
 * The schedule must consume near-full content width.
 */
export function isDayViewIdle(input: {
  view: CalendarView;
  bookingOpen?: boolean;
  appointmentOpen?: boolean;
  receptionPanelOpen?: boolean;
}): boolean {
  return (
    input.view === "day" &&
    !input.bookingOpen &&
    !input.appointmentOpen &&
    !input.receptionPanelOpen
  );
}

/**
 * Day View never mounts a persistent Reception rail.
 * Booking / appointment use overlay workspaces (Chapter 4 + management).
 * Non-day views may still use the existing panel when explicitly opened.
 */
export function shouldMountReceptionRail(input: {
  view: CalendarView;
  receptionPanelOpen?: boolean;
  showReceptionPanel?: boolean;
}): boolean {
  if (!input.showReceptionPanel) return false;
  if (input.view === "day") return false;
  return Boolean(input.receptionPanelOpen);
}

export function shouldShowMorningBrief(view: CalendarView): boolean {
  return view !== "day";
}

/**
 * Empty Unassigned must not compete equally with named employee lanes
 * while unassigned creation remains gated.
 * Show the lane only when existing unassigned appointments exist,
 * or the employee filter is explicitly Unassigned.
 */
export function shouldShowUnassignedLane(input: {
  hasUnassignedAppointments: boolean;
  staffFilter?: string | null;
}): boolean {
  if (input.staffFilter === "unassigned") return true;
  return input.hasUnassignedAppointments;
}

export function hasUnassignedAppointmentsOnDay(
  appointments: Array<{
    staff_id?: string | null;
    start_time: string;
    status?: string | null;
  }>,
  date: Date,
  timeZone: string | null | undefined,
): boolean {
  return appointments.some(
    (a) =>
      !a.staff_id &&
      a.status !== "cancelled" &&
      isSameBusinessCalendarDay(a.start_time, date, timeZone),
  );
}

/** Scope employee lanes by the Day View staff filter. */
export function staffIdsForDayLanes(input: {
  activeStaffIds: string[];
  staffFilter?: string | null;
}): string[] {
  if (!input.staffFilter || input.staffFilter === "all") {
    return input.activeStaffIds;
  }
  if (input.staffFilter === "unassigned") return [];
  return input.activeStaffIds.filter((id) => id === input.staffFilter);
}
