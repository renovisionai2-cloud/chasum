// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOrCreateBusiness, insertSingle, updateResult, insertedRows, updatedRows, existingCustomer, selectFilters } =
  vi.hoisted(() => ({
    getOrCreateBusiness: vi.fn(),
    insertSingle: vi.fn(),
    updateResult: vi.fn(),
    insertedRows: [] as Record<string, unknown>[],
    updatedRows: [] as Record<string, unknown>[],
    existingCustomer: {
      current: {
        id: "cust-1",
        marketing_consent: false,
        marketing_consent_at: null as string | null,
      },
    },
    selectFilters: [] as Record<string, string>[],
  }));

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      expect(table).toBe("customers");
      return {
        insert(row: Record<string, unknown>) {
          insertedRows.push(row);
          return {
            select() {
              return {
                single: async () => insertSingle(row),
              };
            },
          };
        },
        select() {
          const filters: Record<string, string> = {};
          const query = {
            eq(key: string, value: string) {
              filters[key] = value;
              return query;
            },
            maybeSingle: async () => {
              selectFilters.push({ ...filters });
              return { data: existingCustomer.current, error: null };
            },
          };
          return query;
        },
        update(row: Record<string, unknown>) {
          updatedRows.push(row);
          const query = {
            eq() {
              return query;
            },
            then(
              onFulfilled: (value: unknown) => unknown,
              onRejected?: (reason: unknown) => unknown,
            ) {
              return Promise.resolve(updateResult(row)).then(
                onFulfilled,
                onRejected,
              );
            },
          };
          return query;
        },
      };
    },
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createCrmCustomer, updateCrmCustomer } from "@/lib/actions/crm";
import {
  consentTimestampForUpdate,
  parseCustomerPayload,
  stripMissingCustomerWriteColumns,
} from "@/lib/crm/customer-payload";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

describe("CRM customer consent writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedRows.length = 0;
    updatedRows.length = 0;
    selectFilters.length = 0;
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null,
    };
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
    insertSingle.mockResolvedValue({ data: { id: "cust-new" }, error: null });
    updateResult.mockResolvedValue({ error: null });
  });

  it("omits membership_id while the membership feature is gated", () => {
    const payload = parseCustomerPayload(
      form({
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.invalid",
        membership_id: "mem-should-not-write",
        marketing_consent: "true",
      }),
    );
    expect(payload).not.toHaveProperty("membership_id");
    expect(payload.marketing_consent).toBe(true);
    expect(typeof payload.marketing_consent_at).toBe("string");
  });

  it("persists marketing_consent false without fabricating a timestamp", () => {
    const payload = parseCustomerPayload(
      form({
        name: "Pat",
        email: "pat@example.invalid",
        marketing_consent: "false",
      }),
    );
    expect(payload.marketing_consent).toBe(false);
    expect(payload.marketing_consent_at).toBeNull();
  });

  it("strips only the named missing column", () => {
    const payload = {
      marketing_consent: true,
      marketing_consent_at: "2026-09-09T00:00:00.000Z",
      membership_id: "mem-1",
      name: "Pat",
    };
    const membershipOnly = stripMissingCustomerWriteColumns(
      payload,
      'column "membership_id" does not exist',
    );
    expect(membershipOnly.marketing_consent).toBe(true);
    expect(membershipOnly.marketing_consent_at).toBe("2026-09-09T00:00:00.000Z");
    expect(membershipOnly).not.toHaveProperty("membership_id");

    const consentOnly = stripMissingCustomerWriteColumns(
      payload,
      "column customers.marketing_consent does not exist",
    );
    expect(consentOnly).not.toHaveProperty("marketing_consent");
    expect(consentOnly.marketing_consent_at).toBe("2026-09-09T00:00:00.000Z");
    expect(consentOnly.membership_id).toBe("mem-1");
  });

  it("creates a customer with consent fields and without membership_id", async () => {
    const result = await createCrmCustomer(
      {},
      form({
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.invalid",
        marketing_consent: "true",
        membership_id: "mem-should-not-write",
      }),
    );
    expect(result).toEqual({ success: "Client added." });
    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0]).not.toHaveProperty("membership_id");
    expect(insertedRows[0].marketing_consent).toBe(true);
    expect(typeof insertedRows[0].marketing_consent_at).toBe("string");
    expect(insertedRows[0].business_id).toBe("biz-1");
  });

  it("does not strip consent when a missing-column retry is for membership_id", async () => {
    insertSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          message: 'column "membership_id" does not exist',
        },
      })
      .mockResolvedValueOnce({ data: { id: "cust-new" }, error: null });

    const result = await createCrmCustomer(
      {},
      form({
        name: "Pat",
        email: "pat@example.invalid",
        marketing_consent: "true",
      }),
    );
    expect(insertedRows[0].marketing_consent).toBe(true);
    expect(result.error).toContain("membership_id");
    expect(insertedRows).toHaveLength(1);
  });

  it("retries create by stripping only marketing_consent when that column is missing", async () => {
    insertSingle.mockReset();
    let calls = 0;
    insertSingle.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) {
        return {
          data: null,
          error: {
            message: "column customers.marketing_consent does not exist",
          },
        };
      }
      return { data: { id: "cust-new" }, error: null };
    });

    const result = await createCrmCustomer(
      {},
      form({
        name: "Pat",
        email: "pat@example.invalid",
        marketing_consent: "true",
      }),
    );
    expect(result).toEqual({ success: "Client added." });
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows[0]).toHaveProperty("marketing_consent", true);
    expect(insertedRows[1]).not.toHaveProperty("marketing_consent");
    expect(insertedRows[1]).toHaveProperty("marketing_consent_at");
  });

  it("updates consent true and false without writing membership_id", async () => {
    const trueResult = await updateCrmCustomer(
      {},
      form({
        id: "cust-1",
        name: "Pat",
        email: "pat@example.invalid",
        marketing_consent: "true",
        membership_id: "mem-should-not-write",
      }),
    );
    expect(trueResult).toEqual({ success: "Customer profile saved." });
    expect(updatedRows[0]).not.toHaveProperty("membership_id");
    expect(updatedRows[0].marketing_consent).toBe(true);
    expect(typeof updatedRows[0].marketing_consent_at).toBe("string");
    expect(selectFilters[0]).toEqual({ id: "cust-1", business_id: "biz-1" });

    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: true,
      marketing_consent_at: String(updatedRows[0].marketing_consent_at),
    };
    const falseResult = await updateCrmCustomer(
      {},
      form({
        id: "cust-1",
        name: "Pat",
        email: "pat@example.invalid",
        marketing_consent: "false",
      }),
    );
    expect(falseResult).toEqual({ success: "Customer profile saved." });
    expect(updatedRows[1].marketing_consent).toBe(false);
    expect(updatedRows[1].marketing_consent_at).toBeNull();
  });
});

describe("consent timestamp transitions", () => {
  const original = "2026-01-15T12:00:00.000Z";
  const now = "2026-09-09T15:00:00.000Z";

  beforeEach(() => {
    vi.clearAllMocks();
    insertedRows.length = 0;
    updatedRows.length = 0;
    selectFilters.length = 0;
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
    insertSingle.mockResolvedValue({ data: { id: "cust-new" }, error: null });
    updateResult.mockResolvedValue({ error: null });
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null,
    };
  });

  it("create consent=false is false/null and create consent=true has a timestamp", () => {
    const denied = parseCustomerPayload(
      form({ name: "Pat", email: "pat@example.invalid", marketing_consent: "false" }),
    );
    expect(denied.marketing_consent).toBe(false);
    expect(denied.marketing_consent_at).toBeNull();
    const granted = parseCustomerPayload(
      form({ name: "Pat", email: "pat@example.invalid", marketing_consent: "true" }),
    );
    expect(granted.marketing_consent).toBe(true);
    expect(typeof granted.marketing_consent_at).toBe("string");
  });

  it("false -> true creates a timestamp", () => {
    expect(
      consentTimestampForUpdate({
        nextConsent: true,
        existingConsent: false,
        existingAt: null,
        now,
      }),
    ).toBe(now);
  });

  it("true -> false clears the timestamp", () => {
    expect(
      consentTimestampForUpdate({
        nextConsent: false,
        existingConsent: true,
        existingAt: original,
        now,
      }),
    ).toBeNull();
  });

  it("true -> true preserves the original timestamp exactly", () => {
    expect(
      consentTimestampForUpdate({
        nextConsent: true,
        existingConsent: true,
        existingAt: original,
        now,
      }),
    ).toBe(original);
  });

  it("false -> false remains null", () => {
    expect(
      consentTimestampForUpdate({
        nextConsent: false,
        existingConsent: false,
        existingAt: null,
        now,
      }),
    ).toBeNull();
  });

  it("unrelated profile update while consent=true preserves the original timestamp", async () => {
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: true,
      marketing_consent_at: original,
    };
    const result = await updateCrmCustomer(
      {},
      form({
        id: "cust-1",
        name: "Pat Updated",
        email: "pat@example.invalid",
        marketing_consent: "true",
        notes: "unrelated",
      }),
    );
    expect(result).toEqual({ success: "Customer profile saved." });
    expect(updatedRows[0].marketing_consent_at).toBe(original);
    expect(updatedRows[0].notes).toBe("unrelated");
    expect(selectFilters[0]).toEqual({ id: "cust-1", business_id: "biz-1" });
  });

  it("does not find a foreign-business customer on update", async () => {
    existingCustomer.current = null as never;
    const result = await updateCrmCustomer(
      {},
      form({
        id: "cust-foreign",
        name: "Pat",
        email: "pat@example.invalid",
        marketing_consent: "true",
      }),
    );
    expect(result).toEqual({ error: "Customer not found." });
    expect(updatedRows).toHaveLength(0);
    expect(selectFilters[0]).toEqual({ id: "cust-foreign", business_id: "biz-1" });
  });
});
