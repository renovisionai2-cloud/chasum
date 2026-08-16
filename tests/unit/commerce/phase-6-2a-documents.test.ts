import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatStaffFacingInstant } from "@/lib/business/datetime";
import { canCollectFromInvoice } from "@/lib/commerce/document-workspace";
import {
  documentCurrencyMismatch,
  documentCurrencyCode,
} from "@/lib/commerce/document-currency";
import { isCommerceInvoiceRecord } from "@/lib/commerce/money-contract";
import { formatMoneyCentsExact } from "@/lib/commerce/money";
import { invoiceWorkspacePath, receiptWorkspacePath } from "@/lib/commerce/document-paths";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Phase 6.2A invoice and receipt workspace", () => {
  it("uses commerce_invoices only and rejects SaaS / synthetic ids", () => {
    const loader = read("lib/commerce/document-workspace.ts");
    expect(loader).toContain('from("commerce_invoices")');
    expect(loader).not.toContain("billing_invoices");
    expect(isCommerceInvoiceRecord("appt:123")).toBe(false);
    expect(isCommerceInvoiceRecord("fd0a64f6-84ce-4efe-a864-5f2c1fe0bb69")).toBe(
      true,
    );
  });

  it("preserves Ana cents and receipt-as-one-payment", () => {
    expect(formatMoneyCentsExact(2860, "usd")).toContain("28.60");
    expect(formatMoneyCentsExact(24860, "usd")).toContain("248.60");
    expect(formatMoneyCentsExact(5000, "usd")).toContain("50.00");
    expect(formatMoneyCentsExact(19860, "cad")).toContain("198.60");
    expect(5000).not.toBe(24860);
  });

  it("does not relabel stored USD as CAD", () => {
    expect(documentCurrencyMismatch("usd", "cad")).toBe(true);
    expect(documentCurrencyCode("usd")).toBe("USD");
    expect(documentCurrencyCode("cad")).toBe("CAD");
  });

  it("hides Collect at zero collectible remaining and cancelled", () => {
    expect(
      canCollectFromInvoice({ collectHref: null, collectibleRemainingCents: 0 }),
    ).toBe(false);
    expect(
      canCollectFromInvoice({
        collectHref: "/dashboard/payments?customer=a&appointment=b",
        collectibleRemainingCents: 19860,
      }),
    ).toBe(true);
  });

  it("invoice email failure does not mutate invoice money columns", () => {
    const src = read("lib/commerce/invoice-email.ts");
    expect(src).not.toContain("amount_paid_cents");
    expect(src).not.toContain("balance_cents");
    expect(src).toContain("sendEmail");
  });

  it("receipt resend uses the existing receipt row", () => {
    const src = read("lib/actions/commerce-documents.ts");
    expect(src).toContain("sendPaymentReceiptNow");
    expect(src).toContain("receipt_number");
    expect(src).not.toContain("createReceiptForTransaction");
  });

  it("print layout hides portal chrome", () => {
    const shell = read("components/dashboard/shell.tsx");
    expect(shell).toContain("print:hidden");
    const badge = read("components/system/preview-build-badge.tsx");
    expect(badge).toContain("print:hidden");
  });

  it("workspace paths use human document numbers", () => {
    expect(invoiceWorkspacePath("INV-0033")).toContain("INV-0033");
    expect(receiptWorkspacePath("RCT-0001")).toContain("RCT-0001");
    expect(invoiceWorkspacePath("INV-0033")).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}/i,
    );
  });

  it("new invoice create stamps business currency without rewriting numbering", () => {
    const src = read("lib/commerce/invoices.ts");
    expect(src).toContain("currency: documentCurrency");
    expect(src).toContain("nextInvoiceNumber");
    expect(src).not.toContain("INV-0033");
  });

  it("does not import billing_invoices into the workspace UI", () => {
    const inv = read("components/commerce/invoice-document.tsx");
    const rec = read("components/commerce/receipt-document.tsx");
    expect(inv).not.toContain("billing_invoices");
    expect(rec).not.toContain("billing_invoices");
  });

  it("formats staff times in the business timezone", () => {
    expect(
      formatStaffFacingInstant("2026-08-15T00:30:00.000Z", "America/Toronto"),
    ).toContain("8:30 PM");
  });

  it("does not render internal IDs in document copy", () => {
    const inv = read("components/commerce/invoice-document.tsx");
    const rec = read("components/commerce/receipt-document.tsx");
    expect(inv).not.toContain("customerId");
    expect(inv).not.toContain("appointmentId");
    expect(rec).not.toContain("transactionId");
    expect(rec).toContain("This payment");
  });

  it("receipt refund routes to the appointment workspace, not a second collect engine", () => {
    const src = read("lib/commerce/document-workspace.ts");
    expect(src).toContain("refundHref = appointmentHref");
    expect(src).not.toMatch(/refundHref = collectPaymentPath/);
  });

  it("Payments recent transactions can open an existing receipt", () => {
    const dash = read("components/commerce/payments-dashboard.tsx");
    expect(dash).toContain("receiptWorkspacePath");
    expect(dash).toContain("View receipt");
  });

  it("invoice Collect stays gated on collectible remaining", () => {
    const src = read("lib/commerce/document-workspace.ts");
    expect(src).toContain("isCollectible");
    expect(src).toContain("collectibleRemainingCents > 0");
  });
});
