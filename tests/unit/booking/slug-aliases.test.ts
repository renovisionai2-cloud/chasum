import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalBookingUrl,
  publicBookingPath,
  resolvePublicBookingSlug,
  resolvedPublicBusiness,
  type BookingSlugLookup,
} from "@/lib/booking/slug-aliases";
import type { Business } from "@/lib/types/booking";

function biz(id: string, slug: string): Business {
  return {
    id,
    owner_id: `owner-${id}`,
    name: `Business ${id}`,
    slug,
    timezone: "America/Toronto",
    appointment_interval_minutes: 15,
    booking_limit_days: 60,
    cancellation_policy: null,
    max_daily_bookings: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function lookup(opts: {
  bySlug?: Record<string, Business>;
  aliases?: Record<string, string>;
  byId?: Record<string, Business>;
}): BookingSlugLookup {
  return {
    findBusinessBySlug: async (slug) => opts.bySlug?.[slug] ?? null,
    findAlias: async (slug) =>
      opts.aliases?.[slug] ? { business_id: opts.aliases[slug] } : null,
    findBusinessById: async (id) => opts.byId?.[id] ?? null,
  };
}

describe("public booking slug aliases", () => {
  const tenantA = biz("biz-a", "studio-a");
  const tenantB = biz("biz-b", "studio-b");

  it("hits the current canonical slug directly", async () => {
    const resolution = await resolvePublicBookingSlug(
      "studio-b",
      lookup({ bySlug: { "studio-b": tenantB } }),
    );
    expect(resolution).toEqual({
      kind: "canonical",
      business: tenantB,
      canonicalSlug: "studio-b",
    });
  });

  it("resolves a historical alias to the current business id", async () => {
    const resolution = await resolvePublicBookingSlug(
      "studio-b-old",
      lookup({
        aliases: { "studio-b-old": "biz-b" },
        byId: { "biz-b": tenantB },
      }),
    );
    expect(resolution.kind).toBe("alias");
    if (resolution.kind !== "alias") return;
    expect(resolution.business.id).toBe("biz-b");
    expect(resolution.canonicalSlug).toBe("studio-b");
    expect(resolution.requestedSlug).toBe("studio-b-old");
    expect(publicBookingPath(resolution.canonicalSlug)).toBe("/book/studio-b");
  });

  it("preserves query params on the canonical redirect path", () => {
    expect(
      publicBookingPath("studio-b", { location: "main", invite: "VIP" }),
    ).toBe("/book/studio-b?location=main&invite=VIP");
  });

  it("returns missing for an unknown slug", async () => {
    const resolution = await resolvePublicBookingSlug("no-such", lookup({}));
    expect(resolution.kind).toBe("missing");
    expect(resolvedPublicBusiness(resolution)).toBeNull();
  });

  it("does not follow alias chains", async () => {
    const resolution = await resolvePublicBookingSlug(
      "oldest",
      lookup({
        aliases: { oldest: "biz-b" },
        byId: { "biz-b": tenantB },
      }),
    );
    expect(resolution.kind).toBe("alias");
    if (resolution.kind !== "alias") return;
    expect(resolution.canonicalSlug).toBe("studio-b");
  });

  it("never resolves tenant A alias to tenant B", async () => {
    const resolution = await resolvePublicBookingSlug(
      "studio-a-old",
      lookup({
        bySlug: { "studio-a": tenantA, "studio-b": tenantB },
        aliases: { "studio-a-old": "biz-a" },
        byId: { "biz-a": tenantA, "biz-b": tenantB },
      }),
    );
    expect(resolvedPublicBusiness(resolution)?.id).toBe("biz-a");
    expect(resolvedPublicBusiness(resolution)?.id).not.toBe("biz-b");
  });

  it("keeps business_id stable when the canonical slug changes", async () => {
    const renamed = biz("biz-b", "studio-b-new");
    const resolution = await resolvePublicBookingSlug(
      "studio-b",
      lookup({
        aliases: { "studio-b": "biz-b" },
        byId: { "biz-b": renamed },
      }),
    );
    expect(resolution.kind).toBe("alias");
    if (resolution.kind !== "alias") return;
    expect(resolution.business.id).toBe("biz-b");
    expect(resolution.canonicalSlug).toBe("studio-b-new");
  });

  it("emits canonical metadata from the current slug, never the alias", () => {
    expect(canonicalBookingUrl("https://chasum.example", "studio-b")).toBe(
      "https://chasum.example/book/studio-b",
    );
  });

  it("prefers a live canonical slug over an alias of the same string", async () => {
    const resolution = await resolvePublicBookingSlug(
      "studio-b",
      lookup({
        bySlug: { "studio-b": tenantB },
        aliases: { "studio-b": "biz-a" },
        byId: { "biz-a": tenantA, "biz-b": tenantB },
      }),
    );
    expect(resolution.kind).toBe("canonical");
    expect(resolvedPublicBusiness(resolution)?.id).toBe("biz-b");
  });

  it("trims requested slugs and rejects blanks", async () => {
    expect(
      (
        await resolvePublicBookingSlug(
          "  studio-b  ",
          lookup({ bySlug: { "studio-b": tenantB } }),
        )
      ).kind,
    ).toBe("canonical");
    expect((await resolvePublicBookingSlug("   ", lookup({}))).kind).toBe(
      "missing",
    );
  });
});

describe("039_business_slug_aliases migration", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/039_business_slug_aliases.sql"),
    "utf8",
  );

  it("creates a generic alias table keyed by business_id + unique slug", () => {
    expect(sql).toContain("create table if not exists business_slug_aliases");
    expect(sql).toContain(
      "business_id uuid not null references businesses (id) on delete restrict",
    );
    expect(sql).toContain(
      "create unique index if not exists business_slug_aliases_slug_key",
    );
    expect(sql).not.toContain("gvm-baby-world");
    expect(sql).not.toContain("gvm-baby-world-ultrasound");
  });

  it("enforces cross-table slug uniqueness and alias immutability", () => {
    expect(sql).toContain("enforce_business_slug_namespace");
    expect(sql).toContain("business_slug_aliases rows are immutable");
    expect(sql).toContain("errcode = '23505'");
    expect(sql).toContain("record_business_slug_alias");
    expect(sql).toContain("after update of slug on businesses");
  });

  it("runs trigger writes as SECURITY DEFINER with a pinned search_path", () => {
    expect(sql).toMatch(
      /create or replace function enforce_business_slug_namespace\(\)[\s\S]*security definer[\s\S]*set search_path = public, pg_temp/,
    );
    expect(sql).toMatch(
      /create or replace function record_business_slug_alias\(\)[\s\S]*security definer[\s\S]*set search_path = public, pg_temp/,
    );
    expect(sql).toContain("revoke insert, update, delete on table business_slug_aliases from anon, authenticated");
    expect(sql).not.toMatch(
      /grant\s+(insert|update|delete)\s+on table business_slug_aliases to (anon|authenticated)/i,
    );
  });

  it("serializes cross-table slug claims with a per-slug xact advisory lock", () => {
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("hashtext('chasum.business_slug_namespace')");
    expect(sql).toContain("lock_business_slug_namespace_pair");
  });

  it("does not seed tenant-specific alias rows", () => {
    expect(sql).not.toContain("gvm-baby-world");
    expect(sql).not.toContain("gvm-baby-world-ultrasound");
    expect(sql).not.toMatch(/insert into businesses\b/i);
  });

  it("compares TG_OP to PostgreSQL uppercase operation names, never lowercase", () => {
    const compared = [...sql.matchAll(/\btg_op\s*=\s*'([^']*)'/gi)].map(
      (match) => match[1],
    );
    expect(compared.length).toBeGreaterThanOrEqual(3);
    expect(new Set(compared)).toEqual(new Set(["UPDATE"]));
    for (const value of compared) {
      expect(["INSERT", "UPDATE", "DELETE", "TRUNCATE"]).toContain(value);
    }
    expect(sql).not.toMatch(
      /\btg_op\s*=\s*'(update|insert|delete|truncate)'/,
    );
  });

  it("captures the previous businesses.slug as an alias only on UPDATE", () => {
    expect(sql).toMatch(
      /if tg_op = 'UPDATE'\s+and old\.slug is not null\s+and new\.slug is distinct from old\.slug then/,
    );
    expect(recordAliasFires(PG_TG_OP.update, "chasum-hq", "chasum-hq-test")).toBe(
      true,
    );
    expect(
      recordAliasFires("update", "chasum-hq", "chasum-hq-test"),
    ).toBe(false);
    expect(
      recordAliasFires(PG_TG_OP.insert, "chasum-hq", "chasum-hq-test"),
    ).toBe(false);
  });

  it("runs alias immutability on UPDATE of business_slug_aliases, not INSERT", () => {
    expect(sql).toMatch(
      /if tg_table_name = 'business_slug_aliases' then\s+if tg_op = 'UPDATE' then[\s\S]*business_slug_aliases rows are immutable/,
    );
    expect(
      aliasImmutabilityFires(PG_TG_OP.update, "business_slug_aliases"),
    ).toBe(true);
    expect(
      aliasImmutabilityFires(PG_TG_OP.insert, "business_slug_aliases"),
    ).toBe(false);
    expect(aliasImmutabilityFires("update", "business_slug_aliases")).toBe(
      false,
    );
  });

  it("keeps INSERT namespace locking on the else branch of the UPDATE check", () => {
    expect(sql).toMatch(
      /if tg_op = 'UPDATE' then\s+perform lock_business_slug_namespace_pair\(old\.slug, new\.slug\);[\s\S]*?else\s+perform lock_business_slug_namespace\(new\.slug\);/,
    );
    expect(
      recordAliasFires(PG_TG_OP.insert, null, "brand-new-slug"),
    ).toBe(false);
  });

  it("does not record an alias when an authenticated profile save leaves slug unchanged", () => {
    expect(
      recordAliasFires(PG_TG_OP.update, "chasum-hq-test", "chasum-hq-test"),
    ).toBe(false);
  });

  it("reclaims a same-tenant historical slug by deleting the alias row for the new canonical slug", () => {
    expect(sql).toMatch(
      /delete from business_slug_aliases\s+where slug = new\.slug\s+and business_id = new\.id;/,
    );
    expect(
      reclaimDeletesOwnAlias(
        "businesses",
        "chasum-hq",
        { slug: "chasum-hq", businessId: "hq-1" },
        "hq-1",
      ),
    ).toBe(true);
    expect(
      reclaimDeletesOwnAlias(
        "businesses",
        "chasum-hq",
        { slug: "chasum-hq", businessId: "other" },
        "hq-1",
      ),
    ).toBe(false);
  });
});

/** PostgreSQL sets TG_OP to these exact strings — never lowercase. */
const PG_TG_OP = {
  insert: "INSERT",
  update: "UPDATE",
  delete: "DELETE",
  truncate: "TRUNCATE",
} as const;

function recordAliasFires(
  tgOp: string,
  oldSlug: string | null,
  newSlug: string,
): boolean {
  return tgOp === "UPDATE" && oldSlug != null && newSlug !== oldSlug;
}

function aliasImmutabilityFires(tgOp: string, table: string): boolean {
  return table === "business_slug_aliases" && tgOp === "UPDATE";
}

function reclaimDeletesOwnAlias(
  table: string,
  newSlug: string,
  existingAlias: { slug: string; businessId: string },
  businessId: string,
): boolean {
  return (
    table === "businesses" &&
    existingAlias.slug === newSlug &&
    existingAlias.businessId === businessId
  );
}
