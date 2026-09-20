import { afterEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/observability/sentry", () => ({
  captureException: sentry.captureException,
}));

import { sanitizeTelemetryContext } from "@/lib/observability/context";
import {
  captureBookingFailure,
  captureCommunicationFailure,
  capturePaymentFailure,
  logger,
} from "@/lib/observability/logger";

describe("structured logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sentry.captureException.mockReset();
  });

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

  it("uses controlled failure messages instead of raw error text", async () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const raw = "provider/customer detail ada@example.com";

    await captureBookingFailure(new Error(raw));
    await capturePaymentFailure(new Error(raw));
    await captureCommunicationFailure(new Error(raw));

    const payloads = output.mock.calls.map(([line]) =>
      JSON.parse(line as string),
    );

    expect(payloads.map((payload) => payload.message)).toEqual([
      "booking_failure",
      "payment_failure",
      "communications_failure",
    ]);
    expect(JSON.stringify(payloads)).not.toContain(raw);
    expect(sentry.captureException).toHaveBeenCalledTimes(3);
  });
});
