import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function sourceFiles(root: string): string[] {
  const absolute = resolve(process.cwd(), root);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${root}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(relative);
    return /\.(ts|tsx)$/.test(entry.name) ? [relative] : [];
  });
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

  it("has no direct application Location INSERT path outside the governed RPC", () => {
    const offenders = ["app", "components", "lib"].flatMap(sourceFiles).filter(
      (path) =>
        /\.from\(["']locations["']\)\s*\.insert\(/s.test(source(path)),
    );
    expect(offenders).toEqual([]);
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
    expect(dialog).toContain("source.hourDayCount === 7");
    expect(dialog).toContain("defaultLocationCount === 1");
    expect(dialog).toContain('htmlFor="location_name"');
    expect(dialog).toContain('htmlFor="copy_source"');
  });

  it("keeps shared dialogs above the fixed mobile navigation", () => {
    const dialog = source("components/ui/dialog.tsx");
    const mobileNav = source("components/dashboard/mobile-bottom-nav.tsx");
    expect(dialog).toContain("fixed inset-0 z-[60]");
    expect(mobileNav).toContain("fixed inset-x-0 bottom-0 z-50");
  });

  it("routes global location-add entry into the single workflow and uses generic plan-change copy", () => {
    const switcher = source("components/dashboard/location-switcher.tsx");
    expect(switcher).toContain("/dashboard/business?tab=locations&add=1");
    expect(switcher).toContain("Request plan change");
    expect(switcher).not.toContain("UpgradeToProfessionalModal");
    expect(switcher).not.toContain("FREE_PLAN_UPGRADE_CTA");
  });

  it("surfaces the locked Services / Hours / Staff / Resources review destinations", () => {
    const hub = source("components/business/business-hub.tsx");
    expect(hub).toContain("Location hours & scheduling");
    expect(hub).toContain("Assign employees");
    expect(hub).toContain("Review services");
    expect(hub).toContain("Rooms & resources");
    expect(hub).toContain("/dashboard/business?tab=services");
    expect(hub).toContain("/dashboard/business?tab=rooms");
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


const db = vi.hoisted(() => ({
  rpc: vi.fn(),
  cookieSet: vi.fn(),
  rows: {} as Record<string, unknown[]>,
  selects: [] as Array<[string, string]>,
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  cache: <T,>(fn: T) => fn,
}));
vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: vi.fn(async () => ({
    id: "business-a", subscription_plan_key: "enterprise", timezone: "America/Toronto", min_notice_minutes: 45,
  })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ set: db.cookieSet })) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: db.rpc,
    from: (table: string) => {
      const query = {
        select: (columns: string) => { db.selects.push([table, columns]); return query; },
        eq: () => query, in: () => query, order: () => query,
        maybeSingle: async () => ({ data: { id: "new-location" }, error: null }),
        then: (resolve: (result: unknown) => unknown) => resolve({ data: db.rows[table] ?? [], error: null }),
      };
      return query;
    },
  })),
}));

import { createLocation, getLocationSetupContext } from "@/lib/actions/location";

describe("Stage 1C server preview and generated address", () => {
  beforeEach(() => {
    db.rpc.mockReset();
    db.cookieSet.mockReset();
    db.selects = [];
    db.rows = { locations: [{ id: "source-a", name: "Main Studio", is_default: true }] };
    db.rpc.mockResolvedValue({ data: { location_id: "new-location", copied_service_count: 2 }, error: null });
  });

  function form(name: string) {
    const data = new FormData();
    data.set("name", name);
    data.set("slug", "forged-address");
    data.set("timezone", "America/Vancouver");
    data.set("setup_mode", "default");
    return data;
  }

  it("generates the existing deterministic slug from the name, ignoring client slug", async () => {
    const result = await createLocation({}, form("  West & Downtown Studio!  "));
    expect(result.locationId).toBe("new-location");
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith("create_location_from_template", expect.objectContaining({
      p_business_id: "business-a", p_name: "West & Downtown Studio!", p_slug: "west-downtown-studio",
      p_timezone: "America/Vancouver", p_setup_mode: "default", p_source_location_id: "source-a",
    }));
  });

  it("returns a safe duplicate-name error without retrying or changing location scope", async () => {
    db.rpc.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } });
    const result = await createLocation({}, form("Downtown"));
    expect(result).toEqual({ error: "This location name is already in use. Choose a different name." });
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.cookieSet).not.toHaveBeenCalled();
  });

  it("rejects a name that cannot generate an address before persistence", async () => {
    expect(await createLocation({}, form("!!!"))).toHaveProperty("error");
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("loads actual weekly windows and orders split hours with availability precedence", async () => {
    db.rows.location_hours = Array.from({ length: 7 }, (_, day_of_week) => ({
      location_id: "source-a", day_of_week, is_open: day_of_week > 0 && day_of_week < 6,
      open_time: "09:00:00", close_time: "17:00:00",
    })).reverse();
    db.rows.location_hour_segments = [
      { location_id: "source-a", day_of_week: 2, open_time: "13:00:00", close_time: "19:00:00", sort_order: 1 },
      { location_id: "source-a", day_of_week: 2, open_time: "08:00:00", close_time: "12:00:00", sort_order: 0 },
      // Split windows are authoritative even over a closed single daily window.
      { location_id: "source-a", day_of_week: 0, open_time: "10:00:00", close_time: "12:00:00", sort_order: 0 },
    ];
    db.rows.location_settings = [{ location_id: "source-a", appointment_interval_minutes: 15,
      booking_limit_days: 120, max_daily_bookings: 12, cancellation_policy: "24 hours",
      min_booking_notice_minutes: 90, default_travel_minutes: 25, timezone: "America/Toronto" }];
    const context = await getLocationSetupContext();
    expect(context.businessMinBookingNoticeMinutes).toBe(45);
    expect(context.sources[0].weeklyHours.map((day) => day.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(context.sources[0].weeklyHours[2].ranges).toEqual([
      { openTime: "08:00:00", closeTime: "12:00:00" }, { openTime: "13:00:00", closeTime: "19:00:00" },
    ]);
    expect(context.sources[0].weeklyHours[0].ranges).toEqual([{ openTime: "10:00:00", closeTime: "12:00:00" }]);
    expect(context.sources[0].weeklyHours[6].ranges).toEqual([]);
    expect(context.sources[0].settings).toEqual({ appointmentIntervalMinutes: 15, bookingLimitDays: 120,
      maxDailyBookings: 12, cancellationPolicy: "24 hours", minBookingNoticeMinutes: 90,
      defaultTravelMinutes: 25, timezone: "America/Toronto" });
    expect(db.selects).toContainEqual(["location_hours", "location_id, day_of_week, is_open, open_time, close_time"]);
    expect(db.selects).toContainEqual(["location_hour_segments", "id, location_id, day_of_week, open_time, close_time, sort_order"]);
  });
});
