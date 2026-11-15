// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { closeServiceTaxFixture, type TeardownEvent } from "./service-tax-teardown";

const events: TeardownEvent[] = [];
const emit = (event: TeardownEvent) => events.push(event);
const names = () => events.map((event) => event.event);
const ok = () => ({ close: vi.fn(async () => undefined) });
const stalled = () => ({ close: vi.fn(() => new Promise(() => {})) });
beforeEach(() => { vi.useFakeTimers(); events.length = 0; });
afterEach(() => { expect(vi.getTimerCount()).toBe(0); vi.useRealTimers(); });

it("starts both browser closes concurrently, then completes Vite and clears timers", async () => {
  let finishChromium!: () => void, finishWebkit!: () => void;
  const chromium = { close: vi.fn(() => new Promise<void>((resolve) => { finishChromium = resolve; })) };
  const webkit = { close: vi.fn(() => new Promise<void>((resolve) => { finishWebkit = resolve; })) };
  const vite = ok();
  const run = closeServiceTaxFixture({ chromium, webkit, vite, emit });
  await vi.advanceTimersByTimeAsync(0);
  expect(chromium.close).toHaveBeenCalledOnce(); expect(webkit.close).toHaveBeenCalledOnce();
  expect(vite.close).not.toHaveBeenCalled();
  finishChromium(); finishWebkit(); await run;
  expect(names()).toEqual(["FIXTURE_TEARDOWN_BEGIN", "CHROMIUM_CLOSE_BEGIN", "WEBKIT_CLOSE_BEGIN", "CHROMIUM_CLOSE_COMPLETE", "WEBKIT_CLOSE_COMPLETE", "VITE_CLOSE_BEGIN", "VITE_CLOSE_COMPLETE", "FIXTURE_TEARDOWN_COMPLETE"]);
});

it.each([undefined, null, new Error("synthetic close failure")])("fails on browser rejection %s, still closes the other browser and Vite", async (reason) => {
  const chromium = ok(), vite = ok();
  const run = closeServiceTaxFixture({ chromium, webkit: { close: () => Promise.reject(reason) }, vite, emit });
  await expect(run).rejects.toMatchObject({ errors: [expect.any(Error)] });
  expect(chromium.close).toHaveBeenCalledOnce(); expect(vite.close).toHaveBeenCalledOnce();
  expect(events).toContainEqual(expect.objectContaining({ event: "WEBKIT_CLOSE_ERROR", status: "rejected", terminationConfirmed: false }));
  expect(names()).not.toContain("WEBKIT_CLOSE_COMPLETE"); expect(names()).not.toContain("FIXTURE_TEARDOWN_COMPLETE");
});

it("also treats a synchronous throw of undefined as failed close", async () => {
  const vite = ok();
  await expect(closeServiceTaxFixture({ webkit: { close() { throw undefined; } }, vite, emit })).rejects.toThrow("teardown failed");
  expect(vite.close).toHaveBeenCalledOnce();
  expect(events).toContainEqual(expect.objectContaining({ event: "WEBKIT_CLOSE_ERROR", status: "rejected", detail: "undefined" }));
});

it("bounds each browser independently at 30s and Vite at 10s; never claims timed-out termination", async () => {
  const vite = stalled();
  const run = closeServiceTaxFixture({ chromium: stalled(), webkit: stalled(), vite, emit });
  const failed = expect(run).rejects.toMatchObject({ errors: expect.arrayContaining([expect.objectContaining({ message: "WEBKIT: timed_out (termination unconfirmed)" })]) });
  await vi.advanceTimersByTimeAsync(29_999); expect(vite.close).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); expect(vite.close).toHaveBeenCalledOnce();
  expect(events.filter((event) => event.status === "timed_out")).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(10_000); await failed;
  expect(events.filter((event) => event.status === "timed_out")).toHaveLength(3);
  expect(events.filter((event) => event.status === "timed_out").every((event) => event.terminationConfirmed === false)).toBe(true);
  expect(names()).not.toContain("FIXTURE_TEARDOWN_COMPLETE");
});

it("consumes a late browser rejection after timeout without emitting late success", async () => {
  let rejectLate!: (reason: unknown) => void;
  const vite = ok();
  const run = closeServiceTaxFixture({ webkit: { close: () => new Promise((_, reject) => { rejectLate = reject; }) }, vite, emit });
  const failed = expect(run).rejects.toThrow("teardown failed");
  await vi.advanceTimersByTimeAsync(30_000); await failed;
  expect(vite.close).toHaveBeenCalledOnce();
  const before = [...events]; rejectLate(undefined); await vi.advanceTimersByTimeAsync(0);
  expect(events).toEqual(before);
});

it("fails a Vite rejection with undefined rather than producing a false PASS", async () => {
  const run = closeServiceTaxFixture({ chromium: ok(), webkit: ok(), vite: { close: () => Promise.reject(undefined) }, emit });
  await expect(run).rejects.toThrow("teardown failed");
  expect(events).toContainEqual(expect.objectContaining({ event: "VITE_CLOSE_ERROR", status: "rejected", detail: "undefined" }));
  expect(names()).not.toContain("FIXTURE_TEARDOWN_COMPLETE");
});

it("finishes cleanup even if the diagnostic sink throws", async () => {
  const vite = ok();
  await expect(closeServiceTaxFixture({ chromium: ok(), webkit: ok(), vite, emit: () => { throw new Error("sink"); } })).resolves.toBeUndefined();
  expect(vite.close).toHaveBeenCalledOnce();
});
