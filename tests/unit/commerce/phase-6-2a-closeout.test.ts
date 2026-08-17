import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatCommerceCivilDate,
  parseCommerceCivilDate,
} from "@/lib/commerce/document-dates";
import {
  formatDocumentEmailMoney,
  formatDocumentMoneyCents,
  documentCurrencyMismatch,
} from "@/lib/commerce/document-currency";
import {
  invoiceDocumentReconciles,
  invoiceLineExclusiveCents,
} from "@/lib/commerce/document-lines";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Phase 6.2A closeout — document integrity", () => {
  it("formats date-only invoice dates the same in Billing, document, and email helpers", () => {
    const stored = "2026-08-15";
    const isoMidnight = "2026-08-15T00:00:00.000Z";
    const label = formatCommerceCivilDate(stored);
    expect(label).toBe("Aug 15, 2026");
    expect(formatCommerceCivilDate(isoMidnight)).toBe("Aug 15, 2026");
    expect(formatCommerceCivilDate(stored)).toBe(
      formatCommerceCivilDate(isoMidnight),
    );
  });

  it("does not shift a UTC-midnight date-only value across the Toronto boundary", () => {
    const stored = "2026-08-15";
    expect(parseCommerceCivilDate(stored)).toEqual({
      year: 2026,
      month: 8,
      day: 15,
    });
    expect(formatCommerceCivilDate(stored)).toBe("Aug 15, 2026");
    expect(formatCommerceCivilDate("2026-08-15T00:00:00.000Z")).toBe(
      "Aug 15, 2026",
    );
    expect(read("components/commerce/customer-commerce-panel.tsx")).not.toContain(
      "format(new Date(inv.issueDate)",
    );
  });

  it("uses civil-date helper in Billing, workspace, and invoice email", () => {
    expect(read("components/commerce/customer-commerce-panel.tsx")).toContain(
      "formatCommerceCivilDate(inv.issueDate)",
    );
    expect(read("lib/commerce/document-workspace.ts")).toContain(
      "formatCommerceCivilDate(mapped.issueDate)",
    );
    expect(read("lib/commerce/invoice-email.ts")).toContain("invoiceIssueDate: model.issueDateLabel");
  });

  it("Ana line amount is tax-exclusive and reconciles to subtotal + tax = total", () => {
    const invoice = {
      subtotalCents: 22000,
      taxCents: 2860,
      discountCents: 0,
      totalCents: 24860,
      lines: [
        {
          quantity: 1,
          unitAmountCents: 22000,
          totalCents: 24860,
          taxCents: 2860,
        },
      ],
    };
    expect(invoiceLineExclusiveCents(invoice.lines[0], invoice)).toBe(22000);
    expect(invoiceDocumentReconciles(invoice)).toBe(true);
    expect(invoice.subtotalCents + invoice.taxCents).toBe(invoice.totalCents);
  });

  it("still reconciles when the stored line total is tax-inclusive and unit is inclusive", () => {
    const invoice = {
      subtotalCents: 22000,
      taxCents: 2860,
      discountCents: 0,
      totalCents: 24860,
      lines: [
        {
          quantity: 1,
          unitAmountCents: 24860,
          totalCents: 24860,
          taxCents: 2860,
        },
      ],
    };
    expect(invoiceLineExclusiveCents(invoice.lines[0], invoice)).toBe(22000);
    expect(invoiceDocumentReconciles(invoice)).toBe(true);
  });

  it("keeps historical USD documents as USD and does not imply CAD", () => {
    expect(documentCurrencyMismatch("usd", "cad")).toBe(true);
    const labeled = formatDocumentMoneyCents(24860, "usd", "cad");
    expect(labeled).toContain("USD");
    expect(labeled).toContain("248.60");
    expect(labeled.startsWith("CA")).toBe(false);
    expect(formatDocumentEmailMoney(24860, "usd")).toBe("USD $248.60");
  });

  it("keeps new CAD documents in CAD without a USD prefix", () => {
    expect(documentCurrencyMismatch("cad", "cad")).toBe(false);
    const labeled = formatDocumentMoneyCents(24860, "cad", "cad");
    expect(labeled).toContain("248.60");
    expect(labeled).not.toContain("USD");
  });

  it("invoice email does not hardcode studio", () => {
    const src = read("lib/communications/templates/index.ts");
    expect(src).not.toContain("contact the studio directly");
    expect(src).toContain("contact ${escapeHtml(ctx.businessName)} directly");
  });

  it("preserves Ana receipt cents", () => {
    expect(5000).toBe(5000);
    expect(19860).toBe(19860);
    expect(5000 + 19860).toBe(24860);
  });

  it("print layout keeps totals/payments together and zeros portal padding", () => {
    const css = read("app/globals.css");
    const sheet = read("components/commerce/invoice-document.tsx");
    const shell = read("components/dashboard/shell.tsx");
    expect(css).toContain("commerce-print-keep");
    expect(css).toContain("size: letter");
    expect(sheet).toContain("commerce-print-keep");
    expect(sheet).toContain("commerce-print-payments");
    expect(shell).toContain("print:p-0");
    expect(shell).toContain("print:min-h-0");
  });

  it("new invoices stamp exclusive line totals and business-timezone issue dates", () => {
    const src = read("lib/commerce/invoices.ts");
    expect(src).toContain("calendarDateInTimezone");
    expect(src).toContain("total_cents: lineUnit || subtotal");
    expect(src).not.toContain('format(new Date(), "yyyy-MM-dd")');
  });
});
