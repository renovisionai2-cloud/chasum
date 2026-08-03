import { describe, expect, it } from "vitest";
import {
  formatFromHeader,
  resolveTenantEmailBranding,
  sanitizeEmailDisplayName,
  toBrandingContext,
} from "@/lib/communications/tenant-email-branding";
import { renderEmailTemplate } from "@/lib/communications/templates";
import { planAllowsRemoveBranding } from "@/lib/billing/plan-features";

describe("sanitizeEmailDisplayName", () => {
  it("strips header-injection characters", () => {
    expect(sanitizeEmailDisplayName('GVM <evil@x.com>\r\nBcc: a@b.com')).toBe(
      "GVM evil@x.com Bcc: a@b.com",
    );
  });

  it("falls back when empty", () => {
    expect(sanitizeEmailDisplayName("   ")).toBe("Chasum");
  });
});

describe("formatFromHeader", () => {
  it("builds business-named From on platform address", () => {
    expect(
      formatFromHeader(
        "GVM Baby World Ultrasound",
        "Chasum <notifications@chasumai.com>",
      ),
    ).toBe("GVM Baby World Ultrasound <notifications@chasumai.com>");
  });

  it("quotes names with commas", () => {
    expect(formatFromHeader("Acme, Inc", "notifications@chasumai.com")).toBe(
      '"Acme, Inc" <notifications@chasumai.com>',
    );
  });
});

describe("planAllowsRemoveBranding", () => {
  it("denies Free / starter", () => {
    expect(
      planAllowsRemoveBranding({ subscription_plan_key: "starter" }),
    ).toBe(false);
    expect(planAllowsRemoveBranding({ subscription_plan_key: "free" })).toBe(
      false,
    );
  });

  it("allows Professional, Business, Enterprise", () => {
    expect(
      planAllowsRemoveBranding({ subscription_plan_key: "professional" }),
    ).toBe(true);
    expect(
      planAllowsRemoveBranding({ subscription_plan_key: "business" }),
    ).toBe(true);
    expect(
      planAllowsRemoveBranding({ subscription_plan_key: "enterprise" }),
    ).toBe(true);
  });

  it("Private Alpha elevates to Professional branding rights without forcing Chasum", () => {
    expect(
      planAllowsRemoveBranding({
        subscription_plan_key: "starter",
        private_alpha_enabled: true,
      }),
    ).toBe(true);
  });
});

describe("resolveTenantEmailBranding", () => {
  const base = {
    name: "GVM Baby World Ultrasound",
    email: "ops@example.com",
    notification_email: "bookings@example.com",
    phone: "555-0100",
    website: "https://example.com",
    logo_url: "https://cdn.example.com/logo.png",
    brand_color: "#1a5f7a",
    accent_color: "#0ea5e9",
  };

  it("customer Free plan keeps Powered by Chasum secondary", () => {
    const result = resolveTenantEmailBranding(
      { ...base, subscription_plan_key: "starter" },
      "customer",
    );
    expect(result.displaySenderName).toBe("GVM Baby World Ultrasound");
    expect(result.fromHeader).toContain("GVM Baby World Ultrasound");
    expect(result.fromHeader).toContain("notifications@chasumai.com");
    expect(result.replyToAddress).toBe("bookings@example.com");
    expect(result.logoUrl).toBe("https://cdn.example.com/logo.png");
    expect(result.showChasumBranding).toBe(true);
    expect(result.footerText).toBe("Powered by Chasum");
  });

  it("customer Professional removes Chasum branding", () => {
    const result = resolveTenantEmailBranding(
      { ...base, subscription_plan_key: "professional" },
      "customer",
    );
    expect(result.showChasumBranding).toBe(false);
    expect(result.chasumBrandingStyle).toBe("none");
    expect(result.footerText).not.toMatch(/Powered by Chasum/i);
    expect(result.footerText).not.toMatch(/Sent by Chasum/i);
  });

  it("Private Alpha on starter gets Professional-level branding removal", () => {
    const result = resolveTenantEmailBranding(
      {
        ...base,
        subscription_plan_key: "starter",
        private_alpha_enabled: true,
      },
      "customer",
    );
    expect(result.showChasumBranding).toBe(false);
  });

  it("falls back reply-to to account email", () => {
    const result = resolveTenantEmailBranding(
      {
        ...base,
        notification_email: null,
        email: "account@example.com",
      },
      "customer",
    );
    expect(result.replyToAddress).toBe("account@example.com");
  });

  it("business audience keeps product-context footer", () => {
    const result = resolveTenantEmailBranding(
      { ...base, subscription_plan_key: "professional" },
      "business",
    );
    expect(result.showChasumBranding).toBe(true);
    expect(result.chasumBrandingStyle).toBe("product_context");
    expect(result.footerText).toMatch(/Sent via Chasum/);
  });
});

describe("customer confirmation template branding", () => {
  const ctx = {
    businessId: "b1",
    businessName: "GVM Baby World Ultrasound",
    customerName: "Darshan Dindial",
    staffName: "Bobita Singh",
    serviceName: "Starter Package",
    startTime: "2026-08-04T21:30:00.000Z",
    endTime: "2026-08-04T21:50:00.000Z",
    amountCents: 11615,
    locationName: "GVM Baby World Ultrasound — Main",
    branding: toBrandingContext(
      resolveTenantEmailBranding(
        {
          name: "GVM Baby World Ultrasound",
          email: "ops@example.com",
          notification_email: "bookings@example.com",
          logo_url: "https://cdn.example.com/gvm.png",
          brand_color: "#1a5f7a",
          subscription_plan_key: "professional",
          private_alpha_enabled: true,
        },
        "customer",
      ),
    ),
  };

  it("uses business logo and omits platform Sent by footer", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", ctx);
    expect(rendered.subject).toMatch(/You're booked — Starter Package/);
    expect(rendered.html).toContain("https://cdn.example.com/gvm.png");
    expect(rendered.html).toContain("Appointment confirmed");
    expect(rendered.html).not.toContain("Sent by Chasum");
    expect(rendered.html).not.toContain("AI Business Operating System");
    expect(rendered.html).not.toMatch(/Powered by Chasum/i);
    expect(rendered.html).toContain("GVM Baby World Ultrasound");
  });

  it("Free plan shows Powered by without platform tagline", () => {
    const free = renderEmailTemplate("appointment.confirmation", {
      ...ctx,
      branding: toBrandingContext(
        resolveTenantEmailBranding(
          {
            name: "GVM Baby World Ultrasound",
            subscription_plan_key: "starter",
            private_alpha_enabled: false,
          },
          "customer",
        ),
      ),
    });
    expect(free.html).toContain("Powered by Chasum");
    expect(free.html).not.toContain("AI Business Operating System");
  });

  it("business notification uses distinct subject and CTA", () => {
    const business = renderEmailTemplate("appointment.business", {
      ...ctx,
      branding: toBrandingContext(
        resolveTenantEmailBranding(
          {
            name: "GVM Baby World Ultrasound",
            subscription_plan_key: "professional",
          },
          "business",
        ),
      ),
    });
    expect(business.subject).toMatch(
      /New appointment booked — Starter Package/,
    );
    expect(business.html).toContain("Open appointment in Chasum");
    expect(business.html).toContain("New appointment booked");
  });
});
