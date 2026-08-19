"use server";

import {
  listAuthorizedBusinesses,
  requireUser,
} from "@/lib/actions/business";
import { LOCATION_SCOPE_COOKIE } from "@/lib/location/constants";
import { readLocationScopeCookie } from "@/lib/location/scope";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedBusinessId } from "@/lib/tenancy/authorize";
import { writeActiveBusinessCookie } from "@/lib/tenancy/cookie";
import { locationCookieAfterBusinessSwitch } from "@/lib/tenancy/location-reset";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type TenancyActionState = {
  error?: string;
  success?: string;
};

/**
 * Persist the operator's active tenant after authorization check.
 * Never trusts a client-supplied business id by itself.
 */
export async function setActiveBusinessAction(
  businessId: string,
): Promise<TenancyActionState> {
  await requireUser();
  const id = businessId.trim();
  if (!id) {
    return { error: "Choose a business to switch to." };
  }

  const authorized = await listAuthorizedBusinesses();
  if (!isAuthorizedBusinessId(authorized, id)) {
    return { error: "You do not have access to that business." };
  }

  await writeActiveBusinessCookie(id);

  const supabase = await createClient();
  const { data: locRows } = await supabase
    .from("locations")
    .select("id, is_default")
    .eq("business_id", id)
    .eq("is_active", true)
    .order("is_default", { ascending: false });

  const locationIds = (locRows ?? []).map((row) => String(row.id));
  const defaultLocationId =
    (locRows ?? []).find((row) => row.is_default)?.id != null
      ? String((locRows ?? []).find((row) => row.is_default)?.id)
      : (locationIds[0] ?? null);

  const nextLocation = locationCookieAfterBusinessSwitch({
    previousCookie: await readLocationScopeCookie(),
    locationIds,
    defaultLocationId,
  });

  const store = await cookies();
  if (nextLocation) {
    store.set(LOCATION_SCOPE_COOKIE, nextLocation, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    store.delete(LOCATION_SCOPE_COOKIE);
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Switched business." };
}
