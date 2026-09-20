import { afterEach, describe, expect, it } from "vitest";
import {
  captureException,
  captureMessage,
  isSentryEnabled,
} from "@/lib/observability/sentry";

describe("Sentry provider-off behavior", () => {
  const originalDsn = process.env.SENTRY_DSN;
  const originalPublicDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  afterEach(() => {
    if (originalDsn === undefined) delete process.env.SENTRY_DSN;
    else process.env.SENTRY_DSN = originalDsn;
    if (originalPublicDsn === undefined)
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    else process.env.NEXT_PUBLIC_SENTRY_DSN = originalPublicDsn;
  });

  it("does not perform provider work or throw when no DSN is configured", () => {
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    expect(isSentryEnabled()).toBe(false);
    expect(() =>
      captureException(new Error("diagnostic"), {
        domain: "booking",
        customerEmail: "private@example.com",
      }),
    ).not.toThrow();
    expect(() =>
      captureMessage("diagnostic", "error", {
        domain: "booking",
        token: "private",
      }),
    ).not.toThrow();
  });
});
