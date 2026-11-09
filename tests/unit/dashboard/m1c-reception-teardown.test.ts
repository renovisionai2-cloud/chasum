// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  closeFixtureResources,
  type CloseDiagnostic,
  type CloseEvent,
} from "./m1c-reception-teardown";

afterEach(() => {
  vi.useRealTimers();
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
});
