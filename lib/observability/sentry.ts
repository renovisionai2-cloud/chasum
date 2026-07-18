/**
 * Sentry integration — no-ops when SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is unset.
 */

import type { LogContext } from "@/lib/observability/logger";

function getDsn(): string | null {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? null;
}

export function isSentryEnabled(): boolean {
  return Boolean(getDsn());
}

let initialized = false;

export function initSentry(runtime: "nodejs" | "edge" | "client" = "nodejs"): void {
  if (initialized) return;
  const dsn = getDsn();
  if (!dsn) return;

  try {
    // Dynamic require keeps builds working when Sentry is unused locally.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    Sentry.init({
      dsn,
      environment:
        process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
      enabled: true,
      // Avoid PII by default
      sendDefaultPii: false,
    });
    initialized = true;
    if (runtime === "nodejs") {
      // no-op marker for health checks
      process.env.__CHASUM_SENTRY_INIT__ = "1";
    }
  } catch {
    // Package missing or edge constraints — stay silent
  }
}

export function captureException(
  error: unknown,
  context?: LogContext,
): void {
  if (!getDsn()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
        if (typeof context.domain === "string") {
          scope.setTag("domain", context.domain);
        }
      }
      Sentry.captureException(error);
    });
  } catch {
    // ignore
  }
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: LogContext,
): void {
  if (!getDsn()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context);
      Sentry.captureMessage(message, level);
    });
  } catch {
    // ignore
  }
}
