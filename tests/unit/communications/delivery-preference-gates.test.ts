// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadBusiness = vi.fn();
const loadCustomer = vi.fn();
const channelAllowed = vi.fn();

vi.mock("@/lib/communications/preferences", () => ({
  channelAllowed: (...args: unknown[]) => channelAllowed(...args),
  loadBusinessCommPreferences: (...args: unknown[]) => loadBusiness(...args),
  loadCustomerCommPreferences: (...args: unknown[]) => loadCustomer(...args),
}));
vi.mock("@/lib/communications/providers", () => ({
  providerSendEmail: vi.fn(async () => ({
    success: true,
    provider: "stub",
    messageId: "msg",
  })),
  providerSendSms: vi.fn(async () => ({
    success: true,
    provider: "stub",
    messageId: "sms",
  })),
}));
vi.mock("@/lib/communications/templates", () => ({
  renderEmailTemplate: () => ({
    key: "custom",
    subject: "Synthetic",
    text: "Synthetic",
    html: "<p>Synthetic</p>",
  }),
  renderSmsTemplate: () => ({ key: "custom", text: "Synthetic" }),
}));
vi.mock("@/lib/communications/tenant-email-branding", () => ({
  loadTenantEmailBranding: async () => ({
    businessName: "Fictional",
    fromHeader: "sender@example.invalid",
  }),
  toBrandingContext: () => ({}),
  formatFromHeader: () => "sender@example.invalid",
}));
vi.mock("@/lib/communications/email-from", () => ({
  resolveEmailFromAddress: () => ({ from: "sender@example.invalid" }),
}));
vi.mock("@/lib/communications/timeline", () => ({
  appendCrmTimeline: vi.fn(),
  writeCommsAudit: vi.fn(),
}));
vi.mock("@/lib/observability/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: () => ({ insert: async () => ({ error: null }) }) }),
}));

import { sendEmail } from "@/lib/communications/delivery";
import { providerSendEmail } from "@/lib/communications/providers";
import type { CommunicationsPreferences } from "@/lib/communications/types";

const businessOn: CommunicationsPreferences = {
  businessId: "biz",
  emailEnabled: true,
  smsEnabled: true,
  marketingEmailEnabled: true,
  reminderHoursBefore: 24,
  notificationEmail: null,
  quietHoursStart: null,
  quietHoursEnd: null,
  optOutFooter: null,
};

const context = {
  businessId: "biz",
  businessName: "Fictional",
  customerName: "Synthetic",
  staffName: "Synthetic",
  serviceName: "Synthetic",
  startTime: "2026-09-01T00:00:00Z",
};

function smsPreferredCustomer() {
  return {
    customerId: "cust-1",
    preferredMethod: "sms",
    email: false,
    sms: true,
    marketing: false,
  };
}

describe("delivery preference and marketing gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadBusiness.mockResolvedValue(businessOn);
    loadCustomer.mockResolvedValue(smsPreferredCustomer());
    channelAllowed.mockImplementation(
      (input: {
        channel: "email" | "sms";
        customer?: { email: boolean; sms: boolean; marketing: boolean };
        marketing?: boolean;
      }) => {
        if (input.marketing) {
          if (!businessOn.marketingEmailEnabled) return false;
          if (!input.customer?.marketing) return false;
        }
        if (input.customer && input.channel === "email" && !input.customer.email) {
          return false;
        }
        return true;
      },
    );
  });

  it("suppresses customer confirmation email when preferred=sms but not business/staff", async () => {
    const confirmation = await sendEmail({
      businessId: "biz",
      to: "owned@example.invalid",
      templateKey: "appointment.confirmation",
      context,
      customerId: "cust-1",
    });
    expect(confirmation).toMatchObject({ ok: false, skipped: true });
    expect(providerSendEmail).not.toHaveBeenCalled();

    const business = await sendEmail({
      businessId: "biz",
      to: "owner@example.invalid",
      templateKey: "appointment.business",
      context,
      customerId: "cust-1",
      skipPreferenceCheck: true,
    });
    const staff = await sendEmail({
      businessId: "biz",
      to: "staff@example.invalid",
      templateKey: "appointment.staff",
      context,
      customerId: "cust-1",
      skipPreferenceCheck: true,
    });
    expect(business.ok).toBe(true);
    expect(staff.ok).toBe(true);
    expect(providerSendEmail).toHaveBeenCalledTimes(2);
  });

  it("blocks marketing.* even when skipPreferenceCheck=true and consent is false", async () => {
    loadCustomer.mockResolvedValue({
      ...smsPreferredCustomer(),
      marketing: false,
      email: true,
    });
    const result = await sendEmail({
      businessId: "biz",
      to: "owned@example.invalid",
      templateKey: "marketing.campaign",
      context,
      customerId: "cust-1",
      skipPreferenceCheck: true,
    });
    expect(result).toMatchObject({
      ok: false,
      skipped: true,
      error: "Marketing disabled by consent.",
    });
    expect(providerSendEmail).not.toHaveBeenCalled();
  });

  it("blocks marketing.* when skipPreferenceCheck=true and customer is missing", async () => {
    const result = await sendEmail({
      businessId: "biz",
      to: "owned@example.invalid",
      templateKey: "marketing.campaign",
      context,
      skipPreferenceCheck: true,
    });
    expect(result).toMatchObject({ ok: false, skipped: true });
    expect(providerSendEmail).not.toHaveBeenCalled();
  });

  it("blocks marketing.* when business marketing is disabled", async () => {
    loadBusiness.mockResolvedValue({ ...businessOn, marketingEmailEnabled: false });
    loadCustomer.mockResolvedValue({
      ...smsPreferredCustomer(),
      marketing: true,
      email: true,
    });
    const result = await sendEmail({
      businessId: "biz",
      to: "owned@example.invalid",
      templateKey: "marketing.campaign",
      context,
      customerId: "cust-1",
      skipPreferenceCheck: true,
    });
    expect(result).toMatchObject({ ok: false, skipped: true });
    expect(providerSendEmail).not.toHaveBeenCalled();
  });

  it("allows marketing.* only when skipPreferenceCheck, consent, and business marketing are all true", async () => {
    loadCustomer.mockResolvedValue({
      customerId: "cust-1",
      preferredMethod: "any",
      email: true,
      sms: true,
      marketing: true,
    });
    const result = await sendEmail({
      businessId: "biz",
      to: "owned@example.invalid",
      templateKey: "marketing.campaign",
      context,
      customerId: "cust-1",
      skipPreferenceCheck: true,
    });
    expect(result.ok).toBe(true);
    expect(providerSendEmail).toHaveBeenCalledTimes(1);
  });
});
