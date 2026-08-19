import { describe, expect, it, vi, beforeEach } from "vitest";
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
import {
  composeRefundReason,
  validateStoredRefundReason,
} from "@/lib/commerce/refund-reason";
import { renderEmailTemplate } from "@/lib/communications/templates";
import {
  buildAppointmentReport,
  buildCustomerReport,
  buildEmployeeReports,
  buildFinancial,
  buildLocationReports,
  buildRevenueBreakdown,
  buildServiceReport,
  type ReportAppointmentRow,
} from "@/lib/reports/compute";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const sendEmail = vi.fn();
const writeCommerceAudit = vi.fn();

vi.mock("@/lib/communications/delivery", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

vi.mock("@/lib/commerce/audit", () => ({
  writeCommerceAudit: (...args: unknown[]) => writeCommerceAudit(...args),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";
import {
  sendRefundBusinessNotification,
  sendRefundConfirmationEmail,
} from "@/lib/commerce/refund-email";

type QueryResult = { data: unknown; error: unknown };

function chain(result: QueryResult) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const m of [
    "select",
    "eq",
    "in",
    "order",
    "limit",
    "update",
    "insert",
  ]) {
    api[m] = vi.fn(self);
  }
  api.maybeSingle = vi.fn(async () => result);
  api.single = vi.fn(async () => result);
  api.then = (
    onFulfilled?: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

const TORONTO = { timezone: "America/Toronto", currency: "CAD" };
const NOW = new Date("2026-08-18T20:52:00.000Z");

function gvmRow(
  overrides: Partial<ReportAppointmentRow> & {
    id: string;
    start_time: string;
    end_time: string;
    customer_id: string;
    service_id: string;
    price_cents: number;
    tax_cents: number;
    amount_paid_cents: number;
    serviceName: string;
    customerName: string;
    created_at: string;
  },
): ReportAppointmentRow {
  const {
    serviceName,
    customerName,
    created_at,
    ...rest
  } = overrides;
  return {
    status: "confirmed",
    location_id: "loc-1",
    staff_id: "staff-1",
    payment_status: "fully_paid",
    deposit_cents: 5000,
    service: { name: serviceName, price: overrides.price_cents / 100, duration_minutes: 60 },
    staff: { id: "staff-1", name: "Bobita Singh" },
    customer: {
      id: overrides.customer_id,
      name: customerName,
      created_at,
    },
    location: { id: "loc-1", name: "Main" },
    ...rest,
  };
}

const ana = gvmRow({
  id: "appt-ana",
  start_time: "2026-08-15T00:30:00.000Z",
  end_time: "2026-08-15T00:50:00.000Z",
  customer_id: "cust-ana",
  service_id: "svc-early",
  price_cents: 22000,
  tax_cents: 2860,
  amount_paid_cents: 24860,
  serviceName: "Gestational Age / Early Ultrasound",
  customerName: "Ana Ramoersad",
  created_at: "2025-01-10T12:00:00.000Z",
});

const sum18 = gvmRow({
  id: "appt-sum-18",
  start_time: "2026-08-18T21:00:00.000Z",
  end_time: "2026-08-18T22:00:00.000Z",
  customer_id: "cust-sum",
  service_id: "svc-elite",
  price_cents: 23600,
  tax_cents: 3068,
  amount_paid_cents: 26668,
  serviceName: "Elite Package",
  customerName: "Sum Dindial",
  created_at: "2026-08-18T16:00:00.000Z",
});

const sum19 = gvmRow({
  id: "appt-sum-19",
  start_time: "2026-08-19T13:10:00.000Z",
  end_time: "2026-08-19T14:10:00.000Z",
  customer_id: "cust-sum",
  service_id: "svc-elite",
  price_cents: 23600,
  tax_cents: 3068,
  amount_paid_cents: 26668,
  serviceName: "Elite Package",
  customerName: "Sum Dindial",
  created_at: "2026-08-18T16:00:00.000Z",
});

const chase = gvmRow({
  id: "appt-chase",
  start_time: "2026-08-19T15:00:00.000Z",
  end_time: "2026-08-19T16:00:00.000Z",
  customer_id: "cust-chase",
  service_id: "svc-ultimate",
  price_cents: 29900,
  tax_cents: 3887,
  amount_paid_cents: 33787,
  serviceName: "Ultimate 2 Visit Package",
  customerName: "Chase Dindial",
  created_at: "2026-08-18T18:00:00.000Z",
});

const gvmAugust = [ana, sum18, sum19, chase];

const refundRow = {
  id: "rf-chase",
  business_id: "biz",
  customer_id: "cust-chase",
  transaction_id: "tx-chase",
  invoice_id: "inv-1",
  appointment_id: "appt-chase",
  amount_cents: 5000,
  currency: "cad",
  reason: "Goodwill adjustment",
  refund_type: "partial",
  approval_status: "approved",
  status: "succeeded",
  provider: "manual",
  provider_reference: null,
  created_at: "2026-08-18T19:00:00.000Z",
  metadata: {},
};

const txRow = {
  id: "tx-chase",
  business_id: "biz",
  customer_id: "cust-chase",
  appointment_id: "appt-chase",
  invoice_id: "inv-1",
  kind: "payment",
  status: "partially_refunded",
  method: "e_transfer",
  amount_cents: 33787,
  currency: "cad",
  provider: "manual",
  provider_reference: null,
  provider_payment_intent_id: null,
  description: null,
  occurred_at: "2026-08-18T18:30:00.000Z",
  created_at: "2026-08-18T18:30:00.000Z",
};

function mockRefundTables(overrides?: {
  refund?: Record<string, unknown>;
  customerEmail?: string | null;
  logs?: { status: string } | null;
  ownerEnabled?: boolean;
  emailEnabled?: boolean;
  notificationEmail?: string | null;
}) {
  const refund = { ...refundRow, ...(overrides?.refund ?? {}) };
  const from = vi.fn((table: string) => {
    if (table === "commerce_refunds") {
      return chain({ data: refund, error: null });
    }
    if (table === "commerce_transactions") {
      return chain({ data: txRow, error: null });
    }
    if (table === "customers") {
      return chain({
        data: {
          id: "cust-chase",
          name: "Chase Dindial",
          email: overrides?.customerEmail === undefined
            ? "chase@example.com"
            : overrides.customerEmail,
        },
        error: null,
      });
    }
    if (table === "businesses") {
      return chain({
        data: {
          name: "GVM Baby World Ultrasound",
          timezone: "America/Toronto",
          email: "owner@gvm.test",
          notification_email: overrides?.notificationEmail ?? "ops@gvm.test",
          owner_notifications_enabled: overrides?.ownerEnabled ?? true,
          email_notifications_enabled: overrides?.emailEnabled ?? true,
        },
        error: null,
      });
    }
    if (table === "appointments") {
      return chain({
        data: {
          id: "appt-chase",
          start_time: "2026-08-19T15:00:00.000Z",
          end_time: "2026-08-19T16:00:00.000Z",
          services: { name: "Ultimate 2 Visit Package" },
          location: { timezone: "America/Toronto", name: "Main" },
        },
        error: null,
      });
    }
    if (table === "commerce_invoices") {
      return chain({
        data: { invoice_number: "INV-0040" },
        error: null,
      });
    }
    if (table === "commerce_receipts") {
      return chain({
        data: { receipt_number: "RCT-0007" },
        error: null,
      });
    }
    if (table === "staff") {
      return chain({
        data: { name: "Bobita Singh" },
        error: null,
      });
    }
    if (table === "notification_logs") {
      return chain({
        data: overrides?.logs ?? { status: "sent" },
        error: null,
      });
    }
    return chain({ data: null, error: null });
  });
  vi.mocked(createServiceClient).mockReturnValue({ from } as never);
  return from;
}

describe("Phase 6.2B PO closeout — business refund notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({ ok: true, messageId: "msg-biz-1" });
    writeCommerceAudit.mockResolvedValue(undefined);
  });

  it("creates a business refund notification with operational fields", async () => {
    mockRefundTables();
    const sent = await sendRefundBusinessNotification({
      businessId: "biz",
      refundId: "rf-chase",
      actorId: "user-1",
    });
    expect(sent.status).toBe("sent");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const call = sendEmail.mock.calls[0]?.[0] as {
      templateKey: string;
      to: string;
      context: Record<string, unknown>;
    };
    expect(call.templateKey).toBe("commerce.refund.business");
    expect(call.to).toBe("ops@gvm.test");
    expect(call.context.customerName).toBe("Chase Dindial");
    expect(call.context.serviceName).toBe("Ultimate 2 Visit Package");
    expect(call.context.locationName).toBe("Main");
    expect(call.context.refundReason).toBe("Goodwill adjustment");
    expect(call.context.invoiceNumber).toBe("INV-0040");
    expect(call.context.receiptNumber).toBe("RCT-0007");
    expect(call.context.processedByName).toBe("Bobita Singh");
    expect(call.context.documentCurrency).toBe("cad");
    expect(String(call.context.actionUrl)).toContain("/dashboard/calendar");
  });

  it("uses notification_email then business email, not a hard-coded GVM address", () => {
    const src = read("lib/commerce/refund-email.ts");
    expect(src).toContain("notification_email");
    expect(src).toContain("owner_notifications_enabled");
    expect(src).not.toContain("@gvmbabyworld");
  });

  it("records sent only when delivery truth is sent/delivered", () => {
    expect(
      recordedDeliveryStatus({
        hasRecipient: true,
        logStatus: "sent",
      }),
    ).toBe("sent");
    expect(
      recordedDeliveryStatus({
        hasRecipient: true,
        logStatus: "queued",
      }),
    ).toBe("never_sent");
    const delivery = read("lib/communications/delivery.ts");
    expect(delivery).toContain('templateKey === "commerce.refund.business"');
    expect(delivery).toContain("logDelivery");
  });

  it("does not send a duplicate business refund notification without forceResend", async () => {
    mockRefundTables({
      refund: { ...refundRow, metadata: { business_email_status: "sent" } },
    });
    const sent = await sendRefundBusinessNotification({
      businessId: "biz",
      refundId: "rf-chase",
    });
    expect(sent.status).toBe("skipped");
    expect(sent.sendKind).toBe("resend");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends a first business notification when historical refund has no business send marker", async () => {
    mockRefundTables({
      refund: { ...refundRow, metadata: {} },
    });
    const sent = await sendRefundBusinessNotification({
      businessId: "biz",
      refundId: "rf-chase",
    });
    expect(sent.status).toBe("sent");
    expect(sent.sendKind).toBe("first");
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("explicit forceResend may resend after a recorded sent marker", async () => {
    mockRefundTables({
      refund: { ...refundRow, metadata: { business_email_status: "sent" } },
    });
    const sent = await sendRefundBusinessNotification({
      businessId: "biz",
      refundId: "rf-chase",
      forceResend: true,
    });
    expect(sent.status).toBe("sent");
    expect(sent.sendKind).toBe("resend");
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("failed business refund email is not Sent", async () => {
    mockRefundTables({ logs: { status: "failed" } });
    sendEmail.mockResolvedValue({ ok: false, error: "Mailbox rejected." });
    const sent = await sendRefundBusinessNotification({
      businessId: "biz",
      refundId: "rf-chase",
    });
    expect(sent.status).toBe("failed");
    expect(sent.ok).toBe(false);
    expect(sent.sendKind).toBe("first");
  });

  it("failed resend is not Sent and is classified as a resend attempt", async () => {
    mockRefundTables({
      refund: { ...refundRow, metadata: { business_email_status: "sent" } },
      logs: { status: "failed" },
    });
    sendEmail.mockResolvedValue({ ok: false, error: "Mailbox rejected." });
    const sent = await sendRefundBusinessNotification({
      businessId: "biz",
      refundId: "rf-chase",
      forceResend: true,
    });
    expect(sent.status).toBe("failed");
    expect(sent.ok).toBe(false);
    expect(sent.sendKind).toBe("resend");
  });

  it("preserves customer refund confirmation", async () => {
    mockRefundTables();
    const sent = await sendRefundConfirmationEmail({
      businessId: "biz",
      refundId: "rf-chase",
    });
    expect(sent.status).toBe("sent");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const call = sendEmail.mock.calls[0]?.[0] as { templateKey: string; to: string };
    expect(call.templateKey).toBe("commerce.refund");
    expect(call.to).toBe("chase@example.com");
    const refunds = read("lib/commerce/refunds.ts");
    expect(refunds).toContain("sendRefundConfirmationEmail");
    expect(refunds).toContain("sendRefundBusinessNotification");
  });

  it("refund notification failure does not roll back the refund", () => {
    const refunds = read("lib/commerce/refunds.ts");
    expect(refunds).toMatch(
      /Email failure must never reverse the refund/,
    );
    expect(refunds).toMatch(
      /sendRefundBusinessNotification[\s\S]*businessEmailStatus = notified.status/,
    );
    expect(refunds).toMatch(
      /catch \(err\)[\s\S]*businessEmailStatus = "failed"[\s\S]*return \{ ok: true/,
    );
  });

  it("business template is operational, not a customer greeting", () => {
    const rendered = renderEmailTemplate("commerce.refund.business", {
      businessId: "biz",
      businessName: "GVM Baby World Ultrasound",
      customerName: "Chase Dindial",
      staffName: "Team",
      serviceName: "Ultimate 2 Visit Package",
      startTime: "2026-08-19T15:00:00.000Z",
      timezone: "America/Toronto",
      locationName: "Main",
      amountCents: 5000,
      documentCurrency: "cad",
      refundTypeLabel: "Partial refund",
      originalPaymentCents: 33787,
      previouslyRefundedCents: 0,
      remainingRefundableCents: 28787,
      paymentMethodLabel: "E-Transfer",
      refundReason: "Goodwill adjustment",
      processedByName: "Bobita Singh",
      processedAtLabel: "Aug 18, 2026 · 3:00 PM",
      invoiceNumber: "INV-0040",
      receiptNumber: "RCT-0007",
      actionUrl: "https://example.test/dashboard/calendar?appointment=appt-chase",
    });
    expect(rendered.subject).toContain("Chase Dindial");
    expect(rendered.html).toContain("Refund processed");
    expect(rendered.html).toContain("Chase Dindial");
    expect(rendered.html).not.toMatch(/Hi Chase Dindial/);
    expect(rendered.html).toContain("Goodwill adjustment");
    expect(rendered.html).toContain("INV-0040");
    expect(rendered.html).toContain("RCT-0007");
    expect(rendered.html).toContain("Partial refund");
    expect(rendered.html).toContain("Open in");
  });
});

describe("Phase 6.2B PO closeout — structured refund reason", () => {
  it("maps preferred reasons into the existing text field", () => {
    expect(composeRefundReason({ code: "customer_cancellation" })).toEqual({
      ok: true,
      reason: "Customer cancellation",
    });
    expect(composeRefundReason({ code: "na" }).ok).toBe(false);
    expect(
      composeRefundReason({ code: "other", detail: "na" }).ok,
    ).toBe(false);
    expect(
      composeRefundReason({
        code: "other",
        detail: "Customer asked to keep a credit",
      }),
    ).toEqual({
      ok: true,
      reason: "Other: Customer asked to keep a credit",
    });
  });

  it("rejects meaningless stored reasons without rewriting history", () => {
    expect(validateStoredRefundReason("na").ok).toBe(false);
    expect(validateStoredRefundReason("Customer cancellation").ok).toBe(true);
    const refunds = read("lib/commerce/refunds.ts");
    expect(refunds).toContain("validateStoredRefundReason");
    expect(refunds).not.toContain("update({ reason:");
    const sheet = read("components/commerce/refund-transaction-sheet.tsx");
    expect(sheet).toContain("reason_code");
    expect(sheet).toContain("Choose a reason");
  });
});

describe("Phase 6.2B PO closeout — staff and customer email copy", () => {
  it("staff email does not greet the customer", () => {
    const rendered = renderEmailTemplate("appointment.staff", {
      businessId: "biz",
      businessName: "GVM Baby World Ultrasound",
      customerName: "Chase Dindial",
      staffName: "Bobita Singh",
      serviceName: "Ultimate 2 Visit Package",
      startTime: "2026-08-19T15:00:00.000Z",
      timezone: "America/Toronto",
      customMessage: "New appointment booked",
      appointmentTotalCents: 33787,
      depositRequiredCents: 5000,
      depositPaidCents: 5000,
      depositDueNowCents: 0,
      remainingBalanceCents: 28787,
      paymentStatusLabel: "Deposit paid",
      paymentMethodLabel: "E-Transfer",
    });
    expect(rendered.subject).toBe("New appointment — Chase Dindial");
    expect(rendered.html).toContain("Hi Bobita Singh");
    expect(rendered.html).not.toMatch(/Hi Chase Dindial/);
    expect(rendered.html).toContain("Customer");
    expect(rendered.html).toContain("Chase Dindial");
    expect(rendered.html).toContain("Deposit method");
    expect(rendered.html).toContain("E-Transfer");
    expect(rendered.html).not.toContain("Payment method");
  });

  it("customer-facing emails say Subtotal, not Catalog subtotal", () => {
    const confirmation = renderEmailTemplate("appointment.confirmation", {
      businessId: "biz",
      businessName: "GVM",
      customerName: "Chase Dindial",
      staffName: "Bobita Singh",
      serviceName: "Ultimate 2 Visit Package",
      startTime: "2026-08-19T15:00:00.000Z",
      timezone: "America/Toronto",
      subtotalCents: 29900,
      taxCents: 3887,
      appointmentTotalCents: 33787,
    });
    const refund = renderEmailTemplate("commerce.refund", {
      businessId: "biz",
      businessName: "GVM",
      customerName: "Chase Dindial",
      staffName: "Team",
      serviceName: "Ultimate 2 Visit Package",
      startTime: "2026-08-19T15:00:00.000Z",
      amountCents: 5000,
      originalPaymentCents: 33787,
    });
    expect(confirmation.html).toContain("Subtotal");
    expect(confirmation.html).not.toContain("Catalog subtotal");
    expect(refund.html).not.toContain("Catalog");
    expect(read("lib/communications/templates/index.ts")).not.toContain(
      "Catalog subtotal",
    );
  });

  it("stacks label and value for narrow email viewports", () => {
    const src = read("lib/communications/templates/index.ts");
    expect(src).toContain("word-break:break-word");
    expect(src).toContain("@media only screen and (max-width: 480px)");
    expect(src).toContain("display:block;width:100%");
    expect(src).not.toContain("width:120px");
    const rendered = renderEmailTemplate("appointment.staff", {
      businessId: "biz",
      businessName: "GVM",
      customerName: "Chase Dindial",
      staffName: "Bobita Singh",
      serviceName: "Ultimate 2 Visit Package",
      startTime: "2026-08-19T15:00:00.000Z",
      timezone: "America/Toronto",
      appointmentTotalCents: 33787,
      paymentMethodLabel: "E-Transfer",
      depositRequiredCents: 5000,
      depositPaidCents: 5000,
    });
    expect(rendered.html).toContain("Deposit method");
    expect(rendered.html).toContain("E-Transfer");
    expect(rendered.html).not.toMatch(
      /width:120px[\s\S]*Deposit method|Deposit method[\s\S]*width:120px/,
    );
  });
});

describe("Phase 6.2B PO closeout — package catalog forensic", () => {
  it("counts configured service_packages, not services named Package", () => {
    const reports = read("lib/actions/reports.ts");
    expect(reports).toContain('from("service_packages")');
    expect(reports).toContain("is_active");
    const hub = read("components/reports/reports-hub.tsx");
    expect(hub).toContain("Configured package products");
    const create = read("lib/booking-engine/mutations/create.ts");
    expect(create).toContain("Package: ${intent.packageName}");
    expect(create).not.toContain("entitlement");
    expect(create).not.toContain("visits_remaining");

    const services = buildServiceReport(gvmAugust, 0, 0, 0, NOW, TORONTO);
    expect(services.packageSales).toBe(0);
    expect(
      services.mostPopular.find((row) => row.label === "Ultimate 2 Visit Package")
        ?.value,
    ).toBe(1);
  });
});

describe("Phase 6.2B PO closeout — GVM reporting non-regression", () => {
  it("keeps booked-this-month as the full civil month", () => {
    const monthStart = startOfBusinessMonth(NOW, TORONTO);
    const monthEnd = endOfBusinessMonth(NOW, TORONTO);
    expect(new Date(ana.start_time).getTime()).toBeGreaterThanOrEqual(
      monthStart.getTime(),
    );
    expect(new Date(chase.start_time).getTime()).toBeLessThanOrEqual(
      monthEnd.getTime(),
    );
    const appointments = buildAppointmentReport(gvmAugust, 0, NOW, TORONTO);
    expect(appointments.booked).toBe(4);
    expect(appointments.averageBookingValue).toBe(247.75);
  });

  it("reconciles recognized value, tax, gross cash, deposits, and refunds", () => {
    const appointments = buildAppointmentReport(gvmAugust, 0, NOW, TORONTO);
    expect(appointments.booked).toBe(4);

    const employees = buildEmployeeReports(
      gvmAugust,
      [{ id: "staff-1", name: "Bobita Singh", is_active: true }],
      NOW,
      TORONTO,
    );
    expect(employees[0]?.productivity).toBe(4);
    expect(employees[0]?.revenue).toBe(991);

    const services = buildServiceReport(gvmAugust, 0, 0, 0, NOW, TORONTO);
    expect(
      services.mostPopular.reduce((sum, row) => sum + row.value, 0),
    ).toBe(4);

    const locations = buildLocationReports(
      gvmAugust,
      [{ id: "loc-1", name: "Main" }],
      new Map([["loc-1", 1]]),
      NOW,
      TORONTO,
    );
    expect(locations[0]?.appointments).toBe(4);
    expect(locations[0]?.customers).toBe(3);

    const revenue = buildRevenueBreakdown(gvmAugust, NOW, TORONTO);
    const august = revenue.monthly.find((point) => point.label.includes("2026-08"));
    expect(august?.value).toBe(991);

    const financial = buildFinancial(gvmAugust, [], NOW, null, TORONTO);
    expect(financial.taxesCents).toBe(12883);
    expect(financial.depositsCents).toBe(20000);

    const customers = buildCustomerReport(
      [
        { id: "cust-ana", name: "Ana", created_at: ana.customer!.created_at },
        { id: "cust-sum", name: "Sum", created_at: sum18.customer!.created_at },
        { id: "cust-chase", name: "Chase", created_at: chase.customer!.created_at },
      ],
      gvmAugust,
      [],
      NOW,
      TORONTO,
    );
    expect(customers.newCustomers).toBe(2);

    expect(
      sumGrossPaymentsCollectedCents([
        { status: "succeeded", kind: "deposit", amountCents: 5000 },
        { status: "succeeded", kind: "payment", amountCents: 19860 },
        { status: "succeeded", kind: "deposit", amountCents: 5000 },
        { status: "partially_refunded", kind: "payment", amountCents: 21668 },
        { status: "succeeded", kind: "deposit", amountCents: 5000 },
        { status: "succeeded", kind: "payment", amountCents: 21668 },
        { status: "succeeded", kind: "deposit", amountCents: 5000 },
        { status: "partially_refunded", kind: "payment", amountCents: 28787 },
        { status: "succeeded", kind: "refund", amountCents: 2500 },
        { status: "succeeded", kind: "refund", amountCents: 5000 },
      ]),
    ).toBe(111983);
    expect(
      isGrossCollectionTransaction({
        status: "partially_refunded",
        kind: "payment",
      }),
    ).toBe(true);
    expect(
      isGrossCollectionTransaction({ status: "succeeded", kind: "refund" }),
    ).toBe(false);
  });

  it("keeps refunds separate and does not reopen collectible debt", () => {
    const chaseAfterRefund = {
      price_cents: 29900,
      tax_cents: 3887,
      amount_paid_cents: 33787,
      amount_refunded_cents: 5000,
      deposit_cents: 5000,
      payment_status: "partially_paid",
      status: "confirmed",
    };
    expect(remainingBalanceCents(chaseAfterRefund)).toBe(5000);
    expect(collectibleRemainingBalanceCents(chaseAfterRefund)).toBe(0);
    expect(
      invoiceCollectibleBalanceCents({
        totalCents: 33787,
        amountPaidCents: 33787,
        status: "partial",
      }),
    ).toBe(0);
  });
});

describe("Phase 6.2B PO closeout — currency honesty", () => {
  it("new booking deposits inherit business currency; historic USD stays USD", () => {
    expect(resolveNewCommerceCurrency(undefined, "cad")).toBe("cad");
    expect(formatDocumentMoneyCents(5000, "usd", "cad")).toMatch(/USD/);
    expect(formatDocumentMoneyCents(5000, "usd", "cad")).not.toMatch(/^CA\$|^CAD/);
    const payments = read("lib/commerce/payments.ts");
    expect(payments).not.toMatch(/update\(\{[\s\S]*currency:\s*["']cad["']/);
  });
});

describe("Phase 6.2B PO closeout — print documents remain truthful", () => {
  it("invoice/receipt print keeps wrapping, refund visibility, and currency honesty", () => {
    const invoice = read("components/commerce/invoice-document.tsx");
    const css = read("app/globals.css");
    expect(invoice).toContain("break-words");
    expect(invoice).toContain("Currency {model.currencyCode}");
    expect(invoice).toContain("commerce-print-sheet");
    expect(css).toContain("@page");
    expect(css).toContain("commerce-print-keep");
    const workspace = read("lib/commerce/document-workspace.ts");
    expect(workspace).toContain("refund");
  });
});
