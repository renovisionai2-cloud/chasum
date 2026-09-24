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


  it("uses location-scoped wording without implying duplicate Service creation", () => {
    const steps = buildSetupSteps({
      business: {
        name: "Acme Clinic",
        slug: "acme-clinic",
        appointment_interval_minutes: 15,
      },
      serviceCount: 0,
      staffCount: 0,
      hasHours: true,
      locationScoped: true,
    });
    expect(steps.find((step) => step.id === "services")).toMatchObject({
      label: "Enable a service at this location",
      done: false,
    });
    expect(steps.find((step) => step.id === "staff")).toMatchObject({
      label: "Assign a bookable employee to this location",
      done: false,
    });
    expect(
      steps.find((step) => step.id === "services")?.description,
    ).toContain("existing Business Service");
  });

  it("keeps location Staff readiness incomplete when Staff provide no offered Service", () => {
    const steps = buildSetupSteps({
      business: {
        name: "Acme Clinic",
        slug: "acme-clinic",
        appointment_interval_minutes: 15,
      },
      serviceCount: 2,
      staffCount: 1,
      hasHours: true,
      locationScoped: true,
      hasServiceStaffMatch: false,
    });
    expect(steps.find((step) => step.id === "services")?.done).toBe(true);
    expect(steps.find((step) => step.id === "staff")).toMatchObject({
      label: "Assign an employee to an offered service",
      done: false,
    });
    expect(steps.find((step) => step.id === "booking_link")?.done).toBe(false);
  });

  it("marks location Service and Staff setup complete only with a valid intersection", () => {
    const steps = buildSetupSteps({
      business: {
        name: "Acme Clinic",
        slug: "acme-clinic",
        appointment_interval_minutes: 15,
      },
      serviceCount: 2,
      staffCount: 1,
      hasHours: true,
      locationScoped: true,
      hasServiceStaffMatch: true,
    });
    expect(steps.find((step) => step.id === "staff")?.done).toBe(true);
    expect(steps.find((step) => step.id === "booking_link")?.done).toBe(true);
  });

});
