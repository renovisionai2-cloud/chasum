import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Retrieval-only: does this auth user already own or co-own a business?
 * Never inserts. Safe for middleware, callback, and onboarding routing.
 */
export async function userHasAccessibleBusiness(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
): Promise<boolean> {
  const [{ data: owned }, { data: members }] = await Promise.all([
    supabase.from("businesses").select("id").eq("owner_id", userId).limit(1),
    supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", userId)
      .in("role", ["owner", "admin"])
      .limit(1),
  ]);

  return Boolean(owned?.length || members?.length);
}
