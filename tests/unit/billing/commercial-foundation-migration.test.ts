import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/038_commercial_foundation_additive.sql",
  ),
  "utf8",
);
const track3Blocked = readFileSync(
  join(process.cwd(), "docs/WORLD_CLASS_COMMERCIAL_FOUNDATION.md"),
  "utf8",
);

describe("038_commercial_foundation_additive (Track 2 Staging applied; Production unapplied)", () => {
  it("requires manual scoped SQL and leaves 034–036 and Track 3 untouched", () => {
    expect(sql).toMatch(/MANUAL SCOPED SQL EXECUTION ONLY/);
    expect(sql).toMatch(/supabase db push/);
    expect(sql).toMatch(/034/);
    expect(sql).toMatch(/035/);
    expect(sql).toMatch(/036/);
    expect(sql).toMatch(/STAGING: APPLIED \+ VERIFIED/);
    expect(sql).toMatch(/PRODUCTION: UNAPPLIED/);
    expect(sql).not.toMatch(/subscription_events enable row level security/);
    expect(sql).not.toMatch(/policy.*subscription_events/i);
    expect(sql).not.toMatch(/policy.*billing_invoices/i);
    expect(sql).not.toMatch(/create table.*billing_profiles/i);
    expect(sql).not.toMatch(/add column if not exists past_due_since/i);
    expect(sql).not.toMatch(/insert into public\.plan_offers/i);
    expect(sql).not.toMatch(/private_alpha/);
    expect(track3Blocked).toMatch(/Track 3/);
    expect(track3Blocked).toMatch(/BLOCKED/);
  });

  it("defines plan_offers uniqueness, money, and default/active CHECKs", () => {
    expect(sql).toMatch(/unique \(plan_key, currency, version\)/);
    expect(sql).toMatch(/plan_offers_one_default_per_plan_currency/);
    expect(sql).toMatch(/where is_default_for_new/);
    expect(sql).toMatch(/plan_offers_default_requires_locked/);
    expect(sql).toMatch(/plan_offers_default_requires_active/);
    expect(sql).toMatch(/plan_offers_active_requires_locked/);
    expect(sql).toMatch(/version >= 1/);
    expect(sql).toMatch(/monthly_cents is null or monthly_cents >= 0/);
    expect(sql).toMatch(/currency = lower\(currency\)/);
  });

  it("locks commercial payload and uses auth.role\(\) = service_role, not null uid", () => {
    expect(sql).toMatch(/locked offer commercial payload is immutable/);
    expect(sql).toMatch(/locked offers cannot be unlocked/);
    expect(sql).toMatch(/auth\.role\(\) is distinct from 'service_role'/);
    expect(sql).toMatch(/current_user not in \('postgres', 'supabase_admin'\)/);
    expect(sql).not.toMatch(/auth\.uid\(\)\s+is\s+null/i);
    expect(sql).toMatch(/if tg_op = 'INSERT' then/);
    expect(sql).toMatch(/subscription_plan_key must match plan_offers\.plan_key/);
    expect(sql).toMatch(/businesses may only reference locked offers/);
    expect(sql).toMatch(/offer_id may only be assigned by trusted server role/);
  });

  it("adds nullable businesses.offer_id without backfill", () => {
    expect(sql).toMatch(/add column if not exists offer_id uuid/);
    expect(sql).toMatch(/No Track 2 backfill/);
    expect(sql).not.toMatch(/update public\.businesses set offer_id/i);
  });

  it("keeps plan_offers and usage_events off tenant PostgREST", () => {
    expect(sql).toMatch(/alter table public\.plan_offers enable row level security/);
    expect(sql).toMatch(/alter table public\.usage_events enable row level security/);
    expect(sql).toMatch(/revoke all on table public\.plan_offers from anon/);
    expect(sql).toMatch(/revoke all on table public\.plan_offers from authenticated/);
    expect(sql).toMatch(/revoke all on table public\.usage_events from anon/);
    expect(sql).toMatch(/revoke all on table public\.usage_events from authenticated/);
    expect(sql).not.toMatch(/create policy/i);
    expect(sql).toMatch(/grant select, insert, update, delete on table public\.plan_offers to service_role/);
    expect(sql).toMatch(/grant select, insert on table public\.usage_events to service_role/);
  });

  it("makes usage_events append-only with micro-USD cost", () => {
    expect(sql).toMatch(/estimated_cost_micros/);
    expect(sql).toMatch(/1,000,000 micros/);
    expect(sql).toMatch(/usage_events is append-only/);
    expect(sql).toMatch(/num_segments/);
    expect(sql).toMatch(/NumSegments/);
    expect(sql).toMatch(/usage_events_business_occurred_idx/);
    expect(sql).toMatch(
      /business_id uuid not null references public\.businesses \(id\) on delete restrict/i,
    );
    expect(sql).not.toMatch(
      /usage_events \([\s\S]*references public\.businesses \(id\) on delete cascade/i,
    );
  });

  it("does not change Private Alpha or existing billing RLS", () => {
    const features = readFileSync(
      join(process.cwd(), "lib/billing/plan-features.ts"),
      "utf8",
    );
    expect(features).toMatch(
      /if \(businessHasPrivateAlpha\(business\)\) return "professional"/,
    );
    expect(features).toMatch(
      /if \(businessHasPrivateAlpha\(business\)\) return true/,
    );
    const billing015 = readFileSync(
      join(process.cwd(), "supabase/migrations/015_billing_phase1.sql"),
      "utf8",
    );
    expect(billing015).toMatch(/Owners insert own subscription events/);
    expect(sql).not.toMatch(/Owners insert own subscription events/);
  });
});
