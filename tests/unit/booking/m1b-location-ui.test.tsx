import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingSheet } from "@/components/booking-sheet/booking-sheet";
import { QuickAppointmentForm } from "@/components/reception/quick-appointment";
import type { OperatorServiceCatalogItem } from "@/lib/services/operator-catalog";
import type { Location } from "@/lib/types/booking";
import type { BookingDraft } from "@/lib/booking/booking-draft";
import type { AppointmentWithRelations, Customer, StaffWithServices } from "@/lib/types/booking";
const mocks = vi.hoisted(() => ({ prefs: { locationId: "A", serviceId: "shared", staffId: "employee" }, preview: vi.fn().mockResolvedValue({ slots: [], alternativeStaff: [], alternativeDays: [] }), slots: vi.fn().mockResolvedValue([]), eligible: vi.fn().mockResolvedValue([]), scopeWrite: vi.fn(), create: vi.fn().mockResolvedValue({ success: "Booked", appointmentId: "new" }), enable: vi.fn().mockResolvedValue({ success: "Enabled" }), refresh: vi.fn(), toast: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }), usePathname: () => "/dashboard/services" }));
vi.mock("@/providers/toast-provider", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/hooks/use-form-action", () => ({ useRefresh: () => mocks.refresh, useFormAction: vi.fn(), confirmDelete: vi.fn() }));
vi.mock("@/lib/actions/services", () => ({ enableServiceAtLocation: mocks.enable, createService: vi.fn(), updateService: vi.fn(), deleteService: vi.fn(), getServiceBlackouts: vi.fn(), getServiceLocationIds: vi.fn(), getServiceStaffAssignments: vi.fn(), upsertServiceBlackout: vi.fn(), deleteServiceBlackout: vi.fn() }));
vi.mock("@/lib/actions/appointments", () => ({ createAppointment: mocks.create, updateAppointment: vi.fn(), cancelAppointment: vi.fn(), setAppointmentStatus: vi.fn() }));
vi.mock("@/lib/actions/business-management", () => ({ listPackages: async () => [] }));
vi.mock("@/lib/actions/booking-engine", () => ({ duplicateAppointment: vi.fn() }));
vi.mock("@/lib/actions/booking-sheet", () => ({ getBookingSheetCustomerSnapshot: async () => null, previewBookingSheetAvailability: mocks.preview }));
vi.mock("@/lib/actions/staff", () => ({ getEligibleStaffForBooking: mocks.eligible }));
vi.mock("@/lib/actions/customers", () => ({ quickCreateCustomer: vi.fn() }));
vi.mock("@/lib/actions/scheduling", () => ({ getDashboardAvailableSlots: mocks.slots }));
vi.mock("@/lib/reception/use-booking-preferences", () => ({ useBookingPreferences: () => mocks.prefs, writeBookingPreferences: vi.fn() }));
vi.mock("@/components/services/service-categories-panel", () => ({ ServiceCategoriesPanel: () => null }));
vi.mock("@/components/booking-sheet/customer-section", () => ({ CustomerSection: () => null }));
vi.mock("@/components/booking-sheet/availability-section", () => ({ AvailabilitySection: () => null }));
vi.mock("@/components/booking-sheet/booking-communications-section", () => ({ BookingCommunicationsSection: () => null }));
vi.mock("@/components/booking-sheet/cancel-appointment-dialog", () => ({ CancelAppointmentDialog: () => null }));
vi.mock("@/components/booking-sheet/payments-section", () => ({ PaymentsSection: () => null }));
vi.mock("@/components/booking-sheet/timeline-section", () => ({ TimelineSection: () => null }));
vi.mock("@/components/booking-sheet/summer-assistant", () => ({ SummerAssistant: () => null }));

const locations = ["A", "B", "C"].map((id) => ({ id, name: `Location ${id}`, is_default: id === "A", is_active: true })) as Location[];
const services = [
  { id: "shared", name: "Shared consultation", location_id: "A", service_locations: [{ location_id: "B" }] },
  { id: "primary-only", name: "Primary only", location_id: "A", service_locations: [] },
].map((service) => ({ ...service, business_id: "business", is_active: true, duration_minutes: 30, price: 25, color: "#2563eb", online_booking: true, buffer_before_minutes: 0, buffer_after_minutes: 0 })) as OperatorServiceCatalogItem[];
vi.mock("@/lib/actions/location", () => ({ setLocationScope: mocks.scopeWrite }));
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });


const staff = [{ id: "employee", name: "Branch employee", is_active: true, location_id: "A", staff_locations: [{ location_id: "B" }], staff_services: [{ service_id: "shared" }] }] as StaffWithServices[];
const customers = [{ id: "customer", name: "Test customer", email: "test@example.test" }] as Customer[];
const common = { services, locations, staff, customers, onSuccess: vi.fn() };
const all = { mode: "all" } as const;

function hidden(name: string) { return document.querySelector(`input[name="${name}"]`); }
async function settleAvailability() { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 180)); }); }

describe("M1B Booking Sheet", () => {
  it("starts ALL empty despite saved preference, with honest Service/Employee state and no availability call", async () => {
    render(<BookingSheet {...common} scope={all} open onClose={vi.fn()} packages={[]} />);
    expect(screen.getByLabelText("Location")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Choose a location" })).toBeInTheDocument();
    expect(screen.getByLabelText("Service")).toBeDisabled();
    expect(screen.getByLabelText("Employee")).toBeDisabled();
    expect(screen.queryByRole("option", { name: "Branch employee" })).not.toBeInTheDocument();
    expect(hidden("service_id")).toHaveValue("");
    expect(document.querySelector('button[type="submit"]')).toBeDisabled();
    await settleAvailability();
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.slots).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "B" } });
    expect(screen.queryByRole("option", { name: "Choose a location" })).not.toBeInTheDocument();
    expect(hidden("location_id")).toHaveValue("B");
    await waitFor(() => expect(mocks.preview).toHaveBeenCalledWith(expect.objectContaining({ locationId: "B" })));
    expect(mocks.scopeWrite).not.toHaveBeenCalled();
    expect(all).toEqual({ mode: "all" });
  });
  it("resets a fresh ALL booking after named workspace scope changes", async () => {
    const { rerender } = render(<BookingSheet {...common} scope={{ mode: "single", locationId: "B" }} open onClose={vi.fn()} packages={[]} />);
    expect(hidden("location_id")).toHaveValue("B");
    rerender(<BookingSheet {...common} scope={all} open onClose={vi.fn()} packages={[]} />);
    expect(hidden("location_id")).toHaveValue("");
    await settleAvailability();
    expect(mocks.preview).not.toHaveBeenCalled();
  });
  it("retains explicit draft Location under ALL", () => {
    render(<BookingSheet {...common} scope={all} draft={{ locationId: "B" }} open onClose={vi.fn()} packages={[]} />);
    expect(hidden("location_id")).toHaveValue("B");
  });
  it("retains saved appointment Location and time for editing/rescheduling under ALL", () => {
    const appointment = { id: "saved", location_id: "B", service_id: "shared", staff_id: "employee", customer_id: "customer", start_time: "2026-10-01T12:00:00Z", end_time: "2026-10-01T12:30:00Z", status: "confirmed" } as AppointmentWithRelations;
    render(<BookingSheet {...common} scope={all} appointment={appointment} draft={{ locationId: "A" }} open onClose={vi.fn()} packages={[]} />);
    expect(hidden("location_id")).toHaveValue("B");
    expect(hidden("start_time")).toHaveValue(appointment.start_time);
  });
  it("preselects the sole active Location even with stale named scope", () => {
    render(<BookingSheet {...common} locations={[locations[1]]} scope={{ mode: "single", locationId: "stale" }} open onClose={vi.fn()} packages={[]} />);
    expect(hidden("location_id")).toHaveValue("B");
  });
});

describe("M1B Quick Appointment", () => {
  it("places Location before Service, keeps draft null and latent fallbacks unreachable until explicit choice", async () => {
    const drafts = vi.fn();
    render(<QuickAppointmentForm {...common} scope={all} defaultServiceId="shared" defaultStaffId="employee" defaultSlotIso="2026-10-01T12:00:00Z" onDraftChange={drafts} />);
    const location = screen.getByLabelText("Location");
    expect(location).toHaveValue("");
    expect(location.compareDocumentPosition(screen.getByLabelText("Service")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByLabelText("Service")).toBeDisabled();
    expect(screen.getByLabelText("Employee")).toBeDisabled();
    expect(within(screen.getByLabelText("Employee")).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText(/Still need.*location/)).toBeVisible();
    expect(document.querySelector('button[type="submit"]')).toBeDisabled();
    expect(drafts).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: null, serviceId: null, staffId: "" }));
    await settleAvailability();
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.slots).not.toHaveBeenCalled();
    expect(mocks.eligible).not.toHaveBeenCalled();
    fireEvent.change(location, { target: { value: "B" } });
    expect(drafts).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: "B" }));
    expect(screen.queryByRole("option", { name: "Choose a location" })).not.toBeInTheDocument();
    expect(mocks.scopeWrite).not.toHaveBeenCalled();
  });
  it.each([{ mode: "all" } as const, { mode: "single", locationId: "stale" } as const])("uses the sole Location for %j", (scope) => {
    render(<QuickAppointmentForm {...common} scope={scope} locations={[locations[1]]} />);
    expect(hidden("location_id")).toHaveValue("B");
  });
  it("Book another returns ALL to explicit choice despite saved preferences", async () => {
    const drafts = vi.fn<(draft: BookingDraft) => void>();
    render(<QuickAppointmentForm {...common} scope={all} preselectedCustomerId="customer" onDraftChange={drafts} />);
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "B" } });
    // Exercise the existing successful action-result reset independently of slot UI.
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(screen.getByText("Appointment confirmed")).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "Book another", exact: true }));
    expect(screen.getByLabelText("Location")).toHaveValue("");
    expect(drafts).toHaveBeenLastCalledWith(expect.objectContaining({ locationId: null }));
    expect(mocks.scopeWrite).not.toHaveBeenCalled();
  });
});
