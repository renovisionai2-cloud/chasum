// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const VERSION_A = "2026-09-02T23:00:15.639771+00:00";
const VERSION_B = "2026-09-09T15:00:00.123456+00:00";
const ORIGINAL_GRANT = "2026-01-15T12:00:00.000Z";

const {
  getOrCreateBusiness,
  insertSingle,
  insertedRows,
  updatedRows,
  updateFilters,
  selectFilters,
  existingCustomer,
  updateError,
  updateErrorOnce,
  updateReturnsRow,
} = vi.hoisted(() => ({
  getOrCreateBusiness: vi.fn(),
  insertSingle: vi.fn(),
  insertedRows: [] as Record<string, unknown>[],
  updatedRows: [] as Record<string, unknown>[],
  updateFilters: [] as Record<string, string>[],
  selectFilters: [] as Record<string, string>[],
  existingCustomer: {
    current: {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null as string | null,
      updated_at: "2026-09-02T23:00:15.639771+00:00",
    } as Record<string, unknown> | null,
  },
  updateError: { current: null as { message: string } | null },
  updateErrorOnce: { current: null as { message: string } | null },
  updateReturnsRow: { current: true },
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
          const filters: Record<string, string> = {};
          const query = {
            eq(key: string, value: string) {
              filters[key] = value;
              return query;
            },
            select() {
              return {
                maybeSingle: async () => {
                  updateFilters.push({ ...filters });
                  const once = updateErrorOnce.current;
                  if (once) {
                    updateErrorOnce.current = null;
                    return { data: null, error: once };
                  }
                  if (updateError.current) {
                    return { data: null, error: updateError.current };
                  }
                  const current = existingCustomer.current;
                  if (
                    !current ||
                    filters.id !== current.id ||
                    filters.business_id !== "biz-1" ||
                    filters.updated_at !== current.updated_at
                  ) {
                    return { data: null, error: null };
                  }
                  Object.assign(current, row);
                  if (updateReturnsRow.current) {
                    current.updated_at = VERSION_B;
                    return { data: { id: current.id }, error: null };
                  }
                  return { data: null, error: null };
                },
              };
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
  CUSTOMER_CONSENT_INVALID,
  CUSTOMER_CONSENT_UNAVAILABLE,
  CUSTOMER_PROFILE_CONFLICT,
  CUSTOMER_VERSION_REQUIRED,
  consentTimestampForUpdate,
  crmCustomerFormSnapshotKey,
  parseConsentWriteIntent,
  parseCustomerPayload,
  parseExpectedCustomerVersion,
  stripMissingCustomerWriteColumns,
} from "@/lib/crm/customer-payload";

function form(entries: Record<string, string | undefined>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

function profileSave(overrides: Record<string, string | undefined> = {}) {
  return form({
    id: "cust-1",
    name: "Pat",
    email: "pat@example.invalid",
    expected_updated_at: VERSION_A,
    ...overrides,
  });
}

function consentSave(
  intent: "edit" | "grant" | "revoke",
  consent?: string,
  extra: Record<string, string | undefined> = {},
) {
  const data = profileSave(extra);
  data.set("marketing_consent_intent", intent);
  if (consent !== undefined) data.set("marketing_consent", consent);
  return data;
}

describe("CRM customer consent writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedRows.length = 0;
    updatedRows.length = 0;
    updateFilters.length = 0;
    selectFilters.length = 0;
    updateError.current = null;
    updateErrorOnce.current = null;
    updateReturnsRow.current = true;
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null,
      updated_at: VERSION_A,
    };
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
    insertSingle.mockResolvedValue({ data: { id: "cust-new" }, error: null });
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

  it("omits consent fields from update payloads unless intent is applied later", () => {
    const payload = parseCustomerPayload(
      form({
        name: "Pat",
        email: "pat@example.invalid",
        marketing_consent: "true",
      }),
      { consentTimestampMode: "defer" },
    );
    expect(payload).not.toHaveProperty("marketing_consent");
    expect(payload).not.toHaveProperty("marketing_consent_at");
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
});

describe("consent intent and stale-form contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedRows.length = 0;
    updatedRows.length = 0;
    updateFilters.length = 0;
    selectFilters.length = 0;
    updateError.current = null;
    updateErrorOnce.current = null;
    updateReturnsRow.current = true;
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: true,
      marketing_consent_at: ORIGINAL_GRANT,
      updated_at: VERSION_A,
    };
    getOrCreateBusiness.mockResolvedValue({ id: "biz-1" });
  });

  it("treats missing intent as omit even if a stale marketing_consent=true is present", () => {
    const intent = parseConsentWriteIntent(
      form({ marketing_consent: "true", name: "Pat" }),
    );
    expect(intent).toEqual({ kind: "omit" });
  });

  it("treats an unchecked checkbox plus intent=edit as revoke", () => {
    expect(parseConsentWriteIntent(consentSave("edit"))).toEqual({
      kind: "revoke",
    });
  });

  it("treats a checked checkbox plus intent=edit as grant", () => {
    expect(parseConsentWriteIntent(consentSave("edit", "true"))).toEqual({
      kind: "grant",
    });
  });

  it("rejects contradictory grant+false input", () => {
    expect(parseConsentWriteIntent(consentSave("grant", "false"))).toEqual({
      kind: "invalid",
      error: CUSTOMER_CONSENT_INVALID,
    });
  });

  it("preserves exact expected_updated_at precision", () => {
    const parsed = parseExpectedCustomerVersion(
      form({ expected_updated_at: VERSION_A }),
    );
    expect(parsed).toEqual({ ok: true, updatedAt: VERSION_A });
  });

  it("fails safely when expected version is missing", () => {
    expect(parseExpectedCustomerVersion(form({}))).toEqual({
      ok: false,
      error: CUSTOMER_VERSION_REQUIRED,
    });
  });

  it("remounts the form snapshot when updated_at changes", () => {
    const first = crmCustomerFormSnapshotKey({
      id: "cust-1",
      updated_at: VERSION_A,
    });
    const second = crmCustomerFormSnapshotKey({
      id: "cust-1",
      updated_at: VERSION_B,
    });
    expect(first).not.toBe(second);
  });

  it("1. ordinary profile edit preserves consent and timestamp exactly", async () => {
    const result = await updateCrmCustomer(
      {},
      profileSave({ name: "Pat Updated", notes: "unrelated" }),
    );
    expect(result).toEqual({ success: "Customer profile saved." });
    expect(updatedRows[0]).not.toHaveProperty("marketing_consent");
    expect(updatedRows[0]).not.toHaveProperty("marketing_consent_at");
    expect(updatedRows[0].notes).toBe("unrelated");
    expect(existingCustomer.current?.marketing_consent).toBe(true);
    expect(existingCustomer.current?.marketing_consent_at).toBe(ORIGINAL_GRANT);
    expect(updateFilters[0]).toEqual({
      id: "cust-1",
      business_id: "biz-1",
      updated_at: VERSION_A,
    });
  });

  it("2. ordinary profile submission omitting consent does not revoke it", async () => {
    const result = await updateCrmCustomer({}, profileSave());
    expect(result.success).toBe("Customer profile saved.");
    expect(updatedRows[0]).not.toHaveProperty("marketing_consent");
    expect(existingCustomer.current?.marketing_consent).toBe(true);
  });

  it("3. explicit unchecked consent is still a valid revoke", async () => {
    const result = await updateCrmCustomer({}, consentSave("edit"));
    expect(result).toEqual({ success: "Customer profile saved." });
    expect(updatedRows[0].marketing_consent).toBe(false);
    expect(updatedRows[0].marketing_consent_at).toBeNull();
  });

  it("4. explicit grant/revoke and unchanged/legacy timestamp cases remain correct", async () => {
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null,
      updated_at: VERSION_A,
    };
    const granted = await updateCrmCustomer({}, consentSave("edit", "true"));
    expect(granted.success).toBe("Customer profile saved.");
    expect(updatedRows[0].marketing_consent).toBe(true);
    expect(typeof updatedRows[0].marketing_consent_at).toBe("string");

    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: true,
      marketing_consent_at: ORIGINAL_GRANT,
      updated_at: VERSION_A,
    };
    updatedRows.length = 0;
    const unchanged = await updateCrmCustomer({}, consentSave("grant"));
    expect(unchanged.success).toBe("Customer profile saved.");
    expect(updatedRows[0].marketing_consent_at).toBe(ORIGINAL_GRANT);

    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: true,
      marketing_consent_at: null,
      updated_at: VERSION_A,
    };
    updatedRows.length = 0;
    const legacy = await updateCrmCustomer({}, consentSave("grant"));
    expect(legacy.success).toBe("Customer profile saved.");
    expect(updatedRows[0].marketing_consent).toBe(true);
    expect(updatedRows[0].marketing_consent_at).toBeNull();
  });

  it("5. stale Overview after another tab revoked consent does not restore it", async () => {
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null,
      updated_at: VERSION_B,
    };
    const staleOverview = profileSave({
      expected_updated_at: VERSION_A,
      marketing_consent: "true",
      name: "Pat From Tab A",
    });
    const result = await updateCrmCustomer({}, staleOverview);
    expect(result).toEqual({ error: CUSTOMER_PROFILE_CONFLICT });
    expect(existingCustomer.current.marketing_consent).toBe(false);
    expect(existingCustomer.current.marketing_consent_at).toBeNull();
  });

  it("6. a stale marketing form cannot silently overwrite a newer consent decision", async () => {
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null,
      updated_at: VERSION_B,
    };
    const result = await updateCrmCustomer(
      {},
      consentSave("edit", "true", { expected_updated_at: VERSION_A }),
    );
    expect(result).toEqual({ error: CUSTOMER_PROFILE_CONFLICT });
    expect(existingCustomer.current.marketing_consent).toBe(false);
  });

  it("7. consent change after SELECT uses the form snapshot version, not a fresh reread", async () => {
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null,
      updated_at: VERSION_B,
    };
    const result = await updateCrmCustomer(
      {},
      consentSave("revoke", undefined, { expected_updated_at: VERSION_A }),
    );
    expect(updateFilters[0]?.updated_at).toBe(VERSION_A);
    expect(result).toEqual({ error: CUSTOMER_PROFILE_CONFLICT });
  });

  it("8. a stale concurrent grant cannot rotate the first committed grant timestamp", async () => {
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: true,
      marketing_consent_at: ORIGINAL_GRANT,
      updated_at: VERSION_B,
    };
    const result = await updateCrmCustomer(
      {},
      consentSave("grant", undefined, { expected_updated_at: VERSION_A }),
    );
    expect(result).toEqual({ error: CUSTOMER_PROFILE_CONFLICT });
    expect(existingCustomer.current.marketing_consent_at).toBe(ORIGINAL_GRANT);
  });

  it("9. missing or malformed expected version on update fails safely", async () => {
    const missing = await updateCrmCustomer(
      {},
      form({ id: "cust-1", name: "Pat", email: "pat@example.invalid" }),
    );
    expect(missing).toEqual({ error: CUSTOMER_VERSION_REQUIRED });
    expect(updatedRows).toHaveLength(0);

    const empty = await updateCrmCustomer(
      {},
      profileSave({ expected_updated_at: "   " }),
    );
    expect(empty).toEqual({ error: CUSTOMER_VERSION_REQUIRED });
    expect(updatedRows).toHaveLength(0);
  });

  it("10. missing/foreign customer or zero returned rows does not report success", async () => {
    existingCustomer.current = null;
    const missing = await updateCrmCustomer({}, profileSave({ id: "cust-foreign" }));
    expect(missing).toEqual({ error: "Customer not found." });
    expect(updatedRows).toHaveLength(0);
    expect(selectFilters[0]).toEqual({ id: "cust-foreign", business_id: "biz-1" });

    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: true,
      marketing_consent_at: ORIGINAL_GRANT,
      updated_at: VERSION_A,
    };
    updateReturnsRow.current = false;
    const zero = await updateCrmCustomer({}, profileSave());
    expect(zero).toEqual({ error: CUSTOMER_PROFILE_CONFLICT });
  });

  it("11. missing-schema compatibility cannot bypass the concurrency/consent guard", async () => {
    updateError.current = {
      message: "column customers.marketing_consent does not exist",
    };
    const consent = await updateCrmCustomer({}, consentSave("edit", "true"));
    expect(consent).toEqual({ error: CUSTOMER_CONSENT_UNAVAILABLE });
    expect(existingCustomer.current?.marketing_consent).toBe(true);

    updateError.current = null;
    updateErrorOnce.current = {
      message: "column customers.marketing_consent_at does not exist",
    };
    updatedRows.length = 0;
    updateFilters.length = 0;
    existingCustomer.current = {
      id: "cust-1",
      marketing_consent: false,
      marketing_consent_at: null,
      updated_at: VERSION_B,
    };
    const staleRetry = await updateCrmCustomer(
      {},
      consentSave("edit", "true", { expected_updated_at: VERSION_A }),
    );
    expect(staleRetry).toEqual({ error: CUSTOMER_PROFILE_CONFLICT });
    expect(updateFilters.every((filters) => filters.updated_at === VERSION_A)).toBe(
      true,
    );
    expect(existingCustomer.current.marketing_consent).toBe(false);
  });

  it("rejects contradictory consent input without writing", async () => {
    const result = await updateCrmCustomer({}, consentSave("grant", "false"));
    expect(result).toEqual({ error: CUSTOMER_CONSENT_INVALID });
    expect(updatedRows).toHaveLength(0);
  });
});

describe("consent timestamp transitions", () => {
  const original = ORIGINAL_GRANT;
  const now = "2026-09-09T15:00:00.000Z";

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
});
