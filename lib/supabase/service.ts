import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, requireServiceRoleKey } from "@/lib/env";

export function createServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient cannot run in the browser.");
  }
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(env.url, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
