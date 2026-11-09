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
  reason?: "REJECTED" | "TIMEOUT";
  message?: string;
};
export type CloseDiagnosticEmitter = (event: CloseEvent, detail: CloseDiagnostic) => void;

type CloseResource = {
  component: CloseComponent;
  close: () => Promise<void>;
};

type CloseOutcome =
  | { status: "complete" }
  | { status: "rejected"; error: unknown }
  | { status: "timeout" };

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
  return error instanceof Error ? error.message : String(error);
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
): Promise<unknown | undefined> {
  const startedAt = performance.now();
  emitSafely(emit, `${resource.component}_CLOSE_BEGIN`, {
    component: resource.component,
    timeoutMs,
  });

  // Convert both synchronous throws and asynchronous rejections into a handled
  // outcome. If the deadline wins, a later rejection remains observed rather
  // than becoming an unhandled rejection.
  const closeOutcome: Promise<CloseOutcome> = Promise.resolve()
    .then(resource.close)
    .then<CloseOutcome, CloseOutcome>(
      () => ({ status: "complete" }),
      (error: unknown) => ({ status: "rejected", error }),
    );

  let deadline: ReturnType<typeof setTimeout> | undefined;
  const timeoutOutcome = new Promise<CloseOutcome>((resolve) => {
    deadline = setTimeout(() => resolve({ status: "timeout" }), timeoutMs);
  });

  const outcome = await Promise.race([closeOutcome, timeoutOutcome]);
  if (deadline) clearTimeout(deadline);
  const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;

  if (outcome.status === "complete") {
    emitSafely(emit, `${resource.component}_CLOSE_COMPLETE`, {
      component: resource.component,
      timeoutMs,
      durationMs,
    });
    return;
  }

  const error = outcome.status === "timeout"
    ? new ResourceCloseTimeoutError(resource.component, timeoutMs)
    : outcome.error;
  emitSafely(emit, `${resource.component}_CLOSE_ERROR`, {
    component: resource.component,
    timeoutMs,
    durationMs,
    reason: outcome.status === "timeout" ? "TIMEOUT" : "REJECTED",
    message: errorMessage(error),
  });
  return error;
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
  const errors = (
    await Promise.all(
      browsers.map((browser) => closeWithDeadline(browser, browserTimeoutMs, emit)),
    )
  ).filter((error) => error !== undefined);

  // Vite is always attempted after every browser has either settled or reached
  // its explicit deadline. A timed-out browser remains a failure; the deadline
  // is not treated as proof that its process terminated.
  const viteError = await closeWithDeadline(vite, viteTimeoutMs, emit);
  if (viteError !== undefined) errors.push(viteError);

  if (errors.length) {
    throw new AggregateError(errors, "M1C fixture cleanup failed");
  }
}
