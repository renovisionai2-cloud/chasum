import { cookies } from "next/headers";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/tenancy/constants";

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
};

export async function readActiveBusinessCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ACTIVE_BUSINESS_COOKIE)?.value?.trim();
  return value || null;
}

export async function writeActiveBusinessCookie(businessId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_BUSINESS_COOKIE, businessId, COOKIE_OPTS);
}

export async function clearActiveBusinessCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ACTIVE_BUSINESS_COOKIE);
}
