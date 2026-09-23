// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ synthetic: true })) }));
vi.mock("@/lib/env", () => ({ getSupabaseEnv: vi.fn(), requireServiceRoleKey: vi.fn() }));

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, requireServiceRoleKey } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

const factory = vi.mocked(createClient);
const env = { url: "https://synthetic.example.invalid", anonKey: "synthetic-anon" };
const serviceKey = "synthetic-server-service-key";

function transport(timeoutMs = 20_000) {
  createServiceClient({ requestTimeoutMs: timeoutMs });
  const fetcher = factory.mock.calls[0]?.[2]?.global?.fetch;
  if (!fetcher) throw new Error("Expected bounded C1 transport");
  return fetcher;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSupabaseEnv).mockReturnValue(env);
  vi.mocked(requireServiceRoleKey).mockReturnValue(serviceKey);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C1 opt-in service client transport (all fetches mocked)", () => {
  it("preserves default clients without a custom fetch or global options", () => {
    createServiceClient();
    expect(factory).toHaveBeenCalledExactlyOnceWith(env.url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  it("uses the same server key/auth configuration and forces no-store for the optional transport", async () => {
    const response = new Response("synthetic");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetcher);
    const bounded = transport();
    expect(factory).toHaveBeenCalledExactlyOnceWith(env.url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: bounded },
    });
    const input = `${env.url}/storage/v1/object/import-artifacts/synthetic`;
    const init = { method: "POST", body: "synthetic", cache: "force-cache" as const, headers: { "x-test": "synthetic" } };
    expect(await bounded(input, init)).toBe(response);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(input, {
      ...init, cache: "no-store", signal: expect.any(AbortSignal),
    });
    expect(init.cache).toBe("force-cache");
  });

  it("supplies a timeout signal even when the caller supplies no fetch options", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("synthetic"));
    vi.stubGlobal("fetch", fetcher);
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await transport(15_000)(env.url);
    expect(timeout).toHaveBeenCalledExactlyOnceWith(15_000);
    expect(fetcher.mock.calls[0][1]).toEqual({ cache: "no-store", signal: expect.any(AbortSignal) });
  });

  it("aborts an otherwise pending mocked request at its real timeout", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>((_input, init) => new Promise((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) throw new Error("Expected request signal");
      if (signal.aborted) reject(signal.reason);
      else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    })));
    await expect(transport(5)(env.url)).rejects.toMatchObject({ name: "TimeoutError" });
  });

  it("preserves an in-flight caller cancellation as well as the independent deadline", async () => {
    const caller = new AbortController();
    let received: AbortSignal | null | undefined;
    vi.stubGlobal("fetch", vi.fn<typeof fetch>((_input, init) => new Promise((_resolve, reject) => {
      received = init?.signal;
      received?.addEventListener("abort", () => reject(received?.reason), { once: true });
    })));
    const pending = transport()(env.url, { signal: caller.signal });
    const rejection = expect(pending).rejects.toMatchObject({ name: "AbortError", message: "synthetic caller cancellation" });
    caller.abort(new DOMException("synthetic caller cancellation", "AbortError"));
    await rejection;
    expect(received?.aborted).toBe(true);
    expect(received?.reason).toBe(caller.signal.reason);
  });

  it("retains an already-aborted caller signal", async () => {
    const caller = new AbortController();
    caller.abort("synthetic cancellation");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("synthetic"));
    vi.stubGlobal("fetch", fetcher);
    await transport()(env.url, { signal: caller.signal });
    const signal = fetcher.mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(true);
    expect(signal?.reason).toBe(caller.signal.reason);
  });

  it("blocks browser construction before reading configuration or server credentials", () => {
    vi.stubGlobal("window", {});
    expect(() => createServiceClient({ requestTimeoutMs: 20_000 })).toThrow("cannot run in the browser");
    expect(getSupabaseEnv).not.toHaveBeenCalled();
    expect(requireServiceRoleKey).not.toHaveBeenCalled();
    expect(factory).not.toHaveBeenCalled();
  });

  it("fails without public project configuration before reading the server key", () => {
    vi.mocked(getSupabaseEnv).mockReturnValueOnce(null);
    expect(() => createServiceClient({ requestTimeoutMs: 20_000 })).toThrow("Supabase is not configured.");
    expect(requireServiceRoleKey).not.toHaveBeenCalled();
    expect(factory).not.toHaveBeenCalled();
  });
});
