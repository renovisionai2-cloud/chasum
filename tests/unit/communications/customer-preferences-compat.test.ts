// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { logger, captureMessage } = vi.hoisted(() => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
  captureMessage: vi.fn(),
}));

vi.mock("@/lib/observability/logger", () => ({ logger }));
vi.mock("@/lib/observability/sentry", () => ({
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  captureException: vi.fn(),
}));

const from = vi.fn();
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from }),
}));

import {
  channelAllowed,
  deriveCustomerChannelPreferences,
  loadCustomerCommPreferences,
  resetMarketingConsentCompatWarnForTests,
} from "@/lib/communications/preferences";
import type { CommunicationsPreferences } from "@/lib/communications/types";
import { isMarketingConsentColumnMissing } from "@/lib/supabase/errors";

const BIZ = "biz-owned";
const CUST = "cust-1";

const businessOn: CommunicationsPreferences = {
  businessId: BIZ,
  emailEnabled: true,
  smsEnabled: true,
  marketingEmailEnabled: true,
  reminderHoursBefore: 24,
  notificationEmail: null,
  quietHoursStart: null,
  quietHoursEnd: null,
  optOutFooter: null,
};

type Handler = (select: string, filters: Record<string, string>) => {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
};

function installClient(handler: Handler) {
  const selects: string[] = [];
  const filterLog: Record<string, string>[] = [];
  from.mockImplementation((table: string) => {
    expect(table).toBe("customers");
    const filters: Record<string, string> = {};
    let select = "";
    const query = {
      select(s: string) {
        select = s;
        selects.push(s);
        return query;
      },
      eq(key: string, value: string) {
        filters[key] = value;
        return query;
      },
      maybeSingle: async () => {
        filterLog.push({ ...filters });
        return handler(select, { ...filters });
      },
    };
    return query;
  });
  return { selects, filterLog };
}

describe("isMarketingConsentColumnMissing", () => {
  it("matches postgres and PostgREST missing-column errors", () => {
    expect(
      isMarketingConsentColumnMissing(
        "column customers.marketing_consent does not exist",
      ),
    ).toBe(true);
    expect(
      isMarketingConsentColumnMissing(
        "Could not find the 'marketing_consent' column of 'customers' in the schema cache",
      ),
    ).toBe(true);
  });

  it("does not treat marketing_consent_at or genuine failures as the compat path", () => {
    expect(
      isMarketingConsentColumnMissing(
        "column customers.marketing_consent_at does not exist",
      ),
    ).toBe(false);
    expect(isMarketingConsentColumnMissing("timeout connecting to database")).toBe(
      false,
    );
  });
});

describe("deriveCustomerChannelPreferences", () => {
  it("uses actual consent and preserves preferred method", () => {
    expect(
      deriveCustomerChannelPreferences(
        {
          preferred_communication_method: "any",
          marketing_consent: false,
          email: "owned@example.invalid",
          phone: "555",
        },
        { customerId: CUST, marketing: false },
      ),
    ).toMatchObject({
      preferredMethod: "any",
      email: true,
      sms: true,
      marketing: false,
    });
    expect(
      deriveCustomerChannelPreferences(
        {
          preferred_communication_method: "email",
          marketing_consent: true,
          email: "owned@example.invalid",
          phone: "555",
        },
        { customerId: CUST, marketing: true },
      ),
    ).toMatchObject({
      preferredMethod: "email",
      email: true,
      sms: false,
      marketing: true,
    });
  });
});

describe("channelAllowed", () => {
  const customer = (
    over: Partial<{
      email: boolean;
      sms: boolean;
      marketing: boolean;
      preferredMethod: string | null;
    }>,
  ) => ({
    customerId: CUST,
    email: true,
    sms: true,
    marketing: false,
    preferredMethod: "any" as string | null,
    ...over,
  });

  it("suppresses email when preferred method is sms", () => {
    const prefs = deriveCustomerChannelPreferences(
      {
        preferred_communication_method: "sms",
        email: "owned@example.invalid",
        phone: "555",
      },
      { customerId: CUST, marketing: false },
    );
    expect(channelAllowed({ channel: "email", business: businessOn, customer: prefs })).toBe(
      false,
    );
    expect(channelAllowed({ channel: "sms", business: businessOn, customer: prefs })).toBe(
      true,
    );
  });

  it("suppresses email and SMS when preferred method is call", () => {
    const prefs = deriveCustomerChannelPreferences(
      {
        preferred_communication_method: "call",
        email: "owned@example.invalid",
        phone: "555",
      },
      { customerId: CUST, marketing: false },
    );
    expect(channelAllowed({ channel: "email", business: businessOn, customer: prefs })).toBe(
      false,
    );
    expect(channelAllowed({ channel: "sms", business: businessOn, customer: prefs })).toBe(
      false,
    );
  });

  it("suppresses SMS when preferred method is email", () => {
    const prefs = deriveCustomerChannelPreferences(
      {
        preferred_communication_method: "email",
        email: "owned@example.invalid",
        phone: "555",
      },
      { customerId: CUST, marketing: false },
    );
    expect(channelAllowed({ channel: "email", business: businessOn, customer: prefs })).toBe(
      true,
    );
    expect(channelAllowed({ channel: "sms", business: businessOn, customer: prefs })).toBe(
      false,
    );
  });

  it("allows email and SMS when preferred method is any or null if contact exists", () => {
    for (const preferred of ["any", null]) {
      const prefs = deriveCustomerChannelPreferences(
        {
          preferred_communication_method: preferred,
          email: "owned@example.invalid",
          phone: "555",
        },
        { customerId: CUST, marketing: false },
      );
      expect(channelAllowed({ channel: "email", business: businessOn, customer: prefs })).toBe(
        true,
      );
      expect(channelAllowed({ channel: "sms", business: businessOn, customer: prefs })).toBe(
        true,
      );
    }
  });

  it("never allows marketing unless business marketing is on and customer consent is true", () => {
    expect(
      channelAllowed({
        channel: "email",
        business: { ...businessOn, marketingEmailEnabled: false },
        customer: customer({ marketing: true }),
        marketing: true,
      }),
    ).toBe(false);
    expect(
      channelAllowed({
        channel: "email",
        business: businessOn,
        customer: customer({ marketing: false }),
        marketing: true,
      }),
    ).toBe(false);
    expect(
      channelAllowed({
        channel: "email",
        business: businessOn,
        customer: null,
        marketing: true,
      }),
    ).toBe(false);
    expect(
      channelAllowed({
        channel: "email",
        business: businessOn,
        customer: customer({ marketing: true }),
        marketing: true,
      }),
    ).toBe(true);
  });
});

describe("loadCustomerCommPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMarketingConsentCompatWarnForTests();
    delete process.env.CHASUM_ALLOW_SOFT_SCHEMA;
  });
  afterEach(() => {
    delete process.env.CHASUM_ALLOW_SOFT_SCHEMA;
  });

  it("uses marketing_consent and preferred method when the full schema is present", async () => {
    const { selects, filterLog } = installClient((select, filters) => {
      expect(select).toContain("marketing_consent");
      expect(filters).toEqual({ id: CUST, business_id: BIZ });
      return {
        data: {
          id: CUST,
          preferred_communication_method: "any",
          marketing_consent: true,
          email: "owned@example.invalid",
          phone: "555",
        },
        error: null,
      };
    });
    await expect(
      loadCustomerCommPreferences(BIZ, CUST, true),
    ).resolves.toMatchObject({
      preferredMethod: "any",
      marketing: true,
      email: true,
      sms: true,
    });
    const denied = installClient(() => ({
      data: {
        id: CUST,
        preferred_communication_method: "sms",
        marketing_consent: false,
        email: "owned@example.invalid",
        phone: "555",
      },
      error: null,
    }));
    void denied;
    expect(selects).toHaveLength(1);
    expect(filterLog[0]).toEqual({ id: CUST, business_id: BIZ });
    await expect(
      loadCustomerCommPreferences(BIZ, CUST, true),
    ).resolves.toMatchObject({
      preferredMethod: "sms",
      marketing: false,
      email: false,
      sms: true,
    });
  });

  it("falls back to a narrow read when marketing_consent is missing", async () => {
    const { selects, filterLog } = installClient((select, filters) => {
      expect(filters).toEqual({ id: CUST, business_id: BIZ });
      if (select.includes("marketing_consent")) {
        return {
          data: null,
          error: {
            message: "column customers.marketing_consent does not exist",
          },
        };
      }
      expect(select).not.toContain("marketing_consent");
      expect(select).toContain("preferred_communication_method");
      return {
        data: {
          id: CUST,
          preferred_communication_method: "email",
          email: "owned@example.invalid",
          phone: null,
        },
        error: null,
      };
    });

    const prefs = await loadCustomerCommPreferences(BIZ, CUST, true);
    expect(prefs).toMatchObject({
      preferredMethod: "email",
      email: true,
      sms: false,
      marketing: false,
    });
    expect(
      channelAllowed({
        channel: "email",
        business: businessOn,
        customer: prefs,
        marketing: true,
      }),
    ).toBe(false);
    expect(selects).toEqual([
      "id, preferred_communication_method, marketing_consent, email, phone",
      "id, preferred_communication_method, email, phone",
    ]);
    expect(filterLog).toHaveLength(2);
    expect(filterLog.every((f) => f.business_id === BIZ && f.id === CUST)).toBe(
      true,
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "comms.customer.prefs",
      "marketing_consent column missing; using compatibility read",
      expect.objectContaining({ message: expect.stringContaining("marketing_consent") }),
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("does not spam warnings on the compatibility path", async () => {
    installClient((select) => {
      if (select.includes("marketing_consent")) {
        return {
          data: null,
          error: {
            message:
              "Could not find the 'marketing_consent' column of 'customers' in the schema cache",
          },
        };
      }
      return {
        data: {
          preferred_communication_method: "any",
          email: "owned@example.invalid",
          phone: "555",
        },
        error: null,
      };
    });
    await loadCustomerCommPreferences(BIZ, CUST, true);
    await loadCustomerCommPreferences(BIZ, CUST, true);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("keeps transactional channels on genuine DB errors and logs at error", async () => {
    installClient(() => ({
      data: null,
      error: { message: "timeout connecting to database" },
    }));
    await expect(
      loadCustomerCommPreferences(BIZ, CUST, true),
    ).resolves.toMatchObject({
      email: true,
      sms: true,
      marketing: false,
      preferredMethod: null,
    });
    expect(logger.error).toHaveBeenCalled();
    expect(captureMessage).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("does not return a foreign-business row through the compatibility fallback", async () => {
    installClient((select, filters) => {
      if (select.includes("marketing_consent")) {
        return {
          data: null,
          error: {
            message: "column customers.marketing_consent does not exist",
          },
        };
      }
      if (filters.business_id !== BIZ) {
        return {
          data: {
            id: CUST,
            preferred_communication_method: "sms",
            email: "foreign@example.invalid",
            phone: "555",
          },
          error: null,
        };
      }
      return {
        data: {
          id: CUST,
          preferred_communication_method: "email",
          email: "owned@example.invalid",
          phone: "555",
        },
        error: null,
      };
    });
    const prefs = await loadCustomerCommPreferences(BIZ, CUST, true);
    expect(prefs.preferredMethod).toBe("email");
    expect(prefs.email).toBe(true);
    expect(from).toHaveBeenCalled();
  });
});
