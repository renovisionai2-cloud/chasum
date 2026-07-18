/** Helpers for PostgREST / Supabase schema errors. */

import { captureMessage } from "@/lib/observability/sentry";
import { logger } from "@/lib/observability/logger";

export function isMissingSchemaError(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find the table") ||
    m.includes("could not find the relation")
  );
}

/**
 * Soft schema fallbacks are OFF by default (including local/dev).
 * Set CHASUM_ALLOW_SOFT_SCHEMA=1 only when intentionally running against an incomplete DB.
 */
export function allowSoftSchemaFallback(): boolean {
  return process.env.CHASUM_ALLOW_SOFT_SCHEMA === "1";
}

/**
 * True only when the error is a missing-schema signal AND soft fallbacks are explicitly allowed.
 * Use this at former silent `return []` / `return null` sites.
 */
export function isSoftSchemaFallbackAllowed(
  message: string | null | undefined,
  scope?: string,
): boolean {
  if (!isMissingSchemaError(message)) return false;
  if (allowSoftSchemaFallback()) {
    if (scope) {
      logger.warn(scope, "soft schema fallback (CHASUM_ALLOW_SOFT_SCHEMA=1)", {
        message,
      });
    }
    return true;
  }
  if (scope) {
    logger.error(scope, "schema missing — soft fallbacks disabled", { message });
    captureMessage(`[${scope}] schema missing`, "error", { message });
  }
  return false;
}

/** Log schema gaps; real failures at error. Soft gaps warn only when allowed. */
export function logQueryError(scope: string, message: string): void {
  if (isMissingSchemaError(message)) {
    if (allowSoftSchemaFallback()) {
      logger.warn(scope, "schema not ready", { message });
      return;
    }
    logger.error(scope, "schema not ready (fail-loud)", { message });
    captureMessage(`[${scope}] schema not ready`, "error", { message });
    return;
  }
  logger.error(scope, message);
}
