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
import {
  ACKNOWLEDGED_CONTACT_FIELD,
  contactIdentityKey,
  DUPLICATE_LOOKUP_FAILED,
  SHARED_PHONE_WARNING,
} from "@/lib/customers/contact-identity";

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
      acknowledgedContactKey: warned.warnedContactKey,
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

  it("warns before inserting when the Clients form reuses a phone", async () => {
    rows.push({
      id: "household",
      business_id: "biz-1",
      name: "Dana Reed",
      email: "dana@example.invalid",
      phone: "416-555-0100",
    });
    const result = await createCustomer(
      {},
      customerForm({ name: "Sam Reed", phone: "(416) 555-0100", email: "" }),
    );
    expect(result.error).toBe(SHARED_PHONE_WARNING);
    // The chooser shows the real existing person, not a placeholder.
    expect(
      result.phoneMatches?.map(({ id, name, email, phone }) => ({
        id,
        name,
        email,
        phone,
      })),
    ).toEqual([
      {
        id: "household",
        name: "Dana Reed",
        email: "dana@example.invalid",
        phone: "416-555-0100",
      },
    ]);
    expect(result.warnedContactKey).toBe(
      contactIdentityKey({ email: null, phone: "(416) 555-0100" }),
    );
    expect(rows).toHaveLength(1);
  });

  it("creates a separate Clients person only for the acknowledged contact", async () => {
    rows.push({
      id: "household",
      business_id: "biz-1",
      name: "Dana Reed",
      email: null,
      phone: "4165550100",
    });
    const warned = await createCustomer(
      {},
      customerForm({ name: "Sam Reed", phone: "4165550100", email: "" }),
    );
    const created = await createCustomer(
      {},
      customerForm({
        name: "Sam Reed",
        phone: "4165550100",
        email: "",
        [ACKNOWLEDGED_CONTACT_FIELD]: warned.warnedContactKey,
      }),
    );
    expect(created.error).toBeUndefined();
    expect(created.success).toBe("Client added.");
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.email)).toEqual([null, null]);
    expect(rows.map((row) => row.phone)).toEqual(["4165550100", "4165550100"]);
  });

  it("refuses an acknowledgement raised for a different phone", async () => {
    rows.push({
      id: "household",
      business_id: "biz-1",
      name: "Dana Reed",
      email: null,
      phone: "4165550100",
    });
    rows.push({
      id: "other-household",
      business_id: "biz-1",
      name: "Jo Vance",
      email: null,
      phone: "4165550999",
    });
    const warned = await createCustomer(
      {},
      customerForm({ name: "Sam Reed", phone: "4165550100", email: "" }),
    );
    expect(warned.error).toBe(SHARED_PHONE_WARNING);

    // Operator edited the phone but the old authorisation is replayed.
    const replayed = await createCustomer(
      {},
      customerForm({
        name: "Sam Reed",
        phone: "4165550999",
        email: "",
        [ACKNOWLEDGED_CONTACT_FIELD]: warned.warnedContactKey,
      }),
    );
    expect(replayed.error).toBe(SHARED_PHONE_WARNING);
    expect(replayed.phoneMatches?.map((match) => match.id)).toEqual([
      "other-household",
    ]);
    expect(rows).toHaveLength(2);
  });

  it("refuses an acknowledgement after only the email changed", async () => {
    rows.push({
      id: "household",
      business_id: "biz-1",
      name: "Dana Reed",
      email: null,
      phone: "4165550100",
    });
    const warned = await createCustomer(
      {},
      customerForm({ name: "Sam Reed", phone: "4165550100", email: "" }),
    );
    const replayed = await createCustomer(
      {},
      customerForm({
        name: "Sam Reed",
        phone: "4165550100",
        email: "sam@example.invalid",
        [ACKNOWLEDGED_CONTACT_FIELD]: warned.warnedContactKey,
      }),
    );
    expect(replayed.error).toBe(SHARED_PHONE_WARNING);
    expect(rows).toHaveLength(1);
  });

  it("fails closed when the Clients phone scan errors", async () => {
    failNext.phone = true;
    const result = await createCustomer(
      {},
      customerForm({ name: "Sam Reed", phone: "4165550100", email: "" }),
    );
    expect(result.error).toBe(DUPLICATE_LOOKUP_FAILED);
    expect(result.phoneMatches).toBeUndefined();
    expect(rows).toHaveLength(0);
  });

  it("does not warn on another business's shared phone", async () => {
    rows.push({
      id: "foreign",
      business_id: "biz-2",
      name: "Foreign Person",
      email: null,
      phone: "4165550100",
    });
    const result = await createCustomer(
      {},
      customerForm({ name: "Sam Reed", phone: "4165550100", email: "" }),
    );
    expect(result.error).toBeUndefined();
    expect(result.phoneMatches).toBeUndefined();
    expect(rows.filter((row) => row.business_id === "biz-1")).toHaveLength(1);
  });

  it("still blocks a duplicate email on an acknowledged separate person", async () => {
    rows.push({
      id: "household",
      business_id: "biz-1",
      name: "Dana Reed",
      email: "dana@example.invalid",
      phone: "4165550100",
    });
    const result = await createCustomer(
      {},
      customerForm({
        name: "Sam Reed",
        phone: "4165550100",
        email: "Dana@example.invalid",
        [ACKNOWLEDGED_CONTACT_FIELD]: contactIdentityKey({
          email: "Dana@example.invalid",
          phone: "4165550100",
        }),
      }),
    );
    expect(result.error).toMatch(/already exists/i);
    expect(rows).toHaveLength(1);
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
