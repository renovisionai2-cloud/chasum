import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(path, "utf8");
const sql = read("supabase/migrations/20260920230358_tenant_identity_gate.sql");
describe("tenant creation security contracts (local PostgreSQL tests prove behavior)", () => {
  it("keeps new function private to service role", () => {
    expect(sql).toContain("from public, anon, authenticated;");
    expect(sql).toMatch(
      /grant execute on function public.decide_business_identity\([^;]+to service_role;/,
    );
    expect(sql).not.toMatch(
      /grant execute on function public.decide_business_identity\([^;]+to (anon|authenticated)/,
    );
    expect(sql).toContain("set search_path = pg_catalog, public, pg_temp");
  });
  it("closes insert and legacy create, retaining profile update", () => {
    expect(sql).toContain(
      "revoke insert on public.businesses from public, anon, authenticated",
    );
    const legacy = sql
      .split("create or replace function public.ensure_business_for_owner")[1]
      .split("$$;")[0];
    expect(legacy).not.toMatch(/insert|create_default_location/i);
    expect(sql).toContain('"Owners update their businesses"');
    expect(sql).toContain("new.owner_id is distinct from old.owner_id");
  });
  it("has no open override or sensitive audit metadata", () => {
    const table = sql
      .split("create table public.tenant_identity_decisions")[1]
      .split("alter table")[0];
    expect(table).not.toMatch(
      /^\s*(metadata|email|phone_number|business_name)\s|jsonb/m,
    );
    expect(table).toContain(
      "reviewed_by uuid references public.platform_admins(user_id)",
    );
    expect(sql).toContain("p_intent not in ('create_new', 'join_existing')");
  });
  it("places onboarding outside dashboard and excludes create from auth/resolution", () => {
    const page = read("app/onboarding/business/page.tsx");
    expect(page).toContain("resolveBusinessForUser");
    expect(page).toContain("hasOperatorMarker");
    expect(read("lib/actions/business.ts")).not.toContain(".rpc(");
    expect(read("lib/actions/auth.ts")).not.toContain(
      "ensure_business_for_owner",
    );
    expect(read("app/(dashboard)/layout.tsx")).toContain(
      "await requireBusiness()",
    );
  });
  it("preserves paid-plan preference as non-billing and no 034-036 dependency", () => {
    expect(read("components/auth/signup-form.tsx")).toContain(
      "it does not activate paid billing",
    );
    expect(sql).not.toMatch(
      /appointment_resources|resource_requirements|optional_staff/,
    );
    expect(sql).not.toContain("stripe");
  });
});
