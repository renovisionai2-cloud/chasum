import { cookies } from "next/headers";
import { LOCATION_SCOPE_COOKIE } from "@/lib/location/constants";

export async function readLocationScopeCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(LOCATION_SCOPE_COOKIE)?.value ?? null;
}
