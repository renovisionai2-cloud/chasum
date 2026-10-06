import "server-only";

import { isCanonicalUuid } from "./normalize";
import type { AdmissionOutcome, CommitOutcome } from "./types";

type RpcError = { message?: string | null } | null;

function firstRow(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data) && data.length !== 1) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === "object"
    ? (row as Record<string, unknown>)
    : null;
}

function unknownReason(scope: string, error: RpcError): string {
  return error?.message
    ? `${scope} failed: ${error.message}`
    : `${scope} returned an invalid result.`;
}

export function mapAdmissionRpcResult(
  data: unknown,
  error: RpcError,
): AdmissionOutcome {
  if (error) return { kind: "UNKNOWN", reason: unknownReason("Admission", error) };
  const row = firstRow(data);
  if (!row) {
    return { kind: "UNKNOWN", reason: unknownReason("Admission", null) };
  }
  const outcome = row?.outcome;
  const attemptId = row?.attempt_id;
  const executionState = row?.execution_state;
  if (
    !isCanonicalUuid(attemptId) ||
    !["REQUESTED", "ACCEPTED", "FAILED", "SKIPPED"].includes(
      String(executionState),
    )
  ) {
    return {
      kind: "UNKNOWN",
      reason: unknownReason("Admission", null),
    };
  }
  if (outcome === "ADMITTED" || outcome === "EXISTING") {
    return {
      kind: outcome,
      attemptId,
      executionState: executionState as
        | "REQUESTED"
        | "ACCEPTED"
        | "FAILED"
        | "SKIPPED",
    };
  }
  if (
    outcome === "KEY_CONFLICT" &&
    isCanonicalUuid(row.conflict_event_id)
  ) {
    return {
      kind: "KEY_CONFLICT",
      attemptId,
      executionState: executionState as
        | "REQUESTED"
        | "ACCEPTED"
        | "FAILED"
        | "SKIPPED",
      conflictEventId: row.conflict_event_id,
    };
  }
  return { kind: "UNKNOWN", reason: unknownReason("Admission", null) };
}

export function mapCommitRpcResult(
  data: unknown,
  error: RpcError,
  expectedAttemptId: string,
): CommitOutcome {
  const unknown = (
    reason: string,
    options?: { transactionId: string; recorded: true },
  ): CommitOutcome => ({
    kind: "UNKNOWN",
    attemptId: expectedAttemptId,
    transactionId: options?.transactionId ?? null,
    recorded: options?.recorded ?? false,
    synchronization: "UNKNOWN",
    reason,
  });
  if (error) {
    return unknown(unknownReason("Commit", error));
  }
  const row = firstRow(data);
  if (!row) {
    return unknown(unknownReason("Commit", null));
  }
  const outcome = row?.outcome;
  const attemptId =
    isCanonicalUuid(row?.attempt_id) ? row.attempt_id : null;
  const transactionId =
    isCanonicalUuid(row?.transaction_id) ? row.transaction_id : null;

  if (attemptId !== expectedAttemptId) {
    return unknown("Commit returned a mismatched attempt identity.");
  }

  if (
    (outcome === "RECORDED" || outcome === "REPLAY") &&
    attemptId &&
    transactionId &&
    row?.recorded === true &&
    row?.synchronization === "PENDING"
  ) {
    return {
      kind: outcome,
      attemptId,
      transactionId,
      recorded: true,
      synchronization: "PENDING",
    };
  }
  if (
    outcome === "NOT_COMMITTABLE" &&
    transactionId === null &&
    row?.recorded === false &&
    row?.synchronization === "UNKNOWN"
  ) {
    return {
      kind: "NOT_COMMITTABLE",
      attemptId,
      recorded: false,
      synchronization: "UNKNOWN",
    };
  }
  if (
    outcome === "UNKNOWN" &&
    row?.synchronization === "UNKNOWN" &&
    row?.recorded === true &&
    transactionId
  ) {
    return unknown("Ledger-backed commit evidence requires review.", {
      transactionId,
      recorded: true,
    });
  }
  if (
    outcome === "UNKNOWN" &&
    row?.synchronization === "UNKNOWN" &&
    row?.recorded === false &&
    row?.transaction_id === null
  ) {
    return unknown("Commit produced no certifiable ledger evidence.");
  }
  return unknown(unknownReason("Commit", null));
}
