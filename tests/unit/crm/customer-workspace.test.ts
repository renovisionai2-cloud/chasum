import { describe, expect, it } from "vitest";
import {
  appointmentPriceCents,
  buildDirectoryMetricsByCustomer,
  isNewCustomer,
} from "@/lib/crm/directory-metrics";
import { buildCustomerPaymentSummary } from "@/lib/crm/payment-summary";
import {
  buildCustomerHealthSummary,
  CRM_STATUS_FILTER_OPTIONS,
  formatHealthMetric,
  isVipCustomer,
} from "@/lib/crm/customer-health";
import type { CrmDirectoryCustomer } from "@/lib/actions/crm";
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
    expect(m?.outstandingBalanceCents).toBe(11000);
  });

  it("includes tax in directory outstanding remaining balance", () => {
    const metrics = buildDirectoryMetricsByCustomer(
      [
        {
          customer_id: "c1",
          start_time: "2026-08-01T15:00:00.000Z",
          status: "confirmed",
          price_cents: 10000,
          tax_cents: 1300,
          amount_paid_cents: 0,
        },
      ],
      new Date("2026-08-06T12:00:00.000Z"),
    );
    expect(metrics.get("c1")?.outstandingBalanceCents).toBe(11300);
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

describe("Customer health summary", () => {
  const base = {
    id: "1",
    business_id: "b",
    name: "Ada",
    email: "a@example.com",
    phone: null,
    notes: null,
    tags: [],
    referral_source: null,
    created_at: "2026-08-02T00:00:00.000Z",
    updated_at: "2026-08-02T00:00:00.000Z",
  } as CrmDirectoryCustomer;

  it("counts balances, VIP, and inactive from directory rows", () => {
    const nowMs = Date.parse("2026-08-06T12:00:00.000Z");
    const health = buildCustomerHealthSummary(
      [
        {
          ...base,
          id: "1",
          crm_status: "active",
          outstanding_balance_cents: 2200,
          visit_count_completed: 3,
          last_visit_at: "2026-08-03T12:00:00.000Z",
        },
        {
          ...base,
          id: "2",
          crm_status: "inactive",
          is_vip: true,
          outstanding_balance_cents: 0,
        },
        {
          ...base,
          id: "3",
          crm_status: "active",
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      nowMs,
    );

    expect(health.withBalances).toEqual({ kind: "count", value: 1 });
    expect(health.vip).toEqual({ kind: "count", value: 1 });
    expect(health.inactive).toEqual({ kind: "count", value: 1 });
    expect(health.newThisMonth).toEqual({ kind: "count", value: 2 });
    expect(health.returningThisMonth).toEqual({ kind: "count", value: 1 });
    expect(health.averageSpend.kind).toBe("unavailable");
    expect(formatHealthMetric(health.averageSpend)).toBe("Unavailable");
    expect(health.observations.some((o) => o.includes("outstanding"))).toBe(
      true,
    );
  });

  it("treats VIP as derived segment via flag or legacy status", () => {
    expect(isVipCustomer({ is_vip: true, crm_status: "active" })).toBe(true);
    expect(isVipCustomer({ is_vip: false, crm_status: "vip" })).toBe(true);
    expect(isVipCustomer({ is_vip: false, crm_status: "active" })).toBe(false);
  });

  it("keeps CRM status filter options distinct from VIP segment", () => {
    const values = CRM_STATUS_FILTER_OPTIONS.map((o) => o.value);
    expect(values).toEqual(["lead", "active", "inactive", "archived"]);
    expect(values).not.toContain("vip");
  });
});

describe("Customer payment summary", () => {
  it("labels collected vs outstanding without inventing averages", () => {
    const account = {
      totalPaidCents: 12000,
      outstandingBalanceCents: 3500,
      outstandingAppointmentBalanceCents: 3500,
      outstandingInvoiceCents: 0,
      outstandingDepositDueCents: 0,
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
        { status: "succeeded", kind: "payment", amountCents: 7000 },
        { status: "succeeded", kind: "deposit", amountCents: 5000 },
        { status: "failed", kind: "payment", amountCents: 1000 },
      ],
    } as unknown as CustomerCommerceAccount;

    const summary = buildCustomerPaymentSummary(account);
    expect(summary.collectedCents).toBe(12000);
    expect(summary.outstandingCents).toBe(3500);
    expect(summary.openInvoiceCount).toBe(2);
    expect(summary.averageTransactionCents).toBe(6000);
  });

  it("returns null average when no succeeded transactions", () => {
    const account = {
      totalPaidCents: 0,
      outstandingBalanceCents: 0,
      outstandingAppointmentBalanceCents: 0,
      outstandingInvoiceCents: 0,
      outstandingDepositDueCents: 0,
      depositsCents: 0,
      storeCreditCents: 0,
      invoices: [],
      refunds: [],
      giftCards: [],
      timeline: [],
    } as unknown as CustomerCommerceAccount;

    expect(
      buildCustomerPaymentSummary(account).averageTransactionCents,
    ).toBeNull();
  });
});

describe("Customer workspace surfaces", () => {
  it("keeps collected vs list-value language honest", () => {
    const root = process.cwd();
    const payment = readFileSync(
      join(root, "components/crm/customer-payment-summary.tsx"),
      "utf8",
    );
    const insights = readFileSync(
      join(root, "components/crm/customer-insights.tsx"),
      "utf8",
    );
    const overview = readFileSync(
      join(root, "components/crm/customer-overview-panel.tsx"),
      "utf8",
    );
    const directory = readFileSync(
      join(root, "components/crm/customer-directory.tsx"),
      "utf8",
    );
    const profile = readFileSync(
      join(root, "components/crm/customer-profile.tsx"),
      "utf8",
    );

    const overviewRead = readFileSync(
      join(root, "components/crm/customer-overview-read.tsx"),
      "utf8",
    );
    expect(payment).toContain("Financial totals come from the commerce ledger.");
    expect(payment).not.toMatch(/label=\"Revenue\"/i);
    expect(payment).toContain("Unavailable");
    expect(insights).toContain("Completed service list value");
    expect(insights).toContain("Unavailable");
    expect(overview).toContain("Customer overview");
    expect(overview).not.toMatch(/Avg spend\s*\$0/i);
    expect(directory).toContain("Clear filters");
    expect(directory).toContain("Open filters");
    expect(directory).toContain("ChevronRight");
    expect(profile).toContain("Observed facts");
    expect(profile).toContain("Recommendations");
    expect(overviewRead).toContain("Edit profile");
    expect(profile).toContain("Messages");
  });

  it("ships directory loading and overview health panel", () => {
    const root = process.cwd();
    expect(
      readFileSync(
        join(root, "app/(dashboard)/dashboard/clients/loading.tsx"),
        "utf8",
      ),
    ).toContain("DashboardSkeleton");
    expect(
      readFileSync(
        join(root, "app/(dashboard)/dashboard/clients/page.tsx"),
        "utf8",
      ),
    ).toContain("CustomerOverviewPanel");
    expect(
      readFileSync(
        join(root, "app/(dashboard)/dashboard/clients/page.tsx"),
        "utf8",
      ),
    ).not.toContain("ChaseCrmPanel");
  });
});
