import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENTERPRISE_SALES_MESSAGE,
  PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE,
  refusePaidPlanChange,
  TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE,
} from "@/lib/billing/paid-upgrade-guard";
import { MockBillingProvider } from "@/lib/billing/subscription-service";

type InsertCall = {
  client: "user" | "service";
  table: string;
  row: Record<string, unknown>;
};

const inserts: InsertCall[] = [];
const userFromCalls: string[] = [];
const serviceFromCalls: string[] = [];
const createClientCalls = { count: 0 };
const createServiceClientCalls = { count: 0 };

const starterBusiness = {
  id: "biz-1",
  subscription_plan_key: "starter",
  subscription_status: "active",
  billing_interval: "monthly",
};

function thenableResult<T extends Record<string, unknown>>(value: T) {
  return {
    ...value,
    then(
      resolve: (value: T) => unknown,
      reject?: (reason: unknown) => unknown,
    ) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
}

function makeClient(
  kind: "user" | "service",
  business: Record<string, unknown>,
) {
  return {
    from(table: string) {
      if (kind === "user") userFromCalls.push(table);
      else serviceFromCalls.push(table);

      const result = {
        select() {
          return result;
        },
        eq() {
          return result;
        },
        order() {
          return result;
        },
        limit() {
          return thenableResult({ data: [], error: null });
        },
        single() {
          if (table === "businesses") {
            return Promise.resolve({ data: business, error: null });
          }
          return Promise.resolve({
            data: null,
            error: { message: "not found" },
          });
        },
        update() {
          return result;
        },
        insert(row: Record<string, unknown>) {
          inserts.push({ client: kind, table, row });
          return Promise.resolve({ error: null });
        },
        then(
          resolve: (value: { data: unknown; error: null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          const payload =
            table === "subscription_plans"
              ? { data: [], error: null }
              : { data: null, error: null };
          return Promise.resolve(payload).then(resolve, reject);
        },
      };
      return result;
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    createClientCalls.count += 1;
    return makeClient("user", starterBusiness);
  },
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    createServiceClientCalls.count += 1;
    return makeClient("service", starterBusiness);
  },
}));

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: vi.fn(async () => ({
    id: "biz-1",
    subscription_plan_key: "starter",
    subscription_status: "active",
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { changeSubscriptionPlan } from "@/lib/actions/billing";

function planForm(planKey: string, interval = "monthly") {
  const data = new FormData();
  data.set("plan_key", planKey);
  data.set("billing_interval", interval);
  return data;
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walkFiles(full, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("Track 3 production compatibility — paid-upgrade guard", () => {
  it("blocks Professional and Business on the mock provider", () => {
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "professional",
      }),
    ).toBe(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "business",
      }),
    ).toBe(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);
  });

  it("keeps Enterprise on the sales path", () => {
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "enterprise",
      }),
    ).toBe(ENTERPRISE_SALES_MESSAGE);
  });

  it("allows starter / zero-dollar plans on mock", () => {
    expect(
      refusePaidPlanChange({
        providerName: "mock",
        planKey: "starter",
      }),
    ).toBeNull();
  });

  it("does not block a future Stripe provider from paid self-serve plans", () => {
    expect(
      refusePaidPlanChange({
        providerName: "stripe",
        planKey: "professional",
      }),
    ).toBeNull();
  });
});

describe("Track 3 production compatibility — MockBillingProvider writes", () => {
  beforeEach(() => {
    inserts.length = 0;
    userFromCalls.length = 0;
    serviceFromCalls.length = 0;
    createClientCalls.count = 0;
    createServiceClientCalls.count = 0;
  });

  it("rejects paid mock upgrades before any invoice or event write", async () => {
    const provider = new MockBillingProvider();
    await expect(
      provider.changePlan({
        businessId: "biz-1",
        planKey: "professional",
        interval: "monthly",
      }),
    ).rejects.toThrow(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);

    expect(createClientCalls.count).toBe(0);
    expect(createServiceClientCalls.count).toBe(0);
    expect(inserts).toEqual([]);
  });

  it("creates no billing_invoice and no invoice_paid event for a rejected paid upgrade", async () => {
    const provider = new MockBillingProvider();
    await expect(
      provider.changePlan({
        businessId: "biz-1",
        planKey: "business",
        interval: "yearly",
      }),
    ).rejects.toThrow(PAID_PLAN_UPGRADE_UNAVAILABLE_MESSAGE);

    expect(
      inserts.filter((call) => call.table === "billing_invoices"),
    ).toEqual([]);
    expect(
      inserts.filter((call) => call.row.event_type === "invoice_paid"),
    ).toEqual([]);
  });

  it("keeps zero-dollar starter plan changes and writes the event through the service client", async () => {
    const provider = new MockBillingProvider();
    await provider.changePlan({
      businessId: "biz-1",
      planKey: "starter",
      interval: "yearly",
    });

    const eventWrites = inserts.filter(
      (call) => call.table === "subscription_events",
    );
    expect(eventWrites).toHaveLength(1);
    expect(eventWrites[0]?.client).toBe("service");
    expect(eventWrites[0]?.row.event_type).toBe("interval_changed");
    expect(eventWrites[0]?.row.to_plan_key).toBe("starter");
    expect(eventWrites[0]?.row.amount_cents).toBe(0);
    expect(
      inserts.filter((call) => call.table === "billing_invoices"),
    ).toEqual([]);
    expect(
      inserts.filter((call) => call.client === "user"),
    ).toEqual([]);
  });

  it("records cancel through the trusted server client", async () => {
    const provider = new MockBillingProvider();
    await provider.cancelSubscription({
      businessId: "biz-1",
      immediately: true,
    });

    const eventWrites = inserts.filter(
      (call) => call.table === "subscription_events",
    );
    expect(eventWrites).toHaveLength(1);
    expect(eventWrites[0]?.client).toBe("service");
    expect(eventWrites[0]?.row.event_type).toBe("canceled");
    expect(eventWrites[0]?.row.to_status).toBe("canceled");
  });

  it("records reactivate through the trusted server client", async () => {
    const provider = new MockBillingProvider();
    await provider.reactivateSubscription({ businessId: "biz-1" });

    const eventWrites = inserts.filter(
      (call) => call.table === "subscription_events",
    );
    expect(eventWrites).toHaveLength(1);
    expect(eventWrites[0]?.client).toBe("service");
    expect(eventWrites[0]?.row.event_type).toBe("reactivated");
    expect(eventWrites[0]?.row.to_status).toBe("active");
  });

  it("never uses the user-scoped client to write subscription_events or billing_invoices", async () => {
    const provider = new MockBillingProvider();
    await provider.changePlan({
      businessId: "biz-1",
      planKey: "starter",
      interval: "monthly",
    });
    await provider.cancelSubscription({ businessId: "biz-1" });
    await provider.reactivateSubscription({ businessId: "biz-1" });

    expect(
      inserts.filter(
        (call) =>
          call.client === "user" &&
          (call.table === "subscription_events" ||
            call.table === "billing_invoices"),
      ),
    ).toEqual([]);
    expect(
      inserts.filter((call) => call.table === "subscription_events"),
    ).toHaveLength(3);
    expect(
      inserts.every((call) => call.client === "service"),
    ).toBe(true);
  });
});

describe("Track 3 production compatibility — server action + source safety", () => {
  it("does not invoke paid mock checkout from changeSubscriptionPlan", async () => {
    const result = await changeSubscriptionPlan(
      {},
      planForm("professional"),
    );
    expect(result).toEqual({
      error: TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE,
    });
  });

  it("locks tenant starter changes under mock so design-partner plans cannot be undone", async () => {
    const result = await changeSubscriptionPlan({}, planForm("starter"));
    expect(result).toEqual({
      error: TENANT_SELF_SERVE_PLAN_LOCKED_MESSAGE,
    });
  });

  it("keeps source writes on the service helper and never fabricates paid invoices", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/billing/subscription-service.ts"),
      "utf8",
    );
    expect(source).toMatch(/insertTrustedSubscriptionEvent/);
    expect(source).toMatch(/createServiceClient/);
    expect(source).not.toMatch(/await supabase\.from\("subscription_events"\)\.insert/);
    expect(source).not.toMatch(/from\("billing_invoices"\)\.insert/);
    expect(source).not.toMatch(/event_type: "invoice_paid"/);
    expect(source).not.toMatch(/nextInvoiceNumber/);
    expect(source).toMatch(/createClient/);
  });

  it("does not expose the service-role client to Client Components", () => {
    const clientFiles = [
      ...walkFiles(join(process.cwd(), "app")),
      ...walkFiles(join(process.cwd(), "components")),
    ].filter((file) => {
      const text = readFileSync(file, "utf8");
      return /['"]use client['"]/.test(text);
    });

    expect(clientFiles.length).toBeGreaterThan(0);

    for (const file of clientFiles) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/createServiceClient/);
      expect(text, file).not.toMatch(/lib\/supabase\/service/);
      expect(text, file).not.toMatch(/lib\/billing\/subscription-service/);
      expect(text, file).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    }

    const serviceSource = readFileSync(
      join(process.cwd(), "lib/supabase/service.ts"),
      "utf8",
    );
    expect(serviceSource).toMatch(/cannot run in the browser/);
  });
});
