/**
 * Structured logging + Sentry capture helpers.
 * Never log secrets, card numbers, or raw API keys.
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

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("authorization") ||
      lower.includes("card") ||
      lower.includes("cvv")
    ) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

function emit(payload: LogPayload): void {
  const line = JSON.stringify({
    ...payload,
    context: sanitizeContext(payload.context),
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
  logger.error("booking", errorMessage(error), context);
  captureException(error, { domain: "booking", ...context });
}

export async function capturePaymentFailure(
  error: unknown,
  context?: LogContext,
): Promise<void> {
  const { captureException } = await import("@/lib/observability/sentry");
  logger.error("payment", errorMessage(error), context);
  captureException(error, { domain: "payment", ...context });
}

export async function captureCommunicationFailure(
  error: unknown,
  context?: LogContext,
): Promise<void> {
  const { captureException } = await import("@/lib/observability/sentry");
  logger.error("communications", errorMessage(error), context);
  captureException(error, { domain: "communications", ...context });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
