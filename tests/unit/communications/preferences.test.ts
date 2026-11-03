import { describe, expect, it } from "vitest";
import {
  deriveCustomerChannelPreferences,
  deferPastQuietHours,
  isWithinQuietHours,
} from "@/lib/communications/preferences";
import { computeBackoffMs } from "@/lib/communications/queue";

describe("communications preferences", () => {
  it("detects quiet hours including overnight", () => {
    const evening = new Date("2026-07-18T22:30:00");
    expect(isWithinQuietHours(evening, "21:00", "08:00")).toBe(true);
    const noon = new Date("2026-07-18T12:00:00");
    expect(isWithinQuietHours(noon, "21:00", "08:00")).toBe(false);
  });

  it("defers past quiet hours end", () => {
    const evening = new Date("2026-07-18T22:00:00");
    const next = deferPastQuietHours(evening, "21:00", "08:00");
    expect(next.getHours()).toBe(8);
    expect(next.getDate()).toBe(19);
  });

  it("computes capped exponential backoff", () => {
    expect(computeBackoffMs(1)).toBe(60_000);
    expect(computeBackoffMs(2)).toBe(300_000);
    expect(computeBackoffMs(10)).toBe(25 * 60_000);
  });

  it("does not treat a missing or legacy placeholder email as an email channel", () => {
    expect(
      deriveCustomerChannelPreferences(
        { email: null, phone: "4165550100", preferred_communication_method: "any" },
        { customerId: "cust", marketing: false },
      ).email,
    ).toBe(false);
    expect(
      deriveCustomerChannelPreferences(
        {
          email: "phone.4165550100@chasum.local",
          phone: "4165550100",
          preferred_communication_method: "email",
        },
        { customerId: "cust", marketing: false },
      ).email,
    ).toBe(false);
    expect(
      deriveCustomerChannelPreferences(
        {
          email: "ada@example.invalid",
          phone: "4165550100",
          preferred_communication_method: "sms",
        },
        { customerId: "cust", marketing: true },
      ),
    ).toMatchObject({ email: false, sms: true, marketing: true });
  });
});
