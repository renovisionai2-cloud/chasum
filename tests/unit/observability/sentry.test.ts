import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  withScope: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setExtras: vi.fn(),
  setTag: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  init: sentry.init,
  withScope: sentry.withScope,
  captureException: sentry.captureException,
  captureMessage: sentry.captureMessage,
}));

import {
  captureException,
  captureMessage,
  isSentryEnabled,
} from "@/lib/observability/sentry";

describe("Sentry observability boundary", () => {
  const originalDsn = process.env.SENTRY_DSN;
  const originalPublicDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  beforeEach(() => {
    vi.clearAllMocks();
    sentry.withScope.mockImplementation(
      (
        callback: (scope: {
          setExtras: typeof sentry.setExtras;
          setTag: typeof sentry.setTag;
        }) => void,
      ) => {
        callback({
          setExtras: sentry.setExtras,
          setTag: sentry.setTag,
        });
      },
    );
  });

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

    expect(sentry.withScope).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("sanitizes extras and domain tags before provider capture", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@example.invalid/1";

    const error = new Error("diagnostic");
    captureException(error, {
      domain: "booking",
      status: "failed",
      customerEmail: "private@example.com",
      token: "private",
      nested: { secret: "private" },
    });

    expect(isSentryEnabled()).toBe(true);
    expect(sentry.withScope).toHaveBeenCalledTimes(1);
    expect(sentry.setExtras).toHaveBeenCalledWith({
      domain: "booking",
      status: "failed",
    });
    expect(sentry.setTag).toHaveBeenCalledWith("domain", "booking");
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });
});
