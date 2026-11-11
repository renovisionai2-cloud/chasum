/** Local to the service-tax fixture; does not import PR #190's teardown helper. */
type Resource = "CHROMIUM" | "WEBKIT" | "VITE";
type Closeable = { close: () => Promise<unknown> };
type Outcome =
  | { resource: Resource; status: "completed" }
  | { resource: Resource; status: "rejected"; reason: unknown }
  | { resource: Resource; status: "timed_out" };
export type TeardownEvent = {
  event: "FIXTURE_TEARDOWN_BEGIN" | "FIXTURE_TEARDOWN_COMPLETE" | "FIXTURE_TEARDOWN_ERROR"
    | `${Resource}_CLOSE_${"BEGIN" | "COMPLETE" | "ERROR"}`;
  status?: Outcome["status"];
  timeoutMs?: number;
  terminationConfirmed?: false;
  detail?: string;
};

function reasonText(reason: unknown): string {
  // Promise.reject(undefined) is a failure too; never infer success from reason.
  try { return (reason instanceof Error ? reason.message : String(reason)).slice(0, 300); }
  catch { return "Unprintable rejection"; }
}

export async function closeServiceTaxFixture(input: {
  chromium?: Closeable;
  webkit?: Closeable;
  vite?: Closeable;
  emit: (event: TeardownEvent) => void;
}) {
  const emit = (event: TeardownEvent) => {
    try { input.emit(event); } catch { /* Diagnostics must not interrupt cleanup. */ }
  };
  async function close(resource: Resource, target: Closeable, timeoutMs: number): Promise<Outcome> {
    emit({ event: `${resource}_CLOSE_BEGIN`, timeoutMs });
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Explicit discriminants distinguish fulfilled(undefined) from rejected(undefined).
    // Attach both handlers before racing so late rejection remains consumed.
    const operation = Promise.resolve().then(() => target.close()).then<Outcome, Outcome>(
      () => ({ resource, status: "completed" }),
      (reason: unknown) => ({ resource, status: "rejected", reason }),
    );
    let outcome: Outcome;
    try {
      outcome = await Promise.race([
        operation,
        new Promise<Outcome>((resolve) => {
          timer = setTimeout(() => resolve({ resource, status: "timed_out" }), timeoutMs);
        }),
      ]);
    } finally { if (timer !== undefined) clearTimeout(timer); }
    if (outcome.status === "completed") emit({ event: `${resource}_CLOSE_COMPLETE`, status: outcome.status });
    else emit({
      event: `${resource}_CLOSE_ERROR`, status: outcome.status, terminationConfirmed: false,
      detail: outcome.status === "rejected" ? reasonText(outcome.reason) : "Close deadline expired; termination is unconfirmed.",
    });
    return outcome;
  }

  emit({ event: "FIXTURE_TEARDOWN_BEGIN" });
  const outcomes = await Promise.all([
    ...(input.chromium ? [close("CHROMIUM", input.chromium, 30_000)] : []),
    ...(input.webkit ? [close("WEBKIT", input.webkit, 30_000)] : []),
  ]);
  // Every browser close is bounded and returns an outcome, including rejection.
  // Vite is attempted after browser accounting even when a browser never settles.
  if (input.vite) outcomes.push(await close("VITE", input.vite, 10_000));
  const failures = outcomes.filter((outcome) => outcome.status !== "completed");
  if (failures.length) {
    emit({ event: "FIXTURE_TEARDOWN_ERROR" });
    throw new AggregateError(failures.map((failure) => new Error(
      `${failure.resource}: ${failure.status}${failure.status === "rejected" ? ` (${reasonText(failure.reason)})` : " (termination unconfirmed)"}`,
    )), "Service tax fixture teardown failed");
  }
  emit({ event: "FIXTURE_TEARDOWN_COMPLETE" });
}
