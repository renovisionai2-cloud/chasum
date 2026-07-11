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

async function createDefaultBusinessHours(businessId: string) {
  const supabase = await createClient();
  const hours = Array.from({ length: 7 }, (_, day) => ({
    business_id: businessId,
    day_of_week: day,
    is_open: day >= 1 && day <= 5,
    open_time: "09:00:00",
    close_time: "17:00:00",
  }));

  await supabase.from("business_hours").insert(hours);
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
  const existing = await getBusiness();
  if (existing) return existing;

  const user = await requireUser();
  const supabase = await createClient();

  const baseName =
    (user.user_metadata?.full_name as string | undefined) ?? "My Business";
  const emailPrefix = user.email?.split("@")[0] ?? "business";
  let attempt = 0;
  const baseSlug = slugify(emailPrefix);

  while (attempt < 5) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const { data, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: baseName,
        slug: candidate,
      })
      .select("*")
      .single();

    if (data) {
      await createDefaultBusinessHours(data.id);
      return data;
    }

    if (error?.code !== "23505") {
      throw new Error(error?.message ?? "Failed to create business");
    }

    attempt += 1;
  }

  throw new Error("Failed to generate a unique business slug");
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
