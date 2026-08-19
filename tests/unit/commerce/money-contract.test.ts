import { describe, expect, it } from "vitest";
import {
  appointmentCollectibleMoneyFromStamps,
  appointmentMoneyFromStamps,
  appointmentSubtotalCents,
  appointmentTaxCents,
  appointmentTotalCents,
  collectibleDepositDueNowCents,
  collectibleRemainingBalanceCents,
  depositCollectedCents,
  depositDueNowCents,
  depositRequiredCents,
  GROSS_PAYMENTS_COLLECTED_LABEL,
  invoiceAmountsFromAppointmentStamps,
  isAppointmentCollectible,
  isCommerceInvoiceRecord,
  isGrossCollectionTransaction,
  isOutstandingInvoiceStatus,
  remainingBalanceCents,
  sumGrossPaymentsCollectedCents,
} from "@/lib/commerce/money-contract";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";
import { planningAttentionLabel } from "@/lib/calendar/planning-density";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const exclusiveHst = [
  {
    id: "t1",
    name: "HST",
    rate_bps: 1300,
    inclusive: false,
    is_default: true,
    is_active: true,
  },
];

const inclusiveHst = [
  {
    id: "t1",
    name: "HST",
    rate_bps: 1300,
    inclusive: true,
    is_default: true,
    is_active: true,
  },
];

describe("Chapter 6 money contract", () => {
  it("treats price_cents as exclusive subtotal and adds tax for total", () => {
    const stamps = { price_cents: 70000, tax_cents: 9100 };
    expect(appointmentSubtotalCents(stamps)).toBe(70000);
    expect(appointmentTaxCents(stamps)).toBe(9100);
    expect(appointmentTotalCents(stamps)).toBe(79100);
  });

  it("preserves inclusive-tax resolver stamps without reinterpreting price_cents as total", () => {
    const resolved = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: inclusiveHst,
    });
    expect(resolved.taxInclusive).toBe(true);
    expect(resolved.appointmentTotalCents).toBe(70000);
    expect(resolved.subtotalCents + resolved.taxCents).toBe(
      resolved.appointmentTotalCents,
    );
    const money = appointmentMoneyFromStamps({
      price_cents: resolved.subtotalCents,
      tax_cents: resolved.taxCents,
    });
    expect(money.subtotalCents).toBe(resolved.subtotalCents);
    expect(money.taxCents).toBe(resolved.taxCents);
    expect(money.totalCents).toBe(resolved.appointmentTotalCents);
  });

  it("keeps exclusive resolver stamps aligned with the appointment contract", () => {
    const resolved = resolveBookingFinancials({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
    });
    const money = appointmentMoneyFromStamps({
      price_cents: resolved.subtotalCents,
      tax_cents: resolved.taxCents,
    });
    expect(money.subtotalCents).toBe(70000);
    expect(money.taxCents).toBe(9100);
    expect(money.totalCents).toBe(79100);
  });

  it("handles zero-tax appointments", () => {
    const money = appointmentMoneyFromStamps({
      price_cents: 22000,
      tax_cents: 0,
    });
    expect(money.totalCents).toBe(22000);
    expect(money.remainingBalanceCents).toBe(22000);
  });

  it("separates deposit required, collected, due now, and remaining balance", () => {
    const stamps = {
      price_cents: 20000,
      tax_cents: 2600,
      deposit_cents: 5000,
      amount_paid_cents: 5000,
      amount_refunded_cents: 0,
    };
    expect(depositRequiredCents(stamps)).toBe(5000);
    expect(depositCollectedCents(stamps)).toBe(5000);
    expect(depositDueNowCents(stamps)).toBe(0);
    expect(remainingBalanceCents(stamps)).toBe(17600);
    expect(remainingBalanceCents(stamps)).not.toBe(depositDueNowCents(stamps));
  });

  it("computes deposit due now as unpaid required deposit only", () => {
    const unpaid = {
      price_cents: 20000,
      tax_cents: 2600,
      deposit_cents: 5000,
      amount_paid_cents: 0,
    };
    expect(depositDueNowCents(unpaid)).toBe(5000);
    expect(remainingBalanceCents(unpaid)).toBe(22600);

    const partialDeposit = {
      ...unpaid,
      amount_paid_cents: 2000,
    };
    expect(depositDueNowCents(partialDeposit)).toBe(3000);
    expect(depositCollectedCents(partialDeposit)).toBe(2000);
  });

  it("includes tax in remaining balance and fully-paid status", () => {
    const unpaid = appointmentMoneyFromStamps({
      price_cents: 10000,
      tax_cents: 1300,
      amount_paid_cents: 0,
    });
    expect(unpaid.remainingBalanceCents).toBe(11300);
    expect(unpaid.paymentStatus).toBe("unpaid");

    const fullyPaid = appointmentMoneyFromStamps({
      price_cents: 10000,
      tax_cents: 1300,
      amount_paid_cents: 11300,
    });
    expect(fullyPaid.remainingBalanceCents).toBe(0);
    expect(fullyPaid.paymentStatus).toBe("fully_paid");

    const partial = appointmentMoneyFromStamps({
      price_cents: 10000,
      tax_cents: 1300,
      amount_paid_cents: 5000,
    });
    expect(partial.remainingBalanceCents).toBe(6300);
    expect(partial.paymentStatus).toBe("partially_paid");
  });

  it("accounts for refunds and partial refunds in net paid and remaining", () => {
    const refunded = appointmentMoneyFromStamps({
      price_cents: 10000,
      tax_cents: 1300,
      amount_paid_cents: 11300,
      amount_refunded_cents: 11300,
    });
    expect(refunded.netPaidCents).toBe(0);
    expect(refunded.remainingBalanceCents).toBe(11300);
    expect(refunded.paymentStatus).toBe("refunded");

    const partialRefund = appointmentMoneyFromStamps({
      price_cents: 10000,
      tax_cents: 1300,
      amount_paid_cents: 11300,
      amount_refunded_cents: 3000,
    });
    expect(partialRefund.netPaidCents).toBe(8300);
    expect(partialRefund.remainingBalanceCents).toBe(3000);
    expect(partialRefund.paymentStatus).toBe("fully_paid");
  });

  it("creates invoice totals from appointment total, not exclusive subtotal alone", () => {
    const invoice = invoiceAmountsFromAppointmentStamps({
      price_cents: 70000,
      tax_cents: 9100,
      amount_paid_cents: 5000,
    });
    expect(invoice.subtotalCents).toBe(70000);
    expect(invoice.taxCents).toBe(9100);
    expect(invoice.totalCents).toBe(79100);
    expect(invoice.amountPaidCents).toBe(5000);
    expect(invoice.balanceCents).toBe(74100);
    expect(invoice.totalCents).not.toBe(invoice.subtotalCents);
  });

  it("distinguishes real commerce invoices from unpaid appointments", () => {
    expect(isCommerceInvoiceRecord("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(
      true,
    );
    expect(isCommerceInvoiceRecord("appt:abc")).toBe(false);
    expect(isOutstandingInvoiceStatus("open")).toBe(true);
    expect(isOutstandingInvoiceStatus("partial")).toBe(true);
    expect(isOutstandingInvoiceStatus("paid")).toBe(false);
    expect(isOutstandingInvoiceStatus("void")).toBe(false);
  });

  it("counts gross payments collected from payment and deposit cash-in rows", () => {
    const txs = [
      { status: "succeeded" as const, kind: "payment" as const, amountCents: 8000 },
      { status: "succeeded" as const, kind: "deposit" as const, amountCents: 5000 },
      { status: "succeeded" as const, kind: "refund" as const, amountCents: 2000 },
      { status: "failed" as const, kind: "payment" as const, amountCents: 4000 },
      { status: "pending" as const, kind: "payment" as const, amountCents: 1000 },
    ];
    expect(sumGrossPaymentsCollectedCents(txs)).toBe(13000);
    expect(isGrossCollectionTransaction(txs[2]!)).toBe(false);
    expect(GROSS_PAYMENTS_COLLECTED_LABEL).toBe("Gross payments collected");
    expect(
      isGrossCollectionTransaction({
        status: "partially_refunded",
        kind: "payment",
      }),
    ).toBe(true);
    expect(
      sumGrossPaymentsCollectedCents([
        ...txs,
        {
          status: "partially_refunded" as const,
          kind: "payment" as const,
          amountCents: 21668,
        },
      ]),
    ).toBe(34668);
  });
});

describe("Phase 6.0A collectibility", () => {
  const unpaid = {
    price_cents: 10000,
    tax_cents: 1300,
    deposit_cents: 5000,
    amount_paid_cents: 0,
    amount_refunded_cents: 0,
  };

  it("cancelled unpaid → collectible balance 0 while arithmetic remaining retained", () => {
    const stamps = { ...unpaid, status: "cancelled" };
    expect(remainingBalanceCents(stamps)).toBe(11300);
    expect(collectibleRemainingBalanceCents(stamps)).toBe(0);
    expect(isAppointmentCollectible("cancelled")).toBe(false);
  });

  it("cancelled deposit-required → deposit due 0", () => {
    const stamps = { ...unpaid, status: "cancelled" };
    expect(depositDueNowCents(stamps)).toBe(5000);
    expect(collectibleDepositDueNowCents(stamps)).toBe(0);
  });

  it("cancelled partially paid → collectible balance 0; historical paid retained", () => {
    const stamps = {
      ...unpaid,
      status: "cancelled",
      amount_paid_cents: 5000,
    };
    const money = appointmentCollectibleMoneyFromStamps(stamps);
    expect(money.netPaidCents).toBe(5000);
    expect(money.remainingBalanceCents).toBe(6300);
    expect(money.collectibleRemainingBalanceCents).toBe(0);
  });

  it("cancelled fully paid → historical paid retained; collectible 0", () => {
    const stamps = {
      ...unpaid,
      status: "cancelled",
      amount_paid_cents: 11300,
    };
    const money = appointmentCollectibleMoneyFromStamps(stamps);
    expect(money.netPaidCents).toBe(11300);
    expect(money.collectibleRemainingBalanceCents).toBe(0);
    expect(money.collectibleDepositDueNowCents).toBe(0);
  });

  it("cancelled refunded → history retained; collectible 0", () => {
    const stamps = {
      ...unpaid,
      status: "cancelled",
      amount_paid_cents: 11300,
      amount_refunded_cents: 11300,
    };
    const money = appointmentCollectibleMoneyFromStamps(stamps);
    expect(money.refundedCents).toBe(11300);
    expect(money.netPaidCents).toBe(0);
    expect(money.collectibleRemainingBalanceCents).toBe(0);
  });

  it("active and completed unpaid remain collectible", () => {
    expect(
      collectibleRemainingBalanceCents({ ...unpaid, status: "confirmed" }),
    ).toBe(11300);
    expect(
      collectibleRemainingBalanceCents({ ...unpaid, status: "completed" }),
    ).toBe(11300);
  });

  it("no-show preserves current collectible behavior", () => {
    expect(isAppointmentCollectible("no_show")).toBe(true);
    expect(
      collectibleRemainingBalanceCents({ ...unpaid, status: "no_show" }),
    ).toBe(11300);
    expect(
      collectibleDepositDueNowCents({ ...unpaid, status: "no_show" }),
    ).toBe(5000);
  });

  it("planning attention never shows Payment due for cancelled", () => {
    expect(
      planningAttentionLabel({
        status: "cancelled",
        paymentStatus: "unpaid",
      }),
    ).toBeNull();
    expect(
      planningAttentionLabel({
        status: "confirmed",
        paymentStatus: "unpaid",
      }),
    ).toBe("Payment due");
  });

  it("cancel mutation only updates status and does not touch commerce", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/booking-engine/mutations/cancel.ts"),
      "utf8",
    );
    expect(src).toContain('status: "cancelled"');
    expect(src).not.toMatch(/commerce_invoices|commerce_transactions|amount_paid|processCommerceRefund/);
  });
});
