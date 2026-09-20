import { initSentry } from "@/lib/observability/sentry";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  initSentry("client");
}
