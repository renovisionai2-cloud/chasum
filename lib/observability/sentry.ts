/**
 * Sentry integration — no-ops when the relevant Sentry DSN is unset.
 */

import * as Sentry from "@sentry/nextjs";
import {
  sanitizeTelemetryContext,
  type TelemetryContext,
} from "@/lib/observability/context";
import type { LogContext } from "@/lib/observability/logger";

function getDsn(
  runtime?: "nodejs" | "edge" | "client",
): string | null {
  if (runtime === "client" || typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_SENTRY_DSN ?? null;
  }
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? null;
}

export function isSentryEnabled(): boolean {
  return Boolean(getDsn());
}

let initialized = false;

export function initSentry(
  runtime: "nodejs" | "edge" | "client" = "nodejs",
): void {
  if (initialized) return;
  const dsn = getDsn(runtime);
  if (!dsn) return;

  try {
    Sentry.init({
      dsn,
      environment:
        process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
      enabled: true,
      sendDefaultPii: false,
    });
    initialized = true;
    if (runtime === "nodejs") {
      process.env.__CHASUM_SENTRY_INIT__ = "1";
    }
  } catch {
    // Provider initialization must never prevent Chasum from serving requests.
  }
}

export function captureException(
  error: unknown,
  context?: LogContext,
): void {
  if (!getDsn()) return;
  try {
    Sentry.withScope((scope) => {
      if (context) {
        const safeContext = sanitizeTelemetryContext(context);
        if (safeContext) scope.setExtras(safeContext);
        if (typeof safeContext?.domain === "string") {
          scope.setTag("domain", safeContext.domain);
        }
      }
      Sentry.captureException(error);
    });
  } catch {
    // Observability must never become an application failure.
  }
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: LogContext,
): void {
  if (!getDsn()) return;
  try {
    Sentry.withScope((scope) => {
      const safeContext: TelemetryContext | undefined =
        sanitizeTelemetryContext(context);
      if (safeContext) scope.setExtras(safeContext);
      if (typeof safeContext?.domain === "string") {
        scope.setTag("domain", safeContext.domain);
      }
      Sentry.captureMessage(message, level);
    });
  } catch {
    // Observability must never become an application failure.
  }
}
