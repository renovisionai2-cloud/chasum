// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser } from "playwright-core";
import { renderEmailTemplate } from "@/lib/communications/templates";

const html = renderEmailTemplate("appointment.confirmation", {
  businessId: "biz-a",
  businessName: "GVM Baby World Ultrasound",
  customerName: "Ana",
  staffName: "Bobita",
  serviceName: "Early gender (16-18 weeks)",
  startTime: "2026-08-04T18:10:00.000Z",
  endTime: "2026-08-04T18:40:00.000Z",
  timezone: "America/Vancouver",
  locationTimezone: "America/Vancouver",
  businessTimezone: "America/Toronto",
  locationName: "Burlington",
  locationAddress: {
    addressLine1: "123 Example Street",
    addressLine2: "Suite 200",
    city: "Burlington",
    state: "ON",
    postalCode: "L7M 1A1",
  },
  appointmentTotalCents: 18645,
  depositPaidCents: 5000,
  remainingBalanceCents: 13645,
  branding: {
    businessName: "GVM Baby World Ultrasound",
    supportEmail: "gvmbabyworld@gmail.com",
    showChasumBranding: false,
  },
}).html!;

describe("customer confirmation mobile email render (~390px)", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser?.close();
  });

  it("contains the address and Get directions without horizontal overflow", async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const metrics = await page.evaluate(() => {
      const htmlEl = document.documentElement;
      const directions = document.querySelector('a[href*="google.com/maps"]');
      const dr = directions?.getBoundingClientRect();
      const address = Array.from(document.querySelectorAll("td")).find((td) =>
        td.textContent?.includes("123 Example Street"),
      );
      const financial = Array.from(document.querySelectorAll("td")).find((td) =>
        td.textContent?.includes("Appointment total"),
      );
      const contact = Array.from(document.querySelectorAll("a, p")).find((el) =>
        (el.textContent || "").includes("Need to change or cancel"),
      );
      return {
        innerWidth: window.innerWidth,
        scrollWidth: htmlEl.scrollWidth,
        clientWidth: htmlEl.clientWidth,
        overflowOk: htmlEl.scrollWidth <= htmlEl.clientWidth + 1,
        directionsText: directions?.textContent?.trim() ?? null,
        directionsHeight: dr ? Math.round(dr.height) : null,
        directionsRight: dr ? Math.round(dr.right) : null,
        addressWidth: address
          ? Math.round(address.getBoundingClientRect().width)
          : null,
        financialVisible: Boolean(financial),
        contactVisible: Boolean(contact),
      };
    });
    await page.close();

    expect(metrics.innerWidth).toBe(390);
    expect(metrics.overflowOk).toBe(true);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.directionsText).toBe("Get directions");
    expect(metrics.directionsHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.directionsRight).toBeLessThanOrEqual(390);
    expect(metrics.addressWidth).toBeLessThanOrEqual(390);
    expect(metrics.financialVisible).toBe(true);
    expect(metrics.contactVisible).toBe(true);
  });
});
