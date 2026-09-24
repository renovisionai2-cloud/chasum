// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "lib/server/import-c3.ts"), "utf8");
const actions = fs.readFileSync(path.join(root, "lib/actions/import-c3.ts"), "utf8");

describe("C3 import safety boundary", () => {
  it("reuses only the existing governed writer seams", () => {
    expect(source).toMatch(/beginGovernedImport/);
    expect(source).toMatch(/commitGovernedImportBatch/);
    expect(source).toMatch(/resumeGovernedImport/);
    expect(source).toMatch(/finishGovernedImport/);
    expect(source).not.toMatch(/from\(["']appointments["']\)\.insert/);
    expect(source).not.toMatch(/createBooking|resolveBookingFinancials|emitBookingEvent/);
  });

  it("never imports or calls the appointment-created communications bridge", () => {
    expect(source).toMatch(/enqueueReminderJobs/);
    expect(source).not.toMatch(/handleAppointmentEvent/);
    expect(source).not.toMatch(/registerCommunicationsBookingBridge/);
    expect(source).not.toMatch(/enqueueWebhookJob/);
    expect(source).not.toMatch(/enqueueCalendarSyncJob/);
  });

  it("does not expose browser authority for Business, actor, rows or mapping", () => {
    expect(actions).not.toMatch(/businessId|actorId|rows:|mapping:/);
    expect(actions).toMatch(/runId/);
    expect(actions).toMatch(/reminderTakeover/);
    expect(actions).toMatch(/leaseToken/);
  });

  it("does not persist lease fencing tokens in browser storage or URLs", () => {
    const workspace = fs.readFileSync(path.join(root, "components/business/import-run-control.tsx"), "utf8");
    expect(workspace).not.toMatch(/localStorage|sessionStorage|URLSearchParams|router\.push.*lease/i);
    expect(workspace).toMatch(/useState<Record<string, string>>\(\{\}\)/);
  });
});
