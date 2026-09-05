// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/env", () => ({ getResendApiKey: () => "synthetic-test-key", getTwilioConfig: () => ({ accountSid: "synthetic", authToken: "synthetic", phoneNumber: "+15555550100" }), isProductionRuntime: () => true }));
vi.mock("@/lib/communications/email-from", () => ({ resolveEmailFromAddress: () => ({ from: "sender@example.invalid" }), validateEmailFromAddress: () => null }));
import { sendEmail, resetEmailProvider } from "@/lib/integrations/providers/email";
import { sendSms, resetSmsProvider } from "@/lib/integrations/providers/sms";
const email = { to: "owned@example.invalid", subject: "Synthetic", html: "Synthetic", idempotencyKey: "synthetic-intent/1" };

describe("provider acceptance classification", () => {
  let request: ReturnType<typeof vi.fn>;
  beforeEach(() => { request = vi.fn(); vi.stubGlobal("fetch", request); resetEmailProvider(); resetSmsProvider(); });
  afterEach(() => vi.unstubAllGlobals());
  it("passes the durable attempt key to Resend", async () => {
    request.mockResolvedValue(new Response(JSON.stringify({ id: "synthetic-message" }), { status: 200 }));
    expect(await sendEmail(email)).toMatchObject({ success: true, messageId: "synthetic-message" });
    expect(request.mock.calls[0][1].headers["Idempotency-Key"]).toBe("synthetic-intent/1");
  });
  it.each([400, 401, 403, 422, 429])("HTTP %i is confirmed non-acceptance", async (status) => {
    request.mockResolvedValue(new Response(JSON.stringify({ message: "synthetic rejection" }), { status }));
    expect(await sendEmail(email)).toMatchObject({ success: false, retrySafe: true });
  });
  it.each([408, 409, 500, 502, 503])("HTTP %i must not authorize an automatic resend", async (status) => {
    request.mockResolvedValue(new Response(JSON.stringify({ message: "synthetic uncertainty" }), { status }));
    expect(await sendEmail(email)).toMatchObject({ success: false, retrySafe: false });
  });
  it("network exception is ambiguous", async () => {
    request.mockRejectedValue(Error("network reset after sending"));
    expect(await sendEmail(email)).toMatchObject({ success: false, retrySafe: false });
  });
  it.each(["invalid JSON", "{}"])("unusable success response %s is ambiguous", async (body) => {
    request.mockResolvedValue(new Response(body, { status: 200 }));
    expect(await sendEmail(email)).toMatchObject({ success: false, retrySafe: false });
  });
  it("SMS timeout is ambiguous; no unsupported idempotency header is invented", async () => {
    request.mockRejectedValue(Error("timeout"));
    expect(await sendSms({ to: "+15555550101", body: "Synthetic" })).toMatchObject({ success: false, retrySafe: false });
    expect(request.mock.calls[0][1].headers).not.toHaveProperty("Idempotency-Key");
  });
});
