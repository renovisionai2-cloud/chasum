import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertCollectiblePaymentAmount,
  ledgerKindLabel,
  ledgerReasonLabel,
  mapFrontDeskAppointment,
  sortFrontDeskAppointments,
} from "@/lib/commerce/front-desk";
import { isAppointmentCollectible } from "@/lib/commerce/money-contract";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Phase 6.1 front-desk payments", () => {
  it("blocks overpayment and empty remaining", () => {
    expect(
      assertCollectiblePaymentAmount({ amountCents: 100, remainingCents: 50 }),
    ).toEqual({
      ok: false,
      error: "The payment amount is greater than the amount due.",
    });
    expect(
      assertCollectiblePaymentAmount({ amountCents: 100, remainingCents: 0 }),
    ).toMatchObject({ ok: false });
    expect(
      assertCollectiblePaymentAmount({ amountCents: 50, remainingCents: 100 }),
    ).toEqual({ ok: true });
  });

  it("cancelled appointments are not collectible; no-show remains collectible", () => {
    expect(isAppointmentCollectible("cancelled", "unpaid")).toBe(false);
    expect(isAppointmentCollectible("no_show", "unpaid")).toBe(true);
    const cancelled = mapFrontDeskAppointment({
      id: "a1",
      customerId: "c1",
      customerName: "Ana",
      serviceName: "Facial",
      startTime: "2026-08-12T15:00:00.000Z",
      timeZone: "America/Toronto",
      appointmentStatus: "cancelled",
      stamps: {
        price_cents: 25000,
        tax_cents: 1668,
        amount_paid_cents: 0,
        payment_status: "unpaid",
        status: "cancelled",
      },
    });
    expect(cancelled.remainingCents).toBe(0);
    expect(cancelled.isCollectible).toBe(false);
  });

  it("separates refund kind from reason cancelled", () => {
    expect(ledgerKindLabel("refund")).toBe("Refund");
    expect(ledgerKindLabel("payment")).toBe("Payment");
    expect(ledgerReasonLabel("Refund: cancelled")).toBe("Reason: cancelled");
    expect(ledgerReasonLabel("Appointment cancelled")).toBe(
      "Appointment cancelled",
    );
  });

  it("prioritizes outstanding appointments in selector", () => {
    const rows = sortFrontDeskAppointments([
      mapFrontDeskAppointment({
        id: "paid",
        customerId: "c",
        customerName: "A",
        serviceName: "Cut",
        startTime: "2026-08-10T15:00:00.000Z",
        timeZone: "America/Toronto",
        appointmentStatus: "completed",
        stamps: {
          price_cents: 10000,
          amount_paid_cents: 10000,
          payment_status: "fully_paid",
        },
      }),
      mapFrontDeskAppointment({
        id: "due",
        customerId: "c",
        customerName: "A",
        serviceName: "Color",
        startTime: "2026-08-20T15:00:00.000Z",
        timeZone: "America/Toronto",
        appointmentStatus: "confirmed",
        stamps: {
          price_cents: 20000,
          amount_paid_cents: 0,
          payment_status: "unpaid",
        },
      }),
    ]);
    expect(rows[0].id).toBe("due");
  });

  it("Collect Payment workspace has no Appointment ID / Customer ID inputs", () => {
    const src = read("components/commerce/collect-payment-workspace.tsx");
    expect(src).not.toContain('placeholder="Appointment ID');
    expect(src).not.toContain('placeholder="Customer ID');
    expect(src).toContain("CustomerSearch");
    expect(src).toContain("Pay full remaining balance");
    expect(src).toContain("Pay deposit due");
    expect(src).toContain("Custom amount");
    expect(src).toContain("Payment recorded");
  });

  it("Payments page does not expose Appointment ID as primary UX", () => {
    const dash = read("components/commerce/payments-dashboard.tsx");
    expect(dash).not.toContain('placeholder="Appointment ID');
    expect(dash).toContain("CollectPaymentWorkspace");
    expect(dash).toContain("Outstanding appointment balances");
    expect(dash).toContain("Outstanding deposits");
    expect(dash).toContain("ledgerKindLabel");
  });

  it("appointment-native collect and refund share canonical workflows", () => {
    const sheet = read("components/booking-sheet/booking-sheet.tsx");
    expect(sheet).toContain("CollectPaymentWorkspace");
    expect(sheet).not.toMatch(/window\.location\.href = .*\/dashboard\/payments/);
    const pay = read("components/booking-sheet/payments-section.tsx");
    expect(pay).toContain("RefundTransactionSheet");
    expect(pay).toContain("CollectPaymentWorkspace");
    const profile = read("components/crm/customer-profile.tsx");
    expect(profile).toContain("CollectPaymentWorkspace");
    expect(profile).toContain("setCollectOpen(true)");
  });

  it("recordPaymentAction caps amount to collectible remaining", () => {
    const action = read("lib/actions/commerce.ts");
    expect(action).toContain("assertCollectiblePaymentAmount");
    expect(action).toContain("sendPaymentReceiptNow");
    expect(action).toContain("receiptStatus");
    expect(action).not.toContain("Stripe Elements");
  });

  it("no-show policy is not rewritten in 6.1", () => {
    const contract = read("lib/commerce/money-contract.ts");
    expect(contract).toContain('if (status === "cancelled") return false');
    expect(contract).not.toContain('if (status === "no_show") return false');
  });
});
