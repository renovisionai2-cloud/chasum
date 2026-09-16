import { describe, expect, it } from "vitest";
import { renderEmailTemplate } from "@/lib/communications/templates";

const BASE = {
  businessId: "biz-1",
  businessName: "Chasum HQ",
  customerName: "Darshan Phase 5 Test",
  staffName: "Darshanaanand Dindial",
  serviceName: "Private Alpha Onboarding Consultation",
  timezone: "America/Toronto",
  locationName: "HQ",
};

/** Thursday 9:00–9:45 AM ET */
const START = "2026-09-17T13:00:00.000Z";
const END_45 = "2026-09-17T13:45:00.000Z";
/** Thursday 10:00 AM ET */
const END_60 = "2026-09-17T14:00:00.000Z";
/** Wednesday 2:00–2:45 PM ET */
const PREV_START = "2026-09-16T18:00:00.000Z";
const PREV_END = "2026-09-16T18:45:00.000Z";

describe("appointment.reschedule customer template is truthful", () => {
  it("CASE 1: start change shows the new full range and a truthful previous range", () => {
    const rendered = renderEmailTemplate("appointment.reschedule", {
      ...BASE,
      startTime: START,
      endTime: END_45,
      previousStartTime: PREV_START,
      previousEndTime: PREV_END,
    });

    expect(rendered.html).toContain("9:00 AM–9:45 AM ET");
    expect(rendered.html).toContain("Thursday, September 17, 2026");
    expect(rendered.html).toContain("Previously:");
    expect(rendered.html).toContain("2:00 PM–2:45 PM ET");
    expect(rendered.html).toContain("Wednesday, September 16, 2026");
    expect(rendered.text).toContain("9:00 AM–9:45 AM ET");
  });

  it("CASE 2: end-time-only change shows the new full range and the previous full range", () => {
    const rendered = renderEmailTemplate("appointment.reschedule", {
      ...BASE,
      startTime: START,
      endTime: END_60,
      previousStartTime: START,
      previousEndTime: END_45,
    });

    expect(rendered.html).toContain("9:00 AM–10:00 AM ET");
    expect(rendered.html).toContain("Thursday, September 17, 2026");
    expect(rendered.html).toContain("Previously:");
    expect(rendered.html).toContain("9:00 AM–9:45 AM ET");
    expect(rendered.html).not.toMatch(
      /Previously:[^<]*Thursday, September 17, 2026 at 9:00 AM ET/,
    );
    expect(rendered.text).toContain("9:00 AM–10:00 AM ET");
  });

  it("CASE 2 without previousEndTime suppresses a misleading start-only Previously line", () => {
    const rendered = renderEmailTemplate("appointment.reschedule", {
      ...BASE,
      startTime: START,
      endTime: END_60,
      previousStartTime: START,
    });

    expect(rendered.html).toContain("9:00 AM–10:00 AM ET");
    expect(rendered.html).not.toContain("Previously:");
  });

  it("staff and business templates show the new current range, not a previous start", () => {
    const staff = renderEmailTemplate("appointment.staff", {
      ...BASE,
      startTime: START,
      endTime: END_60,
      previousStartTime: START,
      previousEndTime: END_45,
    });
    const business = renderEmailTemplate("appointment.business", {
      ...BASE,
      startTime: START,
      endTime: END_60,
      previousStartTime: START,
      previousEndTime: END_45,
      bookingChannel: "staff",
    });

    expect(staff.html).toContain("9:00 AM–10:00 AM ET");
    expect(staff.html).not.toContain("Previously:");
    expect(business.html).toContain("9:00 AM–10:00 AM ET");
    expect(business.html).not.toContain("Previously:");
  });
});
