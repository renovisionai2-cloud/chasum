import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, requireServiceRoleKey } from "@/lib/env";

export function createServiceClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(env.url, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
