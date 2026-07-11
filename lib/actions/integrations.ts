"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types/booking";
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
} from "@/lib/integrations/calendar/google";
import {
  getOutlookAuthUrl,
  exchangeOutlookCode,
} from "@/lib/integrations/calendar/outlook";
import {
  createAppleCalendarConnection,
} from "@/lib/integrations/calendar/sync";
import { enqueueCalendarSyncJob } from "@/lib/integrations/jobs/queue";
import { getAppUrl } from "@/lib/env";
import { redirect } from "next/navigation";

export async function getCalendarConnections() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calendar_connections")
    .select("id, provider, staff_id, calendar_name, sync_enabled, sync_direction, ics_secret, last_synced_at, created_at, staff:staff(name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function connectGoogleCalendar(formData: FormData) {
  const staffId = (formData.get("staff_id") as string) || null;
  await startGoogleCalendarConnect(staffId === "" ? null : staffId);
}

export async function connectOutlookCalendar(formData: FormData) {
  const staffId = (formData.get("staff_id") as string) || null;
  await startOutlookCalendarConnect(staffId === "" ? null : staffId);
}

export async function startGoogleCalendarConnect(staffId?: string | null) {
  const business = await getOrCreateBusiness();
  const state = Buffer.from(
    JSON.stringify({ businessId: business.id, staffId: staffId ?? null }),
  ).toString("base64url");

  const url = getGoogleAuthUrl(state);
  if (!url) throw new Error("Google Calendar is not configured.");
  redirect(url);
}

export async function startOutlookCalendarConnect(staffId?: string | null) {
  const business = await getOrCreateBusiness();
  const state = Buffer.from(
    JSON.stringify({ businessId: business.id, staffId: staffId ?? null }),
  ).toString("base64url");

  const url = getOutlookAuthUrl(state);
  if (!url) throw new Error("Outlook Calendar is not configured.");
  redirect(url);
}

export async function completeGoogleCalendarConnect(
  code: string,
  state: string,
) {
  const { businessId, staffId } = JSON.parse(
    Buffer.from(state, "base64url").toString(),
  ) as { businessId: string; staffId: string | null };

  const tokens = await exchangeGoogleCode(code);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calendar_connections")
    .insert({
      business_id: businessId,
      staff_id: staffId,
      provider: "google",
      provider_calendar_id: "primary",
      calendar_name: "Google Calendar",
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expires_at: tokens.expiresAt.toISOString(),
      sync_direction: "two_way",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await enqueueCalendarSyncJob(businessId, data.id);
}

export async function completeOutlookCalendarConnect(
  code: string,
  state: string,
) {
  const { businessId, staffId } = JSON.parse(
    Buffer.from(state, "base64url").toString(),
  ) as { businessId: string; staffId: string | null };

  const tokens = await exchangeOutlookCode(code);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calendar_connections")
    .insert({
      business_id: businessId,
      staff_id: staffId,
      provider: "outlook",
      provider_calendar_id: "primary",
      calendar_name: "Outlook Calendar",
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expires_at: tokens.expiresAt.toISOString(),
      sync_direction: "two_way",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await enqueueCalendarSyncJob(businessId, data.id);
}

export async function connectAppleCalendar(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const staffId = (formData.get("staff_id") as string) || null;

  const connection = await createAppleCalendarConnection(
    business.id,
    staffId === "" ? null : staffId,
  );

  revalidatePath("/dashboard/integrations");
  return {
    success: `Apple Calendar feed created. Subscribe to: ${getAppUrl()}/api/calendar/feed/${connection.ics_secret}.ics`,
  };
}

export async function disconnectCalendar(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("calendar_connections")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/integrations");
  return { success: "Calendar disconnected." };
}

export async function syncCalendarNow(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  await enqueueCalendarSyncJob(business.id, id);
  revalidatePath("/dashboard/integrations");
  return { success: "Calendar sync queued." };
}

export async function toggleCalendarSync(
  id: string,
  enabled: boolean,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("calendar_connections")
    .update({ sync_enabled: enabled })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/integrations");
  return { success: enabled ? "Sync enabled." : "Sync paused." };
}
