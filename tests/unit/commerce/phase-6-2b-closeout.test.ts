import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  endOfBusinessMonth,
  startOfBusinessMonth,
} from "@/lib/business/datetime";
import { resolveNewCommerceCurrency } from "@/lib/commerce/money";
import {
  collectibleRemainingBalanceCents,
  invoiceCollectibleBalanceCents,
  isGrossCollectionTransaction,
  remainingBalanceCents,
  sumGrossPaymentsCollectedCents,
} from "@/lib/commerce/money-contract";
import { formatDocumentMoneyCents } from "@/lib/commerce/document-currency";
import { recordedDeliveryStatus } from "@/lib/commerce/document-delivery-truth";
import { renderEmailTemplate } from "@/lib/communications/templates";
import {
  buildAppointmentReport,
  buildEmployeeReports,
  buildLocationReports,
  buildServiceReport,
  type ReportAppointmentRow,
} from "@/lib/reports/compute";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const TORONTO = { timezone: "America/Toronto", currency: "CAD" };
const NOW = new Date("2026-08-18T20:52:00.000Z"); // Aug 18 4:52 PM ET

const elite = (
  overrides: Partial<ReportAppointmentRow> = {},
): ReportAppointmentRow => ({
  id: "appt-elite",
  status: "confirmed",
  start_time: "2026-08-19T13:10:00.000Z",
  end_time: "2026-08-19T14:10:00.000Z",
  location_id: "loc-1",
  staff_id: "staff-1",
  customer_id: "cust-sum",
  service_id: "svc-elite",
  price_cents: 23600,
  tax_cents: 3068,
  amount_paid_cents: 26668,
  payment_status: "fully_paid",
  service: { name: "Elite Package", price: 236, duration_minutes: 60 },
  staff: { id: "staff-1", name: "Bobita Singh" },
  customer: {
    id: "cust-sum",
    name: "Sum Dindial",
    created_at: "2026-08-18T16:00:00.000Z",
  },
  location: { id: "loc-1", name: "Main" },
  ...overrides,
});

const anaPast: ReportAppointmentRow = {
  id: "appt-ana",
  status: "confirmed",
  start_time: "2026-08-15T00:30:00.000Z",
  end_time: "2026-08-15T00:50:00.000Z",
  location_id: "loc-1",
  staff_id: "staff-1",
  customer_id: "cust-ana",
  service_id: "svc-early",
  price_cents: 22000,
  tax_cents: 2860,
  amount_paid_cents: 24860,
  payment_status: "fully_paid",
  service: {
    name: "Gestational Age / Early Ultrasound",
    price: 220,
    duration_minutes: 20,
  },
  staff: { id: "staff-1", name: "Bobita Singh" },
  customer: {
    id: "cust-ana",
    name: "Ana Ramoersad",
    created_at: "2025-01-10T12:00:00.000Z",
  },
  location: { id: "loc-1", name: "Main" },
};

describe("Phase 6.2B closeout — CAD new-money path", () => {
  it("uses businesses.currency when a new row omits currency", () => {
    expect(resolveNewCommerceCurrency(undefined, "cad")).toBe("cad");
    expect(resolveNewCommerceCurrency(null, "CAD")).toBe("cad");
    expect(resolveNewCommerceCurrency("usd", "cad")).toBe("usd");
  });

  it("booking deposit and recordCommercePayment stamp business currency", () => {
    const payments = read("lib/commerce/payments.ts");
    const booking = read("lib/actions/appointments.ts");
    const collect = read("lib/actions/commerce.ts");
    expect(payments).toContain("resolveNewCommerceCurrency");
    expect(payments).toContain('.select("currency")');
    expect(payments).not.toMatch(/currency:\s*input\.currency\s*\?\?\s*"usd"/);
    expect(booking).toContain("currency: normalizeCurrency(business.currency)");
    expect(collect).toContain("currency: normalizeCurrency(business.currency)");
  });

  it("receipts inherit the transaction currency; refunds inherit the original payment currency", () => {
    const receipts = read("lib/commerce/receipts.ts");
    const refunds = read("lib/commerce/refunds.ts");
    expect(receipts).toContain("transaction.currency");
    expect(refunds).toContain("currency: tx.currency");
  });

  it("presents historic USD honestly and does not relabel as CAD", () => {
    expect(formatDocumentMoneyCents(5000, "usd", "cad")).toMatch(/USD/);
    expect(formatDocumentMoneyCents(5000, "usd", "cad")).not.toBe(
      formatDocumentMoneyCents(5000, "cad", "cad"),
    );
    expect(read("lib/commerce/payments.ts")).not.toMatch(
      /update\(\{[\s\S]*currency:\s*["']cad["']/,
    );
  });
});

describe("Phase 6.2B closeout — booked this month includes future", () => {
  it("counts future-this-month appointments in Booked / employee / service / location", () => {
    const futureToday = elite({
      id: "aug18",
      start_time: "2026-08-18T21:00:00.000Z",
      end_time: "2026-08-18T22:00:00.000Z",
    });
    const futureTomorrow = elite({ id: "aug19" });
    const rows = [anaPast, futureToday, futureTomorrow];

    const appointments = buildAppointmentReport(rows, 0, NOW, TORONTO);
    expect(appointments.booked).toBe(3);
    expect(appointments.completed).toBe(0);

    const employees = buildEmployeeReports(
      rows,
      [{ id: "staff-1", name: "Bobita Singh", is_active: true }],
      NOW,
      TORONTO,
    );
    expect(employees[0]?.productivity).toBe(3);

    const services = buildServiceReport(rows, 0, 0, 0, NOW, TORONTO);
    const elitePop = services.mostPopular.find((s) => s.label === "Elite Package");
    expect(elitePop?.value).toBe(2);

    const locations = buildLocationReports(
      rows,
      [{ id: "loc-1", name: "Main" }],
      new Map([["loc-1", 1]]),
      NOW,
      TORONTO,
    );
    expect(locations[0]?.appointments).toBe(3);
  });

  it("does not treat booked as already occurred (monthStart → now)", () => {
    const src = read("lib/reports/compute.ts");
    expect(src).toContain("inCurrentBusinessMonth");
    expect(src).toContain("endOfBusinessMonth");
    expect(src).not.toMatch(
      /bookedThisMonth[\s\S]{0,80}inRange\(a\.start_time, monthStart, now\)/,
    );
  });
});

describe("Phase 6.2B closeout — gross cash date and status", () => {
  it("counts a payment collected today for tomorrow's appointment in this month's cash window", () => {
    const occurredAt = new Date("2026-08-18T18:21:00.000Z");
    const monthStart = startOfBusinessMonth(NOW, TORONTO);
    const monthEnd = endOfBusinessMonth(NOW, TORONTO);
    expect(occurredAt.getTime()).toBeGreaterThanOrEqual(monthStart.getTime());
    expect(occurredAt.getTime()).toBeLessThanOrEqual(monthEnd.getTime());
    const appointmentStart = new Date("2026-08-19T13:10:00.000Z");
    expect(appointmentStart.getTime()).toBeGreaterThan(NOW.getTime());
    const dash = read("lib/commerce/dashboard.ts");
    expect(dash).toContain("t.occurredAt");
    expect(dash).toContain("monthEndBiz");
    expect(dash).not.toMatch(/appointment\.start_time/);
  });

  it("still counts the original $216.68 after a partial refund", () => {
    expect(
      sumGrossPaymentsCollectedCents([
        { status: "succeeded", kind: "deposit", amountCents: 5000 },
        { status: "partially_refunded", kind: "payment", amountCents: 21668 },
        { status: "succeeded", kind: "refund", amountCents: 2500 },
      ]),
    ).toBe(26668);
    expect(
      isGrossCollectionTransaction({
        status: "partially_refunded",
        kind: "payment",
      }),
    ).toBe(true);
    expect(
      isGrossCollectionTransaction({
        status: "succeeded",
        kind: "refund",
      }),
    ).toBe(false);
  });
});

describe("Phase 6.2B closeout — voluntary refund does not recreate debt", () => {
  const fullyPaidThenPartialRefund = {
    price_cents: 23600,
    tax_cents: 3068,
    amount_paid_cents: 26668,
    amount_refunded_cents: 2500,
    deposit_cents: 5000,
    payment_status: "partially_paid",
    status: "confirmed",
  };

  it("keeps arithmetic remaining at $25 and collectible remaining at $0", () => {
    expect(remainingBalanceCents(fullyPaidThenPartialRefund)).toBe(2500);
    expect(collectibleRemainingBalanceCents(fullyPaidThenPartialRefund)).toBe(0);
    expect(
      invoiceCollectibleBalanceCents({
        totalCents: 26668,
        amountPaidCents: 26668,
        status: "partial",
      }),
    ).toBe(0);
  });

  it("does not rewrite historical receipts or original payment rows", () => {
    const refunds = read("lib/commerce/refunds.ts");
    expect(refunds).not.toContain("commerce_receipts");
    expect(refunds).toContain("kind: \"refund\"");
  });
});

describe("Phase 6.2B closeout — staff booking notification copy", () => {
  it("uses professional new-appointment wording and Deposit method", () => {
    const rendered = renderEmailTemplate("appointment.staff", {
      businessId: "biz",
      businessName: "GVM Baby World Ultrasound",
      customerName: "Sum Dindial",
      staffName: "Bobita Singh",
      serviceName: "Elite Package",
      startTime: "2026-08-18T21:00:00.000Z",
      endTime: "2026-08-18T22:00:00.000Z",
      timezone: "America/Toronto",
      customMessage: "New appointment booked",
      appointmentTotalCents: 26668,
      depositRequiredCents: 5000,
      depositPaidCents: 5000,
      depositDueNowCents: 0,
      remainingBalanceCents: 21668,
      paymentStatusLabel: "Deposit paid",
      paymentMethodLabel: "Cash",
    });
    expect(rendered.subject).toBe("New appointment — Sum Dindial");
    expect(rendered.html).toContain("A new appointment has been booked.");
    expect(rendered.html).toContain("Deposit method");
    expect(rendered.html).toContain("Cash");
    expect(rendered.html).toContain("Customer");
    expect(rendered.html).toContain("Sum Dindial");
    expect(rendered.html).toContain("Hi Bobita Singh");
    expect(rendered.html).not.toMatch(/Hi Sum Dindial/);
    expect(rendered.html).not.toContain("Staff: appointment new appointment");
    expect(rendered.html).not.toContain("Appointment new appointment:");
    expect(rendered.html).not.toContain("Payment method");
    expect(rendered.text).toContain("A new appointment has been booked.");
  });

  it("does not change customer confirmation Payment method wording", () => {
    const customer = renderEmailTemplate("appointment.confirmation", {
      businessId: "biz",
      businessName: "GVM Baby World Ultrasound",
      customerName: "Sum Dindial",
      staffName: "Bobita Singh",
      serviceName: "Elite Package",
      startTime: "2026-08-18T21:00:00.000Z",
      timezone: "America/Toronto",
      appointmentTotalCents: 26668,
      depositRequiredCents: 5000,
      depositPaidCents: 5000,
      remainingBalanceCents: 21668,
      paymentMethodLabel: "Cash",
    });
    expect(customer.html).toContain("Payment method");
    expect(customer.subject.toLowerCase()).not.toContain("staff:");
  });
});

describe("Phase 6.2B closeout — delivery truth", () => {
  it("never labels queued or failed as Sent", () => {
    expect(
      recordedDeliveryStatus({ hasRecipient: true, logStatus: "sent" }),
    ).toBe("sent");
    expect(
      recordedDeliveryStatus({ hasRecipient: true, logStatus: "queued" }),
    ).toBe("never_sent");
    expect(
      recordedDeliveryStatus({ hasRecipient: true, logStatus: "failed" }),
    ).toBe("failed");
    expect(
      recordedDeliveryStatus({ hasRecipient: true, logStatus: null }),
    ).toBe("never_sent");
  });
});
