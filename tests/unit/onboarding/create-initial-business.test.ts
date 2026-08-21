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
import { RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES } from "@/lib/booking/interval";

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
  chain.in = vi.fn(self);
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
  businessRow?: {
    id: string;
    timezone: string;
    currency: string;
    appointment_interval_minutes?: number;
  };
  locationError?: { message: string } | null;
  locationRows?: { id: string }[];
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
      appointment_interval_minutes: RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES,
    },
    error: null,
  });
  const locations = thenableChain({
    data: options?.locationRows ?? [{ id: "loc-1" }],
    error: options?.locationError ?? null,
  });
  const locationSettings = thenableChain({
    data: null,
    error: null,
  });

  createClient.mockResolvedValue({
    rpc,
    from: (table: string) => {
      if (table === "businesses") return businesses;
      if (table === "locations") return locations;
      if (table === "location_settings") return locationSettings;
      return thenableChain({ error: { message: `unexpected table ${table}` } });
    },
  });

  return { rpc, businesses, locations, locationSettings };
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

  it("creates with Toronto, CAD, starter, and 15-minute interval — not NY/USD/30", async () => {
    const created = {
      id: "biz-1",
      owner_id: owner.id,
      name: "Northshore Clinic",
      slug: "northshore-clinic",
      timezone: "America/New_York",
      currency: "usd",
      appointment_interval_minutes: 30,
    };
    const { rpc, businesses, locations, locationSettings } = mockClient({
      rpcData: created,
      businessRow: {
        id: "biz-1",
        timezone: "America/Toronto",
        currency: "cad",
        appointment_interval_minutes: 15,
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
      appointment_interval_minutes: 15,
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
    expect(locationSettings.update).toHaveBeenCalledWith({
      appointment_interval_minutes: 15,
    });
    expect(locationSettings.in).toHaveBeenCalledWith("location_id", ["loc-1"]);
  });

  it("creates a New York + USD tenant with a 15-minute interval, not the 30-minute database default", async () => {
    const created = {
      id: "biz-ny",
      owner_id: owner.id,
      name: "Hudson Clinic",
      slug: "hudson-clinic",
      timezone: "America/New_York",
      currency: "usd",
      appointment_interval_minutes: 30,
    };
    const { rpc, businesses, locationSettings } = mockClient({
      rpcData: created,
      businessRow: {
        id: "biz-ny",
        timezone: "America/New_York",
        currency: "usd",
        appointment_interval_minutes: 15,
      },
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Hudson Clinic",
          timezone: "America/New_York",
          currency: "USD",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(businesses.update).toHaveBeenCalledWith({
      timezone: "America/New_York",
      currency: "usd",
      subscription_plan_key: "starter",
      appointment_interval_minutes: 15,
    });
    expect(locationSettings.update).toHaveBeenCalledWith({
      appointment_interval_minutes: 15,
    });
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
        appointment_interval_minutes: 15,
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
      timezone: "America/Toronto",
      currency: "cad",
      appointment_interval_minutes: 30,
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

  it("does not rewrite a legitimate New York + USD + 30 tenant on same-name retry", async () => {
    getBusiness.mockResolvedValue({
      id: "biz-ny",
      owner_id: owner.id,
      name: "Hudson Clinic",
      timezone: "America/New_York",
      currency: "usd",
      appointment_interval_minutes: 30,
    });
    const { rpc, businesses, locationSettings } = mockClient({
      businessRow: {
        id: "biz-ny",
        timezone: "America/New_York",
        currency: "usd",
        appointment_interval_minutes: 30,
      },
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Hudson Clinic",
          timezone: "America/New_York",
          currency: "USD",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(rpc).not.toHaveBeenCalled();
    expect(businesses.update).toHaveBeenCalledWith({
      timezone: "America/New_York",
      currency: "usd",
      subscription_plan_key: "starter",
    });
    expect(businesses.update.mock.calls[0][0]).not.toHaveProperty(
      "appointment_interval_minutes",
    );
    expect(locationSettings.update).not.toHaveBeenCalled();
  });

  it("repairs timezone and currency on same-name retry without seeding interval", async () => {
    getBusiness.mockResolvedValue({
      id: "biz-1",
      owner_id: owner.id,
      name: "Northshore Clinic",
      timezone: "America/New_York",
      currency: "usd",
      appointment_interval_minutes: 30,
    });
    const { rpc, businesses, locationSettings } = mockClient({
      businessRow: {
        id: "biz-1",
        timezone: "America/Toronto",
        currency: "cad",
        appointment_interval_minutes: 30,
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
    expect(businesses.update.mock.calls[0][0]).not.toHaveProperty(
      "appointment_interval_minutes",
    );
    expect(locationSettings.update).not.toHaveBeenCalled();
  });

  it("does not rewrite location settings when an existing tenant is already at 15 minutes", async () => {
    getBusiness.mockResolvedValue({
      id: "biz-1",
      owner_id: owner.id,
      name: "Northshore Clinic",
      timezone: "America/Toronto",
      currency: "cad",
      appointment_interval_minutes: 15,
    });
    const { rpc, businesses, locationSettings } = mockClient({
      businessRow: {
        id: "biz-1",
        timezone: "America/Toronto",
        currency: "cad",
        appointment_interval_minutes: 15,
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
    expect(businesses.update.mock.calls[0][0]).not.toHaveProperty(
      "appointment_interval_minutes",
    );
    expect(locationSettings.update).not.toHaveBeenCalled();
  });

  it("does not rewrite a stamped existing tenant's 30-minute interval on same-name retry", async () => {
    getBusiness.mockResolvedValue({
      id: "biz-hq",
      owner_id: owner.id,
      name: "Chasum HQ",
      timezone: "America/Toronto",
      currency: "cad",
      appointment_interval_minutes: 30,
    });
    const { rpc, businesses, locationSettings } = mockClient({
      businessRow: {
        id: "biz-hq",
        timezone: "America/Toronto",
        currency: "cad",
        appointment_interval_minutes: 30,
      },
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Chasum HQ",
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
    expect(businesses.update.mock.calls[0][0]).not.toHaveProperty(
      "appointment_interval_minutes",
    );
    expect(locationSettings.update).not.toHaveBeenCalled();
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
