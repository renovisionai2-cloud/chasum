import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderEmailTemplate } from "@/lib/communications/templates";

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

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";
import {
  buildRefundEmailContext,
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
  // Allow `await supabase.from(...).select().eq()` list queries.
  api.then = (
    onFulfilled?: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

describe("Phase 6.0B refund confirmation email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({ ok: true, messageId: "msg-1" });
    writeCommerceAudit.mockResolvedValue(undefined);
  });

  it("template renders full refund confirmation without raw UUID", () => {
    const rendered = renderEmailTemplate("commerce.refund", {
      businessId: "biz",
      businessName: "Glow Studio",
      customerName: "Alex",
      staffName: "Team",
      serviceName: "Facial",
      startTime: "2026-08-12T15:00:00.000Z",
      timezone: "America/Toronto",
      amountCents: 26668,
      paymentMethodLabel: "Cash",
      refundTypeLabel: "Full refund",
      originalPaymentCents: 26668,
      previouslyRefundedCents: 0,
      remainingRefundableCents: 0,
      refundDateLabel: "Aug 12, 2026",
      refundTenderNote: "Chasum recorded this cash refund for the business.",
      receiptNumber: "RF-ABCD1234",
    });
    expect(rendered.subject).toBe("Refund confirmation — Glow Studio");
    expect(rendered.html).toContain("Refund confirmation");
    expect(rendered.html).toContain("$266.68");
    expect(rendered.html).toContain("Full refund");
    expect(rendered.html).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });

  it("template renders partial refund with remaining refundable", () => {
    const rendered = renderEmailTemplate("commerce.refund", {
      businessId: "biz",
      businessName: "Glow Studio",
      customerName: "Alex",
      staffName: "Team",
      serviceName: "Facial",
      startTime: "2026-08-12T15:00:00.000Z",
      amountCents: 5000,
      paymentMethodLabel: "E-Transfer",
      refundTypeLabel: "Partial refund",
      originalPaymentCents: 20000,
      previouslyRefundedCents: 5000,
      remainingRefundableCents: 10000,
      refundTenderNote: "Chasum recorded this e-transfer refund for the business.",
    });
    expect(rendered.html).toContain("partial refund");
    expect(rendered.html).toContain("Original payment");
    expect(rendered.html).toContain("Remaining refundable");
    expect(rendered.text).toContain("Partial refund");
  });

  it("wiring: processCommerceRefund triggers email only on success", () => {
    const refunds = read("lib/commerce/refunds.ts");
    expect(refunds).toContain("sendRefundConfirmationEmail");
    expect(refunds).toContain('if (status === "succeeded")');
    expect(refunds).toContain("emailStatus");
    expect(refunds).toMatch(
      /Email failure must never reverse the refund/,
    );
  });

  it("cancellation template confirms cancel without refund language", () => {
    const rendered = renderEmailTemplate("appointment.cancellation", {
      businessId: "biz",
      businessName: "Glow Studio",
      customerName: "Ana",
      staffName: "Jordan",
      serviceName: "Facial",
      startTime: "2026-08-12T15:00:00.000Z",
      timezone: "America/Toronto",
      locationName: "Main studio",
    });
    expect(rendered.subject).toMatch(/Cancelled/);
    expect(rendered.html).toContain("Glow Studio");
    expect(rendered.html).toContain("Ana");
    expect(rendered.html).toContain("Facial");
    expect(rendered.html).toContain("Jordan");
    expect(rendered.html).toContain("Main studio");
    expect(rendered.html).toMatch(/not a payment or refund notice/i);
    expect(rendered.text).toMatch(/not a payment or refund notice/i);
  });

  it("refund email lookups use service client", () => {
    const email = read("lib/commerce/refund-email.ts");
    expect(email).not.toContain("Stripe Elements");
    expect(email).not.toContain("create migration");
    expect(email).toContain("commerce.refund");
    expect(email).toContain("createServiceClient");
    expect(email).not.toContain('from "@/lib/supabase/server"');
  });

  it("customer without email → unavailable, does not call sendEmail", async () => {
    const refundRow = {
      id: "rf-1",
      business_id: "biz",
      customer_id: "cust",
      transaction_id: "tx-1",
      invoice_id: null,
      appointment_id: null,
      amount_cents: 5000,
      currency: "cad",
      reason: "Customer request",
      refund_type: "full",
      approval_status: "approved",
      status: "succeeded",
      provider: "manual",
      provider_reference: null,
      created_at: "2026-08-12T12:00:00.000Z",
    };
    const txRow = {
      id: "tx-1",
      business_id: "biz",
      customer_id: "cust",
      appointment_id: null,
      invoice_id: null,
      kind: "payment",
      status: "succeeded",
      method: "cash",
      amount_cents: 5000,
      currency: "cad",
      provider: "manual",
      provider_reference: null,
      provider_payment_intent_id: null,
      description: null,
      occurred_at: "2026-08-12T11:00:00.000Z",
      created_at: "2026-08-12T11:00:00.000Z",
    };

    const from = vi.fn((table: string) => {
      if (table === "commerce_refunds") {
        return chain({ data: refundRow, error: null });
      }
      if (table === "commerce_transactions") {
        return chain({ data: txRow, error: null });
      }
      if (table === "customers") {
        return chain({
          data: { id: "cust", name: "Alex", email: null },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });
    vi.mocked(createServiceClient).mockReturnValue({ from } as never);

    const built = await buildRefundEmailContext({
      businessId: "biz",
      refundId: "rf-1",
    });
    expect(built.ok).toBe(false);
    if (!built.ok) expect(built.status).toBe("unavailable");

    const sent = await sendRefundConfirmationEmail({
      businessId: "biz",
      refundId: "rf-1",
    });
    expect(sent.status).toBe("unavailable");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("email provider failure returns failed without throwing", async () => {
    const refundRow = {
      id: "rf-2",
      business_id: "biz",
      customer_id: "cust",
      transaction_id: "tx-2",
      invoice_id: null,
      appointment_id: null,
      amount_cents: 10000,
      currency: "cad",
      reason: "Partial",
      refund_type: "partial",
      approval_status: "approved",
      status: "succeeded",
      provider: "manual",
      provider_reference: null,
      created_at: "2026-08-12T12:00:00.000Z",
    };
    const txRow = {
      id: "tx-2",
      business_id: "biz",
      customer_id: "cust",
      appointment_id: null,
      invoice_id: null,
      kind: "payment",
      status: "partially_refunded",
      method: "e_transfer",
      amount_cents: 20000,
      currency: "cad",
      provider: "manual",
      provider_reference: null,
      provider_payment_intent_id: null,
      description: null,
      occurred_at: "2026-08-12T11:00:00.000Z",
      created_at: "2026-08-12T11:00:00.000Z",
    };

    let refundLookup = 0;
    const from = vi.fn((table: string) => {
      if (table === "commerce_refunds") {
        refundLookup += 1;
        if (refundLookup === 1) {
          return chain({ data: refundRow, error: null });
        }
        // prior refunds list + metadata update
        return chain({
          data: [{ amount_cents: 10000, status: "succeeded", id: "rf-2" }],
          error: null,
        });
      }
      if (table === "commerce_transactions") {
        return chain({ data: txRow, error: null });
      }
      if (table === "customers") {
        return chain({
          data: { id: "cust", name: "Alex", email: "alex@example.com" },
          error: null,
        });
      }
      if (table === "businesses") {
        return chain({
          data: { name: "Glow", timezone: "America/Toronto" },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });
    vi.mocked(createServiceClient).mockReturnValue({ from } as never);
    sendEmail.mockResolvedValue({ ok: false, error: "Resend down" });

    const sent = await sendRefundConfirmationEmail({
      businessId: "biz",
      refundId: "rf-2",
    });
    expect(sent.ok).toBe(false);
    expect(sent.status).toBe("failed");
    expect(sendEmail).toHaveBeenCalled();
  });

  it("UI success surfaces customer confirmation note", () => {
    const action = read("lib/actions/commerce.ts");
    expect(action).toContain("Customer confirmation sent.");
    expect(action).toContain("Customer email could not be sent");
    const sheet = read("components/commerce/refund-transaction-sheet.tsx");
    expect(sheet).toContain("success={state.success}");
  });

  it("failed/rejected refund paths do not import email before success", () => {
    const refunds = read("lib/commerce/refunds.ts");
    // Email import is inside succeeded branch only.
    expect(refunds).toMatch(
      /if \(status === "succeeded"\)[\s\S]*sendRefundConfirmationEmail/,
    );
  });
});
