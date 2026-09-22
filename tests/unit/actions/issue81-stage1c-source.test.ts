import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Issue #81 Stage 1C application contract", () => {
  it("uses canonical plan quota in the operator read model instead of DB can_add_location", () => {
    const location = source("lib/actions/location.ts");
    const quota = location.slice(
      location.indexOf("export const getLocationQuota"),
      location.indexOf("export type LocationTemplateSource"),
    );
    expect(quota).toContain("evaluateLocationQuota");
    expect(quota).not.toContain('rpc("can_add_location"');
  });

  it("creates locations only through the atomic Stage 1C RPC", () => {
    const location = source("lib/actions/location.ts");
    const create = location.slice(
      location.indexOf("export async function createLocation"),
      location.indexOf("export async function assignStaffToLocation"),
    );
    expect(create).toContain('rpc("create_location_from_template"');
    expect(create).not.toContain('.from("locations")\n    .insert');
    expect(create).toContain("Location template setup is not available in this environment yet.");
  });

  it("adds deliberate secondary Staff memberships without moving home location", () => {
    const location = source("lib/actions/location.ts");
    const assign = location.slice(
      location.indexOf("export async function assignStaffToLocation"),
      location.indexOf("export async function updateLocation"),
    );
    expect(assign).toContain('.from("staff_locations").upsert');
    expect(assign).toContain("is_primary: false");
    expect(assign).not.toContain('.from("staff")\n    .update');
    expect(assign).not.toContain("default_location_id");
  });

  it("renders the three locked setup modes and truthful snapshot language", () => {
    const dialog = source("components/dashboard/add-location-dialog.tsx");
    expect(dialog).toContain('title="Default location"');
    expect(dialog).toContain('title="Copy another"');
    expect(dialog).toContain('title="Start blank"');
    expect(dialog).toContain("Copied from");
    expect(dialog).toContain("Hours start closed");
    expect(dialog).not.toContain("Inherited from");
  });

  it("keeps Staff/resources opt-in rather than automatic", () => {
    const dialog = source("components/dashboard/add-location-dialog.tsx");
    expect(dialog).toContain("Staff and rooms/resources are not copied automatically.");
    expect(dialog).toContain("Select staff from");
    expect(dialog).toContain("Skip for now");
  });

  it("keeps the workflow mobile-first and accessibility basics explicit", () => {
    const dialog = source("components/dashboard/add-location-dialog.tsx");
    expect(dialog).toContain("sm:grid-cols-3");
    expect(dialog).toContain("sm:grid-cols-2");
    expect(dialog).toContain("flex flex-wrap");
    expect(dialog).toContain("aria-pressed");
    expect(dialog).toContain('htmlFor="location_name"');
    expect(dialog).toContain('htmlFor="copy_source"');
  });

  it("routes global location-add entry into the single workflow and uses generic plan-change copy", () => {
    const switcher = source("components/dashboard/location-switcher.tsx");
    expect(switcher).toContain("/dashboard/business?tab=locations&add=1");
    expect(switcher).toContain("Request plan change");
    expect(switcher).not.toContain("UpgradeToProfessionalModal");
    expect(switcher).not.toContain("FREE_PLAN_UPGRADE_CTA");
  });

  it("uses canonical Business = 6 in code and fallback catalog", () => {
    const entitlements = source("lib/billing/plan-entitlements.ts");
    const catalog = source("lib/billing/catalog.ts");
    expect(entitlements).toContain("business: 6");
    const businessSection = catalog.slice(
      catalog.indexOf('name: "Business"'),
      catalog.indexOf('name: "Enterprise"'),
    );
    expect(businessSection).toContain("maxLocations: 6");
    expect(businessSection).not.toContain("maxLocations: 10");
  });
});
