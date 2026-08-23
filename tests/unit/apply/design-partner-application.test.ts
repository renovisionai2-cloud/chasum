import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DESIGN_PARTNER_APPLICATIONS_TABLE,
  isDesignPartnerApplicationsTableMissing,
  parseDesignPartnerApplication,
  toDesignPartnerApplicationRow,
} from "@/lib/apply/design-partner-application";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const insert = vi.fn();
const createServiceClient = vi.fn();
const emailsSend = vi.fn();
const loggerInfo = vi.fn();
const loggerError = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: (...args: unknown[]) => createServiceClient(...args),
}));

vi.mock("@/lib/env", () => ({
  getResendApiKey: () => "re_test",
  getEmailFromAddress: () => "Chasum <hello@chasum.app>",
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfo(...args),
    error: (...args: unknown[]) => loggerError(...args),
    warn: vi.fn(),
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => emailsSend(...args) };
  },
}));

import { submitDesignPartnerApplication } from "@/lib/actions/design-partner";

function validForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("business_name", "GVM Baby World");
  data.set("industry", "Ultrasound");
  data.set("employees", "1–5");
  data.set("locations", "1");
  data.set("current_software", "Picktime");
  data.set("monthly_appointments", "80");
  data.set("pain_point", "Front desk");
  data.set("email", "owner@example.com");
  data.set("phone", "555-0100");
  data.set("notes", "Design partner");
  for (const [key, value] of Object.entries(overrides)) {
    data.set(key, value);
  }
  return data;
}

function mockInsertResult(result: {
  data: { id: string } | null;
  error: { message: string; code?: string } | null;
}) {
  insert.mockReturnValue({
    select: () => ({
      single: async () => result,
    }),
  });
  createServiceClient.mockReturnValue({
    from: (table: string) => {
      expect(table).toBe(DESIGN_PARTNER_APPLICATIONS_TABLE);
      return { insert };
    },
  });
}

describe("isDesignPartnerApplicationsTableMissing", () => {
  it("allows fallback only for the missing design_partner_applications table", () => {
    expect(
      isDesignPartnerApplicationsTableMissing({
        code: "42P01",
        message: 'relation "design_partner_applications" does not exist',
      }),
    ).toBe(true);
    expect(
      isDesignPartnerApplicationsTableMissing({
        code: "PGRST205",
        message:
          "Could not find the table 'public.design_partner_applications' in the schema cache",
      }),
    ).toBe(true);
  });

  it("rejects missing-column, permission, and generic failures", () => {
    expect(
      isDesignPartnerApplicationsTableMissing({
        code: "42703",
        message:
          'column "x" of relation "design_partner_applications" does not exist',
      }),
    ).toBe(false);
    expect(
      isDesignPartnerApplicationsTableMissing({
        code: "42501",
        message: "permission denied for table design_partner_applications",
      }),
    ).toBe(false);
    expect(
      isDesignPartnerApplicationsTableMissing(new Error("fetch failed")),
    ).toBe(false);
    expect(
      isDesignPartnerApplicationsTableMissing({
        code: "42P01",
        message: 'relation "businesses" does not exist',
      }),
    ).toBe(false);
  });
});

describe("parseDesignPartnerApplication", () => {
  it("maps actual form fields and rejects incomplete submissions", () => {
    const parsed = parseDesignPartnerApplication(validForm());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.businessName).toBe("GVM Baby World");
    expect(parsed.value.email).toBe("owner@example.com");
    expect(
      parseDesignPartnerApplication(validForm({ business_name: "" })).ok,
    ).toBe(false);
    expect(parseDesignPartnerApplication(validForm({ email: "nope" })).ok).toBe(
      false,
    );
  });

  it("does not invent contact_name", () => {
    const row = toDesignPartnerApplicationRow({
      businessName: "A",
      industry: "B",
      employees: "1",
      locations: "1",
      currentSoftware: "X",
      monthlyAppointments: "10",
      painPoint: "Y",
      email: "a@b.c",
      phone: "",
      notes: "",
    });
    expect(row).not.toHaveProperty("contact_name");
    expect(row.contact_email).toBe("a@b.c");
    expect(row.contact_phone).toBeNull();
    expect(row.requested_plan_key).toBeNull();
    expect(row.status).toBe("received");
    expect(row.source).toBe("apply");
  });
});

describe("submitDesignPartnerApplication", () => {
  beforeEach(() => {
    insert.mockReset();
    createServiceClient.mockReset();
    emailsSend.mockReset();
    loggerInfo.mockReset();
    loggerError.mockReset();
    emailsSend.mockResolvedValue({ error: null });
    mockInsertResult({ data: { id: "app-1" }, error: null });
  });

  it("persists a valid application through the service client", async () => {
    const result = await submitDesignPartnerApplication({}, validForm());
    expect(result).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledTimes(1);
    const payload = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.business_name).toBe("GVM Baby World");
    expect(payload.industry).toBe("Ultrasound");
    expect(payload.employees).toBe("1–5");
    expect(payload.locations).toBe("1");
    expect(payload.current_software).toBe("Picktime");
    expect(payload.monthly_appointments).toBe("80");
    expect(payload.pain_point).toBe("Front desk");
    expect(payload.contact_email).toBe("owner@example.com");
    expect(payload.contact_phone).toBe("555-0100");
    expect(payload.notes).toBe("Design partner");
    expect(payload).not.toHaveProperty("contact_name");
  });

  it("does not persist an invalid application and does not email", async () => {
    const result = await submitDesignPartnerApplication(
      {},
      validForm({ email: "" }),
    );
    expect(result.error).toMatch(/required/i);
    expect(insert).not.toHaveBeenCalled();
    expect(emailsSend).not.toHaveBeenCalled();
  });

  it("still executes the email path after a successful persist", async () => {
    await submitDesignPartnerApplication({}, validForm());
    expect(emailsSend).toHaveBeenCalledTimes(1);
    const sent = emailsSend.mock.calls[0]?.[0] as { subject: string; to: string[] };
    expect(sent.to).toEqual(["sales@chasum.app"]);
    expect(sent.subject).toMatch(/GVM Baby World/);
  });

  it("keeps a persisted application when notification email fails", async () => {
    emailsSend.mockRejectedValue(new Error("Resend down"));
    const result = await submitDesignPartnerApplication({}, validForm());
    expect(result).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      "design-partner",
      "email send failed",
      expect.objectContaining({ error: "Resend down" }),
    );
  });

  it("does not claim email success in logs when send reports an error", async () => {
    emailsSend.mockResolvedValue({ error: { message: "rejected" } });
    const result = await submitDesignPartnerApplication({}, validForm());
    expect(result).toEqual({ ok: true });
    expect(loggerError).toHaveBeenCalledWith(
      "design-partner",
      "email send failed",
      expect.objectContaining({ error: "rejected" }),
    );
    expect(loggerInfo.mock.calls.some((c) => c[1] === "email sent")).toBe(
      false,
    );
  });

  it("does not persist when insert fails for a non-schema reason", async () => {
    mockInsertResult({
      data: null,
      error: { message: "write failed" },
    });
    const result = await submitDesignPartnerApplication({}, validForm());
    expect(result.error).toMatch(/could not be saved/i);
    expect(emailsSend).not.toHaveBeenCalled();
  });

  it("falls back to email/log when 037 is unapplied so /apply is not lost", async () => {
    mockInsertResult({
      data: null,
      error: {
        code: "42P01",
        message: 'relation "design_partner_applications" does not exist',
      },
    });
    const result = await submitDesignPartnerApplication({}, validForm());
    expect(result).toEqual({ ok: true });
    expect(emailsSend).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      "design-partner",
      "037 unapplied — persist skipped",
      expect.anything(),
    );
  });

  it("does not treat a missing column as 037 unapplied", async () => {
    mockInsertResult({
      data: null,
      error: {
        code: "42703",
        message:
          'column "contact_name" of relation "design_partner_applications" does not exist',
      },
    });
    const result = await submitDesignPartnerApplication({}, validForm());
    expect(result.error).toMatch(/could not be saved/i);
    expect(emailsSend).not.toHaveBeenCalled();
  });

  it("does not treat permission errors as 037 unapplied", async () => {
    mockInsertResult({
      data: null,
      error: {
        code: "42501",
        message: "permission denied for table design_partner_applications",
      },
    });
    const result = await submitDesignPartnerApplication({}, validForm());
    expect(result.error).toMatch(/could not be saved/i);
    expect(emailsSend).not.toHaveBeenCalled();
  });

  it("does not treat generic/network failures as 037 unapplied", async () => {
    createServiceClient.mockImplementation(() => {
      throw new Error("fetch failed");
    });
    const result = await submitDesignPartnerApplication({}, validForm());
    expect(result.error).toMatch(/could not be saved/i);
    expect(emailsSend).not.toHaveBeenCalled();
  });
});

describe("design-partner provisioning isolation", () => {
  it("server action never creates auth, tenant, subscription, or Stripe objects", () => {
    const src = read("lib/actions/design-partner.ts");
    expect(src).not.toMatch(/auth\.admin/);
    expect(src).not.toMatch(/createUser/);
    expect(src).not.toMatch(/ensure_business_for_owner/);
    expect(src).not.toMatch(/getOrCreateBusiness/);
    expect(src).not.toMatch(/business_members/);
    expect(src).not.toMatch(/subscription_events/);
    expect(src).not.toMatch(/billing_invoices/);
    expect(src).not.toMatch(/offer_id/);
    expect(src).not.toMatch(/stripe/i);
    expect(src).toMatch(/createServiceClient/);
    expect(src).toMatch(/DESIGN_PARTNER_APPLICATIONS_TABLE/);
  });

  it("form does not collect contact_name", () => {
    const form = read("components/landing/design-partner-form.tsx");
    expect(form).not.toMatch(/contact_name/);
    expect(form).toMatch(/name="business_name"/);
    expect(form).toMatch(/name="email"/);
  });
});
