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

  it("does not seed tenant-specific alias rows", () => {
    expect(sql).not.toContain("gvm-baby-world");
    expect(sql).not.toContain("gvm-baby-world-ultrasound");
    expect(sql).not.toMatch(/insert into businesses\b/i);
  });
});
