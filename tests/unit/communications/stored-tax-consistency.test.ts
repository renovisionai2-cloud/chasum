import { describe, expect, it, vi } from "vitest";
import { storedTaxDisplay } from "@/lib/commerce/stored-tax-display";
import { renderEmailTemplate } from "@/lib/communications/templates";
import type { AppointmentTemplateContext } from "@/lib/communications/types";

const context = {
  businessId: "synthetic-business", businessName: "Test Studio", customerName: "Test Customer",
  serviceName: "Synthetic Service", staffName: "Test Staff", startTime: "2026-11-09T15:00:00Z",
  subtotalCents: 11600, taxCents: 15, appointmentTotalCents: 11615,
  taxRateBps: 1300, taxLabel: "HST", amountCents: 11615,
} as AppointmentTemplateContext;

const customerMessage = "Please contact Test Studio to confirm the appointment total shown in this message.";
const internalMessage = "The stored subtotal and tax do not match the displayed appointment total. Review the original financial records before correcting the amount or collecting a balance.";
const templates = ["appointment.confirmation", "appointment.business", "commerce.receipt", "appointment.staff"] as const;

function expectNoWarning(rendered: ReturnType<typeof renderEmailTemplate>) {
  expect(rendered.html + rendered.text).not.toMatch(/Financial review|financial amounts.*review|Amount mismatch|Please contact .* to confirm the appointment total|The stored subtotal and tax do not match/i);
}

describe.each(templates)("stored tax consistency %s", (key) => {
  const customer = key === "appointment.confirmation" || key === "commerce.receipt";
  const heading = customer ? "Appointment total" : "Amount mismatch";
  const message = customer ? customerMessage : internalMessage;

  it("detects a contradictory 13% claim while preserving stored amounts", () => {
    const r = renderEmailTemplate(key, context);
    expect(r.html).not.toContain("HST (13%)");
    expect(r.html).not.toMatch(/Financial review|tax rate.*not verified/i);
    expect(r.html).toContain("$116.15"); expect(r.html).toContain("$0.15");
    expectNoWarning(r);
  });
  it("retains a supported 13% rate and the exact $131.08 total", () => {
    const r = renderEmailTemplate(key, { ...context, taxCents: 1508, appointmentTotalCents: 13108 });
    expect(r.html).toContain("HST (13%)"); expect(r.html).toContain("$131.08");
    expectNoWarning(r);
  });
  it("accepts inclusive extraction when tax on the rounded net differs by one cent", () => {
    const r = renderEmailTemplate(key, { ...context, subtotalCents: 10265, taxCents: 1335, appointmentTotalCents: 11600 });
    expect(r.html).toContain("HST (13%)");
    expect(r.html).toContain("$13.35"); expect(r.html).toContain("$116.00");
    expect(r.html).not.toMatch(/financial amounts.*review|tax rate.*not verified/i);
    expectNoWarning(r);
  });
  it("detects inconsistent total without rewriting stored amounts", () => {
    const r = renderEmailTemplate(key, { ...context, taxCents: 1508, appointmentTotalCents: 11615 });
    const doc = new DOMParser().parseFromString(r.html, "text/html");
    const warning = [...doc.querySelectorAll("tr")].find(row => row.cells[1]?.textContent === message);
    expect(warning?.cells[0].textContent).toBe(heading);
    expect(warning?.cells[1].textContent).toBe(message);
    expect(r.text).toContain(`${heading}: ${message}`);
    for (const output of [r.html, r.text]) {
      expect(output.split(message)).toHaveLength(2);
      expect(output).not.toContain(customer ? internalMessage : customerMessage);
      if (customer) expect(output).not.toContain("Amount mismatch");
      expect(output).not.toContain("Financial amounts need review.");
    }
    expect(r.html).toContain("$116.00");
    expect(r.html).toContain("$15.08");
    expect(r.html).toContain("$116.15");
    expect(r.html + r.text).not.toContain("$131.08");
    if (key !== "appointment.staff") expect(r.text).toContain("$116.15");
    if (key === "commerce.receipt") {
      expect(r.text).toContain("Subtotal: $116.00");
      expect(r.text).toContain("Tax: $15.08");
      expect(r.text).toContain("Amount received: $116.15");
      expect(r.html).toContain("Thank you — payment received.");
    }
  });
  it.each([undefined, null, 13, 0])("does not warn for consistent amounts with historical rate %s", taxRateBps => {
    expectNoWarning(renderEmailTemplate(key, { ...context, taxRateBps }));
  });
  it("does not warn for the actual November 9 GVM stored amounts", () => {
    expectNoWarning(renderEmailTemplate(key, { ...context, businessName: "GVM Baby World", subtotalCents: 11600, taxCents: 15, appointmentTotalCents: 11615 }));
  });
  it.each([
    { subtotalCents: null }, { taxCents: null },
    { subtotalCents: undefined }, { taxCents: undefined },
    { subtotalCents: -1 }, { taxCents: -1 },
    { subtotalCents: 11600.5 }, { taxCents: 15.5 },
    { subtotalCents: Number.MAX_SAFE_INTEGER + 1 }, { taxCents: Number.MAX_SAFE_INTEGER + 1 },
  ])("does not treat unknown or invalid stored amounts as contradictory: %j", amounts => {
    expectNoWarning(renderEmailTemplate(key, { ...context, ...amounts }));
  });
  it("preserves each template's resolved-total precedence", () => {
    const r = renderEmailTemplate(key, { ...context, taxCents: 1508, appointmentTotalCents: undefined });
    // Receipts prefer the stored subtotal + tax; appointment blocks prefer amountCents.
    if (key === "commerce.receipt") {
      expectNoWarning(r);
      expect(r.html).toContain("$131.08");
    } else {
      expect(r.html).toContain(message);
      expect(r.text).toContain(message);
      expect(r.html).toContain("$116.15");
    }
    expectNoWarning(renderEmailTemplate(key, { ...context, appointmentTotalCents: undefined, amountCents: undefined }));
  });
  it("renders deterministically without mutating financial context or making send requests", () => {
    const input = Object.freeze({ ...context, taxCents: 1508, depositPaidCents: 2500, remainingBalanceCents: 9115 });
    const before = { ...input };
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Rendering must not send requests"));
    try {
      const first = renderEmailTemplate(key, input);
      expect(renderEmailTemplate(key, input)).toEqual(first);
      expect(input).toEqual(before);
      expect(fetch).not.toHaveBeenCalled();
      expect(first.html).toContain("$25.00");
      expect(first.html).toContain("$91.15");
    } finally {
      fetch.mockRestore();
    }
  });
});

describe.each(["appointment.confirmation", "commerce.receipt"])("customer business-name substitution %s", key => {
  it("escapes the appointment business name for HTML and preserves readable plain text", () => {
    const businessName = 'Élodie & Sons <Studio> "East"';
    const r = renderEmailTemplate(key, { ...context, businessName, taxCents: 1508 });
    expect(r.html).toContain("Please contact Élodie &amp; Sons &lt;Studio&gt; &quot;East&quot; to confirm the appointment total shown in this message.");
    expect(r.html).not.toContain("<Studio>");
    expect(r.text).toContain(`Appointment total: Please contact ${businessName} to confirm the appointment total shown in this message.`);
    expect(r.text).not.toContain("&amp;");
    const other = renderEmailTemplate(key, { ...context, businessId: "other-business", businessName: "Another Studio", taxCents: 1508 });
    expect(other.html + other.text).toContain("Please contact Another Studio to confirm the appointment total shown in this message.");
    expect(other.html + other.text).not.toContain("Élodie");
  });
});

it("requires a resolved total while permitting a genuine zero-amount mismatch", () => {
  for (const appointmentTotalCents of [null, undefined]) {
    expect(storedTaxDisplay({ subtotalCents: 11600, taxCents: 1508, appointmentTotalCents }).totalMismatch).toBe(false);
  }
  expect(storedTaxDisplay({ subtotalCents: 0, taxCents: 0, appointmentTotalCents: 0 }).totalMismatch).toBe(false);
  expect(storedTaxDisplay({ subtotalCents: 0, taxCents: 0, appointmentTotalCents: 1 }).totalMismatch).toBe(true);
});

it.each(["appointment.reminder", "appointment.reschedule", "appointment.cancellation", "commerce.invoice", "commerce.deposit_request"])("does not introduce a mismatch warning into unrelated %s", key => {
  expectNoWarning(renderEmailTemplate(key, { ...context, taxCents: 1508 }));
});
