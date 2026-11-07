import { type ComponentProps } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { BookingSheet } from "@/components/booking-sheet/booking-sheet";
import { location, customer, service, staff } from "../calendar/cal01-fixtures";
import type { AppointmentWithRelations } from "@/lib/types/booking";
const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), status: vi.fn(), preview: vi.fn().mockResolvedValue({ slots: [], alternativeStaff: [], alternativeDays: [] }), eligible: vi.fn(), toast: vi.fn(), refresh: vi.fn(), push: vi.fn(), prefs: { locationId: "loc", serviceId: "svc", staffId: "staff" } }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }), usePathname: () => "/dashboard/calendar" }));
vi.mock("@/providers/toast-provider", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/lib/actions/appointments", () => ({ createAppointment: mocks.create, updateAppointment: mocks.update, setAppointmentStatus: mocks.status, cancelAppointment: vi.fn(), rescheduleAppointment: vi.fn(), resizeAppointment: vi.fn() }));
vi.mock("@/lib/actions/business-management", () => ({ listPackages: async () => [] }));
vi.mock("@/lib/actions/booking-engine", () => ({ duplicateAppointment: vi.fn(), undoLastAppointmentChange: vi.fn() }));
vi.mock("@/lib/actions/booking-sheet", () => ({ getBookingSheetCustomerSnapshot: async () => null, previewBookingSheetAvailability: mocks.preview }));
vi.mock("@/lib/actions/staff", () => ({ getEligibleStaffForBooking: mocks.eligible }));
vi.mock("@/lib/actions/customers", () => ({ quickCreateCustomer: vi.fn(), getCustomers: async () => [], getCustomerProfile: async () => null }));
vi.mock("@/lib/actions/scheduling", () => ({ getDashboardAvailableSlots: async () => [] }));
vi.mock("@/lib/actions/reception", () => ({ getNextAvailableSlot: async () => null }));
vi.mock("@/lib/actions/notifications", () => ({ removeFromWaitlist: vi.fn() }));
vi.mock("@/lib/actions/appointment-activity", () => ({ loadAppointmentFinancialActivity: async () => null }));
vi.mock("@/lib/reception/use-booking-preferences", () => ({ useBookingPreferences: () => mocks.prefs, writeBookingPreferences: vi.fn() }));
vi.mock("@/components/booking-sheet/customer-section", () => ({ CustomerSection: () => null }));
vi.mock("@/components/booking-sheet/availability-section", () => ({ AvailabilitySection: () => null }));
vi.mock("@/components/booking-sheet/booking-communications-section", () => ({ BookingCommunicationsSection: () => null }));
vi.mock("@/components/booking-sheet/cancel-appointment-dialog", () => ({ CancelAppointmentDialog: () => null }));
vi.mock("@/components/booking-sheet/payments-section", () => ({ PaymentsSection: () => null }));
vi.mock("@/components/booking-sheet/timeline-section", () => ({ TimelineSection: () => null }));
vi.mock("@/components/booking-sheet/summer-assistant", () => ({ SummerAssistant: () => null }));
vi.mock("@/components/reception/quick-action-dialogs", () => ({ BlockTimeDialog: () => null, InternalNoteDialog: () => null }));

const appointment = { id: "historical", business_id: "biz", customer_id: customer.id, service_id: service.id,
  staff_id: staff.id, location_id: location.id, start_time: "2026-10-24T14:00:00.000Z", end_time: "2026-10-24T15:15:00.000Z",
  status: "confirmed", notes: "Historical notes", price_cents: 10000, amount_paid_cents: 0,
  customer, service, staff, location } as AppointmentWithRelations;
const common = { services: [service], staff: [staff], customers: [customer], locations: [location],
  timezone: "America/Toronto", scope: { mode: "single" as const, locationId: location.id } };
const close = vi.fn(), success = vi.fn();
function sheet(overrides: Partial<ComponentProps<typeof BookingSheet>> = {}) {
  return render(<BookingSheet {...common} open appointment={appointment} packages={[]} onClose={close} onSuccess={success} {...overrides} />);
}
function calendar(overrides: Partial<ComponentProps<typeof CalendarClient>> = {}) {
  return render(<CalendarClient {...common} appointments={[appointment]} initialDate="2026-10-24" initialView="day"
    focusAppointmentId={appointment.id} showReceptionPanel={false} {...overrides} />);
}
function viewport(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (query: string) => ({
    matches: query.includes("max-width") && width < 768, media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }) });
}
beforeEach(() => {
  vi.clearAllMocks(); viewport(1440);
  mocks.status.mockResolvedValue({ success: "Changes saved.", appointmentId: appointment.id });
  mocks.update.mockResolvedValue({ error: "Appointment must be in the future" });
  mocks.eligible.mockResolvedValue([staff]);
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); });

// JSdom responsive-branch interaction coverage, not physical-device visual acceptance.
describe.each([["desktop", 1440], ["tablet", 834], ["mobile", 390]] as const)("N06 %s completion controls", (_name, width) => {
  it("Booking Sheet quick Complete uses only the existing status action", async () => {
    viewport(width); sheet();
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Complete", exact: true }));
    await waitFor(() => expect(mocks.status).toHaveBeenCalledExactlyOnceWith(appointment.id, "completed"));
    await waitFor(() => expect(success).toHaveBeenCalledOnce()); expect(close).toHaveBeenCalledOnce();
    expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("real Appointment Details → Calendar callback → status action keeps the same meaning", async () => {
    viewport(width); calendar();
    await userEvent.click(screen.getByRole("button", { name: "Complete", exact: true }));
    await waitFor(() => expect(mocks.status).toHaveBeenCalledExactlyOnceWith(appointment.id, "completed"));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.toast).toHaveBeenCalledWith("Changes saved.", "success");
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
it("quick Complete reports a server refusal and keeps the Booking Sheet open", async () => {
  const message = "Appointments cannot be completed before their scheduled start.";
  mocks.status.mockResolvedValue({ error: message }); sheet();
  fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Complete", exact: true }));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(message, "error"));
  expect(close).not.toHaveBeenCalled(); expect(success).not.toHaveBeenCalled();
});
it("Calendar refreshes after a rejected completion so optimistic state is reconciled", async () => {
  mocks.status.mockResolvedValue({ error: "Appointment changed or access is no longer available. Reload before trying again." });
  calendar(); await userEvent.click(screen.getByRole("button", { name: "Complete", exact: true }));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining("Reload"), "error"));
  expect(mocks.refresh).toHaveBeenCalled();
});
it("cancelled appointment has no Booking Sheet completion and a disabled Details completion", async () => {
  const cancelled = { ...appointment, status: "cancelled" as const };
  const rendered = sheet({ appointment: cancelled });
  fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
  expect(screen.queryByRole("menuitem", { name: "Complete", exact: true })).not.toBeInTheDocument();
  rendered.unmount(); calendar({ appointments: [cancelled] });
  expect(screen.getByRole("button", { name: "Complete", exact: true })).toBeDisabled();
  expect(mocks.status).not.toHaveBeenCalled();
});
it("status-dropdown Save preserves wider edits and calls updateAppointment, never the quick action", async () => {
  sheet(); await userEvent.click(screen.getByRole("button", { name: /Advanced/ }));
  await userEvent.selectOptions(screen.getByLabelText("Status"), "completed");
  fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Mixed edit retained" } });
  fireEvent.submit(document.querySelector("form")!);
  await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
  const form = mocks.update.mock.calls[0][1] as FormData;
  expect(form.get("status")).toBe("completed"); expect(form.get("notes")).toBe("Mixed edit retained");
  expect(form.get("start_time")).toBe(appointment.start_time);
  expect(mocks.status).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
});
