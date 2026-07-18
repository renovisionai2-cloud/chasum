import { describe, expect, it } from "vitest";
import {
  isPublicBookingAllowed,
  publicBookingBlockedMessage,
} from "@/lib/booking/access";

describe("public booking access", () => {
  it("allows public and request_approval modes", () => {
    expect(
      isPublicBookingAllowed({ public_booking_mode: "public", booking_invite_code: null }),
    ).toBe(true);
    expect(
      isPublicBookingAllowed({
        public_booking_mode: "request_approval",
        booking_invite_code: null,
      }),
    ).toBe(true);
  });

  it("blocks staff_only", () => {
    expect(
      isPublicBookingAllowed({
        public_booking_mode: "staff_only",
        booking_invite_code: null,
      }),
    ).toBe(false);
  });

  it("requires matching invite code", () => {
    const business = {
      public_booking_mode: "invite_only" as const,
      booking_invite_code: "VIP",
    };
    expect(isPublicBookingAllowed(business, "VIP")).toBe(true);
    expect(isPublicBookingAllowed(business, "wrong")).toBe(false);
    expect(isPublicBookingAllowed(business)).toBe(false);
  });

  it("returns staff-only blocked message", () => {
    expect(
      publicBookingBlockedMessage({
        public_booking_mode: "staff_only",
        phone: null,
        email: null,
      }),
    ).toMatch(/managed by our team/i);
  });
});
