"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api/auth";
import { generateWebhookSecret } from "@/lib/integrations/webhooks/dispatch";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types/booking";
import { WEBHOOK_EVENTS } from "@/lib/types/integrations";

export async function getApiKeys() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, expires_at, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createApiKey(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { rawKey?: string }> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Key name is required." };

  const scopes = formData.getAll("scopes") as string[];
  const { rawKey, prefix, hash } = generateApiKey();

  const { error } = await supabase.from("api_keys").insert({
    business_id: business.id,
    name,
    key_prefix: prefix,
    key_hash: hash,
    scopes: scopes.length > 0 ? scopes : ["read", "write"],
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/developer");
  return {
    success: "API key created. Copy it now — it won't be shown again.",
    rawKey,
  };
}

export async function revokeApiKey(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/developer");
  return { success: "API key revoked." };
}

export async function getWebhooks() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .select("id, url, events, active, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createWebhook(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { secret?: string }> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const url = (formData.get("url") as string)?.trim();
  if (!url) return { error: "Webhook URL is required." };

  const events = formData.getAll("events") as string[];
  const secret = generateWebhookSecret();

  const { error } = await supabase.from("webhook_endpoints").insert({
    business_id: business.id,
    url,
    secret,
    events: events.length > 0 ? events : [...WEBHOOK_EVENTS],
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/developer");
  return {
    success: "Webhook endpoint created.",
    secret,
  };
}

export async function deleteWebhook(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/developer");
  return { success: "Webhook deleted." };
}

export async function toggleWebhook(
  id: string,
  active: boolean,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("webhook_endpoints")
    .update({ active })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/developer");
  return { success: active ? "Webhook enabled." : "Webhook disabled." };
}
