import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bookingDecisionAccess,
  bookingFactsFromValues,
  bookingProgressSteps,
  firstMissingDecision,
} from "@/components/booking-sheet/booking-workflow";
import {
  BOOKING_SUCCESS_PAYMENT_LABELS,
  bookingSuccessPaymentState,
  recordedDeliveryLabel,
} from "@/lib/booking/booking-success-summary";
import {
  locationDecisionRequired,
  resolveInitialBookingLocation,
  usableBookingLocations,
} from "@/lib/booking/usable-locations";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";

const root = process.cwd();

describe("Phase 6 UX closeout — View appointment opens operating/read state", () => {
  it("existing appointments default to view mode rather than the editor", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(booking).toContain('useState<"view" | "edit">("view")');
    expect(booking).toContain("AppointmentOperatingView");
    expect(booking).toContain('managementMode === "view"');
    expect(booking).toContain('setManagementMode("edit")');
    expect(booking).not.toContain(
      "onEditFocus={() => {\n                document\n                  .getElementById(\"bs-appt-heading\")",
    );
  });

  it("explicit Edit enters the booking editor; Save changes is hidden in view", () => {
    const booking = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    const actions = readFileSync(
      join(root, "components/booking-sheet/appointment-management-actions.tsx"),
      "utf8",
    );
    expect(actions).toContain("Edit");
    expect(booking).toContain('setManagementMode("edit")');
    expect(booking).toContain("AppointmentSection");
    expect(booking).toContain('managementMode === "view" ? null');
    expect(booking).toContain('"Save changes"');
  });
});

describe("Phase 6 UX closeout — success screen hierarchy", () => {
  it("leads with Appointment booked and compact payment summary", () => {
    const success = readFileSync(
      join(root, "components/booking-sheet/booking-success-state.tsx"),
      "utf8",
    );
    expect(success).toContain("Appointment booked");
    expect(success).toContain("Appointment total");
    expect(success).toContain("Amount collected");
    expect(success).toContain("BOOKING_SUCCESS_PAYMENT_LABELS");
    expect(success).toContain("Remaining");
    expect(success).toContain("Customer confirmation");
    expect(success).toContain("Business notification");
    expect(success).toContain("View appointment");
    expect(success).toContain("Book another");
    expect(success).toContain("Done");
  });

  it("maps recorded collection to payment states with exact cents", () => {
    const po = resolveBookingFinancials({
      catalogPriceCents: 23600,
      taxInclusive: false,
      taxCents: 3068,
      depositRequiredCents: 5000,
      paymentTodayCents: 5000,
      currency: "cad",
    });
    expect(po.subtotalCents).toBe(23600);
    expect(po.taxCents).toBe(3068);
    expect(po.appointmentTotalCents).toBe(26668);
    expect(po.remainingBalanceCents).toBe(21668);

    expect(
      bookingSuccessPaymentState({
        appointmentTotalCents: 26668,
        collectedCents: 0,
        depositRequiredCents: 5000,
        paymentRecorded: false,
      }),
    ).toBe("no_payment");
    expect(
      bookingSuccessPaymentState({
        appointmentTotalCents: 26668,
        collectedCents: 5000,
        depositRequiredCents: 5000,
        paymentRecorded: true,
      }),
    ).toBe("deposit_paid");
    expect(
      bookingSuccessPaymentState({
        appointmentTotalCents: 26668,
        collectedCents: 2500,
        depositRequiredCents: 5000,
        paymentRecorded: true,
      }),
    ).toBe("partially_paid");
    expect(
      bookingSuccessPaymentState({
        appointmentTotalCents: 26668,
        collectedCents: 26668,
        depositRequiredCents: 5000,
        paymentRecorded: true,
      }),
    ).toBe("paid_in_full");
    expect(BOOKING_SUCCESS_PAYMENT_LABELS.paid_in_full).toBe("Paid in full");
  });

  it("never reports Sent unless delivery was recorded as sent", () => {
    expect(recordedDeliveryLabel(undefined)).toBe("Not recorded");
    expect(
      recordedDeliveryLabel({
        channel: "customer_email",
        status: "sent",
        label: "Sent",
      }),
    ).toBe("Sent");
    expect(
      recordedDeliveryLabel({
        channel: "customer_email",
        status: "failed",
        label: "Failed",
      }),
    ).toBe("Could not be sent");
    expect(
      recordedDeliveryLabel({
        channel: "business_email",
        status: "not_configured",
        label: "Not configured",
      }),
    ).toBe("Not recorded");
    expect(
      recordedDeliveryLabel({
        channel: "customer_email",
        status: "skipped",
        label: "Skipped",
      }),
    ).toBe("Not recorded");
    const success = readFileSync(
      join(root, "components/booking-sheet/booking-success-state.tsx"),
      "utf8",
    );
    expect(success).toContain("recordedDeliveryLabel");
    expect(success).not.toContain("Sent ✓");
  });
});

describe("Phase 6 UX closeout — location sequencing", () => {
  it("auto-selects a single usable location and does not require a step", () => {
    const locations = [
      { id: "gvm", name: "GVM", is_active: true, is_default: true },
    ];
    expect(usableBookingLocations(locations)).toHaveLength(1);
    expect(locationDecisionRequired(locations)).toBe(false);
    const resolved = resolveInitialBookingLocation({ locations });
    expect(resolved.required).toBe(false);
    expect(resolved.locationId).toBe("gvm");
    expect(resolved.provenance).toBe("entry_context");
    expect(
      firstMissingDecision(
        bookingFactsFromValues({
          customerId: "c1",
          serviceId: "s1",
          needsNamedEmployee: true,
          date: "2026-08-18",
          slot: null,
          slotValid: false,
          paymentAcknowledged: false,
          success: false,
          locationRequired: false,
        }),
      ),
    ).toBe("employee");
    expect(
      bookingProgressSteps({ locationRequired: false }),
    ).not.toContain("location");
  });

  it("requires location after service and before employee when multiple locations exist", () => {
    const locations = [
      { id: "a", name: "A", is_active: true, is_default: true },
      { id: "b", name: "B", is_active: true, is_default: false },
    ];
    expect(locationDecisionRequired(locations)).toBe(true);
    const prefs = resolveInitialBookingLocation({
      locations,
      preferenceLocationId: "a",
    });
    expect(prefs.required).toBe(true);
    expect(prefs.provenance).toBe("preference");

    const afterService = bookingFactsFromValues({
      customerId: "c1",
      customerResolved: true,
      serviceId: "s1",
      serviceResolved: true,
      needsNamedEmployee: true,
      employeeResolved: false,
      date: "2026-08-18",
      slot: null,
      slotValid: false,
      paymentAcknowledged: false,
      success: false,
      locationRequired: true,
      locationResolved: false,
    });
    expect(firstMissingDecision(afterService)).toBe("location");
    expect(bookingDecisionAccess("employee", afterService)).toEqual({
      accessible: false,
      reason: "Choose a location first",
    });
    expect(bookingDecisionAccess("datetime", afterService).reason).toMatch(
      /location/i,
    );
    expect(bookingProgressSteps(afterService)).toEqual([
      "customer",
      "service",
      "location",
      "employee",
      "datetime",
      "payment",
      "review",
    ]);

    const afterLocation = {
      ...afterService,
      locationResolved: true,
    };
    expect(firstMissingDecision(afterLocation)).toBe("employee");
    expect(bookingDecisionAccess("employee", afterLocation).accessible).toBe(
      true,
    );
  });

  it("calendar/draft location context may resolve a multi-location decision", () => {
    const resolved = resolveInitialBookingLocation({
      locations: [
        { id: "a", is_active: true },
        { id: "b", is_active: true },
      ],
      draftLocationId: "b",
    });
    expect(resolved.locationId).toBe("b");
    expect(resolved.provenance).toBe("entry_context");
    expect(resolved.required).toBe(true);
  });
});

describe("Phase 6 UX closeout — appointment vs payment status", () => {
  it("keeps Booked appointment status separate from Paid in full", () => {
    expect(APPOINTMENT_STATUS_LABELS.confirmed).toBe("Booked");
    expect(APPOINTMENT_STATUS_LABELS.completed).toBe("Completed");
    const view = readFileSync(
      join(root, "components/booking-sheet/appointment-operating-view.tsx"),
      "utf8",
    );
    expect(view).toContain("appointmentStatus");
    expect(view).toContain("paymentStatusLabel");
    expect(view).toContain("remainingCents");
    const sheet = readFileSync(
      join(root, "components/booking-sheet/booking-sheet.tsx"),
      "utf8",
    );
    expect(sheet).not.toMatch(/setStatus\("completed"\).*payment/s);
  });
});
