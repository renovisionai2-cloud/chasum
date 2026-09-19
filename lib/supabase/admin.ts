import { createServiceClient } from "@/lib/supabase/service";

/**
 * Server-only Auth Admin / service-role client.
 * Thin re-export of the existing service-role path — no second secret.
 */
export function createAdminClient() {
  return createServiceClient();
}
