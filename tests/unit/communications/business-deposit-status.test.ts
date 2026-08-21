import { describe, expect, it } from "vitest";
import { resolveDepositDueNowCents } from "@/lib/commerce/booking-financials";
import { renderEmailTemplate } from "@/lib/communications/templates";
import {
  resolveTenantEmailBranding,
  toBrandingContext,
} from "@/lib/communications/tenant-email-branding";

const baseCtx = {
  businessId: "biz",
  businessName: "GVM Baby World Ultrasound",
  customerName: "Darshan Dindial",
  staffName: "Bobita",
  serviceName: "Gestational Age / Early Ultrasound",
  startTime: "2026-08-05T00:40:00.000Z",
  endTime: "2026-08-05T01:00:00.000Z",
  timezone: "America/Toronto",
  subtotalCents: 22000,
  taxCents: 2860,
  taxRateBps: 1300,
  taxLabel: "HST",
  appointmentTotalCents: 24860,
  depositRequiredCents: 5000,
  remainingBalanceCents: 19860,
};

function businessBranding() {
  return toBrandingContext(
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
}

describe("business notification deposit status wording", () => {
  it("$50 required and $50 paid shows due now $0 and Deposit paid", () => {
    const due = resolveDepositDueNowCents({
      depositRequiredCents: 5000,
      netPaidCents: 5000,
    });
    expect(due.depositDueNowCents).toBe(0);

    const rendered = renderEmailTemplate("appointment.business", {
      ...baseCtx,
      depositPaidCents: 5000,
      depositDueNowCents: due.depositDueNowCents,
      paymentStatusLabel: "Deposit paid",
      branding: businessBranding(),
    });
    expect(rendered.html).toContain("Deposit required");
    expect(rendered.html).toContain("$50.00");
    expect(rendered.html).toContain("Deposit received");
    expect(rendered.html).toContain("Deposit due now");
    expect(rendered.html).toMatch(/Deposit due now[\s\S]*\$0\.00/);
    expect(rendered.html).toContain("Payment status");
    expect(rendered.html).toContain("Deposit paid");
    expect(rendered.html).toContain("$198.60");
    expect(rendered.text).toContain("Deposit due now: $0.00");
    expect(rendered.text).toContain("Payment status: Deposit paid");
  });

  it("$50 required and $0 paid shows due now $50 and Deposit required", () => {
    const due = resolveDepositDueNowCents({
      depositRequiredCents: 5000,
      netPaidCents: 0,
    });
    expect(due.depositDueNowCents).toBe(5000);

    const rendered = renderEmailTemplate("appointment.business", {
      ...baseCtx,
      depositPaidCents: 0,
      depositDueNowCents: due.depositDueNowCents,
      remainingBalanceCents: 24860,
      paymentStatusLabel: "Deposit required",
      branding: businessBranding(),
    });
    expect(rendered.html).toContain("Deposit required");
    expect(rendered.html).toContain("Deposit received");
    expect(rendered.html).toMatch(/Deposit received[\s\S]*\$0\.00/);
    expect(rendered.html).toMatch(/Deposit due now[\s\S]*\$50\.00/);
    expect(rendered.html).toContain("Payment status");
    expect(rendered.html).toContain("Deposit required");
  });

  it("$50 required and $20 paid shows due now $30", () => {
    const due = resolveDepositDueNowCents({
      depositRequiredCents: 5000,
      netPaidCents: 2000,
    });
    expect(due.depositDueNowCents).toBe(3000);

    const rendered = renderEmailTemplate("appointment.business", {
      ...baseCtx,
      depositPaidCents: 2000,
      depositDueNowCents: due.depositDueNowCents,
      remainingBalanceCents: 22860,
      paymentStatusLabel: "Outstanding balance",
      branding: businessBranding(),
    });
    expect(rendered.html).toMatch(/Deposit received[\s\S]*\$20\.00/);
    expect(rendered.html).toMatch(/Deposit due now[\s\S]*\$30\.00/);
    expect(rendered.html).toContain("Outstanding balance");
  });

  it("staff notification includes the same deposit due now fields", () => {
    const due = resolveDepositDueNowCents({
      depositRequiredCents: 5000,
      netPaidCents: 5000,
    });
    const rendered = renderEmailTemplate("appointment.staff", {
      ...baseCtx,
      depositPaidCents: 5000,
      depositDueNowCents: due.depositDueNowCents,
      paymentStatusLabel: "Deposit paid",
      branding: businessBranding(),
    });
    expect(rendered.html).toContain("Deposit due now");
    expect(rendered.html).toMatch(/Deposit due now[\s\S]*\$0\.00/);
  });

  it("resent business notification uses the same resolved values", () => {
    const due = resolveDepositDueNowCents({
      depositRequiredCents: 5000,
      netPaidCents: 5000,
    });
    const first = renderEmailTemplate("appointment.business", {
      ...baseCtx,
      depositPaidCents: 5000,
      depositDueNowCents: due.depositDueNowCents,
      paymentStatusLabel: "Deposit paid",
      branding: businessBranding(),
    });
    const resent = renderEmailTemplate("appointment.business", {
      ...baseCtx,
      depositPaidCents: 5000,
      depositDueNowCents: due.depositDueNowCents,
      paymentStatusLabel: "Deposit paid",
      branding: businessBranding(),
    });
    expect(resent.html).toMatch(/Deposit due now[\s\S]*\$0\.00/);
    expect(resent.html).toContain("Deposit paid");
    expect(resent.text).toBe(first.text);
  });
});
