/**
 * Shared telemetry privacy boundary.
 *
 * This is deliberately allowlist-first: values that are not explicitly
 * approved for diagnostics are omitted rather than serialized or redacted.
 */

export type TelemetryContextValue = string | number | boolean;
export type TelemetryContext = Record<string, TelemetryContextValue>;

export const TELEMETRY_MAX_STRING_LENGTH = 120;

const STRING_FIELDS = new Set([
  "domain",
  "scope",
  "route",
  "routeType",
  "method",
  "runtime",
  "environment",
  "digest",
  "referenceId",
  "correlationId",
  "businessId",
  "locationId",
  "appointmentId",
  "jobId",
  "sendIntentId",
  "invoiceId",
  "receiptId",
  "transactionId",
  "provider",
  "status",
  "errorCode",
  "claimId",
  "databaseCode",
  "retryPolicy",
  "intendedStatus",
  "stage",
  "event",
  "channel",
  "templateKey",
  "deliveryState",
  "action",
]);

const NUMBER_FIELDS = new Set([
  "attempt",
  "latencyMs",
  "maxAttempts",
  "affectedRows",
]);

const BOOLEAN_FIELDS = new Set(["accepted", "retrySafe"]);

function boundedString(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > TELEMETRY_MAX_STRING_LENGTH
    ? trimmed.slice(0, TELEMETRY_MAX_STRING_LENGTH)
    : trimmed;
}

/**
 * Sanitize one flat diagnostic context. Nested objects, arrays, unknown keys,
 * nulls, non-finite numbers, and all other values are intentionally dropped.
 */
export function sanitizeTelemetryContext(
  context?: Record<string, unknown> | null,
): TelemetryContext | undefined {
  if (!context) return undefined;

  const safe: TelemetryContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (STRING_FIELDS.has(key) && typeof value === "string") {
      const bounded = boundedString(value);
      if (bounded !== null) safe[key] = bounded;
      continue;
    }
    if (
      NUMBER_FIELDS.has(key) &&
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      safe[key] = value;
      continue;
    }
    if (BOOLEAN_FIELDS.has(key) && typeof value === "boolean") {
      safe[key] = value;
    }
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}
