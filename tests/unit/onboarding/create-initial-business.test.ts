import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getBusiness = vi.fn();
const createClient = vi.fn();
const redirect = vi.fn((href: string) => {
  throw new Error(`REDIRECT:${href}`);
});

vi.mock("@/lib/actions/business", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  getBusiness: (...args: unknown[]) => getBusiness(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirect(href),
}));

import { createInitialBusinessAction } from "@/lib/actions/create-initial-business";

const owner = {
  id: "user-1",
  user_metadata: { preferred_plan: "free" },
};

function form(fields: {
  businessName?: string;
  timezone?: string;
  currency?: string;
}) {
  const data = new FormData();
  data.set("businessName", fields.businessName ?? "");
  data.set("timezone", fields.timezone ?? "");
  data.set("currency", fields.currency ?? "");
  return data;
}

function thenableChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.update = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.select = vi.fn(self);
  chain.single = vi.fn(async () => result);
  chain.then = (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

function mockClient(options?: {
  rpcData?: unknown;
  rpcError?: { message: string } | null;
  businessRow?: { id: string; timezone: string; currency: string };
  locationError?: { message: string } | null;
}) {
  const rpc = vi.fn(async () => ({
    data: options?.rpcData ?? null,
    error: options?.rpcError ?? null,
  }));
  const businesses = thenableChain({
    data: options?.businessRow ?? {
      id: "biz-1",
      timezone: "America/Toronto",
      currency: "cad",
    },
    error: null,
  });
  const locations = thenableChain({
    data: null,
    error: options?.locationError ?? null,
  });

  createClient.mockResolvedValue({
    rpc,
    from: (table: string) => {
      if (table === "businesses") return businesses;
      if (table === "locations") return locations;
      return thenableChain({ error: { message: `unexpected table ${table}` } });
    },
  });

  return { rpc, businesses, locations };
}

describe("createInitialBusinessAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue(owner);
    getBusiness.mockResolvedValue(null);
  });

  it("does not create a tenant when timezone is invalid", async () => {
    const { rpc, businesses } = mockClient();
    const result = await createInitialBusinessAction(
      {},
      form({
        businessName: "Northshore Clinic",
        timezone: "Not/A/Zone",
        currency: "cad",
      }),
    );
    expect(result).toMatchObject({ error: expect.any(String) });
    expect(rpc).not.toHaveBeenCalled();
    expect(businesses.update).not.toHaveBeenCalled();
  });

  it("does not create a tenant when currency is invalid", async () => {
    const { rpc, businesses } = mockClient();
    const result = await createInitialBusinessAction(
      {},
      form({
        businessName: "Northshore Clinic",
        timezone: "America/Toronto",
        currency: "xyz",
      }),
    );
    expect(result).toMatchObject({ error: expect.any(String) });
    expect(rpc).not.toHaveBeenCalled();
    expect(businesses.update).not.toHaveBeenCalled();
  });

  it("creates with the explicit name, America/Toronto, and CAD — not NY/USD", async () => {
    const created = {
      id: "biz-1",
      owner_id: owner.id,
      name: "Northshore Clinic",
      slug: "northshore-clinic",
      timezone: "America/New_York",
      currency: "usd",
    };
    const { rpc, businesses, locations } = mockClient({
      rpcData: created,
      businessRow: {
        id: "biz-1",
        timezone: "America/Toronto",
        currency: "cad",
      },
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Northshore Clinic",
          timezone: "America/Toronto",
          currency: "CAD",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("ensure_business_for_owner", {
      p_name: "Northshore Clinic",
      p_preferred_slug: "northshore-clinic",
    });
    expect(businesses.update).toHaveBeenCalledWith({
      timezone: "America/Toronto",
      currency: "cad",
      subscription_plan_key: "starter",
    });
    expect(businesses.update.mock.calls[0][0]).not.toMatchObject({
      timezone: "America/New_York",
    });
    expect(businesses.update.mock.calls[0][0]).not.toMatchObject({
      currency: "usd",
    });
    expect(locations.update).toHaveBeenCalledWith({
      timezone: "America/Toronto",
    });
    expect(locations.eq).toHaveBeenCalledWith("business_id", "biz-1");
    expect(locations.eq).toHaveBeenCalledWith("is_default", true);
  });

  it("maps preferred_plan=free to starter and does not create billing rows", async () => {
    const created = {
      id: "biz-1",
      owner_id: owner.id,
      name: "Northshore Clinic",
      slug: "northshore-clinic",
    };
    const { rpc, businesses } = mockClient({
      rpcData: created,
      businessRow: {
        id: "biz-1",
        timezone: "Europe/London",
        currency: "gbp",
      },
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Northshore Clinic",
          timezone: "Europe/London",
          currency: "gbp",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(rpc.mock.calls[0][0]).toBe("ensure_business_for_owner");
    expect(JSON.stringify(rpc.mock.calls)).not.toMatch(/stripe/i);
    expect(businesses.update).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_plan_key: "starter" }),
    );
  });

  it("redirects an existing differently named business without creating another tenant", async () => {
    getBusiness.mockResolvedValue({
      id: "biz-existing",
      owner_id: owner.id,
      name: "Already Here",
    });
    const { rpc, businesses } = mockClient();

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Another Clinic",
          timezone: "America/Toronto",
          currency: "cad",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(rpc).not.toHaveBeenCalled();
    expect(businesses.update).not.toHaveBeenCalled();
  });

  it("retries timezone/currency stamp for the same owned name without a second RPC", async () => {
    getBusiness.mockResolvedValue({
      id: "biz-1",
      owner_id: owner.id,
      name: "Northshore Clinic",
      timezone: "America/New_York",
      currency: "usd",
    });
    const { rpc, businesses, locations } = mockClient({
      businessRow: {
        id: "biz-1",
        timezone: "America/Toronto",
        currency: "cad",
      },
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Northshore Clinic",
          timezone: "America/Toronto",
          currency: "CAD",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(rpc).not.toHaveBeenCalled();
    expect(businesses.update).toHaveBeenCalledWith({
      timezone: "America/Toronto",
      currency: "cad",
      subscription_plan_key: "starter",
    });
    expect(locations.update).toHaveBeenCalledWith({
      timezone: "America/Toronto",
    });
  });

  it("does not stamp another tenant when RPC returns a different business", async () => {
    const { rpc, businesses } = mockClient({
      rpcData: {
        id: "biz-other",
        owner_id: "someone-else",
        name: "Partner Clinic",
      },
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Northshore Clinic",
          timezone: "America/Toronto",
          currency: "cad",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(businesses.update).not.toHaveBeenCalled();
  });
});
