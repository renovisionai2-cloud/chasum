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
