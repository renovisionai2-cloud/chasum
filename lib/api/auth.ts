import { createHash, randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import type { ApiKey, ApiScope } from "@/lib/types/integrations";

export function generateApiKey(): { rawKey: string; prefix: string; hash: string } {
  const raw = `chsm_${randomBytes(32).toString("hex")}`;
  const prefix = raw.slice(0, 12);
  const hash = hashApiKey(raw);
  return { rawKey: raw, prefix, hash };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function authenticateApiKey(
  authorizationHeader: string | null,
): Promise<{ businessId: string; scopes: ApiScope[]; keyId: string } | null> {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;

  const rawKey = authorizationHeader.slice(7).trim();
  if (!rawKey.startsWith("chsm_")) return null;

  const supabase = createServiceClient();
  const hash = hashApiKey(rawKey);

  const { data } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", hash)
    .maybeSingle();

  if (!data) return null;

  const key = data as ApiKey & { key_hash: string };

  if (key.expires_at && new Date(key.expires_at) < new Date()) return null;

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id);

  return {
    businessId: key.business_id,
    scopes: key.scopes as ApiScope[],
    keyId: key.id,
  };
}

export function requireScope(scopes: ApiScope[], required: ApiScope): boolean {
  return scopes.includes(required) || scopes.includes("write");
}
