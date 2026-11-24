// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BROWSER_CLOSE_TIMEOUT_MS, HTTP_SERVER_CLOSE_TIMEOUT_MS, TEARDOWN_HOOK_TIMEOUT_MS,
  closeFixtureResources, MissingFixtureResourceError, ResourceCloseTimeoutError,
  type CloseComponent, type CloseDiagnostic, type CloseEvent, type FixtureResources,
} from "./n02-payment-teardown";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  try { expect(vi.getTimerCount()).toBe(0); }
  finally { vi.useRealTimers(); }
});

const components = ["CHROMIUM", "WEBKIT", "HTTP_SERVER"] as const;
function fixture() {
  const close = {
    CHROMIUM: vi.fn(async () => {}),
    WEBKIT: vi.fn(async () => {}),
    HTTP_SERVER: vi.fn(async () => {}),
  };
  const resources: FixtureResources = {
    CHROMIUM: { close: close.CHROMIUM },
    WEBKIT: { close: close.WEBKIT },
    HTTP_SERVER: { close: close.HTTP_SERVER },
  };
  const events: Array<{ event: CloseEvent; detail: CloseDiagnostic }> = [];
  return { close, resources, events, emit: (event: CloseEvent, detail: CloseDiagnostic) => {
    events.push({ event, detail });
  } };
}
function cleanup(f: ReturnType<typeof fixture>) {
  return closeFixtureResources({
    resources: f.resources, emit: f.emit, browserTimeoutMs: 20, httpServerTimeoutMs: 10,
  });
}
function expectError(f: ReturnType<typeof fixture>, component: CloseComponent, reason: CloseDiagnostic["reason"]) {
  expect(f.events).toContainEqual({
    event: `${component}_CLOSE_ERROR`,
    detail: expect.objectContaining({ component, reason, terminationConfirmed: false }),
  });
  expect(f.events.some(({ event }) => event === `${component}_CLOSE_COMPLETE`)).toBe(false);
}

describe("N02 fixture teardown", () => {
  it("accounts for both successful browser closes and HTTP server closure", async () => {
    const f = fixture();
    await cleanup(f);
    for (const component of components) expect(f.close[component]).toHaveBeenCalledOnce();
    expect(f.events.map(({ event }) => event)).toEqual([
      "CHROMIUM_CLOSE_BEGIN", "WEBKIT_CLOSE_BEGIN",
      "CHROMIUM_CLOSE_COMPLETE", "WEBKIT_CLOSE_COMPLETE",
      "HTTP_SERVER_CLOSE_BEGIN", "HTTP_SERVER_CLOSE_COMPLETE",
    ]);
    for (const { detail } of f.events.filter(({ event }) => event.endsWith("_COMPLETE"))) {
      expect(detail).toMatchObject({ status: "completed", durationMs: expect.any(Number) });
      expect(detail).not.toHaveProperty("terminationConfirmed", true);
    }
  });

  it.each(components)("%s rejection fails and HTTP cleanup is still attempted", async (component) => {
    const f = fixture(), reason = new Error("synthetic close rejection");
    f.close[component].mockRejectedValue(reason);
    await expect(cleanup(f)).rejects.toMatchObject({
      errors: [expect.objectContaining({ cause: reason, message: expect.stringContaining(component) })],
    });
    expect(f.close.HTTP_SERVER).toHaveBeenCalledOnce();
    expectError(f, component, "REJECTED");
    expect(f.events.find(({ event }) => event === `${component}_CLOSE_ERROR`)?.detail.status).toBe("rejected");
  });

  it.each(components)("%s timeout fails and HTTP cleanup is still attempted", async (component) => {
    const f = fixture();
    f.close[component].mockImplementation(() => new Promise<void>(() => {}));
    const failed = expect(cleanup(f)).rejects.toMatchObject({
      errors: [expect.objectContaining({
        name: "ResourceCloseTimeoutError", component,
        timeoutMs: component === "HTTP_SERVER" ? 10 : 20,
      })],
    });
    await vi.advanceTimersByTimeAsync(20);
    await failed;
    expect(f.close.HTTP_SERVER).toHaveBeenCalledOnce();
    expectError(f, component, "TIMEOUT");
    expect(f.events.find(({ event }) => event === `${component}_CLOSE_ERROR`)?.detail).toMatchObject({
      status: "timed_out", message: expect.stringContaining("termination is unconfirmed"),
    });
  });

  it.each([undefined, null, false, 0, ""])("never treats rejection %s as success", async (reason) => {
    const f = fixture();
    f.close.WEBKIT.mockRejectedValue(reason);
    await expect(cleanup(f)).rejects.toMatchObject({
      errors: [expect.objectContaining({ cause: reason, message: expect.stringContaining("WEBKIT") })],
    });
    expectError(f, "WEBKIT", "REJECTED");
    expect(f.close.HTTP_SERVER).toHaveBeenCalledOnce();
  });

  it.each(components)("captures a synchronous %s throw without skipping other cleanup", async (component) => {
    const f = fixture();
    f.close[component].mockImplementation(() => { throw undefined; });
    await expect(cleanup(f)).rejects.toMatchObject({
      errors: [expect.objectContaining({ cause: undefined, message: expect.stringContaining(component) })],
    });
    for (const name of components) expect(f.close[name]).toHaveBeenCalledOnce();
    expectError(f, component, "REJECTED");
  });

  it("starts both browser closes concurrently and waits for both before HTTP", async () => {
    const f = fixture();
    let finishChromium!: () => void, finishWebkit!: () => void;
    f.close.CHROMIUM.mockImplementation(() => new Promise<void>(resolve => { finishChromium = resolve; }));
    f.close.WEBKIT.mockImplementation(() => new Promise<void>(resolve => { finishWebkit = resolve; }));
    const done = cleanup(f);
    await vi.advanceTimersByTimeAsync(0);
    expect(f.close.CHROMIUM).toHaveBeenCalledOnce();
    expect(f.close.WEBKIT).toHaveBeenCalledOnce();
    expect(f.close.HTTP_SERVER).not.toHaveBeenCalled();
    finishWebkit();
    await vi.advanceTimersByTimeAsync(0);
    expect(f.close.HTTP_SERVER).not.toHaveBeenCalled();
    finishChromium();
    await done;
    expect(f.close.HTTP_SERVER).toHaveBeenCalledOnce();
  });

  it("bounds both stalled browsers at 30s together, then HTTP at 10s, within the 45s hook", async () => {
    const f = fixture();
    for (const component of components) f.close[component].mockImplementation(() => new Promise<void>(() => {}));
    const failed = expect(closeFixtureResources({ resources: f.resources, emit: f.emit })).rejects.toMatchObject({
      errors: [
        expect.objectContaining({ component: "CHROMIUM", timeoutMs: 30_000 }),
        expect.objectContaining({ component: "WEBKIT", timeoutMs: 30_000 }),
        expect.objectContaining({ component: "HTTP_SERVER", timeoutMs: 10_000 }),
      ],
    });
    await vi.advanceTimersByTimeAsync(29_999);
    expect(f.close.HTTP_SERVER).not.toHaveBeenCalled();
    expect(f.events.filter(({ event }) => event.endsWith("_ERROR"))).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(f.close.HTTP_SERVER).toHaveBeenCalledOnce();
    expect(f.events.filter(({ event }) => event.endsWith("_ERROR"))).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(f.events.some(({ event }) => event === "HTTP_SERVER_CLOSE_ERROR")).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await failed;
    expect(BROWSER_CLOSE_TIMEOUT_MS).toBe(30_000);
    expect(HTTP_SERVER_CLOSE_TIMEOUT_MS).toBe(10_000);
    expect(TEARDOWN_HOOK_TIMEOUT_MS).toBe(45_000);
    for (const component of components) expectError(f, component, "TIMEOUT");
  });

  it.each(components.flatMap(component => (["resolve", "reject"] as const).map(settlement => ({ component, settlement }))))(
    "handles late $component $settlement without an unhandled rejection or false completion",
    async ({ component, settlement }) => {
      const f = fixture(), unhandled = vi.fn();
      let resolveLate!: () => void, rejectLate!: (reason: unknown) => void;
      f.close[component].mockImplementation(() => new Promise<void>((resolve, reject) => {
        resolveLate = resolve; rejectLate = reject;
      }));
      process.on("unhandledRejection", unhandled);
      try {
        const failed = expect(cleanup(f)).rejects.toMatchObject({ errors: [expect.any(ResourceCloseTimeoutError)] });
        await vi.advanceTimersByTimeAsync(20);
        await failed;
        const eventsAtTimeout = [...f.events];
        if (settlement === "reject") rejectLate(undefined); else resolveLate();
        await vi.advanceTimersByTimeAsync(0);
        expect(unhandled).not.toHaveBeenCalled();
        expect(f.events).toEqual(eventsAtTimeout);
        expectError(f, component, "TIMEOUT");
      } finally { process.off("unhandledRejection", unhandled); }
    },
  );

  it.each(components)("fails missing %s explicitly and closes every initialized resource", async (component) => {
    const f = fixture();
    f.resources[component] = undefined;
    await expect(cleanup(f)).rejects.toMatchObject({
      errors: [expect.objectContaining({ cause: expect.any(MissingFixtureResourceError) })],
    });
    expectError(f, component, "MISSING_RESOURCE");
    for (const name of components) {
      if (name === component) expect(f.close[name]).not.toHaveBeenCalled();
      else expect(f.close[name]).toHaveBeenCalledOnce();
    }
  });

  it("reports every missing resource after wholly failed setup", async () => {
    const f = fixture();
    f.resources = { CHROMIUM: undefined, WEBKIT: null, HTTP_SERVER: undefined };
    await expect(cleanup(f)).rejects.toMatchObject({ errors: [
      expect.objectContaining({ cause: expect.objectContaining({ component: "CHROMIUM" }) }),
      expect.objectContaining({ cause: expect.objectContaining({ component: "WEBKIT" }) }),
      expect.objectContaining({ cause: expect.objectContaining({ component: "HTTP_SERVER" }) }),
    ] });
    for (const component of components) expectError(f, component, "MISSING_RESOURCE");
  });

  it("fails a partially initialized resource lacking close and still closes HTTP", async () => {
    const f = fixture();
    f.resources.WEBKIT = {} as NonNullable<FixtureResources["WEBKIT"]>;
    await expect(cleanup(f)).rejects.toThrow(AggregateError);
    expectError(f, "WEBKIT", "MISSING_RESOURCE");
    expect(f.close.HTTP_SERVER).toHaveBeenCalledOnce();
  });

  it.each([false, true])("a throwing diagnostic sink cannot alter cleanup (failed=%s)", async (failed) => {
    const f = fixture();
    f.emit = () => { throw new Error("synthetic diagnostic failure"); };
    if (failed) f.close.WEBKIT.mockRejectedValue(undefined);
    if (failed) await expect(cleanup(f)).rejects.toMatchObject({ errors: [expect.objectContaining({ cause: undefined })] });
    else await expect(cleanup(f)).resolves.toBeUndefined();
    expect(f.close.HTTP_SERVER).toHaveBeenCalledOnce();
  });

  it("preserves an unprintable rejection without skipping HTTP", async () => {
    const f = fixture();
    const reason = { toString() { throw new Error("cannot format"); } };
    f.close.WEBKIT.mockRejectedValue(reason);
    await expect(cleanup(f)).rejects.toMatchObject({ errors: [expect.objectContaining({ cause: reason })] });
    expectError(f, "WEBKIT", "REJECTED");
    expect(f.close.HTTP_SERVER).toHaveBeenCalledOnce();
  });
});
