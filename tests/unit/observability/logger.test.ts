import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeTelemetryContext } from "@/lib/observability/context";
import { logger } from "@/lib/observability/logger";

describe("structured logger", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits without throwing", () => {
    expect(() =>
      logger.info("test", "hello", { bookingId: "b1", password: "secret" }),
    ).not.toThrow();
  });

  it("keeps only bounded allowlisted scalar context", () => {
    expect(
      sanitizeTelemetryContext({
        domain: "booking",
        randomUnknownKey: "drop me",
        password: "secret",
        token: "secret",
        authorization: "Bearer secret",
        cookie: "session=secret",
        apiKey: "secret",
        customerName: "Ada",
        customerEmail: "ada@example.com",
        customerPhone: "+15555555555",
        notes: "private",
        body: "private",
        headers: { authorization: "secret" },
        webhookPayload: { customerEmail: "ada@example.com" },
        providerPayload: { token: "secret" },
        nested: { appointmentId: "hidden" },
        array: [{ appointmentId: "hidden" }],
        reason: "provider/customer free text",
        latencyMs: Number.POSITIVE_INFINITY,
        overlong: "not allowlisted",
        status: "  failed  ",
      }),
    ).toEqual({ domain: "booking", status: "failed" });
  });

  it("bounds allowlisted strings and rejects non-finite numbers", () => {
    const context = sanitizeTelemetryContext({
      route: ` /book/${"x".repeat(200)} `,
      latencyMs: Number.NaN,
      attempt: 2,
    });
    expect(context?.route).toHaveLength(120);
    expect(context?.attempt).toBe(2);
    expect(context).not.toHaveProperty("latencyMs");
  });

  it("applies the shared policy to emitted console context", () => {
    const output = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("test", "hello", {
      domain: "booking",
      randomUnknownKey: "drop me",
      customerEmail: "private@example.com",
    });
    expect(JSON.parse(output.mock.calls[0][0] as string).context).toEqual({
      domain: "booking",
    });
  });
});
