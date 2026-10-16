// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes?: string | null;
  tags?: string[];
};

const { rows, failNext, idSeq, getOrCreateBusiness } = vi.hoisted(() => ({
  rows: [] as Row[],
  failNext: { email: false, phone: false },
  idSeq: { n: 1 },
  getOrCreateBusiness: vi.fn(),
}));

function matches(row: Row, filters: Record<string, string>) {
  if (filters.business_id && row.business_id !== filters.business_id) return false;
  if (filters.id && row.id !== filters.id) return false;
  if (filters["ilike:email"]) {
    return (row.email ?? "").toLowerCase() === filters["ilike:email"].toLowerCase();
  }
  return true;
}

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/communication/service", () => ({
  getCommunicationService: () => ({ listForCustomer: async () => [] }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      expect(table).toBe("customers");
      return {
        insert(row: Row) {
          const duplicate =
            row.email != null &&
            row.email !== "" &&
            rows.some(
              (existing) =>
                existing.business_id === row.business_id &&
                (existing.email ?? "").toLowerCase() === row.email,
            );
          if (duplicate) {
            const error = { code: "23505", message: "duplicate key" };
            return Object.assign(Promise.resolve({ data: null, error }), {
              select: () => ({
                single: async () => ({ data: null, error }),
              }),
            });
          }
          const stored: Row = { ...row, id: `cust-${idSeq.n++}` };
          rows.push(stored);
          return Object.assign(Promise.resolve({ data: stored, error: null }), {
            select: () => ({
              single: async () => ({ data: { id: stored.id }, error: null }),
            }),
          });
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
                return Promise.resolve({
                  data: null,
                  error: { message: "email lookup failed" },
                });
              }
              return Promise.resolve({
                data: rows.filter((row) => matches(row, filters)),
                error: null,
              });
            },
            range(from: number, to: number) {
              if (failNext.phone) {
                failNext.phone = false;
                return Promise.resolve({
                  data: null,
                  error: { message: "phone lookup failed" },
                });
              }
              const matched = rows
                .filter((row) => matches(row, filters) && row.phone)
                .sort((a, b) => a.id.localeCompare(b.id))
                .slice(from, to + 1);
              return Promise.resolve({ data: matched, error: null });
            },
            maybeSingle: async () => {
              const found = rows.find((row) => matches(row, filters)) ?? null;
              return { data: found, error: null };
            },
          };
          return query;
        },
        update(patch: Partial<Row>) {
          const filters: Record<string, string> = {};
          const query = {
            eq(key: string, value: string) {
              filters[key] = value;
              return query;
            },
            then(
              resolve: (value: { error: null }) => void,
              reject?: (reason: unknown) => void,
            ) {
              const found = rows.find((row) => matches(row, filters));
              if (found) Object.assign(found, patch);
              return Promise.resolve({ error: null }).then(resolve, reject);
            },
          };
          return query;
        },
      };
    },
  }),
}));

import { filterCustomersLocal } from "@/lib/reception/recent-customers";
import {
  createCustomer,
  quickCreateCustomer,
  updateCustomer,
} from "@/lib/actions/customers";

function customerForm(entries: Record<string, string | undefined>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

describe("phone-only customer create and update", () => {
  beforeEach(() => {
    rows.length = 0;
    idSeq.n = 1;
    failNext.email = false;
    failNext.phone = false;
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
  });

  it("creates a customer with a phone and stores email as null", async () => {
    const result = await createCustomer(
      {},
      customerForm({ name: "Walk In", phone: "+44 20 7946 0958", email: "" }),
    );
    expect(result.error).toBeUndefined();
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBeNull();
    expect(rows[0].phone).toBe("+44 20 7946 0958");
    expect(JSON.stringify(rows)).not.toContain("chasum.local");
    expect(JSON.stringify(rows)).not.toContain('""');
  });

  it("creates a customer with email only", async () => {
    const result = await quickCreateCustomer({
      name: "Ada Lovelace",
      email: "Ada@Example.invalid",
    });
    expect(result.customerId).toBe("cust-1");
    expect(rows[0].email).toBe("ada@example.invalid");
  });

  it("rejects a name with no reachable contact and writes nothing", async () => {
    const result = await createCustomer({}, customerForm({ name: "No Contact", email: "" }));
    expect(result.error).toMatch(/phone number or an email/i);
    expect(rows).toHaveLength(0);
  });

  it("lets two phone-only customers in one business share a phone", async () => {
    const first = await quickCreateCustomer({
      name: "Alex",
      phone: "4165550100",
    });
    const warned = await quickCreateCustomer({
      name: "Blair",
      phone: "(416) 555-0100",
    });
    expect(warned.customerId).toBeUndefined();
    expect(warned.phoneMatches?.map((match) => match.name)).toEqual(["Alex"]);
    expect(rows).toHaveLength(1);
    const second = await quickCreateCustomer({
      name: "Blair",
      phone: "(416) 555-0100",
      createSeparatePerson: true,
    });
    expect(first.customerId).toBe("cust-1");
    expect(second.customerId).toBe("cust-2");
    expect(rows.map((row) => row.email)).toEqual([null, null]);
  });

  it("adds an email later and removes it only while a phone remains", async () => {
    await quickCreateCustomer({ name: "Alex", phone: "4165550100" });
    const added = await updateCustomer(
      {},
      customerForm({
        id: "cust-1",
        name: "Alex",
        email: "alex@example.invalid",
        phone: "4165550100",
      }),
    );
    expect(added.error).toBeUndefined();
    expect(rows[0].email).toBe("alex@example.invalid");

    const removed = await updateCustomer(
      {},
      customerForm({ id: "cust-1", name: "Alex", email: "", phone: "4165550100" }),
    );
    expect(removed.error).toBeUndefined();
    expect(rows[0].email).toBeNull();

    await updateCustomer(
      {},
      customerForm({
        id: "cust-1",
        name: "Alex",
        email: "alex@example.invalid",
        phone: "4165550100",
      }),
    );
    const blocked = await updateCustomer(
      {},
      customerForm({ id: "cust-1", name: "Alex", email: "", phone: "" }),
    );
    expect(blocked.error).toMatch(/phone number/i);
    expect(rows[0].email).toBe("alex@example.invalid");
  });

  it("does not overwrite email when the field is absent", async () => {
    rows.push({
      id: "cust-1",
      business_id: "biz-1",
      name: "Alex",
      email: "alex@example.invalid",
      phone: "4165550100",
    });
    const data = new FormData();
    data.set("id", "cust-1");
    data.set("name", "Alex Updated");
    data.set("phone", "4165550100");
    const result = await updateCustomer({}, data);
    expect(result.error).toBeUndefined();
    expect(rows[0].email).toBe("alex@example.invalid");
    expect(rows[0].name).toBe("Alex Updated");
  });

  it("searches a phone-only recent customer without throwing", () => {
    const matches = filterCustomersLocal(
      [
        {
          id: "cust-1",
          business_id: "biz-1",
          name: "Alex",
          email: null,
          phone: "4165550100",
          notes: null,
          tags: [],
          referral_source: null,
          created_at: "2026-10-16T00:00:00.000Z",
          updated_at: "2026-10-16T00:00:00.000Z",
        },
      ],
      "alex",
    );
    expect(matches).toHaveLength(1);
    expect(filterCustomersLocal(matches, "416555")).toHaveLength(1);
  });
});
