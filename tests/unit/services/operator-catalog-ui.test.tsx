import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServicesManager } from "@/components/services/services-manager";
import { BookingSheet } from "@/components/booking-sheet/booking-sheet";
import { QuickAppointmentForm } from "@/components/reception/quick-appointment";
import type { OperatorServiceCatalogItem } from "@/lib/services/operator-catalog";
import type { Location } from "@/lib/types/booking";
const mocks = vi.hoisted(() => ({ enable: vi.fn().mockResolvedValue({ success: "Enabled" }), refresh: vi.fn(), toast: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }), usePathname: () => "/dashboard/services" }));
vi.mock("@/providers/toast-provider", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/hooks/use-form-action", () => ({ useRefresh: () => mocks.refresh, useFormAction: vi.fn(), confirmDelete: vi.fn() }));
vi.mock("@/lib/actions/services", () => ({ enableServiceAtLocation: mocks.enable, createService: vi.fn(), updateService: vi.fn(), deleteService: vi.fn(), getServiceBlackouts: vi.fn(), getServiceLocationIds: vi.fn(), getServiceStaffAssignments: vi.fn(), upsertServiceBlackout: vi.fn(), deleteServiceBlackout: vi.fn() }));
vi.mock("@/lib/actions/appointments", () => ({ createAppointment: vi.fn(), updateAppointment: vi.fn(), cancelAppointment: vi.fn(), setAppointmentStatus: vi.fn() }));
vi.mock("@/lib/actions/business-management", () => ({ listPackages: async () => [] }));
vi.mock("@/lib/actions/booking-engine", () => ({ duplicateAppointment: vi.fn() }));
vi.mock("@/lib/actions/booking-sheet", () => ({ getBookingSheetCustomerSnapshot: async () => null, previewBookingSheetAvailability: async () => null }));
vi.mock("@/lib/actions/staff", () => ({ getEligibleStaffForBooking: async () => [] }));
vi.mock("@/lib/actions/customers", () => ({ quickCreateCustomer: vi.fn() }));
vi.mock("@/lib/actions/scheduling", () => ({ getDashboardAvailableSlots: async () => [] }));
vi.mock("@/lib/reception/use-booking-preferences", () => ({ useBookingPreferences: () => ({}), writeBookingPreferences: vi.fn() }));
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
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Services business catalog", () => {
  it("keeps catalog visible at a location with zero offerings and enables the same ID", async () => {
    render(<ServicesManager services={services} locations={locations} selectedLocationId="C" categories={[]} staff={[]} />);
    expect(screen.getByRole("heading", { name: "Shared consultation" })).toBeVisible();
    expect(screen.getAllByText("Not offered here")).toHaveLength(2);
    expect(screen.queryByText(/first service/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enable Shared consultation at this location" }));
    await waitFor(() => expect(mocks.enable).toHaveBeenCalledWith("shared", "C"));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });
  it("distinguishes a secondary mapping without hiding other services", () => {
    render(<ServicesManager services={services} locations={locations} selectedLocationId="B" categories={[]} staff={[]} />);
    expect(screen.getByText("Offered here")).toBeVisible();
    expect(screen.getByText("Not offered here")).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });
  it("keeps a naturally offered single-location catalog simple", () => {
    render(<ServicesManager services={services} locations={[locations[0]]} selectedLocationId="A" categories={[]} staff={[]} />);
    expect(screen.queryByText("Offered here")).not.toBeInTheDocument();
    expect(screen.queryByText("Enable at this location")).not.toBeInTheDocument();
    expect(screen.getByText("Shared consultation")).toBeVisible();
  });
  it("uses first-service messaging only for a truly empty business", () => {
    render(<ServicesManager services={[]} locations={locations} selectedLocationId="C" categories={[]} staff={[]} />);
    expect(screen.getByText("Let's add your first service")).toBeVisible();
  });
});

describe("real Booking Sheet and AppointmentSection location switching", () => {
  it("preserves a still-offered service, removes unmapped options, clears an invalid selection", () => {
    render(<BookingSheet open onClose={vi.fn()} onSuccess={vi.fn()} services={services} locations={locations} staff={[]} customers={[]} packages={[]} />);
    const serviceSelect = screen.getByLabelText("Service");
    expect(serviceSelect).toHaveValue("shared");
    expect(within(serviceSelect).getAllByRole("option")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "B" } });
    expect(serviceSelect).toHaveValue("shared");
    expect(within(serviceSelect).getAllByRole("option")).toHaveLength(1);
    expect(within(serviceSelect).queryByText(/Primary only/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "C" } });
    expect(serviceSelect).toHaveValue("");
    expect(within(serviceSelect).getByText("No active services")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "A" } });
    expect(serviceSelect).toHaveValue("shared");
  });
});

describe("Quick Appointment", () => {
  it("derives selectable services and submitted ID from the selected location", async () => {
    render(<QuickAppointmentForm services={services} locations={locations} staff={[]} customers={[]} onSuccess={vi.fn()} />);
    const select = screen.getByLabelText("Service");
    expect(within(select).getAllByRole("option")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "B" } });
    expect(select).toHaveValue("shared");
    expect(within(select).getAllByRole("option")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Location"), { target: { value: "C" } });
    expect(document.querySelector('input[name="service_id"]')).toHaveValue("");
    await waitFor(() => expect(mocks.enable).not.toHaveBeenCalled());
  });
});
