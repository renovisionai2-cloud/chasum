import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Phase 6.0 locks", () => {
  it("does not add Stripe Elements, Checkout, or PaymentIntent UI", () => {
    const paymentsUi = read("components/commerce/payments-dashboard.tsx");
    expect(paymentsUi).not.toMatch(/PaymentElement|CardElement|loadStripe/);
    expect(paymentsUi).not.toMatch(/EmbeddedCheckout|ExpressCheckout/);
    const publicBooking = read("lib/actions/public-booking.ts");
    expect(publicBooking).not.toMatch(/PaymentElement|loadStripe/);
    expect(publicBooking).not.toMatch(/createPaymentIntent/);
  });

  it("does not introduce a new migration or depend on 034/035/036", () => {
    const files = readdirSync(join(root, "supabase/migrations"));
    expect(files.some((f) => f.startsWith("037_"))).toBe(false);
    const money = read("lib/commerce/money-contract.ts");
    expect(money).not.toMatch(/034_optional_appointment_staff|035_booking_interval|036_booking_resources/);
  });

  it("documents the public named-staff price-stamp gap without modifying the RPC", () => {
    const rpc = read("supabase/migrations/013_sprint8_gvm_go_live.sql");
    const insert = rpc.slice(
      rpc.indexOf("insert into appointments"),
      rpc.indexOf("returning id into v_id"),
    );
    expect(insert).toContain("business_id, location_id, service_id, staff_id, customer_id");
    expect(insert).not.toContain("price_cents");
    expect(insert).not.toContain("tax_cents");
    expect(insert).not.toContain("deposit_cents");

    const publicBooking = read("lib/actions/public-booking.ts");
    expect(publicBooking).toContain("create_public_appointment");
  });

  it("does not generate synthetic appointment invoices on the payments snapshot", () => {
    const dashboard = read("lib/commerce/dashboard.ts");
    expect(dashboard).not.toMatch(/appt:\$\{/);
    expect(dashboard).toContain("isCommerceInvoiceRecord");
    expect(dashboard).toContain("collectibleDepositDueNowCents");
    expect(dashboard).toContain("outstandingAppointmentBalancesCents");
  });

  it("keeps invoice create on the canonical appointment total", () => {
    const invoices = read("lib/commerce/invoices.ts");
    expect(invoices).toContain("invoiceAmountsFromAppointmentStamps");
    expect(invoices).toContain("total_cents: total");
    expect(invoices).toContain("subtotal_cents: lineUnit || subtotal");
    expect(invoices).toContain("tax_cents: taxCents");
  });

  it("labels cash-in as gross payments collected on corrected surfaces", () => {
    expect(read("components/commerce/payments-dashboard.tsx")).toMatch(
      /Gross payments collected today/,
    );
    expect(read("components/chase/chase-ops-workspace.tsx")).toMatch(
      /Gross payments collected today/,
    );
    expect(read("components/chase/chase-ops-workspace.tsx")).not.toMatch(
      /label="Revenue today"/,
    );
    expect(read("lib/actions/reports.ts")).toContain(
      "Gross Payments Collected Today",
    );
    expect(read("lib/actions/reports.ts")).not.toContain('["Revenue Today"');
    expect(read("components/dashboard/command-centre.tsx")).toContain(
      "Gross payments collected",
    );
  });

  it("keeps outstanding deposits distinct from remaining appointment balances", () => {
    const dashboard = read("lib/commerce/dashboard.ts");
    expect(dashboard).toContain("money.collectibleDepositDueNowCents");
    expect(dashboard).toContain("money.collectibleRemainingBalanceCents");
    const payments = read("components/commerce/payments-dashboard.tsx");
    expect(payments).toContain("Outstanding deposits");
    expect(payments).toContain("Outstanding appointment balances");
    expect(payments).toContain("required deposits due now");
    const cc = read("lib/dashboard/command-centre.ts");
    expect(cc).toContain("Required deposits still due now");
    expect(cc).toContain("outstanding-appointment-balances");
  });

  it("preserves receipt/resend and Booking Workspace money helpers", () => {
    expect(existsSync(join(root, "lib/commerce/receipts.ts"))).toBe(true);
    const receipts = read("lib/commerce/receipts.ts");
    expect(receipts).toContain("createReceiptForTransaction");
    expect(receipts).toContain("retryPaymentReceiptForAppointment");
    const bookingFinancials = read("lib/commerce/booking-financials.ts");
    expect(bookingFinancials).toContain("resolveBookingFinancials");
    expect(bookingFinancials).toContain("price_cents = exclusive subtotal");
  });

  it("keeps recognize.ts conceptually separate from cash collection", () => {
    const recognize = read("lib/commerce/recognize.ts");
    expect(recognize).toMatch(/NOT cash collection/);
    expect(recognize).toContain("collected ≠ revenue");
  });

  it("wires Phase 6.0A collectibility helpers", () => {
    const money = read("lib/commerce/money-contract.ts");
    expect(money).toContain("isAppointmentCollectible");
    expect(money).toContain("collectibleRemainingBalanceCents");
    expect(money).toContain("collectibleDepositDueNowCents");
    expect(money).toContain("Arithmetic remaining ≠ current collectible");
  });
});
