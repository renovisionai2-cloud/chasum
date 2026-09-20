import { sanitizeTelemetryContext } from "@/lib/observability/context";

/**
 * Structured logging + Sentry capture helpers.
 * Never log secrets, card numbers, raw API keys, or arbitrary provider/customer
 * error text as the structured message.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

type LogPayload = {
  level: LogLevel;
  message: string;
  scope: string;
  timestamp: string;
  context?: LogContext;
};

function emit(payload: LogPayload): void {
  const line = JSON.stringify({
    ...payload,
    context: sanitizeTelemetryContext(payload.context),
  });
  if (payload.level === "error") {
    console.error(line);
  } else if (payload.level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export function log(
  level: LogLevel,
  scope: string,
  message: string,
  context?: LogContext,
): void {
  emit({
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    context,
  });
}

export const logger = {
  debug: (scope: string, message: string, context?: LogContext) =>
    log("debug", scope, message, context),
  info: (scope: string, message: string, context?: LogContext) =>
    log("info", scope, message, context),
  warn: (scope: string, message: string, context?: LogContext) =>
    log("warn", scope, message, context),
  error: (scope: string, message: string, context?: LogContext) =>
    log("error", scope, message, context),
};

/** Domain-tagged failure helpers for ops dashboards / Sentry. */
export async function captureBookingFailure(
  error: unknown,
  context?: LogContext,
): Promise<void> {
  const { captureException } = await import("@/lib/observability/sentry");
  logger.error("booking", "booking_failure", context);
  captureException(error, { domain: "booking", ...context });
}

export async function capturePaymentFailure(
  error: unknown,
  context?: LogContext,
): Promise<void> {
  const { captureException } = await import("@/lib/observability/sentry");
  logger.error("payment", "payment_failure", context);
  captureException(error, { domain: "payment", ...context });
}

export async function captureCommunicationFailure(
  error: unknown,
  context?: LogContext,
): Promise<void> {
  const { captureException } = await import("@/lib/observability/sentry");
  logger.error("communications", "communications_failure", context);
  captureException(error, { domain: "communications", ...context });
}
