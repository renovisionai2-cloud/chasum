import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

describe("trusted operator source locks", () => {
  it("fail-closes getOrCreateBusiness before ensure_business_for_owner when the operator marker is present", () => {
    const source = readRepo("lib/actions/business.ts");
    const marker = source.indexOf("shouldFailClosedTenantCreate");
    const create = source.indexOf("ensure_business_for_owner");
    expect(marker).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(-1);
    expect(marker).toBeLessThan(create);
    expect(source).toContain('redirect("/access-denied")');
  });

  it("never auto-sends inviteUserByEmail and never uses admin.signOut", () => {
    const source = readRepo("lib/actions/operator-access.ts");
    expect(source).not.toContain("inviteUserByEmail");
    expect(source).not.toContain("getUserByEmail");
    expect(source).not.toMatch(/admin\.signOut/);
    expect(source).not.toContain("auth.users");
    expect(source).toContain("generateLink");
    expect(source).toContain("hashed_token");
    expect(source).toContain("verification_type");
    expect(source).not.toContain("properties.action_link");
    expect(source).toContain("ban_duration");
    expect(source).toContain("TRUSTED_OPERATOR_UNBAN_DURATION");
    expect(source).toContain("role: TRUSTED_OPERATOR_ROLE");
  });

  it("keeps /owner and /dashboard/hq on requirePlatformOwner", () => {
    expect(readRepo("app/(owner)/layout.tsx")).toContain("requirePlatformOwner");
    expect(readRepo("lib/hq/snapshot.ts")).toContain("requirePlatformOwner");
    expect(readRepo("lib/owner/auth.ts")).toContain("platform_admins");
  });

  it("does not write platform_admins, businesses.owner_id, or PLATFORM_OWNER_EMAILS", () => {
    const source = readRepo("lib/actions/operator-access.ts");
    expect(source).not.toMatch(/from\("platform_admins"\)[\s\S]{0,80}\.(insert|update|upsert|delete)/);
    expect(source).not.toMatch(/from\("businesses"\)[\s\S]{0,80}\.(insert|update|upsert)/);
    expect(source).not.toContain("PLATFORM_OWNER_EMAILS");
    expect(source).toContain("getPlatformOwnerEmails");
  });

  it("keeps the admin wrapper as a thin re-export of the existing service-role path", () => {
    const source = readRepo("lib/supabase/admin.ts");
    expect(source).toContain("createServiceClient");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("createClient(");
  });

  it("does not import service-role helpers from client components", () => {
    const panel = readRepo("components/employees/operator-access-panel.tsx");
    expect(panel).toContain('"use client"');
    expect(panel).not.toContain("createServiceClient");
    expect(panel).not.toContain("createAdminClient");
    expect(panel).not.toContain("lib/supabase/admin");
    expect(panel).not.toContain("lib/supabase/service");
    expect(panel).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(panel).toContain("Trusted Admin");
    expect(panel).toContain("Full access to this business during Private Alpha");
    expect(panel).not.toMatch(/Employee login|Receptionist|Limited access/);
  });

  it("callback still exchanges the session, verifies token_hash, and does not create a tenant", async () => {
    const source = readRepo("app/auth/callback/route.ts");
    expect(source).toContain("exchangeCodeForSession");
    expect(source).toContain("verifyOtp");
    expect(source).toContain("createAuthCallbackClient");
    expect(source).toContain("redirectWithAuthCookies");
    expect(source).not.toContain('from "@/lib/supabase/server"');
    expect(source).not.toContain("getOrCreateBusiness");
    expect(source).not.toContain("ensure_business_for_owner");
  });

  it("emits ordered raw Set-Cookie headers instead of name-collapsed ResponseCookies", () => {
    const helper = readRepo("lib/supabase/auth-callback.ts");
    expect(helper).toContain("stringifySetCookie");
    expect(helper).toContain('headers.append(\n      "Set-Cookie"');
    expect(helper).toContain("capturedCookies.push(write)");
    expect(helper).not.toContain("response.cookies.set");
    expect(helper).not.toContain("capturedCookies.findIndex");
  });

  it("keeps /access-denied authenticated-safe and out of guest-route bounce", () => {
    const page = readRepo("app/(auth)/access-denied/page.tsx");
    const middleware = readRepo("lib/supabase/middleware.ts");
    const matcher = readRepo("middleware.ts");
    expect(page).not.toContain("getOrCreateBusiness");
    expect(page).not.toContain("ensure_business_for_owner");
    expect(page).toContain("signOut");
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(page).toContain("getSupabaseEnv");
    expect(page).toContain(
      "Your access to this business is unavailable or has been revoked.",
    );
    expect(middleware).not.toMatch(
      /isGuestOnlyAuthRoute[\s\S]*access-denied/,
    );
    expect(matcher).not.toContain("/access-denied");
  });

  it("does not expose a NEXT_PUBLIC service-role secret", () => {
    const admin = readRepo("lib/supabase/admin.ts");
    const service = readRepo("lib/supabase/service.ts");
    const actions = readRepo("lib/actions/operator-access.ts");
    expect(admin).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(service).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(actions).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(service).toContain('typeof window !== "undefined"');
  });
});
