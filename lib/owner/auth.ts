import { getPlatformOwnerEmails } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export type PlatformOwner = {
  user: User;
  email: string;
  source: "env" | "database";
};

function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

/**
 * Returns true when the signed-in user is a Chasum platform owner.
 * Checks PLATFORM_OWNER_EMAILS first, then platform_admins (migration 014).
 */
export async function isPlatformOwner(user: User): Promise<boolean> {
  const email = normalizeEmail(user.email);
  if (!email) return false;

  const envAllow = getPlatformOwnerEmails();
  if (envAllow.includes(email)) return true;

  try {
    const service = createServiceClient();
    const byUser = await service
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (byUser.data) return true;

    const byEmail = await service
      .from("platform_admins")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();
    return Boolean(byEmail.data);
  } catch {
    // Table may not exist until migration 014 is applied.
    return false;
  }
}

export async function requirePlatformOwner(): Promise<PlatformOwner> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/owner");
  }

  const email = normalizeEmail(user.email);
  if (!email) {
    redirect("/dashboard");
  }

  const envAllow = getPlatformOwnerEmails();
  if (envAllow.includes(email)) {
    return { user, email, source: "env" };
  }

  try {
    const service = createServiceClient();
    const byUser = await service
      .from("platform_admins")
      .select("user_id, email")
      .eq("user_id", user.id)
      .maybeSingle();
    if (byUser.data) {
      return { user, email, source: "database" };
    }

    const byEmail = await service
      .from("platform_admins")
      .select("user_id, email")
      .ilike("email", email)
      .maybeSingle();
    if (byEmail.data) {
      return { user, email, source: "database" };
    }
  } catch {
    /* migration not applied */
  }

  redirect("/dashboard");
}
