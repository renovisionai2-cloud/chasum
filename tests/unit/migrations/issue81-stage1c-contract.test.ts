import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260922210000_issue_81_stage_1c_location_template.sql",
  ),
  "utf8",
);

const postgresContract = readFileSync(
  resolve(process.cwd(), "tests/postgres/issue-81-stage1c-contract.sql"),
  "utf8",
);

describe("Issue #81 Stage 1C migration contract", () => {
  it("rejects malformed single-dollar PostgreSQL test block delimiters", () => {
    expect(postgresContract).not.toMatch(/^\s*(?:do \$|end \$;)\s*$/m);
  });

  it("reconciles Business to six locations and removes the Private Alpha bypass", () => {
    expect(migration).toContain("set max_locations = 6");
    const quota = migration.slice(
      migration.indexOf("create or replace function public.can_add_location"),
      migration.indexOf("create or replace function public.enforce_location_quota"),
    );
    expect(quota).toContain("l.is_active = true");
    expect(quota).not.toContain("private_alpha_enabled");
    expect(quota).toContain("public.is_business_owner(b.id)");
    expect(migration).toContain("to authenticated;");
    expect(migration).not.toContain(
      "grant execute on function public.can_add_location(uuid)\n  to authenticated, service_role",
    );
  });

  it("makes the atomic RPC the browser/authenticated Location-create authority", () => {
    expect(migration).toContain(
      "revoke insert on table public.locations",
    );
    expect(migration).toContain(
      "from public, anon, authenticated",
    );
    expect(migration).not.toContain(
      "revoke insert on table public.locations\n  from service_role",
    );
  });

  it("enforces quota at the locations write boundary with a pinned helper", () => {
    expect(migration).toContain("locations_enforce_plan_quota");
    expect(migration).toContain(
      "before insert or update of is_active on public.locations",
    );
    const helper = migration.slice(
      migration.indexOf("create or replace function public.enforce_location_quota"),
      migration.indexOf("drop trigger if exists locations_enforce_plan_quota"),
    );
    expect(helper).toContain("security definer");
    expect(helper).toContain("set search_path = public, pg_temp");
    expect(helper).toContain("for update");
    expect(helper).toContain("LOCATION_LIMIT_REACHED");
  });

  it("keeps the template writer atomic and owner-authorized", () => {
    const writer = migration.slice(
      migration.indexOf("create or replace function public.create_location_from_template"),
    );
    expect(writer).toContain("security definer");
    expect(writer).toContain("set search_path = public, pg_temp");
    expect(writer).toContain("is_business_owner(p_business_id)");
    expect(writer).toContain("pg_timezone_names");
    expect(writer).toContain("Location timezone is invalid.");
    expect(writer).toContain("Multiple active default locations require review before copying.");
    expect(writer).toContain("insert into public.locations");
    expect(writer).toContain("insert into public.location_settings");
    expect(writer).toContain("insert into public.location_hours");
    expect(writer).toContain("insert into public.location_hour_segments");
    expect(writer).toContain("insert into public.service_locations");
  });

  it("copies active source Services through mappings but never copies Staff/resources", () => {
    const writer = migration.slice(
      migration.indexOf("create or replace function public.create_location_from_template"),
    );
    expect(writer).toContain("s.is_active = true");
    expect(writer).toContain("s.location_id = v_source_id");
    expect(writer).toContain("sl.location_id = v_source_id");
    expect(writer).not.toContain("insert into public.staff_locations");
    expect(writer).not.toContain("insert into public.booking_resources");
    expect(writer).not.toContain("appointment_resources");
  });

  it("starts blank with seven closed days instead of invented availability", () => {
    const writer = migration.slice(
      migration.indexOf('-- "Start blank"'),
    );
    expect(writer).toContain("false");
    expect(writer).toContain("generate_series(0, 6)");
    expect(writer).not.toContain("d between 1 and 5");
  });

  it("revokes public/anon writer execution and grants only authenticated workflow access", () => {
    expect(migration).toContain(
      "revoke all on function public.create_location_from_template",
    );
    expect(migration).toContain(
      "from public, anon, authenticated, service_role",
    );
    expect(migration).toContain("to authenticated;");
  });

  it("does not introduce live inheritance or resource-aware booking", () => {
    expect(migration.toLowerCase()).not.toContain("inherited from");
    expect(migration).not.toContain("service_resource_requirements");
    expect(migration).not.toContain("resource_id");
  });
});
