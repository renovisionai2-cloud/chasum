import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingSheet } from "@/components/booking-sheet/booking-sheet";
import type { OperatorServiceCatalogItem } from "@/lib/services/operator-catalog";
import type { ActionState, Customer, Location, StaffWithServices } from "@/lib/types/booking";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  preview: vi.fn().mockResolvedValue({
    slots: [{ start: "2026-10-10T16:00:00.000Z", end: "2026-10-10T16:30:00.000Z" }],
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

function renderSheet() {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  function Host() {
    const [open, setOpen] = useState(true);
    return (
      <>
      {!open ? <button onClick={() => setOpen(true)}>Reopen booking</button> : null}
      <BookingSheet
        open={open}
        onClose={() => { onClose(); setOpen(false); }}
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
        onSuccess={() => { onSuccess(); setOpen(false); }}
      />
      </>
    );
  }
  render(<Host />);
  return { onClose, onSuccess };
}

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
    renderSheet();

    await user.click(await screen.findByText("Record $50 deposit"));
    await user.selectOptions(screen.getByLabelText("Payment method"), "e_transfer");

    const submit = screen.getByRole("button", { name: /Confirm and record/ });
    const footerForm = submit.closest("form") as HTMLFormElement;
    const formData = new FormData(footerForm);

    expect(formData.get("payment_mode")).toBe("deposit");
    expect(formData.getAll("payment_mode")).toHaveLength(1);
    expect(formData.get("payment_amount_cents")).toBe("5000");
    expect(formData.get("payment_method")).toBe("e_transfer");
    expect(formData.get("payment_note")).toBe("");
    expect(formData.get("payment_send_receipt")).toBe("0");
    expect(String(formData.get("payment_idempotency_key"))).toMatch(/^bs-/);
  });

  it.each([false, true])("keeps the failed result visible and prevents a second create (persisted=%s)", async (persisted) => {
    const user = userEvent.setup();
    const state: ActionState = {
      appointmentId: "appt-created",
      success: persisted
        ? "Appointment confirmed — payment was recorded, but appointment financial sync failed."
        : "Appointment confirmed — payment could not be recorded. Use Collect payment to retry.",
      payment: {
        status: "failed", amountCents: persisted ? 4000 : 5000,
        transactionId: persisted ? "tx-committed" : null,
        canRetry: !persisted, method: "e_transfer", methodLabel: "E-Transfer",
        detail: persisted
          ? "Payment was recorded, but appointment financial sync failed. Synthetic sync error."
          : "Synthetic insert error.",
      },
    };
    mocks.create.mockResolvedValue(state);
    const { onClose, onSuccess } = renderSheet();
    await user.click(await screen.findByText("Record $50 deposit"));
    await user.selectOptions(screen.getByLabelText("Payment method"), "e_transfer");
    const submit = screen.getByRole("button", { name: /Confirm and record/ });
    await waitFor(() => expect(submit).toBeEnabled());
    const form = submit.closest("form")!;
    await user.click(submit);

    const alert = await screen.findByRole("alert");
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(state.success, "error");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(alert).toHaveTextContent("Appointment reference: appt-created");
    expect(alert).toHaveTextContent(state.payment!.detail!);
    if (persisted) {
      expect(alert).toHaveTextContent("payment WAS recorded, but appointment balance/status could not sync");
      expect(alert).toHaveTextContent("Recorded amount: $40 · Method: E-Transfer");
      expect(alert).toHaveTextContent("Transaction reference: tx-committed");
      expect(alert).not.toHaveTextContent(/NOT recorded|retry/i);
      expect(screen.queryByRole("link", { name: /Collect payment/i })).not.toBeInTheDocument();
    } else {
      expect(alert).toHaveTextContent("Appointment booked — payment NOT recorded");
      expect(alert).toHaveTextContent("Attempted amount: $50 · Requested method: E-Transfer");
      expect(alert).not.toHaveTextContent(/\bpaid\b|\breceived\b/i);
      expect(within(alert).getByRole("link", { name: /Open Collect payment/ })).toHaveAttribute(
        "href", "/dashboard/payments?customer=cust&appointment=appt-created",
      );
    }
    // Draft controls/review must not keep netting the attempted payment from balance.
    expect(screen.queryByLabelText("Payment method")).not.toBeInTheDocument();
    expect(screen.queryByText("Balance remaining")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Quick actions/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Appointment booked" })).toBeDisabled();
    // Exercise the form guard even when a submission bypasses the disabled button.
    fireEvent.submit(form);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(alert).toBeVisible();
    await user.click(within(form).getByRole("button", { name: "Close", exact: true }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reopen booking" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm appointment" })).toBeEnabled());
  });

  it.each([
    { transactionId: "tx-present", canRetry: true },
    { transactionId: null, canRetry: false },
  ])("does not offer recovery navigation for %j", async (payment) => {
    const user = userEvent.setup();
    mocks.create.mockResolvedValue({
      appointmentId: "appt-created", success: "Appointment booked — payment needs attention.",
      payment: { status: "failed", ...payment },
    });
    renderSheet();
    const submit = screen.getByRole("button", { name: "Confirm appointment" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Collect payment/i })).not.toBeInTheDocument();
  });

  it.each(["recorded", "skipped"] as const)("closes on %s success and permits a new booking after reopening", async (status) => {
    const user = userEvent.setup();
    mocks.create.mockResolvedValue({
      appointmentId: "appt-created", success: "Appointment confirmed.", payment: { status },
    });
    const { onClose, onSuccess } = renderSheet();
    const submit = screen.getByRole("button", { name: "Confirm appointment" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Reopen booking" }));
    const nextSubmit = screen.getByRole("button", { name: "Confirm appointment" });
    await waitFor(() => expect(nextSubmit).toBeEnabled());
    await user.click(nextSubmit);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2));
  });

  it("keeps an in-flight creation mounted when header, backdrop or Escape requests Close", async () => {
    const user = userEvent.setup();
    let finish!: (result: ActionState) => void;
    mocks.create.mockReturnValue(new Promise<ActionState>((resolve) => { finish = resolve; }));
    const { onClose } = renderSheet();
    const submit = screen.getByRole("button", { name: "Confirm appointment" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    expect(screen.getByRole("button", { name: "Confirming…" })).toBeDisabled();
    for (const close of screen.getAllByRole("button", { name: "Close", exact: true })) {
      await user.click(close);
    }
    await user.click(screen.getByRole("button", { name: "Close panel" }));
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeVisible();
    await act(async () => finish({
      appointmentId: "appt-created", success: "Appointment confirmed — payment needs attention.",
      payment: { status: "failed", transactionId: null, canRetry: true },
    }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Appointment booked" })).toBeDisabled();
  });
});
