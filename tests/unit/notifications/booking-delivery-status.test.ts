import { describe, expect, it } from "vitest";
import { formatNotificationStatus } from "@/lib/notifications/status-labels";
import { getNotificationProviderConfigStatus } from "@/lib/notifications/booking-delivery";

describe("booking notification status labels", () => {
  it("uses accurate SMS skip wording", () => {
    expect(formatNotificationStatus("not_configured")).toBe("Not configured");
    expect(formatNotificationStatus("not_included")).toBe(
      "Not included in plan",
    );
    expect(formatNotificationStatus("no_recipient")).toBe("No recipient");
    expect(formatNotificationStatus("not_recorded")).toBe("Not recorded");
    expect(formatNotificationStatus("not_applicable")).toBe("Not applicable");
    expect(formatNotificationStatus("delivered")).toBe("Delivered");
    expect(formatNotificationStatus("queued")).toBe("Queued");
  });

  it("reports provider presence without secrets", () => {
    const status = getNotificationProviderConfigStatus();
    expect(["resend", "disabled"]).toContain(status.emailProvider);
    expect(["twilio", "disabled"]).toContain(status.smsProvider);
    expect(typeof status.emailFromConfigured).toBe("boolean");
  });
});
