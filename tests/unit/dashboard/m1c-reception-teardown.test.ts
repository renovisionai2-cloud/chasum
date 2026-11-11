// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  closeFixtureResources,
  ResourceCloseTimeoutError,
  TEARDOWN_HOOK_TIMEOUT_MS,
  type CloseDiagnostic,
  type CloseEvent,
} from "./m1c-reception-teardown";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  try { expect(vi.getTimerCount()).toBe(0); }
  finally { vi.useRealTimers(); }
});

function diagnostics() {
  const events: Array<{ event: CloseEvent; detail: CloseDiagnostic }> = [];
  return {
    events,
    emit: (event: CloseEvent, detail: CloseDiagnostic) => {
      events.push({ event, detail });
    },
  };
}

describe("M1C fixture teardown", () => {
  it("accounts for every successful browser and Vite close", async () => {
    const observed = diagnostics();
    const chromiumClose = vi.fn(async () => {});
    const webkitClose = vi.fn(async () => {});
    const viteClose = vi.fn(async () => {});

    await closeFixtureResources({
      browsers: [
        { component: "CHROMIUM", close: chromiumClose },
        { component: "WEBKIT", close: webkitClose },
      ],
      vite: { component: "VITE", close: viteClose },
      emit: observed.emit,
      browserTimeoutMs: 100,
      viteTimeoutMs: 100,
    });

    expect(chromiumClose).toHaveBeenCalledOnce();
    expect(webkitClose).toHaveBeenCalledOnce();
    expect(viteClose).toHaveBeenCalledOnce();
    expect(observed.events.map(({ event }) => event)).toEqual([
      "CHROMIUM_CLOSE_BEGIN",
      "WEBKIT_CLOSE_BEGIN",
      "CHROMIUM_CLOSE_COMPLETE",
      "WEBKIT_CLOSE_COMPLETE",
      "VITE_CLOSE_BEGIN",
      "VITE_CLOSE_COMPLETE",
    ]);
    expect(observed.events.some(({ event }) => event.endsWith("_ERROR"))).toBe(false);
  });

  it("fails a timed-out browser, still closes Vite, and handles a later rejection", async () => {
    vi.useFakeTimers();
    const observed = diagnostics();
    let rejectLate: ((error: Error) => void) | undefined;
    const viteClose = vi.fn(async () => {});

    const cleanup = closeFixtureResources({
      browsers: [
        { component: "CHROMIUM", close: async () => {} },
        {
          component: "WEBKIT",
          close: () => new Promise<void>((_resolve, reject) => {
            rejectLate = reject;
          }),
        },
      ],
      vite: { component: "VITE", close: viteClose },
      emit: observed.emit,
      browserTimeoutMs: 20,
      viteTimeoutMs: 20,
    });
    const failed = expect(cleanup).rejects.toThrow("M1C fixture cleanup failed");

    await vi.advanceTimersByTimeAsync(20);
    await failed;

    expect(viteClose).toHaveBeenCalledOnce();
    expect(observed.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "WEBKIT_CLOSE_ERROR",
        detail: expect.objectContaining({
          reason: "TIMEOUT",
          timeoutMs: 20,
          message: expect.stringContaining("termination is unconfirmed"),
        }),
      }),
      expect.objectContaining({ event: "VITE_CLOSE_BEGIN" }),
      expect.objectContaining({ event: "VITE_CLOSE_COMPLETE" }),
    ]));
    expect(observed.events.some(({ event }) => event === "WEBKIT_CLOSE_COMPLETE")).toBe(false);

    rejectLate?.(new Error("late synthetic rejection"));
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports a rejected browser close and still attempts Vite cleanup", async () => {
    const observed = diagnostics();
    const viteClose = vi.fn(async () => {});

    await expect(closeFixtureResources({
      browsers: [
        { component: "CHROMIUM", close: async () => {} },
        { component: "WEBKIT", close: async () => {
          throw new Error("synthetic WebKit close rejection");
        } },
      ],
      vite: { component: "VITE", close: viteClose },
      emit: observed.emit,
      browserTimeoutMs: 100,
      viteTimeoutMs: 100,
    })).rejects.toThrow("M1C fixture cleanup failed");

    expect(viteClose).toHaveBeenCalledOnce();
    expect(observed.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "WEBKIT_CLOSE_ERROR",
        detail: expect.objectContaining({
          reason: "REJECTED",
          message: "synthetic WebKit close rejection",
        }),
      }),
      expect.objectContaining({ event: "VITE_CLOSE_COMPLETE" }),
    ]));
  });

  it.each([undefined, null, false, 0, ""])("never treats WebKit rejection %s as successful cleanup", async (reason) => {
    const observed = diagnostics();
    const viteClose = vi.fn(async () => {});
    const cleanup = closeFixtureResources({
      browsers: [
        { component: "CHROMIUM", close: async () => {} },
        { component: "WEBKIT", close: () => Promise.reject(reason) },
      ],
      vite: { component: "VITE", close: viteClose },
      emit: observed.emit,
    });
    await expect(cleanup).rejects.toMatchObject({
      errors: [expect.objectContaining({ message: expect.stringContaining("WEBKIT"), cause: reason })],
    });
    expect(viteClose).toHaveBeenCalledOnce();
    expect(observed.events).toContainEqual(expect.objectContaining({
      event: "WEBKIT_CLOSE_ERROR", detail: expect.objectContaining({ status: "rejected", reason: "REJECTED" }),
    }));
    expect(observed.events.some(({ event }) => event === "WEBKIT_CLOSE_COMPLETE")).toBe(false);
  });

  it("propagates Vite rejection with undefined", async () => {
    const observed = diagnostics();
    await expect(closeFixtureResources({
      browsers: [{ component: "CHROMIUM", close: async () => {} }, { component: "WEBKIT", close: async () => {} }],
      vite: { component: "VITE", close: () => Promise.reject(undefined) },
      emit: observed.emit,
    })).rejects.toMatchObject({ errors: [expect.objectContaining({ message: expect.stringContaining("VITE"), cause: undefined })] });
    expect(observed.events.some(({ event }) => event === "VITE_CLOSE_COMPLETE")).toBe(false);
  });

  it.each([undefined, null, new Error("synchronous close failure")])("accounts for a synchronous browser throw %s and still closes Vite", async (reason) => {
    const viteClose = vi.fn(async () => {});
    await expect(closeFixtureResources({
      browsers: [{ component: "WEBKIT", close() { throw reason; } }],
      vite: { component: "VITE", close: viteClose }, emit: diagnostics().emit,
    })).rejects.toMatchObject({ errors: [expect.objectContaining({ message: expect.stringContaining("WEBKIT"), cause: reason })] });
    expect(viteClose).toHaveBeenCalledOnce();
  });

  it("accounts for a synchronous Vite throw", async () => {
    await expect(closeFixtureResources({
      browsers: [], vite: { component: "VITE", close() { throw undefined; } }, emit: diagnostics().emit,
    })).rejects.toMatchObject({ errors: [expect.objectContaining({ message: expect.stringContaining("VITE"), cause: undefined })] });
  });

  it("starts both browser closes concurrently and waits for both before Vite", async () => {
    let finishChromium!: () => void, finishWebkit!: () => void;
    const chromiumClose = vi.fn(() => new Promise<void>(resolve => { finishChromium = resolve; }));
    const webkitClose = vi.fn(() => new Promise<void>(resolve => { finishWebkit = resolve; }));
    const viteClose = vi.fn(async () => {});
    const cleanup = closeFixtureResources({
      browsers: [{ component: "CHROMIUM", close: chromiumClose }, { component: "WEBKIT", close: webkitClose }],
      vite: { component: "VITE", close: viteClose }, emit: diagnostics().emit,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(chromiumClose).toHaveBeenCalledOnce(); expect(webkitClose).toHaveBeenCalledOnce();
    expect(viteClose).not.toHaveBeenCalled();
    finishWebkit(); await vi.advanceTimersByTimeAsync(0);
    expect(viteClose).not.toHaveBeenCalled();
    finishChromium(); await cleanup;
    expect(viteClose).toHaveBeenCalledOnce();
  });

  it("retains each browser and Vite failure independently in AggregateError", async () => {
    const observed = diagnostics();
    const viteReason = new Error("Vite rejected");
    const cleanup = closeFixtureResources({
      browsers: [
        { component: "CHROMIUM", close: () => Promise.reject(undefined) },
        { component: "WEBKIT", close: () => Promise.reject(null) },
      ],
      vite: { component: "VITE", close: () => Promise.reject(viteReason) }, emit: observed.emit,
    });
    await expect(cleanup).rejects.toMatchObject({ errors: [
      expect.objectContaining({ message: expect.stringContaining("CHROMIUM"), cause: undefined }),
      expect.objectContaining({ message: expect.stringContaining("WEBKIT"), cause: null }),
      expect.objectContaining({ message: expect.stringContaining("VITE"), cause: viteReason }),
    ] });
    expect(observed.events.filter(({ event }) => event.endsWith("_ERROR"))).toHaveLength(3);
    expect(observed.events.some(({ event }) => event.endsWith("_COMPLETE"))).toBe(false);
  });

  it("bounds concurrent stalled browsers at 30s, then Vite at 10s, within the 45s hook", async () => {
    const observed = diagnostics();
    const stalled = () => new Promise<void>(() => {});
    const viteClose = vi.fn(stalled);
    const cleanup = closeFixtureResources({
      browsers: [{ component: "CHROMIUM", close: stalled }, { component: "WEBKIT", close: stalled }],
      vite: { component: "VITE", close: viteClose }, emit: observed.emit,
    });
    const failed = expect(cleanup).rejects.toMatchObject({ errors: [
      expect.objectContaining({ component: "CHROMIUM", timeoutMs: 30_000 }),
      expect.objectContaining({ component: "WEBKIT", timeoutMs: 30_000 }),
      expect.objectContaining({ component: "VITE", timeoutMs: 10_000 }),
    ] });
    await vi.advanceTimersByTimeAsync(29_999);
    expect(viteClose).not.toHaveBeenCalled();
    expect(observed.events.filter(({ event }) => event.endsWith("_ERROR"))).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(viteClose).toHaveBeenCalledOnce();
    expect(observed.events.filter(({ event }) => event.endsWith("_ERROR"))).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(observed.events.some(({ event }) => event === "VITE_CLOSE_ERROR")).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await failed;
    expect(TEARDOWN_HOOK_TIMEOUT_MS).toBe(45_000);
    const failures = observed.events.filter(({ event }) => event.endsWith("_ERROR"));
    expect(failures).toHaveLength(3);
    for (const { detail } of failures) expect(detail).toMatchObject({ status: "timed_out", terminationConfirmed: false });
    expect(observed.events.some(({ event }) => event.endsWith("_COMPLETE"))).toBe(false);
  });

  it("times out Vite independently after successful browser closes", async () => {
    const observed = diagnostics();
    const cleanup = closeFixtureResources({
      browsers: [{ component: "CHROMIUM", close: async () => {} }, { component: "WEBKIT", close: async () => {} }],
      vite: { component: "VITE", close: () => new Promise<void>(() => {}) }, emit: observed.emit,
    });
    const failed = expect(cleanup).rejects.toMatchObject({ errors: [expect.any(ResourceCloseTimeoutError)] });
    await vi.advanceTimersByTimeAsync(10_000); await failed;
    expect(observed.events).toContainEqual(expect.objectContaining({
      event: "VITE_CLOSE_ERROR", detail: expect.objectContaining({ terminationConfirmed: false, timeoutMs: 10_000 }),
    }));
    expect(observed.events.some(({ event }) => event === "VITE_CLOSE_COMPLETE")).toBe(false);
  });

  it.each(["resolve", "reject"] as const)("handles late WebKit %s without unhandled rejection or a false completion marker", async (settlement) => {
    let resolveLate!: () => void, rejectLate!: (reason: unknown) => void;
    const observed = diagnostics();
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const cleanup = closeFixtureResources({
        browsers: [{ component: "WEBKIT", close: () => new Promise<void>((resolve, reject) => { resolveLate = resolve; rejectLate = reject; }) }],
        vite: { component: "VITE", close: async () => {} }, emit: observed.emit,
      });
      const failed = expect(cleanup).rejects.toThrow(AggregateError);
      await vi.advanceTimersByTimeAsync(30_000); await failed;
      const before = [...observed.events];
      if (settlement === "reject") rejectLate(undefined); else resolveLate();
      await vi.advanceTimersByTimeAsync(0);
      expect(observed.events).toEqual(before);
      expect(unhandled).not.toHaveBeenCalled();
    } finally { process.off("unhandledRejection", unhandled); }
  });

  it.each([false, true])("a throwing diagnostic sink cannot alter cleanup outcome (failed=%s)", async (failed) => {
    const viteClose = vi.fn(async () => {});
    const cleanup = closeFixtureResources({
      browsers: [{ component: "WEBKIT", close: () => failed ? Promise.reject(undefined) : Promise.resolve() }],
      vite: { component: "VITE", close: viteClose },
      emit: () => { throw new Error("diagnostic sink failure"); },
    });
    if (failed) await expect(cleanup).rejects.toMatchObject({ errors: [expect.objectContaining({ cause: undefined })] });
    else await expect(cleanup).resolves.toBeUndefined();
    expect(viteClose).toHaveBeenCalledOnce();
  });

  it("retains an unprintable rejection without allowing diagnostic formatting to skip Vite", async () => {
    const reason = { toString() { throw new Error("cannot format rejection"); } };
    const viteClose = vi.fn(async () => {});
    await expect(closeFixtureResources({
      browsers: [{ component: "WEBKIT", close: () => Promise.reject(reason) }],
      vite: { component: "VITE", close: viteClose }, emit: diagnostics().emit,
    })).rejects.toMatchObject({ errors: [expect.objectContaining({ cause: reason, message: expect.stringContaining("WEBKIT") })] });
    expect(viteClose).toHaveBeenCalledOnce();
  });

  it("still closes Vite after setup produced no browsers", async () => {
    const viteClose = vi.fn(async () => {});
    await closeFixtureResources({ browsers: [], vite: { component: "VITE", close: viteClose }, emit: diagnostics().emit });
    expect(viteClose).toHaveBeenCalledOnce();
  });
});
