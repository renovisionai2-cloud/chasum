// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { Client, type ClientOptions, type Envelope, type Event, type Integration } from "@sentry/core";

const sdk = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ init: sdk.init }));
const secret = "private.customer@example.com customer/provider free text";
const referenceId = "CHS-ERR-ABCDEF0123456789ABCD";

async function configured() {
  vi.resetModules();
  vi.stubEnv("SENTRY_DSN", "https://public@example.invalid/1");
  const { initSentry } = await import("@/lib/observability/sentry");
  initSentry("nodejs");
  return sdk.init.mock.calls.at(-1)![0] as ClientOptions;
}

function unsafeEvent(): Event {
  return {
    event_id: "a".repeat(32), level: "error", environment: "production",
    release: "b".repeat(40), message: secret, logentry: { message: secret, params: [secret] },
    request: { url: "https://example.test/path?email=private@example.com&token=secret", headers: { authorization: secret, cookie: secret }, data: { password: secret }, query_string: secret },
    user: { email: secret, username: secret, ip_address: "127.0.0.1" },
    contexts: { customer: { name: secret, phone: secret } },
    breadcrumbs: [{ message: secret, data: { token: secret }, category: "http" }],
    extra: { domain: "booking", referenceId, businessId: "12345678-1234-1234-1234-123456789abc", route: "/book/[slug]?token=secret", method: "POST", runtime: "nodejs", attempt: 1, accepted: false, customerName: secret, customerEmail: secret, phone: secret, notes: secret, password: secret, token: secret, nested: { domain: secret }, status: secret },
    tags: { domain: secret, token: secret, referenceId: secret },
    exception: { values: [{ type: "TypeError", value: secret, mechanism: { type: secret, data: { secret } }, stacktrace: { frames: [{ filename: "https://example.test/_next/static/chunks/app.js?token=secret", lineno: 12, colno: 4, in_app: true, function: secret, vars: { secret }, context_line: secret, pre_context: [secret], post_context: [secret], abs_path: secret, module_metadata: { secret } }] } }] },
    transaction: secret, server_name: secret, fingerprint: [secret],
    debug_meta: { images: [{ type: "sourcemap", code_file: secret, debug_id: secret }] },
  };
}

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("configured Sentry outbound privacy", () => {
  it("wires beforeSend and preserves safe diagnostics, not raw SDK data", async () => {
    const options = await configured();
    const event = unsafeEvent();
    const hint = { attachments: [{ filename: "private.txt", data: secret }] };
    const safe = await options.beforeSend!({ ...event, type: undefined }, hint);
    expect(JSON.stringify(safe)).not.toMatch(/private|secret|customer\/provider|127\.0\.0\.1/);
    expect(safe?.extra).toEqual({ domain: "booking", referenceId, businessId: "12345678-1234-1234-1234-123456789abc", route: "/book/[slug]", method: "POST", runtime: "nodejs", attempt: 1, accepted: false });
    expect(safe?.tags).toEqual({ domain: "booking", referenceId });
    expect(safe?.exception?.values?.[0]).toEqual({ type: "TypeError", value: "Exception details withheld by Chasum privacy policy", stacktrace: { frames: [{ filename: "/_next/static/chunks/app.js", lineno: 12, colno: 4, in_app: true }] } });
    expect(hint.attachments).toEqual([]);
    for (const key of ["request", "user", "contexts", "breadcrumbs", "logentry", "transaction", "fingerprint", "debug_meta"]) expect(safe).not.toHaveProperty(key);
  });

  it.each([false, true])("protects actual SDK envelopes (internal SDK bypass=%s)", async (internal) => {
    const options = await configured();
    const envelopes: Envelope[] = [];
    const integrations = (options.integrations as (defaults: Integration[]) => Integration[])([]);
    const client = new Client({ ...options, integrations, stackParser: () => [], transport: () => ({ send: async (envelope) => { envelopes.push(envelope); return { statusCode: 200 }; }, flush: async () => true }) });
    client.init();
    client.captureEvent(unsafeEvent(), { data: internal ? { __sentry__: true } : {}, attachments: [{ filename: "private.txt", data: secret }] });
    await client.flush(1000);
    expect(envelopes).toHaveLength(1);
    expect(envelopes[0][1]).toHaveLength(1);
    expect(envelopes[0][1][0][0].type).toBe("event");
    expect(JSON.stringify(envelopes)).not.toMatch(/private|secret|customer\/provider|127\.0\.0\.1/);
    expect(JSON.stringify(envelopes)).toContain(referenceId);
    await client.close();
  });

  it("drops breadcrumbs, transactions, logs, metrics and session integrations", async () => {
    const options = await configured();
    expect(options.beforeBreadcrumb!({ message: secret })).toBeNull();
    expect(options.beforeSendTransaction!({ type: "transaction", transaction: secret }, {})).toBeNull();
    expect(options.enableLogs).toBe(false);
    expect(options.sendClientReports).toBe(false);
    const integrations = (options.integrations as (defaults: Integration[]) => Integration[])([ { name: "BrowserSession" }, { name: "ProcessSession" }, { name: "RequestSession" }, { name: "Http" }, { name: "Http.Server" }, { name: "GlobalHandlers" } ]);
    expect(integrations.map((i) => i.name)).toEqual(["GlobalHandlers", "ChasumOutboundPrivacy"]);
  });

  it("normalizes message-only events, malicious types, unknown paths and nested fields", async () => {
    const options = await configured();
    const safe = await options.beforeSend!({ type: undefined, message: secret, extra: { domain: { token: secret }, businessId: secret, referenceId: secret, route: "/customer/private@example.com" } }, {});
    expect(safe).toEqual({ type: undefined, platform: "javascript", message: "Chasum diagnostic event", extra: {}, tags: {} });
    const error = await options.beforeSend!({ type: undefined, exception: { values: [{ type: secret, value: secret, stacktrace: { frames: [{ filename: "/Users/customer-private/source.js", vars: { secret } }] } }] } }, {});
    expect(error?.exception?.values?.[0].type).toBe("Error");
    expect(error?.exception?.values?.[0].stacktrace?.frames).toEqual([{}]);
  });

  it("is a provider-off no-op and initializes only once after a DSN becomes available", async () => {
    vi.resetModules();
    vi.stubEnv("SENTRY_DSN", ""); vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    const { initSentry } = await import("@/lib/observability/sentry");
    initSentry("nodejs"); expect(sdk.init).not.toHaveBeenCalled();
    vi.stubEnv("SENTRY_DSN", "https://public@example.invalid/1");
    initSentry("nodejs"); initSentry("nodejs"); expect(sdk.init).toHaveBeenCalledTimes(1);
  });

  it("contains initialization failures and allows a later retry", async () => {
    vi.resetModules(); vi.stubEnv("SENTRY_DSN", "https://public@example.invalid/1");
    sdk.init.mockImplementationOnce(() => { throw new Error("init failed"); });
    const { initSentry } = await import("@/lib/observability/sentry");
    expect(() => initSentry("nodejs")).not.toThrow();
    initSentry("nodejs"); expect(sdk.init).toHaveBeenCalledTimes(2);
  });
});
