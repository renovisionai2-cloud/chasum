import { appendFileSync } from "node:fs";
import type { Server } from "node:http";
import type { Socket } from "node:net";
import type { Browser } from "playwright-core";

// Observations only. No resource close, timeout enforcement, rejection suppression,
// process kill, test retry or browser behavior is introduced here.
export function createLifecycleDiagnostic(browsers: Record<string, Browser>) {
  const pending = new Set<string>();
  const sockets = new Set<Socket>();
  const file = process.env.CHASUM_N02_LIFECYCLE_FILE;
  const started = performance.now();
  let records = 0;
  let hookStarted: number | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;

  function snapshot() {
    return {
      pending: [...pending],
      browsers: Object.fromEntries(Object.entries(browsers).map(([name, browser]) => [name, {
        connected: browser.isConnected(),
        contexts: browser.contexts().length,
        pages: browser.contexts().reduce((count, context) => count + context.pages().length, 0),
      }])),
      httpConnections: sockets.size,
      activeResourceTypes: process.getActiveResourcesInfo(),
    };
  }
  function emit(event: string, detail: Record<string, unknown> = {}) {
    if (records++ >= 256) return;
    try {
      const line = JSON.stringify({
        scope: "N02", event, at: new Date().toISOString(), pid: process.pid,
        atMs: Math.round((performance.now() - started) * 10) / 10,
        ...detail,
      });
      if (file) appendFileSync(file, line + "\n");
      console.log("[n02-lifecycle] " + line);
    } catch {
      // Never convert an observation failure into cleanup success.
      console.error("[n02-lifecycle] diagnostic write failed");
    }
  }
  async function observe<T>(operation: string, action: () => Promise<T>): Promise<T> {
    pending.add(operation);
    const begin = performance.now();
    emit("OPERATION_BEGIN", { operation, ...snapshot(), terminationConfirmed: false });
    try {
      const result = await action();
      pending.delete(operation);
      emit("OPERATION_RESOLVED", {
        operation, durationMs: Math.round((performance.now() - begin) * 10) / 10,
        ...snapshot(), terminationConfirmed: false, outcome: "API_PROMISE_RESOLVED",
      });
      return result;
    } catch (error) {
      pending.delete(operation);
      emit("OPERATION_REJECTED", {
        operation, durationMs: Math.round((performance.now() - begin) * 10) / 10,
        errorType: error instanceof Error ? error.name : typeof error,
        ...snapshot(), terminationConfirmed: false,
      });
      throw error;
    }
  }
  return {
    emit, observe,
    attachServer(server: Server) {
      server.on("connection", socket => {
        sockets.add(socket);
        socket.once("close", () => sockets.delete(socket));
      });
      server.once("close", () => emit("HTTP_SERVER_CLOSE_EVENT", snapshot()));
    },
    attachBrowser(name: string, browser: Browser) {
      browser.once("disconnected", () => emit("BROWSER_DISCONNECTED", {
        browser: name, ...snapshot(), terminationConfirmed: false,
      }));
    },
    beginHook() {
      hookStarted = performance.now();
      emit("HOOK_BEGIN", { hookTimeoutMs: 10000, ...snapshot() });
      timer = setInterval(() => emit("HOOK_PENDING", snapshot()), 1000);
      timer.unref();
      deadline = setTimeout(() => emit("ORIGINAL_HOOK_BUDGET_ELAPSED", {
        hookTimeoutMs: 10000, ...snapshot(), terminationConfirmed: false,
        note: "Observation only; Vitest owns the actual hook outcome.",
      }), 10000);
      deadline.unref();
    },
    endHook(outcome: "resolved" | "rejected") {
      if (timer) clearInterval(timer);
      if (deadline) clearTimeout(deadline);
      const durationMs = Math.round((performance.now() - (hookStarted ?? started)) * 10) / 10;
      emit("HOOK_RETURN", { outcome, durationMs, exceededOriginalBudget: durationMs >= 10000, ...snapshot() });
    },
  };
}
