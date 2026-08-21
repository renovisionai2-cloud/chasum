import { describe, expect, it } from "vitest";
import { TIMEZONES } from "@/lib/constants/timezones";
import { BUSINESS_CURRENCIES } from "@/lib/commerce/money";
import {
  validateBusinessCurrency,
  validateBusinessTimezone,
  validateFirstBusinessInput,
} from "@/lib/onboarding/first-business";

describe("first-business timezone validation", () => {
  it("accepts America/Toronto and other curated IANA zones", () => {
    expect(validateBusinessTimezone("America/Toronto")).toEqual({
      ok: true,
      value: "America/Toronto",
    });
    expect(validateBusinessTimezone("America/Vancouver").ok).toBe(true);
    expect(validateBusinessTimezone("America/New_York").ok).toBe(true);
    expect(validateBusinessTimezone("America/Chicago").ok).toBe(true);
    expect(validateBusinessTimezone("America/Denver").ok).toBe(true);
    expect(validateBusinessTimezone("America/Los_Angeles").ok).toBe(true);
    expect(validateBusinessTimezone("Europe/London").ok).toBe(true);
    expect(validateBusinessTimezone("Australia/Sydney").ok).toBe(true);
    for (const zone of [
      "America/Toronto",
      "America/Vancouver",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Australia/Sydney",
    ]) {
      expect(TIMEZONES).toContain(zone);
    }
  });

  it("rejects missing and unsupported timezones without falling back", () => {
    expect(validateBusinessTimezone("")).toMatchObject({ ok: false });
    expect(validateBusinessTimezone("Not/A/Zone")).toMatchObject({ ok: false });
    expect(validateBusinessTimezone("UTC+5")).toMatchObject({ ok: false });
    expect(validateBusinessTimezone("")).not.toMatchObject({
      value: "America/New_York",
    });
    expect(validateBusinessTimezone("Not/A/Zone")).not.toMatchObject({
      value: "America/New_York",
    });
  });
});

describe("first-business currency validation", () => {
  it("accepts CAD and stores the canonical lowercase value", () => {
    expect(validateBusinessCurrency("CAD")).toEqual({
      ok: true,
      value: "cad",
    });
    expect(validateBusinessCurrency("cad")).toEqual({
      ok: true,
      value: "cad",
    });
    expect(BUSINESS_CURRENCIES.map((row) => row.value)).toContain("cad");
  });

  it("accepts other supported currencies", () => {
    expect(validateBusinessCurrency("usd").ok).toBe(true);
    expect(validateBusinessCurrency("eur").ok).toBe(true);
    expect(validateBusinessCurrency("gbp").ok).toBe(true);
    expect(validateBusinessCurrency("aud").ok).toBe(true);
  });

  it("rejects missing and unsupported currencies without falling back to usd", () => {
    expect(validateBusinessCurrency("")).toMatchObject({ ok: false });
    expect(validateBusinessCurrency("xyz")).toMatchObject({ ok: false });
    expect(validateBusinessCurrency("")).not.toMatchObject({ value: "usd" });
    expect(validateBusinessCurrency("xyz")).not.toMatchObject({ value: "usd" });
  });
});

describe("first-business combined input", () => {
  it("requires name, timezone, and currency together", () => {
    expect(
      validateFirstBusinessInput({
        name: "Chasum HQ",
        timezone: "America/Toronto",
        currency: "CAD",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Chasum HQ",
        timezone: "America/Toronto",
        currency: "cad",
      },
    });
  });

  it("does not create a valid payload when timezone is missing", () => {
    const parsed = validateFirstBusinessInput({
      name: "Northshore Clinic",
      timezone: "",
      currency: "cad",
    });
    expect(parsed.ok).toBe(false);
  });

  it("does not create a valid payload when currency is missing", () => {
    const parsed = validateFirstBusinessInput({
      name: "Northshore Clinic",
      timezone: "America/Toronto",
      currency: "",
    });
    expect(parsed.ok).toBe(false);
  });
});
