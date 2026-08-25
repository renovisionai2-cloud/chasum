import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePlatformOwner = vi.fn();
const createServiceClient = vi.fn();

vi.mock("@/lib/owner/auth", () => ({
  requirePlatformOwner: (...args: unknown[]) => requirePlatformOwner(...args),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: (...args: unknown[]) => createServiceClient(...args),
}));

import { assignDesignPartnerPlan } from "@/lib/owner/assign-plan";

const BIZ_ID = "11111111-1111-4111-8111-111111111111";
const OWNER = {
  user: { id: "owner-user-1" },
  email: "po@chasum.app",
  source: "env" as const,
};

type CallLog = {
  updates: Record<string, unknown>[];
  inserts: { table: string; row: Record<string, unknown> }[];
};

function makeService(business: Record<string, unknown> | null, log: CallLog) {
  return {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle() {
          return Promise.resolve({
            data: table === "businesses" ? business : null,
            error: null,
          });
        },
        update(row: Record<string, unknown>) {
          log.updates.push({ table, ...row });
          return {
            eq() {
              return Promise.resolve({ error: null });
            },
          };
        },
        insert(row: Record<string, unknown>) {
          log.inserts.push({ table, row });
          return Promise.resolve({ error: null });
        },
      };
    },
  };
}

describe("Phase 4A /owner design-partner plan assignment", () => {
  beforeEach(() => {
    requirePlatformOwner.mockReset();
    createServiceClient.mockReset();
  });

  it("rejects unauthorized callers before any write", async () => {
    requirePlatformOwner.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(
      assignDesignPartnerPlan({
        businessId: BIZ_ID,
        planKey: "professional",
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("requires a platform owner", async () => {
    requirePlatformOwner.mockResolvedValue(OWNER);
    const log: CallLog = { updates: [], inserts: [] };
    createServiceClient.mockReturnValue(
      makeService(
        {
          id: BIZ_ID,
          subscription_plan_key: "starter",
          subscription_status: "active",
          stripe_customer_id: null,
          stripe_subscription_id: null,
        },
        log,
      ),
    );
    await assignDesignPartnerPlan({
      businessId: BIZ_ID,
      planKey: "starter",
    });
    expect(requirePlatformOwner).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid plan keys and business/enterprise", async () => {
    requirePlatformOwner.mockResolvedValue(OWNER);
    createServiceClient.mockReturnValue(makeService(null, { updates: [], inserts: [] }));

    expect(
      (await assignDesignPartnerPlan({ businessId: BIZ_ID, planKey: "nope" }))
        .ok,
    ).toBe(false);
    expect(
      (await assignDesignPartnerPlan({ businessId: BIZ_ID, planKey: "business" }))
        .ok,
    ).toBe(false);
    expect(
      (
        await assignDesignPartnerPlan({
          businessId: BIZ_ID,
          planKey: "enterprise",
        })
      ).ok,
    ).toBe(false);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("rejects a non-uuid business id", async () => {
    requirePlatformOwner.mockResolvedValue(OWNER);
    const result = await assignDesignPartnerPlan({
      businessId: "not-a-uuid",
      planKey: "professional",
    });
    expect(result.ok).toBe(false);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("accepts starter without writing when already starter", async () => {
    requirePlatformOwner.mockResolvedValue(OWNER);
    const log: CallLog = { updates: [], inserts: [] };
    createServiceClient.mockReturnValue(
      makeService(
        {
          id: BIZ_ID,
          subscription_plan_key: "starter",
          subscription_status: "active",
        },
        log,
      ),
    );
    const result = await assignDesignPartnerPlan({
      businessId: BIZ_ID,
      planKey: "starter",
    });
    expect(result).toMatchObject({
      ok: true,
      unchanged: true,
      toPlanKey: "starter",
    });
    expect(log.updates).toEqual([]);
    expect(log.inserts).toEqual([]);
  });

  it("accepts professional, updates the exact business, and writes an audit event", async () => {
    requirePlatformOwner.mockResolvedValue(OWNER);
    const log: CallLog = { updates: [], inserts: [] };
    createServiceClient.mockReturnValue(
      makeService(
        {
          id: BIZ_ID,
          subscription_plan_key: "starter",
          subscription_status: "active",
          stripe_customer_id: "cus_should_not_change",
          stripe_subscription_id: "sub_should_not_change",
        },
        log,
      ),
    );

    const result = await assignDesignPartnerPlan({
      businessId: BIZ_ID,
      planKey: "professional",
    });

    expect(result).toMatchObject({
      ok: true,
      businessId: BIZ_ID,
      fromPlanKey: "starter",
      toPlanKey: "professional",
      unchanged: false,
    });
    expect(log.updates).toHaveLength(1);
    expect(log.updates[0]?.subscription_plan_key).toBe("professional");
    expect(log.updates[0]).not.toHaveProperty("stripe_customer_id");
    expect(log.updates[0]).not.toHaveProperty("stripe_subscription_id");
    expect(log.inserts).toHaveLength(1);
    expect(log.inserts[0]?.table).toBe("subscription_events");
    expect(log.inserts[0]?.row.event_type).toBe("upgraded");
    expect(log.inserts[0]?.row.from_plan_key).toBe("starter");
    expect(log.inserts[0]?.row.to_plan_key).toBe("professional");
    expect(log.inserts[0]?.row.amount_cents).toBe(0);
    expect(log.inserts[0]?.row.metadata).toMatchObject({
      source: "owner",
      arrangement: "design_partner_manual",
      actor_email: OWNER.email,
    });
    expect(
      log.inserts.filter((row) => row.table === "billing_invoices"),
    ).toEqual([]);
  });
});
