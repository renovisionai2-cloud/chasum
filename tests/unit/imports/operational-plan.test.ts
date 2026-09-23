// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildOperationalPlan } from "@/lib/imports/operational-plan";
import { locationSlug } from "@/lib/location/slug";
import type { CanonicalPayload, MappingConfig, TargetSnapshot } from "@/lib/imports/contracts";
const businessId = "11111111-1111-4111-8111-111111111111";
const source = { schemaVersion: "1" as const, sourceSystem: "fixture", sourceAccountKey: "workspace", sourceTimezone: "America/Toronto", sourceCurrency: "CAD", inputChecksum: "a".repeat(64) };
const snapshot: TargetSnapshot = { businessId, entities: [], assignments: [], sourceRefs: [] };
const mapping: MappingConfig = { version: "1", statusMapping: { booked: "confirmed" }, links: [] };
const ref = (sourceRowKey: string) => ({ sourceRowKey });
const exact = { kind: "EXACT" as const, currency: "CAD", priceCents: 1900, taxCents: 247, depositCents: 500, discountCents: 0, amountPaidCents: 0, amountRefundedCents: 0 };
function fixture(): CanonicalPayload {
  return { source, target: { businessId, businessTimezone: "America/Toronto", businessCurrency: "CAD" }, rows: [
    { entityType: "location", sourceRowKey: "l", name: "New Location!" },
    { entityType: "service", sourceRowKey: "s", name: "Exact service", durationMinutes: 30, currency: "CAD", priceCents: 4500, primaryLocation: ref("l") },
    { entityType: "staff", sourceRowKey: "t", name: "Synthetic Staff", primaryLocation: ref("l") },
    { entityType: "staffService", sourceRowKey: "ts", staff: ref("t"), service: ref("s") },
    { entityType: "customer", sourceRowKey: "c", name: "Synthetic Customer", email: " Person@Example.Test " },
    { entityType: "appointment", sourceRowKey: "a", location: ref("l"), service: ref("s"), staff: ref("t"), customer: ref("c"), start: "2028-01-10T10:00", end: "2028-01-10T10:30", sourceStatus: "booked", financials: exact },
  ] };
}
const plan = (input = fixture()) => buildOperationalPlan(input, snapshot, mapping, "2026-09-23T00:00:00Z");
describe("B2 reviewed operational plan", () => {
  it("generates shared deterministic slug BEFORE preview, without changing input", () => {
    const input = fixture(); const output = plan(input);
    expect(output.locationSlugs).toEqual(["new-location"]);
    expect(output.preview.normalized.rows.find(r => r.entityType === "location")).toMatchObject({ slug: "new-location" });
    expect(input.rows[0]).not.toHaveProperty("slug");
    expect(plan({ ...input, rows: [...input.rows].reverse() })).toEqual(output);
  });
  it("normalizes money/time/email without current catalog recomputation", () => {
    const output = plan();
    expect(output.rows.at(-1)).toMatchObject({ mappedStatus: "confirmed", row: { start: "2028-01-10T15:00:00.000Z", financials: exact } });
    expect(output.rows.find(r => r.row.entityType === "customer")?.row).toMatchObject({ email: "person@example.test" });
  });
  it("keeps dependency order and source IDs absent", () => {
    expect(plan().rows.map(r => r.row.entityType)).toEqual(["location", "service", "staff", "staffService", "customer", "appointment"]);
    expect(plan().rows.every(r => !r.row.sourceExternalId)).toBe(true);
  });
  it.each([{ kind: "NONE" as const }, { ...exact, discountCents: 100 }])("keeps Package A truth, overlays B2 review for %j", financials => {
    const input = fixture(); const appointment = input.rows.at(-1)!;
    if (appointment.entityType !== "appointment") throw new Error();
    appointment.financials = financials;
    const output = plan(input);
    expect(output.preview.outcomes.find(o => o.entityType === "appointment")?.plannedAction).toBe("CREATE");
    expect(output.rows.at(-1)?.outcome).toMatchObject({ plannedAction: "REVIEW", reasonCodes: ["FINANCIAL_RECONCILIATION_REQUIRED"] });
  });
  it.each([{ ...exact, amountPaidCents: 1 }, { ...exact, currency: "USD" }, { kind: "UNRECONCILED" as const }])("blocks unreconciled %j", financials => {
    const input = fixture(); Object.assign(input.rows.at(-1)!, { financials });
    expect(plan(input).rows.at(-1)?.outcome.plannedAction).toBe("REVIEW");
  });
  it("rejects ambiguous durable locators", () => {
    const input = fixture(); input.rows[1].sourceRowKey = "l";
    expect(() => plan(input)).toThrow("DUPLICATE_ROW_KEY");
  });
  it("reviews generated slug collisions and blocks empty slugs", () => {
    const input = fixture(); input.rows.push({ entityType: "location", sourceRowKey: "l2", name: "New Location?" });
    expect(plan(input).rows.filter(r => r.row.entityType === "location").every(r => r.outcome.plannedAction === "BLOCK")).toBe(true);
    input.rows = [{ entityType: "location", sourceRowKey: "l", name: "!!!" }];
    expect(plan(input).rows[0].outcome.plannedAction).toBe("BLOCK");
  });
});
it.each([ [" Main Location! ", "main-location"], ["A__B", "a-b"], ["é", ""], ["a".repeat(60), "a".repeat(48)] ])("preserves Stage 1C slug %s", (name, expected) => expect(locationSlug(name)).toBe(expected));
