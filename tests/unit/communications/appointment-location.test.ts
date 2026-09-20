import { describe, expect, it } from "vitest";
import {
  formatAppointmentLocationAddress,
  googleMapsSearchUrl,
  isDirectionsEligible,
  sameBusinessLocation,
  toAppointmentLocationAddress,
} from "@/lib/communications/appointment-location";

const COMPLETE = {
  addressLine1: "123 Example Street",
  addressLine2: "Suite 200",
  city: "Burlington",
  state: "ON",
  postalCode: "L7M 1A1",
};

describe("appointment location address formatter", () => {
  it("formats a complete address without inventing extra punctuation", () => {
    expect(formatAppointmentLocationAddress(COMPLETE)).toBe(
      ["123 Example Street", "Suite 200", "Burlington, ON L7M 1A1"].join("\n"),
    );
  });

  it("keeps a truthful partial address for line1 + city", () => {
    expect(
      formatAppointmentLocationAddress({
        addressLine1: "123 Example Street",
        addressLine2: null,
        city: "Burlington",
        state: null,
        postalCode: null,
      }),
    ).toBe("123 Example Street\nBurlington");
  });

  it("shows city only when that is all that exists", () => {
    expect(
      formatAppointmentLocationAddress({
        addressLine1: null,
        addressLine2: null,
        city: "Burlington",
        state: null,
        postalCode: null,
      }),
    ).toBe("Burlington");
  });

  it("trims whitespace and ignores empty components", () => {
    expect(
      formatAppointmentLocationAddress({
        addressLine1: "  10 King St  ",
        addressLine2: "   ",
        city: " Hamilton ",
        state: "ON",
        postalCode: "",
      }),
    ).toBe("10 King St\nHamilton, ON");
  });

  it("returns null when every component is empty", () => {
    expect(
      formatAppointmentLocationAddress({
        addressLine1: " ",
        addressLine2: null,
        city: null,
        state: "",
        postalCode: undefined as unknown as string | null,
      }),
    ).toBeNull();
  });
});

describe("directions eligibility and Maps URL", () => {
  it("builds an encoded Google Maps search URL for a complete address", () => {
    expect(isDirectionsEligible(COMPLETE)).toBe(true);
    const url = googleMapsSearchUrl(COMPLETE);
    expect(url).toMatch(
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/,
    );
    const query = new URL(url!).searchParams.get("query");
    expect(query).toBe(
      "123 Example Street, Suite 200, Burlington, ON L7M 1A1",
    );
    expect(url).toContain(encodeURIComponent(query!));
  });

  it("allows directions when line1 plus postal_code is present", () => {
    const address = {
      addressLine1: "123 Example Street",
      addressLine2: null,
      city: null,
      state: null,
      postalCode: "L7M 1A1",
    };
    expect(isDirectionsEligible(address)).toBe(true);
    expect(googleMapsSearchUrl(address)).toContain("query=");
  });

  it("does not create directions for city/state only", () => {
    const address = {
      addressLine1: null,
      addressLine2: null,
      city: "Burlington",
      state: "ON",
      postalCode: null,
    };
    expect(isDirectionsEligible(address)).toBe(false);
    expect(googleMapsSearchUrl(address)).toBeNull();
  });

  it("does not create directions for line1 only", () => {
    const address = {
      addressLine1: "123 Example Street",
      addressLine2: null,
      city: null,
      state: null,
      postalCode: null,
    };
    expect(isDirectionsEligible(address)).toBe(false);
    expect(googleMapsSearchUrl(address)).toBeNull();
  });

  it("never treats a location name as a destination", () => {
    expect(isDirectionsEligible(null)).toBe(false);
    expect(googleMapsSearchUrl(null)).toBeNull();
  });
});

describe("same-business location mapping", () => {
  it("keeps the appointment business location and drops a foreign row", () => {
    const own = { business_id: "biz-a", address_line1: "Address A" };
    const foreign = { business_id: "biz-b", address_line1: "Address B" };
    expect(sameBusinessLocation(own, "biz-a")).toEqual(own);
    expect(sameBusinessLocation(foreign, "biz-a")).toBeNull();
  });

  it("maps structured fields without inventing missing pieces", () => {
    expect(
      toAppointmentLocationAddress({
        address_line1: "123 Example Street",
        address_line2: "Suite 200",
        city: "Burlington",
        state: "ON",
        postal_code: "L7M 1A1",
      }),
    ).toEqual(COMPLETE);
    expect(
      toAppointmentLocationAddress({
        name: "Main",
        address_line1: null,
        city: null,
      }),
    ).toBeNull();
  });
});
