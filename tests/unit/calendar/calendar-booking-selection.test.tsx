import { useState, type ComponentProps } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { BookingSheet } from "@/components/booking-sheet/booking-sheet";
import { location, customer, service, staff } from "./cal01-fixtures";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  preview: vi.fn().mockResolvedValue({
    slots: [{ start: "2026-10-10T16:00:00.000Z", end: "2026-10-10T16:30:00.000Z" }],
    alternativeStaff: [],
    alternativeDays: [],
  }),
  eligible: vi.fn(),
  toast: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  prefs: { locationId: "loc", serviceId: "svc", staffId: "staff" },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
  usePathname: () => "/dashboard/calendar",
}));
vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock("@/lib/actions/appointments", () => ({
  createAppointment: mocks.create,
  updateAppointment: mocks.update,
  cancelAppointment: vi.fn(),
  setAppointmentStatus: vi.fn(),
  rescheduleAppointment: vi.fn(),
  resizeAppointment: vi.fn(),
}));
vi.mock("@/lib/actions/business-management", () => ({
  listPackages: async () => [],
}));
vi.mock("@/lib/actions/booking-engine", () => ({
  duplicateAppointment: vi.fn(),
  undoLastAppointmentChange: vi.fn(),
}));
vi.mock("@/lib/actions/booking-sheet", () => ({
  getBookingSheetCustomerSnapshot: async () => null,
  previewBookingSheetAvailability: mocks.preview,
}));
vi.mock("@/lib/actions/staff", () => ({
  getEligibleStaffForBooking: mocks.eligible,
}));
vi.mock("@/lib/actions/customers", () => ({
  quickCreateCustomer: vi.fn(),
}));
vi.mock("@/lib/actions/scheduling", () => ({
  getDashboardAvailableSlots: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/reception/use-booking-preferences", () => ({
  useBookingPreferences: () => mocks.prefs,
  writeBookingPreferences: vi.fn(),
}));
vi.mock("@/components/booking-sheet/booking-communications-section", () => ({
  BookingCommunicationsSection: () => null,
}));
vi.mock("@/components/booking-sheet/cancel-appointment-dialog", () => ({
  CancelAppointmentDialog: () => null,
}));
vi.mock("@/components/booking-sheet/timeline-section", () => ({
  TimelineSection: () => null,
}));
vi.mock("@/components/booking-sheet/summer-assistant", () => ({
  SummerAssistant: () => null,
}));

vi.mock("@/components/reception/reception-panel", () => ({
  ReceptionPanel: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const [draft, setDraft] = useState("");
    return <aside><button onClick={() => onOpenChange(!open)}>Toggle reception</button><input aria-label="Retained reception draft" hidden={!open} value={draft} onChange={e => setDraft(e.target.value)} /></aside>;
  },
}));
vi.mock("@/components/reception/quick-action-dialogs", () => ({ BlockTimeDialog: () => null, InternalNoteDialog: () => null }));
vi.mock("@/components/day-view/appointment-drawer", () => ({
  AppointmentDrawer: ({ open }: { open: boolean }) => open ? <div role="dialog" aria-label="Appointment details" /> : null,
}));

function renderSheet(overrides: Partial<ComponentProps<typeof BookingSheet>> = {}) {
  return render(<BookingSheet open onClose={vi.fn()} onSuccess={vi.fn()}
    services={[service]} staff={[staff]} customers={[customer]} locations={[location]}
    packages={[]} scope={{ mode: "single", locationId: "loc" }}
    calendarSelection draft={{ date: "2026-10-10" }} timezone="America/Toronto" {...overrides} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.preview.mockResolvedValue({ slots: [{ start: "2026-10-10T16:30:00.000Z", end: "2026-10-10T17:00:00.000Z" }], alternativeStaff: [], alternativeDays: [] });
  mocks.eligible.mockResolvedValue([staff]);
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("Calendar explicitly selected booking context", () => {
  it("ignores saved service/staff preferences and does not invent a date-only time", async () => {
    renderSheet();
    expect(screen.getByLabelText("Service")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Choose a service" })).toBeInTheDocument();
    expect(document.querySelector('[name="staff_id"]')).toHaveValue("");
    expect(document.querySelector('[name="start_time"]')).toHaveValue("");
    expect(screen.getByRole("button", { name: "Confirm appointment" })).toBeDisabled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("preserves the clicked instant, named column and scoped location until service selection", async () => {
    renderSheet({ defaultDate: new Date("2026-10-10T16:30:00.000Z"), defaultStaffId: "staff" });
    expect(screen.getByLabelText("Service")).toHaveValue("");
    expect(document.querySelector('[name="staff_id"]')).toHaveValue("staff");
    expect(document.querySelector('[name="start_time"]')).toHaveValue("2026-10-10T16:30:00.000Z");
    await userEvent.selectOptions(screen.getByLabelText("Service"), "svc");
    await waitFor(() => expect(mocks.preview).toHaveBeenCalledWith(expect.objectContaining({ serviceId: "svc", staffId: "staff", locationId: "loc", date: "2026-10-10" })));
    expect(document.querySelector('[name="start_time"]')).toHaveValue("2026-10-10T16:30:00.000Z");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("does not resolve All Locations from preferences and clears incompatible service on location change", async () => {
    const second = { ...location, id: "loc2", name: "Other Location", is_default: false };
    const otherService = { ...service, id: "svc2", name: "Other Service", location_id: "loc2", service_locations: [{ location_id: "loc2" }] };
    renderSheet({ locations: [location, second], services: [service, otherService], scope: { mode: "all" } });
    expect(screen.getByLabelText("Location")).toHaveValue("");
    await userEvent.selectOptions(screen.getByLabelText("Location"), "loc");
    expect(screen.getByLabelText("Service")).toHaveValue("");
    await userEvent.selectOptions(screen.getByLabelText("Service"), "svc");
    await userEvent.selectOptions(screen.getByLabelText("Location"), "loc2");
    expect(screen.getByLabelText("Service")).toHaveValue("");
    expect(screen.getByRole("option", { name: /Other Service/ })).toBeInTheDocument();
  });
  it("retains explicit service context and legacy preference behavior outside Calendar", () => {
    const { unmount } = renderSheet({ draft: { date: "2026-10-10", serviceId: "svc", staffId: "staff" } });
    expect(screen.getByLabelText("Service")).toHaveValue("svc");
    unmount();
    renderSheet({ calendarSelection: false });
    expect(screen.getByLabelText("Service")).toHaveValue("svc");
    expect(document.querySelector('[name="staff_id"]')).toHaveValue("staff");
  });
  it("does not enable confirmation while clicked-time availability is unresolved or rejected", async () => {
    let resolve!: (value: { slots: []; alternativeStaff: []; alternativeDays: [] }) => void;
    mocks.preview.mockReturnValue(new Promise(r => { resolve = r; }));
    renderSheet({ draft: { customerId: "cust", serviceId: "svc", staffId: "staff", date: "2026-10-10", startIso: "2026-10-10T16:30:00.000Z" } });
    await waitFor(() => expect(mocks.preview).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Confirm appointment" })).toBeDisabled();
    await act(async () => resolve({ slots: [], alternativeStaff: [], alternativeDays: [] }));
    expect(screen.getByRole("button", { name: "Confirm appointment" })).toBeDisabled();
    fireEvent.submit(screen.getByRole("button", { name: "Confirm appointment" }).closest("form")!);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

function renderCalendar(overrides: Partial<ComponentProps<typeof CalendarClient>> = {}) {
  return render(<CalendarClient services={[service]} staff={[staff]} customers={[customer]} locations={[location]}
    appointments={[]} initialDate="2026-10-10" initialView="day" timezone="America/Toronto"
    scope={{ mode: "single", locationId: "loc" }} {...overrides} />);
}
describe("Calendar routes into the real Booking Sheet", () => {
  it("opens an exact half-hour Day slot with named staff, without the Reception panel", async () => {
    const { container } = renderCalendar();
    expect(screen.getByLabelText("Retained reception draft")).not.toBeVisible();
    const slots = container.querySelectorAll('[data-staff-column="staff"] button');
    const noon = slots[5]; // Operational day starts at 07:00.
    vi.spyOn(noon, "getBoundingClientRect").mockReturnValue({ top: 0, height: 100 } as DOMRect);
    fireEvent.click(noon, { clientY: 50 });
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(document.querySelector('[name="start_time"]')).toHaveValue("2026-10-10T16:30:00.000Z");
    expect(document.querySelector('[name="staff_id"]')).toHaveValue("staff");
    expect(screen.getByLabelText("Service")).toHaveValue("");
    expect(document.querySelector('[name="location_id"]')).toHaveValue("loc");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("keeps Month date navigation distinct from keyboard creation with no time", async () => {
    renderCalendar({ initialView: "month" });
    await userEvent.click(screen.getByRole("button", { name: "Open October 12", exact: true }));
    expect(mocks.push).toHaveBeenCalledWith("/dashboard/calendar?view=day&date=2026-10-12");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    screen.getByRole("button", { name: "Add appointment on October 12, 2026", exact: true }).focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(document.querySelector('[name="date"]')).toHaveValue("2026-10-12");
    expect(document.querySelector('[name="start_time"]')).toHaveValue("");
    expect(screen.getByLabelText("Service")).toHaveValue("");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("offers contextual mobile Day creation without a time or staff fallback", async () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: (query: string) => ({ matches: query === "(max-width: 767px)", addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
    renderCalendar();
    await userEvent.click(screen.getByRole("button", { name: "Add appointment on 2026-10-10" }));
    expect(document.querySelector('[name="date"]')).toHaveValue("2026-10-10");
    expect(document.querySelector('[name="start_time"]')).toHaveValue("");
    expect(document.querySelector('[name="staff_id"]')).toHaveValue("");
  });
  it("retains the mounted Reception draft across presentation toggles", async () => {
    renderCalendar();
    await userEvent.click(screen.getByRole("button", { name: "Toggle reception" }));
    await userEvent.type(screen.getByLabelText("Retained reception draft"), "Synthetic draft");
    await userEvent.click(screen.getByRole("button", { name: "Toggle reception" }));
    await userEvent.click(screen.getByRole("button", { name: "Toggle reception" }));
    expect(screen.getByLabelText("Retained reception draft")).toHaveValue("Synthetic draft");
  });
  it("existing Month appointments open details and do not create a booking", async () => {
    const appointment = { id: "existing", business_id: "biz", customer_id: "cust", service_id: "svc", staff_id: "staff", location_id: "loc", customer, service, staff,
      start_time: "2026-10-10T16:30:00.000Z", end_time: "2026-10-10T17:00:00.000Z", status: "confirmed" as const, notes: null, created_at: "2026-01-01", updated_at: "2026-01-01" };
    renderCalendar({ initialView: "month", appointments: [appointment] });
    await userEvent.click(screen.getByRole("button", { name: /12:30 PM Test Customer/ }));
    expect(screen.getByRole("dialog", { name: "Appointment details" })).toBeVisible();
    expect(screen.queryByLabelText("Service")).not.toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
