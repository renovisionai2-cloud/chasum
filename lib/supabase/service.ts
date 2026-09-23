import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, requireServiceRoleKey } from "@/lib/env";

export function createServiceClient(options?: { requestTimeoutMs: number }) {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient cannot run in the browser.");
  }
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(env.url, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(options ? { global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.any([AbortSignal.timeout(options.requestTimeoutMs),
        ...((init?.signal ?? (input instanceof Request ? input.signal : undefined))
          ? [init?.signal ?? (input as Request).signal] : [])]),
    }) } } : {}),
  });
}
