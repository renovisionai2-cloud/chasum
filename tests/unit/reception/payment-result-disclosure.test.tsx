import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuickAppointmentForm } from "@/components/reception/quick-appointment";
import type { OperatorServiceCatalogItem } from "@/lib/services/operator-catalog";
import type { Customer, Location, StaffWithServices } from "@/lib/types/booking";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  eligible: vi.fn(),
  slots: vi.fn().mockResolvedValue([]),
  preview: vi.fn().mockResolvedValue({
    slots: [],
    alternativeStaff: [],
    alternativeDays: [],
  }),
  toast: vi.fn(),
  prefs: { locationId: "loc", serviceId: "svc", staffId: "staff" },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock("@/lib/actions/appointments", () => ({
  createAppointment: mocks.create,
  updateAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
  setAppointmentStatus: vi.fn(),
}));
vi.mock("@/lib/actions/booking-sheet", () => ({
  previewBookingSheetAvailability: mocks.preview,
}));
vi.mock("@/lib/actions/staff", () => ({
  getEligibleStaffForBooking: mocks.eligible,
}));
vi.mock("@/lib/actions/customers", () => ({
  quickCreateCustomer: vi.fn(),
}));
vi.mock("@/lib/actions/scheduling", () => ({
  getDashboardAvailableSlots: mocks.slots,
}));
vi.mock("@/lib/reception/use-booking-preferences", () => ({
  useBookingPreferences: () => mocks.prefs,
  writeBookingPreferences: vi.fn(),
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

function props() {
  return {
    customers: [customer],
    services: [service],
    staff: [staff],
    locations: [location],
    taxRates: [
      {
        id: "hst",
        name: "HST",
        rate_bps: 1300,
        inclusive: false,
        is_default: true,
        is_active: true,
      },
    ],
    currency: "cad",
    preselectedCustomerId: "cust",
    defaultSlotIso: "2026-10-10T16:00:00.000Z",
    defaultServiceId: "svc",
    defaultStaffId: "staff",
    scope: { mode: "single", locationId: "loc" } as const,
    onSuccess: vi.fn(),
  };
}

describe("Reception payment result disclosure", () => {
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

  it("shows a high-visibility warning when the appointment succeeds but payment fails", async () => {
    mocks.create.mockResolvedValue({
      success:
        "Appointment confirmed — payment could not be recorded. Use Collect payment to retry.",
      appointmentId: "appt",
      payment: {
        status: "failed",
        amountCents: 5000,
        kind: "deposit",
        method: "e_transfer",
        methodLabel: "E-Transfer",
        detail: "Synthetic payment failure.",
        canRetry: true,
        receiptStatus: "not_applicable",
      },
      notifications: [],
    });

    const user = userEvent.setup();
    render(<QuickAppointmentForm {...props()} />);

    await user.click(await screen.findByText("Record $50 deposit"));
    await user.selectOptions(screen.getByLabelText("Payment method"), "e_transfer");
    await act(async () => { fireEvent.submit(document.querySelector("form")!); });

    await waitFor(() =>
      expect(
        screen.getByText("Appointment booked — payment NOT recorded"),
      ).toBeVisible(),
    );
    expect(screen.getByText(/Synthetic payment failure/)).toBeVisible();
    expect(screen.getByText(/Collect payment to retry/)).toBeVisible();
    expect(mocks.toast).toHaveBeenCalledWith(
      "Appointment confirmed — payment could not be recorded. Use Collect payment to retry.",
      "error",
    );
  });

  it("shows the authoritative recorded amount and method after payment succeeds", async () => {
    mocks.create.mockResolvedValue({
      success: "Appointment confirmed — Deposit recorded — $50.00 by E-Transfer.",
      appointmentId: "appt",
      payment: {
        status: "recorded",
        amountCents: 5000,
        kind: "deposit",
        method: "e_transfer",
        methodLabel: "E-Transfer",
        detail: "Recorded deposit.",
        transactionId: "tx",
        receiptStatus: "not_requested",
      },
      notifications: [],
    });

    const user = userEvent.setup();
    render(<QuickAppointmentForm {...props()} />);

    await user.click(await screen.findByText("Record $50 deposit"));
    await user.selectOptions(screen.getByLabelText("Payment method"), "e_transfer");
    await act(async () => { fireEvent.submit(document.querySelector("form")!); });

    await waitFor(() => expect(screen.getByText("Payment recorded")).toBeVisible());
    expect(screen.getByText(/\$50 deposit · E-Transfer/)).toBeVisible();
    expect(mocks.toast).toHaveBeenCalledWith(
      "Appointment confirmed — Deposit recorded — $50.00 by E-Transfer.",
      "success",
    );
  });
  it("never labels a committed partial sync as not recorded or invites collection again", async () => {
    mocks.create.mockResolvedValue({ success: "Appointment confirmed — payment recorded, sync needs review.", appointmentId: "appt", payment: { status: "failed", transactionId: "tx", amountCents: 5000, canRetry: false, detail: "Payment recorded, but downstream sync failed." }, notifications: [] });
    const user = userEvent.setup();
    render(<QuickAppointmentForm {...props()} />);
    await user.click(await screen.findByText("Record $50 deposit"));
    await act(async () => { fireEvent.submit(document.querySelector("form")!); });
    await waitFor(() => expect(screen.getByText("Appointment booked — payment recorded; sync needs review")).toBeVisible());
    expect(screen.queryByText(/payment NOT recorded/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Collect payment to retry/)).not.toBeInTheDocument();
  });

});
