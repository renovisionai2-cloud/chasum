import { isPlatformOwner } from "@/lib/owner/auth";
import { userHasAccessibleBusiness } from "@/lib/tenancy/accessible-business";
import { resolvePostAuthDestination } from "@/lib/tenancy/post-auth-destination";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * After a successful auth exchange, route without creating a tenant.
 * Password-recovery `next` is preserved by resolvePostAuthDestination.
 */
export async function resolveAuthenticatedDestination(
  supabase: Pick<SupabaseClient, "from" | "auth">,
  next: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  const hasAccessibleBusiness = await userHasAccessibleBusiness(
    supabase,
    user.id,
  );
  const isPlatformAdmin = await isPlatformOwner(user);

  return resolvePostAuthDestination({
    hasAccessibleBusiness,
    isPlatformAdmin,
    requestedPath: next,
  });
}
