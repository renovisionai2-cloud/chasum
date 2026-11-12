import { performance } from "node:perf_hooks";

// N02-specific adaptation of the accepted M1C teardown design. Reception's
// resource contract stays unchanged; this fixture owns an HTTP server, not Vite.
export const BROWSER_CLOSE_TIMEOUT_MS = 30_000;
export const HTTP_SERVER_CLOSE_TIMEOUT_MS = 10_000;
export const TEARDOWN_HOOK_TIMEOUT_MS = 45_000;

export type CloseComponent = "CHROMIUM" | "WEBKIT" | "HTTP_SERVER";
export type CloseEvent = `${CloseComponent}_CLOSE_${"BEGIN" | "COMPLETE" | "ERROR"}`;
type CloseResource = { close: () => Promise<void> };
export type FixtureResources = Record<CloseComponent, CloseResource | null | undefined>;
type CloseOutcome = { component: CloseComponent } & (
  | { status: "completed" }
  | { status: "rejected"; error: unknown }
  | { status: "timed_out"; timeoutMs: number }
);
export type CloseDiagnostic = {
  component: CloseComponent;
  timeoutMs: number;
  durationMs?: number;
  status?: CloseOutcome["status"];
  terminationConfirmed?: false;
  reason?: "REJECTED" | "TIMEOUT" | "MISSING_RESOURCE";
  message?: string;
};
export type CloseDiagnosticEmitter = (event: CloseEvent, detail: CloseDiagnostic) => void;

export class ResourceCloseTimeoutError extends Error {
  constructor(readonly component: CloseComponent, readonly timeoutMs: number) {
    super(`${component} close did not settle within ${timeoutMs}ms; resource termination is unconfirmed`);
    this.name = "ResourceCloseTimeoutError";
  }
}

export class MissingFixtureResourceError extends Error {
  constructor(readonly component: CloseComponent) {
    super(`${component} was not initialized with a close operation; cleanup is unconfirmed`);
    this.name = "MissingFixtureResourceError";
  }
}

function errorMessage(error: unknown) {
  try { return (error instanceof Error ? error.message : String(error)).slice(0, 300); }
  catch { return "Unprintable rejection"; }
}

function emitSafely(emit: CloseDiagnosticEmitter, event: CloseEvent, detail: CloseDiagnostic) {
  try { emit(event, detail); }
  catch { /* Observation failures must not prevent cleanup or conceal its failure. */ }
}

async function closeWithDeadline(
  component: CloseComponent,
  resource: FixtureResources[CloseComponent],
  timeoutMs: number,
  emit: CloseDiagnosticEmitter,
): Promise<CloseOutcome> {
  const startedAt = performance.now();
  emitSafely(emit, `${component}_CLOSE_BEGIN`, { component, timeoutMs });

  // Observe synchronous throws and late rejections even if the deadline wins.
  // Missing resources fail explicitly, without preventing other cleanup attempts.
  const closeOutcome: Promise<CloseOutcome> = Promise.resolve()
    .then(() => {
      if (!resource || typeof resource.close !== "function") {
        throw new MissingFixtureResourceError(component);
      }
      return resource.close();
    })
    .then<CloseOutcome, CloseOutcome>(
      () => ({ component, status: "completed" }),
      (error: unknown) => ({ component, status: "rejected", error }),
    );
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const timeoutOutcome = new Promise<CloseOutcome>((resolve) => {
    deadline = setTimeout(() => resolve({ component, status: "timed_out", timeoutMs }), timeoutMs);
  });

  let outcome: CloseOutcome;
  try { outcome = await Promise.race([closeOutcome, timeoutOutcome]); }
  finally { if (deadline !== undefined) clearTimeout(deadline); }
  const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
  if (outcome.status === "completed") {
    // Promise completion is not a separate OS process-exit observation.
    emitSafely(emit, `${component}_CLOSE_COMPLETE`, {
      component, timeoutMs, durationMs, status: outcome.status,
    });
    return outcome;
  }

  const error = outcome.status === "timed_out"
    ? new ResourceCloseTimeoutError(component, timeoutMs)
    : outcome.error;
  emitSafely(emit, `${component}_CLOSE_ERROR`, {
    component, timeoutMs, durationMs, status: outcome.status,
    terminationConfirmed: false,
    reason: outcome.status === "timed_out" ? "TIMEOUT"
      : error instanceof MissingFixtureResourceError ? "MISSING_RESOURCE" : "REJECTED",
    message: errorMessage(error),
  });
  return outcome;
}

export async function closeFixtureResources({
  resources,
  emit,
  browserTimeoutMs = BROWSER_CLOSE_TIMEOUT_MS,
  httpServerTimeoutMs = HTTP_SERVER_CLOSE_TIMEOUT_MS,
}: {
  resources: FixtureResources;
  emit: CloseDiagnosticEmitter;
  browserTimeoutMs?: number;
  httpServerTimeoutMs?: number;
}) {
  const outcomes = await Promise.all([
    closeWithDeadline("CHROMIUM", resources.CHROMIUM, browserTimeoutMs, emit),
    closeWithDeadline("WEBKIT", resources.WEBKIT, browserTimeoutMs, emit),
  ]);
  // Attempt HTTP cleanup after BOTH browser outcomes, including failures/timeouts.
  // A timeout is a failure, never confirmation that the resource terminated.
  outcomes.push(await closeWithDeadline("HTTP_SERVER", resources.HTTP_SERVER, httpServerTimeoutMs, emit));
  const errors = outcomes.filter((outcome) => outcome.status !== "completed").map((outcome) =>
    outcome.status === "timed_out"
      ? new ResourceCloseTimeoutError(outcome.component, outcome.timeoutMs)
      : new Error(`${outcome.component} close rejected: ${errorMessage(outcome.error)}`, { cause: outcome.error }),
  );
  if (errors.length) throw new AggregateError(errors, "N02 fixture cleanup failed");
}
