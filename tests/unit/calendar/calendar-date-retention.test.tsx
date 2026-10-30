import { type ComponentProps, type ReactElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CalendarPage from "@/app/(dashboard)/dashboard/calendar/page";
import { ReceptionWorkspace } from "@/components/reception/reception-workspace";
import { location, service, staff } from "./cal01-fixtures";

// Real CalendarPage -> keyed ReceptionWorkspace -> CalendarClient -> Toolbar/views.
// Only data/actions and unrelated dialog subtrees are substituted. No hosted client.
const boundary = vi.hoisted(() => ({
  replace: vi.fn(), push: vi.fn(),
  appointments: vi.fn().mockResolvedValue([]),
  mutation: vi.fn(() => { throw new Error("Navigation must not mutate data"); }),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: boundary.replace, push: boundary.push, refresh: vi.fn() }) }));
vi.mock("@/providers/toast-provider", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "biz", timezone: "America/Toronto", currency: "cad" }) }));
vi.mock("@/lib/actions/location", () => ({
  getLocations: async () => [location], getLocationScope: async () => ({ mode: "single", locationId: "loc" }), getBookingIntervalMinutes: async () => 30,
}));
vi.mock("@/lib/actions/appointments", () => ({
  getAppointments: boundary.appointments,
  getDashboardStats: async () => ({ todayCount: 0, yesterdayCount: 0, lastWeekSameDayCount: 0, weekCount: 0, previousWeekCount: 0, pendingConfirmations: 0, upcoming: [], customerCount: 0 }),
  rescheduleAppointment: boundary.mutation, resizeAppointment: boundary.mutation, setAppointmentStatus: boundary.mutation,
}));
vi.mock("@/lib/actions/services", () => ({ getOperatorServiceCatalog: async () => [service] }));
vi.mock("@/lib/actions/staff", () => ({ getStaff: async () => [staff] }));
vi.mock("@/lib/actions/customers", () => ({ getCustomers: async () => [] }));
vi.mock("@/lib/actions/business-management", () => ({ listTaxRates: async () => [] }));
vi.mock("@/lib/actions/notifications", () => ({ getWaitlistEntries: async () => [] }));
vi.mock("@/lib/actions/day-overlays", () => ({ getStaffDayOverlays: async () => [] }));
vi.mock("@/lib/actions/morning-brief", () => ({ getMorningBrief: async () => ({
  todayAppointments: 0, staffWorking: 1, availableSlots: 0, pendingConfirmations: 0, noShows: 0, waitlistCount: 0,
  summer: { bookingsToday: 0, reschedulesToday: 0, confirmationsToday: 0 },
}) }));
vi.mock("@/lib/actions/booking-engine", () => ({ duplicateAppointment: boundary.mutation, undoLastAppointmentChange: boundary.mutation }));
vi.mock("@/lib/actions/scheduling", () => ({ getDashboardAvailableSlots: async () => [] }));
vi.mock("@/components/booking-sheet", () => ({ BookingSheet: () => null }));
vi.mock("@/components/day-view/appointment-drawer", () => ({ AppointmentDrawer: () => null }));
vi.mock("@/components/reception/reception-panel", () => ({ ReceptionPanel: () => null }));
vi.mock("@/components/reception/quick-action-dialogs", () => ({ BlockTimeDialog: () => null, InternalNoteDialog: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-26T12:00:00Z"));
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { expect(boundary.mutation).not.toHaveBeenCalled(); cleanup(); vi.useRealTimers(); });

async function response(url: string) {
  const params = Object.fromEntries(new URL(url, "http://localhost").searchParams);
  const page = await CalendarPage({ searchParams: Promise.resolve(params) });
  const workspace = page.props.children.find((child: ReactElement) => child.type === ReceptionWorkspace) as ReactElement<ComponentProps<typeof ReceptionWorkspace>>;
  expect(workspace.key).toBe(`America/Toronto:${params.date}:${params.view}`);
  expect(workspace.props.initialDate).toBe(params.date);
  expect(workspace.props.scope).toEqual({ mode: "single", locationId: "loc" });
  return page;
}
async function host(date = "2026-10-26", view = "day") {
  let url = `/dashboard/calendar?view=${view}&date=${date}`;
  const mounted = render(await response(url));
  async function settle(expectedView: string, expectedDate: string, action: () => void, method: "replace" | "push" = "replace") {
    const priorInput = document.querySelector("#calendar-jump-date");
    const priorUrl = url;
    boundary[method].mockClear();
    action();
    expect(boundary[method]).toHaveBeenCalledOnce();
    url = boundary[method].mock.calls[0][0];
    expect(url).toBe(`/dashboard/calendar?view=${expectedView}&date=${expectedDate}`);
    if (method === "replace") expect(boundary.replace).toHaveBeenLastCalledWith(url, { scroll: false });
    // Actual server component consumes the serialized URL and supplies its real key.
    // React reconciles this returned tree, rather than the harness changing a key.
    mounted.rerender(await response(url));
    expect(document.querySelector("#calendar-jump-date")).toHaveValue(expectedDate);
    expect(screen.getByRole("combobox", { name: "Calendar view" })).toHaveValue(expectedView);
    if (url !== priorUrl) expect(document.querySelector("#calendar-jump-date")).not.toBe(priorInput);
  }
  return {
    switchTo: (view: string, date: string) => settle(view, date, () => fireEvent.change(screen.getByRole("combobox", { name: "Calendar view" }), { target: { value: view } })),
    today: (view: string) => settle(view, "2026-10-26", () => fireEvent.click(screen.getByRole("button", { name: "Today", exact: true }))),
    pick: (view: string, date: string) => settle(view, date, () => fireEvent.change(document.querySelector("#calendar-jump-date")!, { target: { value: date } })),
    step: (view: string, date: string, direction: "Next" | "Previous") => settle(view, date, () => fireEvent.click(screen.getByRole("button", { name: direction, exact: true }))),
    monthDay: (date: string, label: string) => settle("day", date, () => fireEvent.click(screen.getByRole("button", { name: label, exact: true })), "push"),
  };
}

it("retains Today through repeated Day/Week/Day server responses and keyed remounts", async () => {
  const calendar = await host("2026-10-24");
  await calendar.today("day");
  for (let round = 0; round < 3; round++) {
    await calendar.switchTo("week", "2026-10-26");
    expect(screen.getByRole("heading", { name: "Oct 25 – Oct 31, 2026" })).toBeVisible();
    expect(boundary.appointments).toHaveBeenLastCalledWith("2026-10-25T04:00:00.000Z", "2026-11-08T04:59:59.999Z");
    await calendar.switchTo("day", "2026-10-26");
    expect(screen.getByRole("heading", { name: "Monday, Oct 26" })).toBeVisible();
    expect(boundary.appointments).toHaveBeenLastCalledWith("2026-10-26T04:00:00.000Z", "2026-10-27T03:59:59.999Z");
  }
});

it.each(["month", "agenda", "timeline", "employees", "locations", "resource"])("retains the selected date through %s and back to Day", async view => {
  const calendar = await host();
  await calendar.switchTo(view, "2026-10-26");
  await calendar.switchTo("day", "2026-10-26");
  expect(screen.getByRole("heading", { name: "Monday, Oct 26" })).toBeVisible();
});
it.each(["week", "month", "agenda"])("honors Today and explicit date selection in %s", async view => {
  const calendar = await host("2026-09-12", view);
  await calendar.today(view);
  await calendar.pick(view, "2026-10-28");
  await calendar.switchTo("day", "2026-10-28");
});
it("retains the weekday when stepping weeks across DST and the year boundary", async () => {
  const calendar = await host("2026-10-26", "week");
  await calendar.step("week", "2026-11-02", "Next");
  await calendar.step("week", "2026-10-26", "Previous");
  await calendar.pick("week", "2026-12-28");
  await calendar.step("week", "2027-01-04", "Next");
  await calendar.switchTo("day", "2027-01-04");
});
it("keeps date-fns month-end clamping and intentional Month day selection", async () => {
  const calendar = await host("2026-01-31", "month");
  await calendar.step("month", "2026-02-28", "Next");
  await calendar.step("month", "2026-01-28", "Previous");
  await calendar.pick("month", "2026-10-26");
  await calendar.monthDay("2026-10-28", "Open October 28");
});
it.each(["2026-10-25", "2026-12-31", "2027-01-01", "2026-03-08", "2026-11-01"])("retains boundary civil date %s through every range view", async date => {
  const calendar = await host(date);
  for (const view of ["week", "month", "agenda", "day"]) await calendar.switchTo(view, date);
});

describe("unchanged server query boundaries", () => {
  it.each([
    ["week", "2026-10-26", "2026-10-25", "2026-10-25T04:00:00.000Z", "2026-11-08T04:59:59.999Z"],
    ["agenda", "2026-10-26", "2026-10-25", "2026-10-25T04:00:00.000Z", "2026-11-08T04:59:59.999Z"],
    ["month", "2026-10-26", "2026-10-01", "2026-10-01T04:00:00.000Z", "2026-11-01T03:59:59.999Z"],
    ["week", "2026-03-09", "2026-03-08", "2026-03-08T05:00:00.000Z", "2026-03-22T03:59:59.999Z"],
    ["month", "2026-11-15", "2026-11-01", "2026-11-01T04:00:00.000Z", "2026-12-01T04:59:59.999Z"],
  ])("%s selected %s equals normalized %s", async (view, selected, normalized, start, end) => {
    await response(`/dashboard/calendar?view=${view}&date=${selected}`);
    expect(boundary.appointments).toHaveBeenLastCalledWith(start, end);
    await response(`/dashboard/calendar?view=${view}&date=${normalized}`);
    expect(boundary.appointments).toHaveBeenLastCalledWith(start, end);
  });
});
