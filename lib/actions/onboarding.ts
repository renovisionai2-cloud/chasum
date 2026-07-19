"use server";

import { getOrCreateBusiness, requireUser } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import {
  composeDisplayName,
  permissionsForRole,
} from "@/lib/employees/roles";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

/**
 * One-click: add the signed-in owner as a bookable staff member.
 * Unblocks public booking without inventing demo employees.
 */
export async function ensureOwnerAsBookableStaff(): Promise<ActionState> {
  const user = await requireUser();
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const email = user.email?.trim().toLowerCase() ?? null;
  if (email) {
    const { data: existing } = await supabase
      .from("staff")
      .select("id")
      .eq("business_id", business.id)
      .ilike("email", email)
      .maybeSingle();
    if (existing) {
      return { success: "You are already on the team as a bookable employee." };
    }
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    email?.split("@")[0] ||
    "Owner";
  const parts = fullName.split(/\s+/);
  const firstName = parts[0] ?? "Owner";
  const lastName = parts.slice(1).join(" ") || "Operator";
  const displayName = composeDisplayName({
    firstName,
    lastName,
    preferredName: null,
    name: fullName,
  });

  const locationId = await getActiveLocationId();

  const { error } = await supabase.from("staff").insert({
    business_id: business.id,
    location_id: locationId,
    first_name: firstName,
    last_name: lastName,
    name: displayName,
    email,
    role_key: "owner",
    employment_status: "active",
    is_active: true,
    permissions: permissionsForRole("owner"),
    accept_online_bookings: true,
    title: "Owner",
    color: "#2563EB",
  });

  if (error) {
    // role_key owner may fail soft schema — retry as admin/employee
    const retry = await supabase.from("staff").insert({
      business_id: business.id,
      location_id: locationId,
      first_name: firstName,
      last_name: lastName,
      name: displayName,
      email,
      role_key: "admin",
      employment_status: "active",
      is_active: true,
      permissions: permissionsForRole("admin"),
      accept_online_bookings: true,
      title: "Owner",
      color: "#2563EB",
    });
    if (retry.error) {
      return { error: retry.error.message };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/services");
  revalidatePath(`/book/${business.slug}`);

  return {
    success:
      "You are now a bookable employee. Assign yourself to services so customers can pick you.",
  };
}
