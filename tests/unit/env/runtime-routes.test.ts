// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/integrations/jobs/processor", () => ({ processPendingJobs: vi.fn(async () => 0) }));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/observability/sentry", () => ({ isSentryEnabled: () => false, captureMessage: vi.fn() }));
import { processPendingJobs } from "@/lib/integrations/jobs/processor";
import { GET as health } from "@/app/api/health/route";
import { GET, POST } from "@/app/api/cron/process-jobs/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("CRON_SECRET", undefined);
  vi.stubEnv("RESEND_API_KEY", undefined);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://synthetic.example.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-anon");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-service");
});
afterEach(() => vi.unstubAllEnvs());

it.each([
  ["preview", false, 200, true],
  ["production", false, 503, false],
  ["production", true, 200, true],
] as const)("health: %s configured=%s", async (vercel, configured, status, ok) => {
  vi.stubEnv("VERCEL_ENV", vercel);
  if (configured) { vi.stubEnv("CRON_SECRET", "synthetic-secret"); vi.stubEnv("RESEND_API_KEY", "synthetic-key"); }
  const result = await health(new Request("https://example.invalid/api/health"));
  expect(result.status).toBe(status);
  expect(await result.json()).toMatchObject({ ok, production: vercel === "production" });
  expect(processPendingJobs).not.toHaveBeenCalled();
});

it.each(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"])("Preview still requires %s", async (key) => {
  vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv(key, undefined);
  expect((await health(new Request("https://example.invalid/api/health"))).status).toBe(503);
});

describe.each([GET, POST])("worker route %s (worker stub only)", (handler) => {
  it.each(["production", "preview", "unexpected", ""])("%s denies missing secret", async (vercel) => {
    vi.stubEnv("VERCEL_ENV", vercel);
    expect((await handler(new Request("https://example.invalid/api/cron/process-jobs"))).status).toBe(503);
    expect(processPendingJobs).not.toHaveBeenCalled();
  });
  it.each(["production", "preview", "unexpected"])("%s enforces bearer", async (vercel) => {
    vi.stubEnv("VERCEL_ENV", vercel); vi.stubEnv("CRON_SECRET", "synthetic-secret");
    for (const bearer of [undefined, "Bearer wrong"]) {
      const response = await handler(new Request("https://example.invalid/api/cron/process-jobs", { headers: bearer ? { authorization: bearer } : {} }));
      expect(response.status).toBe(401);
    }
    expect(processPendingJobs).not.toHaveBeenCalled();
    expect((await handler(new Request("https://example.invalid/api/cron/process-jobs", { headers: { authorization: "Bearer synthetic-secret" } }))).status).toBe(200);
    expect(processPendingJobs).toHaveBeenCalledExactlyOnceWith(50);
  });
  it.each(["development", "test"])("local %s remains usable without secret", async (node) => {
    vi.stubEnv("VERCEL_ENV", undefined); vi.stubEnv("NODE_ENV", node);
    expect((await handler(new Request("https://example.invalid/api/cron/process-jobs"))).status).toBe(200);
    expect(processPendingJobs).toHaveBeenCalledExactlyOnceWith(50);
  });
  it("local production remains guarded", async () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    expect((await handler(new Request("https://example.invalid/api/cron/process-jobs"))).status).toBe(503);
    expect(processPendingJobs).not.toHaveBeenCalled();
  });
  it("Vercel development preserves optional-secret enforcement", async () => {
    vi.stubEnv("VERCEL_ENV", "development"); vi.stubEnv("CRON_SECRET", "synthetic-secret");
    expect((await handler(new Request("https://example.invalid/api/cron/process-jobs"))).status).toBe(401);
    expect(processPendingJobs).not.toHaveBeenCalled();
  });
});
