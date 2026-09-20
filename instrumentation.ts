import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSentry } = await import("@/lib/observability/sentry");
    initSentry("nodejs");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { initSentry } = await import("@/lib/observability/sentry");
    initSentry("edge");
  }
}

function readDigest(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("digest" in error)) {
    return undefined;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" ? digest : undefined;
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const [{ captureException }, { createSupportReference }] = await Promise.all([
    import("@/lib/observability/sentry"),
    import("@/lib/observability/correlation"),
  ]);

  let referenceId: string | undefined;
  try {
    referenceId = createSupportReference();
  } catch {
    referenceId = undefined;
  }

  captureException(error, {
    domain: "server",
    scope: "request_error",
    route: context.routePath,
    routeType: context.routeType,
    method: request.method,
    runtime: process.env.NEXT_RUNTIME ?? "unknown",
    digest: readDigest(error),
    referenceId,
  });
};
