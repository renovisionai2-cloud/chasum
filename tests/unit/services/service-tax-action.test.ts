import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createService, updateService } from "@/lib/actions/services";

const db = vi.hoisted(() => ({ writes: [] as Record<string, unknown>[], filters: [] as unknown[][], schemaFailure: false, savedTaxable: false }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "tenant-a" }) }));
vi.mock("@/lib/actions/location", () => ({ getActiveLocationId: async () => "location-a", getLocationScope: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  from: (table: string) => {
    const q = {
      insert: (payload: Record<string, unknown>) => { if (table === "services") db.writes.push(payload); return q; },
      update: (payload: Record<string, unknown>) => {
        if (table === "services") {
          db.writes.push(payload);
          if (!db.schemaFailure && "taxable" in payload) db.savedTaxable = Boolean(payload.taxable);
        }
        return q;
      },
      delete: () => q,
      select: () => q,
      eq: (...args: unknown[]) => { db.filters.push([table, ...args]); return q; },
      single: async () => ({ data: { id: "service-a" }, error: table === "services" && db.schemaFailure ? { message: "column services.tax_rate_bps does not exist" } : null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: table === "services" && db.schemaFailure ? { message: "column services.tax_rate_bps does not exist" } : null }).then(resolve),
    }; return q;
  },
}) }));

function form(mode: string, percent?: string) {
  const f = new FormData();
  f.set("id", "service-a"); f.set("name", "Synthetic service"); f.set("duration_minutes", "30");
  f.set("price", "116"); f.set("tax_mode", mode);
  if (percent !== undefined) f.set("tax_rate_percent", percent);
  return f;
}

beforeEach(() => { db.writes.length = 0; db.filters.length = 0; db.schemaFailure = false; db.savedTaxable = false; });
afterEach(() => vi.unstubAllEnvs());
describe.each([createService, updateService])("service percentage action", (action) => {
  it("stores human 13% as 1300 bps", async () => {
    expect(await action({}, form("custom", "13"))).toHaveProperty("success");
    expect(db.writes[0]).toMatchObject({ tax_rate_bps: 1300, business_id: "tenant-a" });
    if (action === createService) expect(db.writes[0].taxable).toBe(true);
    else expect(db.writes[0]).not.toHaveProperty("taxable");
  });
  it("keeps legitimate 0.13% as 13 bps", async () => {
    await action({}, form("custom", "0.13")); expect(db.writes[0].tax_rate_bps).toBe(13);
  });
  it("explicit inheritance stores zero, ignoring stale custom input", async () => {
    await action({}, form("inherit", "13")); expect(db.writes[0].tax_rate_bps).toBe(0);
  });
  it.each(["", "abc", "1300", "-1", "13,5", "0.001", "0"])("refuses ambiguous or unrepresentable custom input %s before writes", async (raw) => {
    expect(await action({}, form("custom", raw))).toHaveProperty("error"); expect(db.writes).toEqual([]);
  });
  it("rejects an old raw-bps form instead of silently changing units", async () => {
    const f = form("custom", "13"); f.delete("tax_mode"); f.delete("tax_rate_percent"); f.set("tax_rate_bps", "13");
    expect(await action({}, f)).toHaveProperty("error"); expect(db.writes).toEqual([]);
  });
  it("fails closed if the schema cannot persist the tax choice, including compatibility retry", async () => {
    db.schemaFailure = true;
    vi.stubEnv("CHASUM_ALLOW_SOFT_SCHEMA", "1");
    expect(await action({}, form("custom", "13"))).toHaveProperty("error");
    expect(db.writes).toHaveLength(2);
    expect(db.writes.every((write) => write.tax_rate_bps === 1300)).toBe(true);
    if (action === createService) expect(db.writes.every((write) => write.taxable === true)).toBe(true);
    else for (const write of db.writes) expect(write).not.toHaveProperty("taxable");
    expect(db.filters.every(([table]) => table === "services")).toBe(true);
  });
  it.each(["on", "false", ""])("rejects retired Taxable field %j instead of silently accepting a tax-policy choice", async (value) => {
    const f = form("inherit"); f.set("taxable", value);
    expect(await action({}, f)).toMatchObject({ error: expect.stringContaining("not editable") });
    expect(db.writes).toEqual([]);
  });
});

it.each([true, false])("preserves stored taxable=%s when an ordinary service edit omits the retired control", async (existing) => {
  db.savedTaxable = existing;
  expect(await updateService({}, form("custom", "13"))).toHaveProperty("success");
  expect(db.writes[0]).not.toHaveProperty("taxable");
  expect(db.savedTaxable).toBe(existing);
});

it("scopes service updates to the authenticated tenant", async () => {
  await updateService({}, form("custom", "13"));
  expect(db.filters).toContainEqual(["services", "business_id", "tenant-a"]);
});
