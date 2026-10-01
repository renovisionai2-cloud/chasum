import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingSheet } from "@/components/booking-sheet/booking-sheet";
import type { OperatorServiceCatalogItem } from "@/lib/services/operator-catalog";
import type { Customer, Location, StaffWithServices } from "@/lib/types/booking";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  preview: vi.fn().mockResolvedValue({
    slots: [],
    alternativeStaff: [],
    alternativeDays: [],
  }),
  eligible: vi.fn(),
  toast: vi.fn(),
  refresh: vi.fn(),
  prefs: { locationId: "loc", serviceId: "svc", staffId: "staff" },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
  usePathname: () => "/dashboard/calendar",
}));
vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock("@/hooks/use-form-action", () => ({
  useRefresh: () => mocks.refresh,
  useFormAction: vi.fn(),
  confirmDelete: vi.fn(),
}));
vi.mock("@/lib/actions/appointments", () => ({
  createAppointment: mocks.create,
  updateAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
  setAppointmentStatus: vi.fn(),
}));
vi.mock("@/lib/actions/business-management", () => ({
  listPackages: async () => [],
}));
vi.mock("@/lib/actions/booking-engine", () => ({
  duplicateAppointment: vi.fn(),
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

const location = {
  id: "loc",
  business_id: "biz",
  name: "Test Location",
  slug: "test-location",
  timezone: "America/Toronto",
  is_default: true,
  is_active: true,
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  postal_code: null,
  phone: null,
  metadata: {},
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
} as Location;

const customer = {
  id: "cust",
  business_id: "biz",
  name: "Test Customer",
  email: "test@example.test",
  phone: null,
  notes: null,
  tags: [],
  referral_source: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
} as Customer;

const service = {
  id: "svc",
  business_id: "biz",
  name: "Deposit Service",
  is_active: true,
  duration_minutes: 30,
  price: 220,
  color: "#000000",
  online_booking: true,
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  location_id: "loc",
  service_locations: [{ location_id: "loc" }],
  deposit_required: true,
  deposit_cents: 5000,
  tax_rate_bps: 1300,
} as unknown as OperatorServiceCatalogItem;

const staff = {
  id: "staff",
  business_id: "biz",
  name: "Test Staff",
  title: null,
  photo_url: null,
  biography: null,
  qualifications: null,
  color: "#000000",
  is_active: true,
  location_id: "loc",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  staff_locations: [{ location_id: "loc" }],
  staff_services: [{ service_id: "svc" }],
} as StaffWithServices;

describe("Booking Sheet payment submission integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eligible.mockResolvedValue([staff]);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => cleanup());

  it("includes selected deposit fields in the actual footer form FormData", async () => {
    const user = userEvent.setup();
    render(
      <BookingSheet
        open
        onClose={vi.fn()}
        services={[service]}
        staff={[staff]}
        customers={[customer]}
        locations={[location]}
        packages={[]}
        scope={{ mode: "single", locationId: "loc" }}
        draft={{
          customerId: "cust",
          serviceId: "svc",
          locationId: "loc",
          staffId: "staff",
          date: "2026-10-10",
          startIso: "2026-10-10T16:00:00.000Z",
          durationMinutes: 30,
          durationSource: "service",
          durationIsOverride: false,
          bookingSource: "reception",
        }}
        currency="cad"
        taxRates={[
          {
            id: "hst",
            name: "HST",
            rate_bps: 1300,
            inclusive: false,
            is_default: true,
            is_active: true,
          },
        ]}
        timezone="America/Toronto"
        onSuccess={vi.fn()}
      />,
    );

    await user.click(await screen.findByText("Record $50 deposit"));
    await user.selectOptions(screen.getByLabelText("Payment method"), "e_transfer");

    const submit = screen.getByRole("button", { name: /Confirm and record/ });
    const footerForm = submit.closest("form") as HTMLFormElement;
    const formData = new FormData(footerForm);

    expect(formData.get("payment_mode")).toBe("deposit");
    expect(formData.get("payment_amount_cents")).toBe("5000");
    expect(formData.get("payment_method")).toBe("e_transfer");
    expect(formData.get("payment_note")).toBe("");
    expect(formData.get("payment_send_receipt")).toBe("0");
    expect(String(formData.get("payment_idempotency_key"))).toMatch(/^bs-/);
  });
});
