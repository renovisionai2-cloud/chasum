import { beforeEach, describe, expect, it, vi } from "vitest";
import { APPLY_DELIVERY_ERROR } from "@/lib/marketing/apply-validation";

const { sendMock, getResendApiKeyMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  getResendApiKeyMock: vi.fn(),
}));

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    getResendApiKey: getResendApiKeyMock,
  };
});

vi.mock("resend", () => ({
  Resend: class Resend {
    emails = { send: sendMock };
  },
}));

import { submitDesignPartnerApplication } from "@/lib/actions/design-partner";

function filledForm(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("business_name", "Northshore Clinic");
  formData.set("industry", "Hair Salon");
  formData.set("employees", "6–20");
  formData.set("locations", "2");
  formData.set("current_software", "Fresha");
  formData.set("monthly_activity", "120 visits");
  formData.set("pain_point", "Scheduling and payments");
  formData.set("email", "owner@example.com");
  formData.set("phone", "");
  formData.set("notes", "");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("design-partner lead delivery", () => {
  beforeEach(() => {
    sendMock.mockReset();
    getResendApiKeyMock.mockReset();
    getResendApiKeyMock.mockReturnValue("re_test_key");
  });

  it("returns ok only when Resend accepts the email", async () => {
    sendMock.mockResolvedValue({
      data: { id: "msg_accepted" },
      error: null,
      headers: null,
    });

    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ preferred_plan: "professional" }),
    );

    expect(state).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledOnce();
    const payload = sendMock.mock.calls[0]?.[0] as {
      to: string[];
      replyTo: string;
      text: string;
    };
    expect(payload.to).toEqual(["sales@chasumai.com"]);
    expect(payload.replyTo).toBe("owner@example.com");
    expect(payload.text).toContain("Interested plan: professional");
  });

  it("returns a retry error when RESEND_API_KEY is missing", async () => {
    getResendApiKeyMock.mockReturnValue(null);

    const state = await submitDesignPartnerApplication({}, filledForm());

    expect(state).toEqual({ error: APPLY_DELIVERY_ERROR });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns a retry error when Resend throws", async () => {
    sendMock.mockRejectedValue(new Error("network down"));

    const state = await submitDesignPartnerApplication({}, filledForm());

    expect(state).toEqual({ error: APPLY_DELIVERY_ERROR });
  });

  it("returns a retry error when Resend returns a provider error", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: {
        message: "Invalid from address",
        name: "invalid_from_address",
        statusCode: 403,
      },
      headers: null,
    });

    const state = await submitDesignPartnerApplication({}, filledForm());

    expect(state).toEqual({ error: APPLY_DELIVERY_ERROR });
  });

  it("returns a retry error when Resend omits an email id", async () => {
    sendMock.mockResolvedValue({
      data: {},
      error: null,
      headers: null,
    });

    const state = await submitDesignPartnerApplication({}, filledForm());

    expect(state).toEqual({ error: APPLY_DELIVERY_ERROR });
  });

  it("includes business preferred_plan in the lead email", async () => {
    sendMock.mockResolvedValue({
      data: { id: "msg_business" },
      error: null,
      headers: null,
    });

    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ preferred_plan: "business" }),
    );

    expect(state).toEqual({ ok: true });
    const payload = sendMock.mock.calls[0]?.[0] as { text: string };
    expect(payload.text).toContain("Interested plan: business");
  });
});
