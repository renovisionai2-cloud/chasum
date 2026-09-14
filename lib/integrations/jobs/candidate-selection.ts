import { logger } from "@/lib/observability/logger";

// Healthy observed empty ticks: 249–886ms. Two 5s reads + 250ms backoff
// stay well below Fluid's documented 300s default; no post-claim deadline changes.
export const CANDIDATE_TIMEOUT_MS = 5_000;
export const CANDIDATE_BACKOFF_MS = 250;
const MAX_ATTEMPTS = 2;
class SelectionTimeout extends Error {}

type Failure = { transient: boolean; classification: string; code?: string; status?: number };
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

/** Allowlisted categories only; never emit upstream messages, details or URLs. */
export function classifyCandidateFailure(error: unknown, status?: number): Failure {
  if (error instanceof SelectionTimeout) return { transient: true, classification: "selection_timeout" };
  const e = record(error);
  const code = typeof e.code === "string" ? e.code : "";
  const safeStatus = Number.isInteger(status) && status! >= 100 && status! <= 599 ? status : undefined;
  // SQLSTATE and PostgREST semantic failures take precedence over text/status.
  if (/^[0-9A-Z]{5}$/.test(code) || /^PGRST\d+$/.test(code)) {
    return { transient: false, classification: "database_error", code, status: safeStatus };
  }
  if (safeStatus !== undefined && safeStatus >= 400 && safeStatus < 500) {
    return { transient: false, classification: "request_rejected", status: safeStatus };
  }
  if ([502, 503, 504].includes(safeStatus ?? 0)) {
    return { transient: true, classification: "upstream_unavailable", status: safeStatus };
  }
  const cause = record(e.cause);
  const transportCodes = ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_SOCKET"];
  const transportCode = [code, cause.code].find(c => typeof c === "string" && transportCodes.includes(c));
  if (typeof transportCode === "string") return { transient: true, classification: "transport_failure", code: transportCode };
  const message = typeof e.message === "string" ? e.message.trim() : "";
  if (/^(?:Error:\s*)?Gateway Timeout$/i.test(message)) return { transient: true, classification: "gateway_timeout", status: safeStatus };
  if (/^(?:TypeError:\s*)?(?:fetch failed|Failed to fetch|Network request failed)$/i.test(message)) {
    return { transient: true, classification: "transport_failure", status: safeStatus };
  }
  return { transient: false, classification: "unclassified_error", status: safeStatus };
}

/** Call only with a read. This boundary must never wrap claim or delivery. */
export async function readCandidatesWithRetry<T>(
  read: (signal: AbortSignal) => PromiseLike<{ data: T; error: unknown; status?: number }>,
): Promise<T> {
  const totalStarted = Date.now();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const started = Date.now();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failure: Failure;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new SelectionTimeout());
          controller.abort();
        }, CANDIDATE_TIMEOUT_MS);
      });
      const result = await Promise.race([Promise.resolve().then(() => read(controller.signal)), timeout]);
      if (!result.error) {
        if (attempt === 2) logger.info("worker", "candidate_selection_recovered", {
          stage: "candidate_selection", attempt, maxAttempts: MAX_ATTEMPTS,
          recovered: true, latencyMs: Date.now() - started, totalLatencyMs: Date.now() - totalStarted,
        });
        return result.data;
      }
      failure = classifyCandidateFailure(result.error, result.status);
    } catch (error) {
      failure = classifyCandidateFailure(error);
    } finally {
      clearTimeout(timer);
    }
    const willRetry = failure.transient && attempt < MAX_ATTEMPTS;
    const context = {
      stage: "candidate_selection", attempt, maxAttempts: MAX_ATTEMPTS,
      willRetry, exhausted: failure.transient && !willRetry,
      latencyMs: Date.now() - started, totalLatencyMs: Date.now() - totalStarted,
      ...failure,
    };
    if (!willRetry) {
      logger.error("worker", "candidate_selection_failed", context);
      throw new Error(`Worker candidate selection failed: ${failure.classification}`);
    }
    logger.warn("worker", "candidate_selection_retry", context);
    await new Promise<void>(resolve => setTimeout(resolve, CANDIDATE_BACKOFF_MS));
  }
  throw new Error("Unreachable candidate selection state");
}
