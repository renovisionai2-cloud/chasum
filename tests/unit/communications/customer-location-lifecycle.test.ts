import { describe, expect, it } from "vitest";
import { renderEmailTemplate } from "@/lib/communications/templates";
import { renderSmsTemplate } from "@/lib/communications/templates";
import type { AppointmentTemplateContext } from "@/lib/communications/types";

const ADDRESS_A = {
  addressLine1: "123 Example Street",
  addressLine2: "Suite 200",
  city: "Burlington",
  state: "ON",
  postalCode: "L7M 1A1",
};

const START_UTC = "2026-08-04T18:10:00.000Z";
const END_UTC = "2026-08-04T18:40:00.000Z";

const CUSTOMER_KEYS = [
  "appointment.confirmation",
  "appointment.reminder",
  "appointment.reschedule",
  "appointment.cancellation",
] as const;

function baseCtx(
  overrides: Partial<AppointmentTemplateContext> = {},
): AppointmentTemplateContext {
  return {
    businessId: "biz-a",
    businessName: "GVM Baby World Ultrasound",
    customerName: "Ana",
    staffName: "Bobita",
    serviceName: "Early gender (16-18 weeks)",
    startTime: START_UTC,
    endTime: END_UTC,
    timezone: "America/Vancouver",
    locationTimezone: "America/Vancouver",
    businessTimezone: "America/Toronto",
    locationName: "Burlington",
    locationAddress: ADDRESS_A,
    appointmentTotalCents: 18645,
    depositPaidCents: 5000,
    remainingBalanceCents: 13645,
    branding: {
      businessName: "GVM Baby World Ultrasound",
      supportEmail: "gvmbabyworld@gmail.com",
      showChasumBranding: false,
    },
    ...overrides,
  };
}

function countLabel(text: string, label: string): number {
  return text.split(label).length - 1;
}

describe("customer lifecycle location/address/directions", () => {
  it("CASE A: complete address appears in HTML and text for all four customer templates", () => {
    const ctx = baseCtx();
    for (const key of CUSTOMER_KEYS) {
      const rendered = renderEmailTemplate(key, ctx);
      expect(rendered.html).toContain("Burlington");
      expect(rendered.html).toContain("123 Example Street");
      expect(rendered.html).toContain("Suite 200");
      expect(rendered.html).toContain("ON");
      expect(rendered.html).toContain("L7M 1A1");
      expect(rendered.html).toContain("Get directions");
      expect(rendered.html).toContain("https://www.google.com/maps/search/?api=1");
      expect(rendered.html).toContain("query=123%20Example%20Street%2C%20Suite%20200%2C%20Burlington%2C%20ON%20L7M%201A1");
      expect(rendered.html).not.toContain("999 Other Avenue");
      expect(rendered.html).not.toContain("Hamilton");

      expect(rendered.text).toContain("Location:");
      expect(rendered.text).toContain("Burlington");
      expect(rendered.text).toContain("Address:");
      expect(rendered.text).toContain("123 Example Street");
      expect(rendered.text).toContain("Directions:");
      expect(rendered.text).toContain("https://www.google.com/maps/search/?api=1&query=");
      expect(rendered.text).not.toContain("999 Other Avenue");
    }
  });

  it("confirmation keeps one structured Service/Provider/When block plus arrival lines", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", baseCtx());
    expect(rendered.text).toContain("Your appointment is confirmed.");
    expect(countLabel(rendered.text, "Service:")).toBe(1);
    expect(countLabel(rendered.text, "Provider:")).toBe(1);
    expect(countLabel(rendered.text, "When:")).toBe(1);
    expect(rendered.text).toContain("Times shown in PDT.");
    expect(rendered.text).toContain("Location: Burlington");
    expect(rendered.text).toContain("Address:");
    expect(rendered.text).toContain("Directions:");
  });

  it("reminder keeps the concise sentence and appends arrival lines only", () => {
    const rendered = renderEmailTemplate("appointment.reminder", baseCtx());
    expect(rendered.subject).toBe(
      "Reminder: Early gender (16-18 weeks) with GVM Baby World Ultrasound",
    );
    expect(rendered.text).toMatch(
      /^Reminder: Early gender \(16-18 weeks\) with Bobita on /,
    );
    expect(rendered.text).toContain("Times shown in PDT.");
    expect(rendered.text).toContain("Location: Burlington");
    expect(rendered.text).toContain("Address:");
    expect(rendered.text).toContain("123 Example Street");
    expect(rendered.text).toContain("Directions:");
    expect(rendered.text).not.toContain("Service:");
    expect(rendered.text).not.toContain("Provider:");
    expect(rendered.text).not.toContain("When:");
  });

  it("reschedule keeps the updated-time sentence and appends arrival lines only", () => {
    const rendered = renderEmailTemplate("appointment.reschedule", baseCtx());
    expect(rendered.subject).toMatch(/^Updated time —/);
    expect(rendered.text).toMatch(
      /^Your Early gender \(16-18 weeks\) appointment is now /,
    );
    expect(rendered.text).toContain("Times shown in PDT.");
    expect(rendered.text).toContain("Location: Burlington");
    expect(rendered.text).toContain("Address:");
    expect(rendered.text).toContain("Directions:");
    expect(rendered.text).not.toContain("Service:");
    expect(rendered.text).not.toContain("Provider:");
    expect(rendered.text).not.toContain("When:");
  });

  it("cancellation keeps the cancellation sentence and appends arrival lines only", () => {
    const rendered = renderEmailTemplate("appointment.cancellation", baseCtx());
    expect(rendered.subject).toMatch(/^Cancelled —/);
    expect(rendered.text).toMatch(
      /^Your Early gender \(16-18 weeks\) on .+ has been cancelled\./,
    );
    expect(rendered.text).toContain("Times shown in PDT.");
    expect(rendered.text).toContain("Location: Burlington");
    expect(rendered.text).toContain("Address:");
    expect(rendered.text).toContain("Directions:");
    expect(rendered.text).not.toContain("Service:");
    expect(rendered.text).not.toContain("Provider:");
    expect(rendered.text).not.toContain("When:");
  });

  it("CASE B: line1 + city is displayable and eligible for directions", () => {
    const rendered = renderEmailTemplate(
      "appointment.confirmation",
      baseCtx({
        locationAddress: {
          addressLine1: "123 Example Street",
          addressLine2: null,
          city: "Burlington",
          state: null,
          postalCode: null,
        },
      }),
    );
    expect(rendered.html).toContain("123 Example Street");
    expect(rendered.html).toContain("Burlington");
    expect(rendered.html).toContain("Get directions");
    expect(rendered.html).not.toContain("Suite 200");
    expect(rendered.text).toContain("Address:");
    expect(rendered.text).toContain("Directions:");
  });

  it("CASE B: city/state only renders truthfully without directions", () => {
    const rendered = renderEmailTemplate(
      "appointment.confirmation",
      baseCtx({
        locationAddress: {
          addressLine1: null,
          addressLine2: null,
          city: "Burlington",
          state: "ON",
          postalCode: null,
        },
      }),
    );
    expect(rendered.html).toContain("Burlington, ON");
    expect(rendered.html).not.toContain("Get directions");
    expect(rendered.html).not.toContain("maps/search");
    expect(rendered.text).toContain("Address:");
    expect(rendered.text).toContain("Burlington, ON");
    expect(rendered.text).not.toContain("Directions:");
  });

  it("CASE C: name-only location has no blank Address row or Maps CTA", () => {
    const rendered = renderEmailTemplate(
      "appointment.confirmation",
      baseCtx({ locationAddress: null }),
    );
    expect(rendered.html).toContain("Burlington");
    expect(rendered.html).not.toContain("Get directions");
    expect(rendered.html).not.toContain("maps/search");
    expect(rendered.html).not.toMatch(/Address:\s*</);
    expect(rendered.text).toContain("Location: Burlington");
    expect(rendered.text).not.toContain("Address:");
    expect(rendered.text).not.toContain("Directions:");
  });

  it("preserves Need to change or cancel? contact guidance", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", baseCtx());
    expect(rendered.html).toContain("Need to change or cancel?");
    expect(rendered.html).toContain("mailto:gvmbabyworld@gmail.com?subject=");
  });
});

describe("staff/business templates stay free of customer directions CTA", () => {
  it("does not inject Get directions into staff or business email", () => {
    const ctx = baseCtx({ bookingChannel: "staff" });
    const staff = renderEmailTemplate("appointment.staff", ctx);
    const business = renderEmailTemplate("appointment.business", ctx);
    for (const rendered of [staff, business]) {
      expect(rendered.html).toContain("Burlington");
      expect(rendered.html).not.toContain("Get directions");
      expect(rendered.html).not.toContain("maps/search");
      expect(rendered.html).not.toContain("123 Example Street");
      expect(rendered.text).not.toContain("Directions:");
      expect(rendered.html).not.toContain("Times shown in");
    }
  });
});

describe("customer location timezone cue", () => {
  it("renders Vancouver-local time and a concise timezone cue when location TZ differs from business TZ", () => {
    const rendered = renderEmailTemplate(
      "appointment.confirmation",
      baseCtx(),
    );
    expect(rendered.html).toContain("11:10 AM");
    expect(rendered.html).toContain("11:40 AM");
    expect(rendered.html).not.toContain("2:10 PM");
    expect(rendered.html).not.toContain("1:10 PM");
    expect(rendered.html).toMatch(/Times shown in PDT\./);
    expect(rendered.text).toContain("Times shown in PDT.");
    expect(rendered.html).not.toContain("America/Vancouver");
    expect(rendered.html).not.toContain("America/Toronto");
  });

  it("does not add a redundant cue when location and business share a timezone", () => {
    const rendered = renderEmailTemplate(
      "appointment.confirmation",
      baseCtx({
        timezone: "America/Toronto",
        locationTimezone: "America/Toronto",
        businessTimezone: "America/Toronto",
        startTime: "2026-08-04T15:10:00.000Z",
        endTime: "2026-08-04T15:40:00.000Z",
      }),
    );
    expect(rendered.html).toContain("11:10 AM");
    expect(rendered.html).not.toContain("Times shown in");
  });
});

describe("SMS remains out of scope for Issue #62", () => {
  it("does not add address or directions to customer SMS", () => {
    const sms = renderSmsTemplate("appointment.confirmation", baseCtx());
    expect(sms.text).not.toContain("123 Example Street");
    expect(sms.text).not.toContain("Get directions");
    expect(sms.text).not.toContain("maps/search");
  });
});
