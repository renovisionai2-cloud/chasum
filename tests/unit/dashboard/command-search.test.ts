import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrCreateBusiness = vi.fn();
const getLocationScope = vi.fn();
const isPlatformOwner = vi.fn();
const supabaseFrom = vi.fn();
const getUser = vi.fn();

const observedEq = new Map<string, Array<[string, unknown]>>();

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));

vi.mock("@/lib/actions/location", () => ({
  getLocationScope: (...args: unknown[]) => getLocationScope(...args),
}));

vi.mock("@/lib/owner/auth", () => ({
  isPlatformOwner: (...args: unknown[]) => isPlatformOwner(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: (...args: unknown[]) => supabaseFrom(...args),
  }),
}));

import { searchCommandPalette } from "@/lib/actions/command-search";

type RowMap = Record<string, unknown[]>;

function chain(table: string, rows: unknown[]) {
  const query: Record<string, unknown> = {};
  const self = () => query;
  query.select = self;
  query.eq = (col: string, val: unknown) => {
    const list = observedEq.get(table) ?? [];
    list.push([col, val]);
    observedEq.set(table, list);
    return query;
  };
  query.ilike = self;
  query.or = self;
  query.gte = self;
  query.lte = self;
  query.order = self;
  query.limit = self;
  query.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve({ data: rows, error: null }).then(onFulfilled, onRejected);
  return query;
}

function installTables(rows: RowMap) {
  supabaseFrom.mockImplementation((table: string) =>
    chain(table, rows[table] ?? []),
  );
}

describe("command palette live search", () => {
  beforeEach(() => {
    getOrCreateBusiness.mockReset();
    getLocationScope.mockReset();
    isPlatformOwner.mockReset();
    supabaseFrom.mockReset();
    getUser.mockReset();
    observedEq.clear();
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
    getLocationScope.mockResolvedValue({ mode: "all" });
    isPlatformOwner.mockResolvedValue(false);
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("keeps existing customer, staff, service, and appointment search", async () => {
    installTables({
      customers: [
        {
          id: "c1",
          name: "Ada Client",
          preferred_name: null,
          email: "ada@example.com",
          phone: "555",
          tags: [],
        },
      ],
      staff: [{ id: "s1", name: "Sam Staff", email: "sam@example.com", is_active: true }],
      services: [
        { id: "svc1", name: "Signature Cut", duration_minutes: 45, is_active: true },
      ],
      appointments: [
        {
          id: "a1",
          start_time: "2026-08-22T15:00:00.000Z",
          status: "booked",
          customer: { name: "Ada Client" },
          service: { name: "Signature Cut" },
          staff: { name: "Sam Staff" },
        },
      ],
    });

    const ada = await searchCommandPalette("Ada");
    expect(ada.some((r) => r.id === "customer-c1")).toBe(true);
    expect(ada.find((r) => r.id === "customer-c1")?.href).toBe(
      "/dashboard/clients/c1",
    );

    const staff = await searchCommandPalette("Sam");
    expect(staff.some((r) => r.id === "staff-s1")).toBe(true);

    const services = await searchCommandPalette("Signature");
    expect(services.some((r) => r.id === "service-svc1")).toBe(true);

    const appts = await searchCommandPalette("booked");
    expect(appts.some((r) => r.id === "appointment-a1")).toBe(true);
  });

  it("jumps to tenant packages, memberships, gift cards, invoices, and locations", async () => {
    installTables({
      customers: [],
      staff: [],
      services: [],
      appointments: [],
      service_packages: [
        { id: "p1", name: "Glow Package", total_visits: 5, is_active: true },
      ],
      memberships: [
        {
          id: "m1",
          name: "Glow Membership",
          billing_interval: "monthly",
          is_active: true,
        },
      ],
      gift_cards: [{ id: "g1", code: "GIFT-100", status: "active" }],
      commerce_invoices: [
        { id: "i1", invoice_number: "INV-42", status: "open" },
      ],
      locations: [{ id: "l1", name: "Harbour Studio", is_active: true }],
    });

    const packages = await searchCommandPalette("Glow Package");
    expect(packages.some((r) => r.id === "package-p1")).toBe(true);
    expect(packages.find((r) => r.id === "package-p1")?.href).toBe(
      "/dashboard/business?tab=packages",
    );

    const memberships = await searchCommandPalette("Glow Membership");
    expect(memberships.some((r) => r.id === "membership-m1")).toBe(true);
    expect(memberships.find((r) => r.id === "membership-m1")?.href).toBe(
      "/dashboard/business?tab=memberships",
    );

    const cards = await searchCommandPalette("GIFT-100");
    expect(cards.some((r) => r.id === "gift-card-g1")).toBe(true);
    expect(cards.find((r) => r.id === "gift-card-g1")?.href).toBe(
      "/dashboard/business?tab=giftcards",
    );

    const invoices = await searchCommandPalette("INV-42");
    expect(invoices.some((r) => r.id === "invoice-i1")).toBe(true);
    expect(invoices.find((r) => r.id === "invoice-i1")?.href).toBe(
      "/dashboard/payments/invoices/INV-42",
    );

    const locations = await searchCommandPalette("Harbour");
    expect(locations.some((r) => r.id === "location-l1")).toBe(true);
    expect(locations.find((r) => r.id === "location-l1")?.href).toBe(
      "/dashboard/business?tab=locations",
    );
  });

  it("scopes entity queries to the active business", async () => {
    installTables({
      customers: [],
      staff: [],
      services: [],
      appointments: [],
      service_packages: [],
      memberships: [],
      gift_cards: [],
      commerce_invoices: [],
      locations: [],
    });
    await searchCommandPalette("invoice");
    for (const table of [
      "customers",
      "staff",
      "services",
      "appointments",
      "service_packages",
      "memberships",
      "gift_cards",
      "commerce_invoices",
      "locations",
    ]) {
      expect(observedEq.get(table)).toContainEqual(["business_id", "biz-1"]);
    }
  });

  it("does not return owner-only commands to ordinary operators", async () => {
    installTables({
      customers: [],
      staff: [],
      services: [],
      appointments: [],
    });
    const rows = await searchCommandPalette("hq");
    expect(rows.some((r) => r.href === "/dashboard/hq")).toBe(false);
  });
});
