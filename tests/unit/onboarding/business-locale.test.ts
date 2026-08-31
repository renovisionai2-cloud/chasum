import { describe, expect, it } from "vitest";
import {
  validateOnboardingCurrency,
  validateOnboardingTimezone,
} from "@/lib/onboarding/business-locale";

describe("onboarding timezone and currency validation", () => {
  it("accepts America/Toronto", () => {
    expect(validateOnboardingTimezone("America/Toronto")).toBe(
      "America/Toronto",
    );
  });

  it("rejects empty or invalid timezones", () => {
    expect(validateOnboardingTimezone("")).toBeNull();
    expect(validateOnboardingTimezone("Not/AZone")).toBeNull();
  });

  it("accepts cad", () => {
    expect(validateOnboardingCurrency("cad")).toBe("cad");
  });

  it("rejects empty or invalid currencies", () => {
    expect(validateOnboardingCurrency("")).toBeNull();
    expect(validateOnboardingCurrency("not-a-currency")).toBeNull();
  });
});
