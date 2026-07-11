import { requireSupabaseEnv } from "@/lib/env";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
