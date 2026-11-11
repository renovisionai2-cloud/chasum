import { performance } from "node:perf_hooks";

export const BROWSER_CLOSE_TIMEOUT_MS = 30_000;
export const VITE_CLOSE_TIMEOUT_MS = 10_000;
export const TEARDOWN_HOOK_TIMEOUT_MS = 45_000;

export type CloseComponent = "CHROMIUM" | "WEBKIT" | "VITE";
export type CloseEvent = `${CloseComponent}_CLOSE_${"BEGIN" | "COMPLETE" | "ERROR"}`;
export type CloseDiagnostic = {
  component: CloseComponent;
  timeoutMs: number;
  durationMs?: number;
  status?: CloseOutcome["status"];
  terminationConfirmed?: false;
  reason?: "REJECTED" | "TIMEOUT";
  message?: string;
};
export type CloseDiagnosticEmitter = (event: CloseEvent, detail: CloseDiagnostic) => void;

type CloseResource = {
  component: CloseComponent;
  close: () => Promise<void>;
};

type CloseOutcome = { component: CloseComponent } & (
  | { status: "completed" }
  | { status: "rejected"; error: unknown }
  | { status: "timed_out"; timeoutMs: number }
);

export class ResourceCloseTimeoutError extends Error {
  constructor(
    readonly component: CloseComponent,
    readonly timeoutMs: number,
  ) {
    super(
      `${component} close did not settle within ${timeoutMs}ms; resource termination is unconfirmed`,
    );
    this.name = "ResourceCloseTimeoutError";
  }
}

function errorMessage(error: unknown) {
  try { return (error instanceof Error ? error.message : String(error)).slice(0, 300); }
  catch { return "Unprintable rejection"; }
}

function emitSafely(
  emit: CloseDiagnosticEmitter,
  event: CloseEvent,
  detail: CloseDiagnostic,
) {
  try {
    emit(event, detail);
  } catch {
    // Diagnostic failures must not replace or conceal the cleanup outcome.
  }
}

async function closeWithDeadline(
  resource: CloseResource,
  timeoutMs: number,
  emit: CloseDiagnosticEmitter,
): Promise<CloseOutcome> {
  const startedAt = performance.now();
  emitSafely(emit, `${resource.component}_CLOSE_BEGIN`, {
    component: resource.component,
    timeoutMs,
  });

  // Convert both synchronous throws and asynchronous rejections into a handled
  // outcome. If the deadline wins, a later rejection remains observed rather
  // than becoming an unhandled rejection.
  const closeOutcome: Promise<CloseOutcome> = Promise.resolve()
    .then(() => resource.close())
    .then<CloseOutcome, CloseOutcome>(
      () => ({ component: resource.component, status: "completed" }),
      (error: unknown) => ({ component: resource.component, status: "rejected", error }),
    );

  let deadline: ReturnType<typeof setTimeout> | undefined;
  const timeoutOutcome = new Promise<CloseOutcome>((resolve) => {
    deadline = setTimeout(() => resolve({ component: resource.component, status: "timed_out", timeoutMs }), timeoutMs);
  });

  let outcome: CloseOutcome;
  try { outcome = await Promise.race([closeOutcome, timeoutOutcome]); }
  finally { if (deadline !== undefined) clearTimeout(deadline); }
  const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;

  if (outcome.status === "completed") {
    emitSafely(emit, `${resource.component}_CLOSE_COMPLETE`, {
      component: resource.component,
      timeoutMs,
      durationMs,
      status: outcome.status,
    });
    return outcome;
  }

  const error = outcome.status === "timed_out"
    ? new ResourceCloseTimeoutError(resource.component, timeoutMs)
    : outcome.error;
  emitSafely(emit, `${resource.component}_CLOSE_ERROR`, {
    component: resource.component,
    timeoutMs,
    durationMs,
    status: outcome.status,
    terminationConfirmed: false,
    reason: outcome.status === "timed_out" ? "TIMEOUT" : "REJECTED",
    message: errorMessage(error),
  });
  return outcome;
}

export async function closeFixtureResources({
  browsers,
  vite,
  emit,
  browserTimeoutMs = BROWSER_CLOSE_TIMEOUT_MS,
  viteTimeoutMs = VITE_CLOSE_TIMEOUT_MS,
}: {
  browsers: CloseResource[];
  vite: CloseResource;
  emit: CloseDiagnosticEmitter;
  browserTimeoutMs?: number;
  viteTimeoutMs?: number;
}) {
  const outcomes = await Promise.all(
    browsers.map((browser) => closeWithDeadline(browser, browserTimeoutMs, emit)),
  );

  // Vite is always attempted after every browser has either settled or reached
  // its explicit deadline. A timed-out browser remains a failure; the deadline
  // is not treated as proof that its process terminated.
  outcomes.push(await closeWithDeadline(vite, viteTimeoutMs, emit));
  // Rejection values are data, never a success sentinel: undefined/null still fail.
  const errors = outcomes.filter((outcome) => outcome.status !== "completed").map((outcome) =>
    outcome.status === "timed_out"
      ? new ResourceCloseTimeoutError(outcome.component, outcome.timeoutMs)
      : new Error(`${outcome.component} close rejected: ${errorMessage(outcome.error)}`, { cause: outcome.error }),
  );

  if (errors.length) {
    throw new AggregateError(errors, "M1C fixture cleanup failed");
  }
}
