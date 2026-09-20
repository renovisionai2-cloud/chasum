import { describe, expect, it } from "vitest";
import { sanitizeTelemetryContext } from "@/lib/observability/context";

describe("telemetry context policy", () => {
  it("does not recursively preserve unsafe nested data", () => {
    const result = sanitizeTelemetryContext({
      appointmentId: "appointment-id-is-safe-as-a-diagnostic-key",
      nested: { password: "secret", customerEmail: "private@example.com" },
      values: ["private"],
    });
    expect(result).toEqual({
      appointmentId: "appointment-id-is-safe-as-a-diagnostic-key",
    });
  });

  it("drops prohibited and free-text fields even when their values are scalar", () => {
    const result = sanitizeTelemetryContext({
      password: "secret",
      token: "secret",
      authorization: "secret",
      cookie: "secret",
      apiKey: "secret",
      customerName: "private",
      customerEmail: "private@example.com",
      customerPhone: "private",
      notes: "private",
      messageBody: "private",
      requestBody: "private",
      reason: "provider/customer free text",
    });
    expect(result).toBeUndefined();
  });
});
