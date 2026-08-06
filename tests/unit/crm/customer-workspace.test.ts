import { describe, expect, it } from "vitest";
import {
  appointmentPriceCents,
  buildDirectoryMetricsByCustomer,
  isNewCustomer,
} from "@/lib/crm/directory-metrics";
import { buildCustomerPaymentSummary } from "@/lib/crm/payment-summary";
import type { CustomerCommerceAccount } from "@/lib/commerce/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Customer directory metrics", () => {
  it("derives last visit, next appointment, and outstanding from appointments", () => {
    const now = new Date("2026-08-06T12:00:00.000Z");
    const metrics = buildDirectoryMetricsByCustomer(
      [
        {
          customer_id: "c1",
          start_time: "2026-08-01T15:00:00.000Z",
          status: "completed",
          price_cents: 10000,
          amount_paid_cents: 4000,
        },
        {
          customer_id: "c1",
          start_time: "2026-08-10T15:00:00.000Z",
          status: "confirmed",
          price_cents: 5000,
          amount_paid_cents: 0,
        },
        {
          customer_id: "c1",
          start_time: "2026-07-01T15:00:00.000Z",
          status: "cancelled",
          price_cents: 8000,
          amount_paid_cents: 0,
        },
      ],
      now,
    );

    const m = metrics.get("c1");
    expect(m?.lastVisitAt).toBe("2026-08-01T15:00:00.000Z");
    expect(m?.nextAppointmentAt).toBe("2026-08-10T15:00:00.000Z");
    expect(m?.visitCountCompleted).toBe(1);
    // completed: 100-40 outstanding + upcoming 50 unpaid = 110
    expect(m?.outstandingBalanceCents).toBe(11000);
  });

  it("falls back to service list price when price_cents missing", () => {
    expect(
      appointmentPriceCents({
        customer_id: "c1",
        start_time: "2026-08-01T15:00:00.000Z",
        status: "completed",
        service: { price: 85 },
      }),
    ).toBe(8500);
  });

  it("classifies new customers within window", () => {
    const now = Date.parse("2026-08-06T12:00:00.000Z");
    expect(isNewCustomer("2026-07-20T00:00:00.000Z", now)).toBe(true);
    expect(isNewCustomer("2026-06-01T00:00:00.000Z", now)).toBe(false);
    expect(isNewCustomer(null, now)).toBe(false);
  });
});

describe("Customer payment summary", () => {
  it("labels collected vs outstanding without inventing averages", () => {
    const account = {
      totalPaidCents: 12000,
      outstandingBalanceCents: 3500,
      depositsCents: 2000,
      storeCreditCents: 0,
      invoices: [
        { status: "paid" },
        { status: "open" },
        { status: "overdue" },
      ],
      refunds: [{ amountCents: 500 }],
      giftCards: [{ balanceCents: 1000 }],
      timeline: [
        { status: "succeeded", amountCents: 7000 },
        { status: "succeeded", amountCents: 5000 },
        { status: "failed", amountCents: 1000 },
      ],
    } as unknown as CustomerCommerceAccount;

    const summary = buildCustomerPaymentSummary(account);
    expect(summary.collectedCents).toBe(12000);
    expect(summary.outstandingCents).toBe(3500);
    expect(summary.invoiceCount).toBe(3);
    expect(summary.openInvoiceCount).toBe(2);
    expect(summary.depositsCents).toBe(2000);
    expect(summary.refundsCents).toBe(500);
    expect(summary.averageTransactionCents).toBe(6000);
    expect(summary.giftCardBalanceCents).toBe(1000);
  });

  it("returns null average when no succeeded transactions", () => {
    const account = {
      totalPaidCents: 0,
      outstandingBalanceCents: 0,
      depositsCents: 0,
      storeCreditCents: 0,
      invoices: [],
      refunds: [],
      giftCards: [],
      timeline: [],
    } as unknown as CustomerCommerceAccount;

    expect(buildCustomerPaymentSummary(account).averageTransactionCents).toBeNull();
  });
});

describe("Customer workspace surfaces", () => {
  it("keeps collected vs booking-value language honest", () => {
    const root = process.cwd();
    const payment = readFileSync(
      join(root, "components/crm/customer-payment-summary.tsx"),
      "utf8",
    );
    const insights = readFileSync(
      join(root, "components/crm/customer-insights.tsx"),
      "utf8",
    );
    expect(payment).toContain("Gross payments collected");
    expect(payment).not.toMatch(/label=\"Revenue\"/i);
    expect(insights).toContain("Completed booking value");
    expect(insights).toContain("not commerce “payments collected.”");
  });

  it("ships directory loading and payment summary component", () => {
    const root = process.cwd();
    expect(
      readFileSync(
        join(root, "app/(dashboard)/dashboard/clients/loading.tsx"),
        "utf8",
      ),
    ).toContain("DashboardSkeleton");
    expect(
      readFileSync(
        join(root, "components/crm/customer-payment-summary.tsx"),
        "utf8",
      ),
    ).toContain("Payment summary");
  });
});
