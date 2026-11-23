// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

const { rows, failNext, idSeq, getOrCreateBusiness } = vi.hoisted(() => ({
  rows: [] as Row[],
  failNext: { email: false, phone: false },
  idSeq: { n: 1 },
  getOrCreateBusiness: vi.fn(),
}));

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/communication/service", () => ({
  getCommunicationService: () => ({ listForCustomer: async () => [] }),
}));

function project(row: Row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      insert(row: Row) {
        const stored = { ...row, id: `cust-${idSeq.n++}` };
        rows.push(stored);
        return {
          select: () => ({
            single: async () => ({ data: { id: stored.id }, error: null }),
          }),
        };
      },
      select() {
        const filters: Record<string, string> = {};
        const query = {
          eq(key: string, value: string) {
            filters[key] = value;
            return query;
          },
          ilike(key: string, value: string) {
            filters[`ilike:${key}`] = value;
            return query;
          },
          not() {
            return query;
          },
          order() {
            return query;
          },
          limit() {
            if (failNext.email) {
              failNext.email = false;
              return Promise.resolve({ data: null, error: { message: "email down" } });
            }
            const data = rows
              .filter((row) => !filters.business_id || row.business_id === filters.business_id)
              .filter(
                (row) =>
                  !filters["ilike:email"] ||
                  (row.email ?? "").toLowerCase() === filters["ilike:email"].toLowerCase(),
              )
              .map(project);
            return Promise.resolve({ data, error: null });
          },
          range(from: number, to: number) {
            if (failNext.phone) {
              failNext.phone = false;
              return Promise.resolve({ data: null, error: { message: "phone down" } });
            }
            const data = rows
              .filter((row) => !filters.business_id || row.business_id === filters.business_id)
              .filter((row) => row.phone)
              .sort((a, b) => a.id.localeCompare(b.id))
              .slice(from, to + 1)
              .map(project);
            return Promise.resolve({ data, error: null });
          },
        };
        return query;
      },
    }),
  }),
}));

import { quickCreateCustomer } from "@/lib/actions/customers";

describe("duplicate customer safety", () => {
  beforeEach(() => {
    rows.length = 0;
    idSeq.n = 1;
    failNext.email = false;
    failNext.phone = false;
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
  });

  it("blocks an existing email and does not insert", async () => {
    rows.push({
      id: "existing",
      business_id: "biz-1",
      name: "Ada",
      email: "ada@example.invalid",
      phone: null,
    });
    const result = await quickCreateCustomer({
      name: "Other Ada",
      email: "ADA@example.invalid",
      phone: "4165550199",
    });
    expect(result.error).toMatch(/already exists/i);
    expect(result.emailMatches?.[0]?.id).toBe("existing");
    expect(result.customerId).toBeUndefined();
    expect(rows).toHaveLength(1);
  });

  it("warns on a shared phone and does not auto-select or merge", async () => {
    rows.push({
      id: "household",
      business_id: "biz-1",
      name: "Household",
      email: null,
      phone: "4165550100",
    });
    const result = await quickCreateCustomer({
      name: "New Person",
      phone: "416-555-0100",
    });
    expect(result.phoneMatches?.map((match) => match.id)).toEqual(["household"]);
    expect(result.customerId).toBeUndefined();
    expect(rows.map((row) => row.name)).toEqual(["Household"]);
  });

  it("does not treat a suffix as the same phone", async () => {
    rows.push({
      id: "other",
      business_id: "biz-1",
      name: "Other",
      email: "other@example.invalid",
      phone: "14165550100",
    });
    const result = await quickCreateCustomer({
      name: "Short",
      phone: "4165550100",
    });
    expect(result.phoneMatches).toBeUndefined();
    expect(result.customerId).toBe("cust-1");
  });

  it("finds a match past the first 50 customers", async () => {
    for (let i = 1; i <= 60; i += 1) {
      rows.push({
        id: `p-${String(i).padStart(3, "0")}`,
        business_id: "biz-1",
        name: `Person ${i}`,
        email: null,
        phone: i === 55 ? "4165550100" : `905555${String(i).padStart(4, "0")}`,
      });
    }
    const result = await quickCreateCustomer({ name: "Late", phone: "4165550100" });
    expect(result.phoneMatches?.map((match) => match.id)).toEqual(["p-055"]);
    expect(result.customerId).toBeUndefined();
  });

  it("does not treat a failed lookup as no duplicates", async () => {
    failNext.phone = true;
    const result = await quickCreateCustomer({ name: "Risky", phone: "4165550100" });
    expect(result.error).toMatch(/could not check/i);
    expect(result.customerId).toBeUndefined();
    expect(rows).toHaveLength(0);
  });

  it("excludes customers from another business", async () => {
    rows.push({
      id: "foreign",
      business_id: "biz-2",
      name: "Foreign",
      email: null,
      phone: "4165550100",
    });
    const result = await quickCreateCustomer({ name: "Local", phone: "4165550100" });
    expect(result.phoneMatches).toBeUndefined();
    expect(result.customerId).toBe("cust-1");
    expect(rows.filter((row) => row.business_id === "biz-1")).toHaveLength(1);
  });

  it("does not merge two concurrent phone-only creates", async () => {
    const [a, b] = await Promise.all([
      quickCreateCustomer({ name: "One", phone: "4165550100", createSeparatePerson: true }),
      quickCreateCustomer({ name: "Two", phone: "4165550100", createSeparatePerson: true }),
    ]);
    expect(a.customerId).toBeTruthy();
    expect(b.customerId).toBeTruthy();
    expect(a.customerId).not.toBe(b.customerId);
    expect(rows).toHaveLength(2);
  });
});
