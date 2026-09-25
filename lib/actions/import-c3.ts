"use server";

import { z } from "zod";
import {
  advanceC3Import,
  cancelC3Import,
  C3ImportError,
  getC3ResultPage,
  resumeC3Import,
  retryC3ReminderTakeover,
  startC3Import,
} from "@/lib/server/import-c3";
import { GovernedImportError } from "@/lib/server/import-writer";

export type C3ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; retryAt?: string };

function friendlyError(error: unknown): { error: string; code?: string; retryAt?: string } {
  if (error instanceof C3ImportError) {
    const messages: Record<C3ImportError["code"], string> = {
      OWNER_REQUIRED: "Only the primary business owner can run this import.",
      INVALID_INPUT: "The import request is invalid. Reload the workspace and try again.",
      RUN_NOT_FOUND: "This import run is no longer available.",
      RUN_MISMATCH: "The frozen review no longer matches the governed run. Do not continue this import.",
      REVIEW_UNAVAILABLE: "The frozen reviewed plan is unavailable. Do not reconstruct it; review a new import instead.",
      LEASE_ACTIVE: "This import is still protected by an active session lease. Resume after the safe retry time.",
      LEASE_UNAVAILABLE: "This import cannot continue with the current lease. Reload the workspace and resume when available.",
      NOT_CANCELLABLE: "This import has already started committing and can no longer be cancelled.",
      UNAVAILABLE: "The import could not continue. Already committed batches remain durable and protected from duplication.",
    };
    return { error: messages[error.code], code: error.code, ...(error.retryAt ? { retryAt: error.retryAt } : {}) };
  }
  if (error instanceof GovernedImportError) {
    return { error: error.message, code: error.code };
  }
  if (error instanceof z.ZodError) {
    return { error: "The import request is invalid. Reload the workspace and try again.", code: "INVALID_INPUT" };
  }
  return {
    error: "The import could not continue. Already committed batches remain durable and protected from duplication.",
    code: "UNAVAILABLE",
  };
}

async function boundary<T>(work: () => Promise<T>): Promise<C3ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return { ok: false, ...friendlyError(error) };
  }
}

export async function startC3ImportAction(input: unknown) {
  return boundary(() => {
    const value = z.object({ runId: z.uuid(), reminderTakeover: z.boolean() }).strict().parse(input);
    return startC3Import(value.runId, value.reminderTakeover);
  });
}

export async function advanceC3ImportAction(input: unknown) {
  return boundary(() => {
    const value = z.object({ runId: z.uuid(), leaseToken: z.uuid() }).strict().parse(input);
    return advanceC3Import(value.runId, value.leaseToken);
  });
}

export async function resumeC3ImportAction(runId: unknown) {
  return boundary(() => resumeC3Import(z.uuid().parse(runId)));
}

export async function cancelC3ImportAction(runId: unknown) {
  return boundary(() => cancelC3Import(z.uuid().parse(runId)));
}

export async function retryC3ReminderTakeoverAction(runId: unknown) {
  return boundary(() => retryC3ReminderTakeover(z.uuid().parse(runId)));
}

export async function getC3ResultPageAction(input: unknown) {
  return boundary(() => {
    const value = z.object({
      runId: z.uuid(),
      page: z.number().int().min(0).max(199),
    }).strict().parse(input);
    return getC3ResultPage(value.runId, value.page);
  });
}
