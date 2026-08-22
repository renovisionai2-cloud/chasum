import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/037_design_partner_applications.sql"),
  "utf8",
);

describe("037_design_partner_applications (unapplied Track 1)", () => {
  it("is documented as manual scoped SQL only and does not touch 034–036", () => {
    expect(sql).toMatch(/MANUAL SCOPED SQL EXECUTION ONLY/);
    expect(sql).toMatch(/supabase db push/);
    expect(sql).toMatch(/034/);
    expect(sql).toMatch(/035/);
    expect(sql).toMatch(/036/);
    expect(sql).toMatch(/UNAPPLIED/);
    expect(sql).not.toMatch(/alter table (appointments|businesses|subscription_events|billing_invoices)/i);
  });

  it("creates design_partner_applications with actual form fields", () => {
    expect(sql).toMatch(/create table if not exists public\.design_partner_applications/);
    for (const column of [
      "business_name",
      "industry",
      "employees",
      "locations",
      "current_software",
      "monthly_appointments",
      "pain_point",
      "contact_email",
      "contact_phone",
      "notes",
      "requested_plan_key",
      "status",
      "source",
      "created_at",
      "reviewed_at",
      "reviewed_by",
    ]) {
      expect(sql).toContain(column);
    }
    expect(sql).not.toMatch(/^\s*contact_name\b/m);
    expect(sql).toMatch(/check \(status in \(/);
    expect(sql).toMatch(/'received'/);
    expect(sql).toMatch(/'waitlisted'/);
  });

  it("does not auto-provision tenants or billing", () => {
    expect(sql).not.toMatch(/insert into (auth\.users|businesses|business_members)/i);
    expect(sql).not.toMatch(/create table.*stripe/i);
    expect(sql).not.toMatch(/\boffer_id\b/);
    expect(sql).not.toMatch(/subscription_events/);
  });

  it("denies browser and tenant table access", () => {
    expect(sql).toMatch(/enable row level security/);
    expect(sql).toMatch(/revoke all on table public\.design_partner_applications from public/);
    expect(sql).toMatch(/revoke all on table public\.design_partner_applications from anon/);
    expect(sql).toMatch(/revoke all on table public\.design_partner_applications from authenticated/);
    expect(sql).not.toMatch(/for insert/i);
    expect(sql).not.toMatch(/for select/i);
    expect(sql).not.toMatch(/create policy/i);
    expect(sql).toMatch(/grant select, insert, update, delete on table public\.design_partner_applications\s+to service_role/);
  });
});
