import { describe, expect, it } from "vitest";
import { formatNotificationStatus } from "@/lib/notifications/booking-delivery";
import { getNotificationProviderConfigStatus } from "@/lib/notifications/booking-delivery";

describe("booking notification status labels", () => {
  it("uses accurate SMS skip wording", () => {
    expect(formatNotificationStatus("not_configured")).toBe("Not configured");
    expect(formatNotificationStatus("not_included")).toBe(
      "Not included in plan",
    );
    expect(formatNotificationStatus("no_recipient")).toBe("No recipient");
    expect(formatNotificationStatus("sent")).toBe("Sent");
    expect(formatNotificationStatus("failed")).toBe("Failed");
  });

  it("reports provider presence without secrets", () => {
    const status = getNotificationProviderConfigStatus();
    expect(["resend", "disabled"]).toContain(status.emailProvider);
    expect(["twilio", "disabled"]).toContain(status.smsProvider);
    expect(typeof status.emailFromConfigured).toBe("boolean");
  });
});
