import { describe, expect, it } from "vitest";
import {
  formatAppointmentEmailClock,
  formatAppointmentEmailDate,
  formatAppointmentEmailTimeRange,
  formatAppointmentEmailWhen,
  resolveAppointmentEmailTimezone,
} from "@/lib/communications/appointment-datetime";
import { renderEmailTemplate } from "@/lib/communications/templates";
import {
  resolveTenantEmailBranding,
  toBrandingContext,
} from "@/lib/communications/tenant-email-branding";
import { resolveEditBookingPaymentSummary } from "@/lib/commerce/edit-booking-payment-summary";

/** 11:10 AM America/Toronto on 2026-08-04 = 15:10 UTC (EDT, UTC-4). */
const START_UTC = "2026-08-04T15:10:00.000Z";
const END_UTC = "2026-08-04T15:40:00.000Z";
const ZONE = "America/Toronto";

describe("appointment email timezone formatting", () => {
  it("resolves location → business → America/Toronto", () => {
    expect(
      resolveAppointmentEmailTimezone({
        locationTimezone: "America/Vancouver",
        businessTimezone: "America/Toronto",
      }),
    ).toBe("America/Vancouver");
    expect(
      resolveAppointmentEmailTimezone({
        locationTimezone: null,
        businessTimezone: "America/Toronto",
      }),
    ).toBe("America/Toronto");
    expect(resolveAppointmentEmailTimezone({})).toBe("America/Toronto");
  });

  it("formats America/Toronto 11:10 AM without a four-hour UTC shift", () => {
    expect(formatAppointmentEmailDate(START_UTC, ZONE)).toBe(
      "Tuesday, August 4, 2026",
    );
    expect(formatAppointmentEmailClock(START_UTC, ZONE)).toBe("11:10 AM");
    expect(formatAppointmentEmailTimeRange(START_UTC, END_UTC, ZONE)).toBe(
      "11:10 AM–11:40 AM ET",
    );
    expect(formatAppointmentEmailWhen(START_UTC, ZONE, END_UTC)).toContain(
      "11:10 AM",
    );
    expect(formatAppointmentEmailWhen(START_UTC, ZONE, END_UTC)).not.toContain(
      "3:10 PM",
    );
  });

  it("customer, business, and receipt emails show identical local times", () => {
    const brandingCustomer = toBrandingContext(
      resolveTenantEmailBranding(
        {
          name: "GVM Baby World Ultrasound",
          email: "gvmbabyworld@gmail.com",
          subscription_plan_key: "starter",
          private_alpha_enabled: true,
          brand_color: "#e91e8c",
        },
        "customer",
      ),
    );
    const brandingBusiness = toBrandingContext(
      resolveTenantEmailBranding(
        {
          name: "GVM Baby World Ultrasound",
          email: "gvmbabyworld@gmail.com",
          subscription_plan_key: "starter",
          private_alpha_enabled: true,
        },
        "business",
      ),
    );

    const base = {
      businessId: "biz",
      businessName: "GVM Baby World Ultrasound",
      customerName: "Ana",
      staffName: "Bobita",
      serviceName: "Gestational Age / Early Ultrasound",
      startTime: START_UTC,
      endTime: END_UTC,
      timezone: ZONE,
      businessTimezone: ZONE,
      subtotalCents: 16500,
      taxCents: 2145,
      taxRateBps: 1300,
      taxLabel: "HST",
      appointmentTotalCents: 18645,
      depositPaidCents: 5000,
      remainingBalanceCents: 13645,
      amountCents: 5000,
      receiptNumber: "RCT-165",
    };

    const customer = renderEmailTemplate("appointment.confirmation", {
      ...base,
      branding: brandingCustomer,
    });
    const business = renderEmailTemplate("appointment.business", {
      ...base,
      branding: brandingBusiness,
    });
    const receipt = renderEmailTemplate("commerce.receipt", {
      ...base,
      branding: brandingCustomer,
    });

    for (const rendered of [customer, business, receipt]) {
      expect(rendered.html).toContain("Tuesday, August 4, 2026");
      expect(rendered.html).toContain("11:10 AM");
      expect(rendered.html).toContain("11:40 AM");
      expect(rendered.html).not.toContain("3:10 PM");
      expect(rendered.html).not.toContain("3:40 PM");
    }

    expect(receipt.html).toContain("Gestational Age / Early Ultrasound");
    expect(receipt.html).toContain("$165.00");
    expect(receipt.html).toContain("$21.45");
    expect(receipt.html).toContain("$186.45");
    expect(receipt.html).toContain("$50.00");
    expect(receipt.html).toContain("$136.45");
    expect(receipt.html).toContain("mailto:gvmbabyworld@gmail.com?subject=");
    expect(receipt.html).not.toMatch(/Powered by Chasum/i);
    expect(receipt.html).not.toMatch(/Sent via Chasum/i);
    expect(business.html).toMatch(/Sent via Chasum/i);
  });
});

describe("edit booking payment summary", () => {
  it("loads an existing $50 successful payment with $136.45 remaining", () => {
    const summary = resolveEditBookingPaymentSummary({
      appointmentTotalCents: 18645,
      alreadyPaidCents: 5000,
      paymentTodayCents: 0,
      depositRequiredCents: 5000,
      paymentStatus: "deposit_paid",
    });
    expect(summary.alreadyPaidCents).toBe(5000);
    expect(summary.paymentTodayCents).toBe(0);
    expect(summary.remainingBalanceCents).toBe(13645);
    expect(summary.depositStatusLabel).toBe("Deposit paid");
  });

  it("subtracts both existing and new payments from the balance", () => {
    const summary = resolveEditBookingPaymentSummary({
      appointmentTotalCents: 18645,
      alreadyPaidCents: 5000,
      paymentTodayCents: 3645,
      depositRequiredCents: 5000,
      paymentStatus: "deposit_paid",
    });
    expect(summary.remainingBalanceCents).toBe(10000);
  });

  it("does not invent payments when none exist", () => {
    const summary = resolveEditBookingPaymentSummary({
      appointmentTotalCents: 18645,
      alreadyPaidCents: 0,
      paymentTodayCents: 0,
      depositRequiredCents: 5000,
    });
    expect(summary.alreadyPaidCents).toBe(0);
    expect(summary.remainingBalanceCents).toBe(18645);
    expect(summary.depositStatusLabel).toBe("Deposit required");
  });
});
