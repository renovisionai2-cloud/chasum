import { describe, expect, it } from "vitest";
import { buildSetupSteps } from "@/lib/onboarding/setup-progress";

describe("setup progress booking interval step", () => {
  it("includes a booking time interval onboarding step", () => {
    const steps = buildSetupSteps({
      business: {
        name: "Acme Clinic",
        slug: "acme-clinic",
        appointment_interval_minutes: 15,
      },
      serviceCount: 0,
      staffCount: 0,
      hasHours: true,
    });
    const intervalStep = steps.find((s) => s.id === "booking_interval");
    expect(intervalStep).toBeTruthy();
    expect(intervalStep?.href).toContain("tab=booking");
    expect(intervalStep?.done).toBe(true);
    expect(intervalStep?.description.toLowerCase()).toContain(
      "how frequently",
    );
  });

  it("keeps the interval step incomplete until the business is named", () => {
    const steps = buildSetupSteps({
      business: {
        name: "My Business",
        slug: "user-1234567890",
        appointment_interval_minutes: 15,
      },
      serviceCount: 0,
      staffCount: 0,
      hasHours: false,
    });
    expect(steps.find((s) => s.id === "booking_interval")?.done).toBe(false);
  });

  it("does not treat the silent 30-minute database default as configured", () => {
    const steps = buildSetupSteps({
      business: {
        name: "Chasum HQ",
        slug: "chasum-hq",
        appointment_interval_minutes: 30,
      },
      serviceCount: 0,
      staffCount: 0,
      hasHours: true,
    });
    expect(steps.find((s) => s.id === "booking_interval")?.done).toBe(false);
  });
});
