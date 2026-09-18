import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CUSTOMER_ACCOUNT_TENANT_SCOPE,
  appointmentDepositAppliedCents,
  appointmentOutstandingCents,
  countUpcomingAppointmentsWithBalanceDue,
  customerBalanceChipLabel,
  projectCustomerAccountTotals,
} from "@/lib/commerce/customer-account-projection";

const DOGFOOD_PAID = {
  status: "confirmed" as const,
  price_cents: 10_000,
  tax_cents: 1_300,
  deposit_cents: 0,
  amount_paid_cents: 11_300,
  amount_refunded_cents: 0,
  payment_status: "fully_paid",
  service: { price: 100 },
};

const PARTIAL_AFTER_SUBTOTAL = {
  status: "confirmed" as const,
  price_cents: 10_000,
  tax_cents: 1_300,
  deposit_cents: 0,
  amount_paid_cents: 10_000,
  amount_refunded_cents: 0,
  payment_status: "partially_paid",
};

const TRUE_DEPOSIT = {
  status: "confirmed" as const,
  price_cents: 10_000,
  tax_cents: 1_300,
  deposit_cents: 3_000,
  amount_paid_cents: 11_300,
  amount_refunded_cents: 0,
  payment_status: "fully_paid",
};

const OPEN_INVOICE = {
  status: "open" as const,
  balanceCents: 11_300,
};

const PAID_INVOICE = {
  status: "paid" as const,
  balanceCents: 0,
};

const CASH_PAYMENTS = [
  {
    status: "succeeded" as const,
    kind: "payment" as const,
    method: "cash" as const,
    amountCents: 10_000,
  },
  {
    status: "succeeded" as const,
    kind: "payment" as const,
    method: "cash" as const,
    amountCents: 1_300,
  },
];

describe("legacy falsy-zero deposit formula (Issue #51 defect on main)", () => {
  it("treats deposit_cents=0 as netPaid, so ordinary payments become deposits", () => {
    const netPaid = 11_300;
    const currentMainFormula = Math.min(
      netPaid,
      Number(DOGFOOD_PAID.deposit_cents ?? 0) || netPaid,
    );
    expect(currentMainFormula).toBe(11_300);
  });

  it("legacy balance chip counts a fully paid upcoming visit as due when deposit < catalog price", () => {
    const deposit = Number(DOGFOOD_PAID.deposit_cents ?? 0);
    const price = Math.round(Number(DOGFOOD_PAID.service.price) * 100);
    const legacyDue =
      price > 0 && deposit < price && DOGFOOD_PAID.status !== "cancelled";
    expect(legacyDue).toBe(true);
    expect(customerBalanceChipLabel(legacyDue ? 1 : 0)).toBe("1 due");
  });
});

describe("customer account deposit projection", () => {
  it("zero configured deposit + ordinary payment → depositsCents = 0", () => {
    expect(appointmentDepositAppliedCents(DOGFOOD_PAID)).toBe(0);
    const totals = projectCustomerAccountTotals({
      appointments: [DOGFOOD_PAID],
      invoices: [PAID_INVOICE],
      timeline: CASH_PAYMENTS,
    });
    expect(totals.depositsCents).toBe(0);
    expect(totals.appointmentDepositsCents).toBe(0);
  });

  it("real configured deposit is retained up to the configured amount", () => {
    expect(appointmentDepositAppliedCents(TRUE_DEPOSIT)).toBe(3_000);
    const totals = projectCustomerAccountTotals({
      appointments: [TRUE_DEPOSIT],
      invoices: [PAID_INVOICE],
      timeline: CASH_PAYMENTS,
    });
    expect(totals.depositsCents).toBe(3_000);
  });

  it("partial payment toward a real deposit does not exceed net paid", () => {
    expect(
      appointmentDepositAppliedCents({
        ...TRUE_DEPOSIT,
        amount_paid_cents: 2_000,
      }),
    ).toBe(2_000);
  });

  it("succeeded ledger kind=deposit still populates deposit summary", () => {
    const totals = projectCustomerAccountTotals({
      appointments: [{ ...DOGFOOD_PAID, amount_paid_cents: 3_000 }],
      invoices: [],
      timeline: [
        {
          status: "succeeded",
          kind: "deposit",
          method: "cash",
          amountCents: 3_000,
        },
      ],
    });
    expect(totals.depositsCents).toBe(3_000);
  });
});

describe("customer account tax-inclusive outstanding", () => {
  it("non-invoiced taxable appointment with subtotal paid still owes stored tax", () => {
    expect(appointmentOutstandingCents(PARTIAL_AFTER_SUBTOTAL)).toBe(1_300);
    const totals = projectCustomerAccountTotals({
      appointments: [PARTIAL_AFTER_SUBTOTAL],
      invoices: [],
      timeline: [CASH_PAYMENTS[0]],
    });
    expect(totals.outstandingBalanceCents).toBe(1_300);
    expect(totals.appointmentOutstandingCents).toBe(1_300);
  });

  it("uses stored tax_cents and does not invent catalog tax", () => {
    expect(
      appointmentOutstandingCents({
        price_cents: 10_000,
        tax_cents: 1_300,
        amount_paid_cents: 0,
        service: { price: 999 },
      }),
    ).toBe(11_300);
  });
});

describe("customer balance chip", () => {
  it("fully paid invoice / zero remaining does not say 1 due", () => {
    const count = countUpcomingAppointmentsWithBalanceDue([DOGFOOD_PAID]);
    expect(count).toBe(0);
    expect(customerBalanceChipLabel(count)).toBe("Clear");
    expect(customerBalanceChipLabel(count)).not.toBe("1 due");
  });

  it("existing open/partial remaining still appears as due", () => {
    const count = countUpcomingAppointmentsWithBalanceDue([
      PARTIAL_AFTER_SUBTOTAL,
    ]);
    expect(count).toBe(1);
    expect(customerBalanceChipLabel(count)).toBe("1 due");

    const withOpenInvoice = projectCustomerAccountTotals({
      appointments: [PARTIAL_AFTER_SUBTOTAL],
      invoices: [OPEN_INVOICE],
      timeline: [CASH_PAYMENTS[0]],
    });
    expect(withOpenInvoice.invoiceOutstandingCents).toBe(11_300);
    expect(withOpenInvoice.outstandingBalanceCents).toBe(11_300);
    expect(customerBalanceChipLabel(1)).toBe("1 due");
  });

  it("cancelled appointments are not due", () => {
    expect(
      countUpcomingAppointmentsWithBalanceDue([
        { ...PARTIAL_AFTER_SUBTOTAL, status: "cancelled" },
      ]),
    ).toBe(0);
  });
});

describe("customer total paid", () => {
  it("keeps total paid at the ordinary cash total", () => {
    const totals = projectCustomerAccountTotals({
      appointments: [DOGFOOD_PAID],
      invoices: [PAID_INVOICE],
      timeline: CASH_PAYMENTS,
    });
    expect(totals.totalPaidCents).toBe(11_300);
    expect(totals.outstandingBalanceCents).toBe(0);
  });
});

describe("tenant filters", () => {
  it("customer-account I/O keeps business_id and customer_id on every account query", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(
      join(here, "../../../lib/commerce/customer-account.ts"),
      "utf8",
    );
    expect(CUSTOMER_ACCOUNT_TENANT_SCOPE.businessId).toBe("business_id");
    expect(CUSTOMER_ACCOUNT_TENANT_SCOPE.customerId).toBe("customer_id");
    expect(source).toContain("CUSTOMER_ACCOUNT_TENANT_SCOPE");
    expect(source).toMatch(/\.eq\(\s*CUSTOMER_ACCOUNT_TENANT_SCOPE\.businessId/);
    expect(source).toMatch(/\.eq\(\s*CUSTOMER_ACCOUNT_TENANT_SCOPE\.customerId/);
    expect(source).toContain("listInvoices({ businessId, customerId");
    expect(source).toContain("listTransactions({ businessId, customerId");
    expect(source).toContain("listReceipts({ businessId, customerId");
    expect(source).toContain("listRefunds({ businessId, customerId");
  });

  it("projection never accepts a foreign-tenant row mix as a substitute for I/O filters", () => {
    const scoped = projectCustomerAccountTotals({
      appointments: [DOGFOOD_PAID],
      invoices: [PAID_INVOICE],
      timeline: CASH_PAYMENTS,
    });
    const mixed = projectCustomerAccountTotals({
      appointments: [
        DOGFOOD_PAID,
        { ...PARTIAL_AFTER_SUBTOTAL, amount_paid_cents: 0 },
      ],
      invoices: [PAID_INVOICE, OPEN_INVOICE],
      timeline: CASH_PAYMENTS,
    });
    expect(scoped.outstandingBalanceCents).toBe(0);
    expect(mixed.outstandingBalanceCents).toBeGreaterThan(0);
  });
});
