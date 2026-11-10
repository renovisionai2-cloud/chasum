import { describe, expect, it } from "vitest";
import { renderEmailTemplate } from "@/lib/communications/templates";
import type { AppointmentTemplateContext } from "@/lib/communications/types";

const context = {
  businessId: "synthetic-business", businessName: "Test Studio", customerName: "Test Customer",
  serviceName: "Synthetic Service", staffName: "Test Staff", startTime: "2026-11-09T15:00:00Z",
  subtotalCents: 11600, taxCents: 15, appointmentTotalCents: 11615,
  taxRateBps: 1300, taxLabel: "HST", amountCents: 11615,
} as AppointmentTemplateContext;

describe.each(["appointment.confirmation", "appointment.business", "commerce.receipt"] as const)("stored tax consistency %s", (key) => {
  it("detects a contradictory 13% claim while preserving stored amounts", () => {
    const r = renderEmailTemplate(key, context);
    expect(r.html).not.toContain("HST (13%)");
    expect(r.html).not.toMatch(/Financial review|tax rate.*not verified/i);
    expect(r.html).toContain("$116.15"); expect(r.html).toContain("$0.15");
  });
  it("retains a supported 13% rate and the exact $131.08 total", () => {
    const r = renderEmailTemplate(key, { ...context, taxCents: 1508, appointmentTotalCents: 13108 });
    expect(r.html).toContain("HST (13%)"); expect(r.html).toContain("$131.08");
  });
  it("accepts inclusive extraction when tax on the rounded net differs by one cent", () => {
    const r = renderEmailTemplate(key, { ...context, subtotalCents: 10265, taxCents: 1335, appointmentTotalCents: 11600 });
    expect(r.html).toContain("HST (13%)");
    expect(r.html).toContain("$13.35"); expect(r.html).toContain("$116.00");
    expect(r.html).not.toMatch(/financial amounts.*review|tax rate.*not verified/i);
  });
  it("detects inconsistent total without rewriting stored amounts", () => {
    const r = renderEmailTemplate(key, { ...context, taxCents: 1508, appointmentTotalCents: 11615 });
    expect(r.html).toMatch(/financial amounts.*review/i);
  });
});
