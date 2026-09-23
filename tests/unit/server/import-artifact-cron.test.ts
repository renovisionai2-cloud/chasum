// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/import-artifact-cleanup", () => ({ cleanupImportArtifacts: vi.fn() }));

import { GET, POST } from "@/app/api/cron/cleanup-import-artifacts/route";
import { cleanupImportArtifacts } from "@/lib/server/import-artifact-cleanup";
import { RATE_LIMITS, resetRateLimitStore } from "@/lib/security/rate-limit";

const cleanup = vi.mocked(cleanupImportArtifacts);
const secret = "synthetic-c1-cron-secret";
const url = "https://synthetic.example.invalid/api/cron/cleanup-import-artifacts";

function request(authorization?: string, suffix = "") {
  return new Request(url + suffix, { headers: authorization ? { authorization } : {} });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimitStore();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("CRON_SECRET", undefined);
  cleanup.mockResolvedValue({ claimed: 25, confirmed: 24, failed: 1 });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe.each([GET, POST])("C1 cleanup route %s (worker mocked; no hosted request)", handler => {
  it.each(["production", "preview", "unexpected", "", "development"])("%s denies a missing secret", async environment => {
    vi.stubEnv("VERCEL_ENV", environment);
    if (environment === "development") vi.stubEnv("NODE_ENV", "development");
    const response = await handler(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Cleanup is unavailable." });
    expect(cleanup).not.toHaveBeenCalled();
  });

  it.each(["production", "preview", "development"])("%s rejects missing, wrong and malformed bearer", async environment => {
    vi.stubEnv("VERCEL_ENV", environment);
    vi.stubEnv("CRON_SECRET", secret);
    for (const bearer of [undefined, "Bearer wrong", `Basic ${secret}`, `Bearer ${secret}-suffix`]) {
      const response = await handler(request(bearer));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    }
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("authorizes one bounded worker invocation and ignores caller-supplied keys, identity and limit", async () => {
    vi.stubEnv("CRON_SECRET", secret);
    const response = await handler(request(`Bearer ${secret}`, "?limit=999999&businessId=other&objectKey=secret-key"));
    expect(response.status).toBe(200);
    expect(cleanup).toHaveBeenCalledExactlyOnceWith();
    expect(await response.json()).toEqual({ claimed: 25, confirmed: 24, failed: 1 });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-ratelimit-limit")).toBe(String(RATE_LIMITS.cron.limit));
  });

  it("suppresses worker error bodies and emits no console payload", async () => {
    vi.stubEnv("CRON_SECRET", secret);
    const sensitive = "SYNTHETIC-PRIVATE-LABEL object/key.csv signed-token customer@example.invalid";
    cleanup.mockRejectedValueOnce(new Error(sensitive));
    const logs = [vi.spyOn(console, "log"), vi.spyOn(console, "warn"), vi.spyOn(console, "error")];
    const response = await handler(request(`Bearer ${secret}`));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Cleanup could not complete." });
    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });
});

it("rate limits authorized cleanup before another privileged worker invocation", async () => {
  vi.stubEnv("CRON_SECRET", secret);
  for (let i = 0; i < RATE_LIMITS.cron.limit; i++) {
    expect((await GET(request(`Bearer ${secret}`))).status).toBe(200);
  }
  const response = await POST(request(`Bearer ${secret}`));
  expect(response.status).toBe(429);
  expect(await response.json()).toEqual({ error: "Rate limit exceeded" });
  expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
  expect(cleanup).toHaveBeenCalledTimes(RATE_LIMITS.cron.limit);
});

it("unauthorized callers cannot consume the shared cleanup rate limit", async () => {
  vi.stubEnv("CRON_SECRET", secret);
  for (let i = 0; i <= RATE_LIMITS.cron.limit; i++) {
    expect((await GET(request("Bearer incorrect"))).status).toBe(401);
  }
  const response = await GET(request(`Bearer ${secret}`));
  expect(response.status).toBe(200);
  expect(response.headers.get("x-ratelimit-remaining")).toBe(String(RATE_LIMITS.cron.limit - 1));
  expect(cleanup).toHaveBeenCalledExactlyOnceWith();
});
