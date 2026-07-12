import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types/booking";
import { redirect } from "next/navigation";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getBusiness(): Promise<Business | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return data;
}

export async function getOrCreateBusiness(): Promise<Business> {
  const user = await requireUser();
  const supabase = await createClient();

  const baseName =
    (user.user_metadata?.full_name as string | undefined) ?? "My Business";
  const emailPrefix = user.email?.split("@")[0] ?? "business";
  const preferredSlug = slugify(emailPrefix);

  const { data, error } = await supabase.rpc("ensure_business_for_owner", {
    p_name: baseName,
    p_preferred_slug: preferredSlug,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as Business;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}
