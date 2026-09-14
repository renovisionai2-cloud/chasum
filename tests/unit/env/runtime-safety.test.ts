// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRuntimeEnvironment, isProductionRuntime, requiresHostedSafetyGuards } from "@/lib/env";
import { getEmailProvider, resetEmailProvider, sendEmail } from "@/lib/integrations/providers/email";
import { getSmsProvider, resetSmsProvider, sendSms } from "@/lib/integrations/providers/sms";

const cases = [
  ["production", "production", "production", true],
  ["preview", "production", "preview", true],
  ["development", "production", "development", false],
  [undefined, "production", "production", true],
  [undefined, "development", "development", false],
  [undefined, "test", "development", false],
  ["unexpected", "development", "unknown", true],
  ["", "development", "unknown", true],
] as const;

beforeEach(() => {
  for (const name of ["RESEND_API_KEY", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]) vi.stubEnv(name, undefined);
  resetEmailProvider(); resetSmsProvider();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request"); }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); resetEmailProvider(); resetSmsProvider(); });

describe.each(cases)("VERCEL_ENV=%s NODE_ENV=%s", (vercel, node, identity, guarded) => {
  beforeEach(() => { vi.stubEnv("VERCEL_ENV", vercel); vi.stubEnv("NODE_ENV", node); });
  it("reports deployment identity independently of safeguards", () => {
    expect(getRuntimeEnvironment()).toBe(identity);
    expect(isProductionRuntime()).toBe(identity === "production");
    expect(requiresHostedSafetyGuards()).toBe(guarded);
  });
  it("preserves missing-email provider semantics", async () => {
    expect(getEmailProvider().name).toBe(guarded ? "disabled" : "console");
    const result = await sendEmail({ to: "test@example.invalid", subject: "Synthetic", html: "Synthetic" });
    expect(result.success).toBe(!guarded);
    if (guarded) expect(result.messageId).toBeUndefined();
    else expect(result.messageId).toMatch(/^console-/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("preserves missing-SMS provider semantics", async () => {
    expect(getSmsProvider().name).toBe(guarded ? "disabled" : "console");
    const result = await sendSms({ to: "+15555550100", body: "Synthetic" });
    expect(result.success).toBe(!guarded);
    if (guarded) { expect(result.skipped).toBe(true); expect(result.messageId).toBeUndefined(); }
    else expect(result.messageId).toMatch(/^console-sms-/);
    expect(fetch).not.toHaveBeenCalled();
  });
});

it("selects configured real providers on Preview without sending", () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("RESEND_API_KEY", "synthetic-key");
  vi.stubEnv("TWILIO_ACCOUNT_SID", "synthetic-sid");
  vi.stubEnv("TWILIO_AUTH_TOKEN", "synthetic-token");
  vi.stubEnv("TWILIO_PHONE_NUMBER", "+15555550100");
  expect(getEmailProvider().name).toBe("resend");
  expect(getSmsProvider().name).toBe("twilio");
  expect(fetch).not.toHaveBeenCalled();
});
