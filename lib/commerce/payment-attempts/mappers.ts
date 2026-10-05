import "server-only";

import type { AdmissionOutcome, CommitOutcome } from "./types";

type RpcError = { message?: string | null } | null;

function firstRow(data: unknown): Record<string, unknown> | null {
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
    typeof attemptId !== "string" ||
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
  if (outcome === "KEY_CONFLICT" && typeof row.conflict_event_id === "string") {
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
): CommitOutcome {
  if (error) {
    return {
      kind: "UNKNOWN",
      attemptId: null,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: unknownReason("Commit", error),
    };
  }
  const row = firstRow(data);
  if (!row) {
    return {
      kind: "UNKNOWN",
      attemptId: null,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: unknownReason("Commit", null),
    };
  }
  const outcome = row?.outcome;
  const attemptId =
    typeof row?.attempt_id === "string" ? row.attempt_id : null;
  const transactionId =
    typeof row?.transaction_id === "string" ? row.transaction_id : null;

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
    attemptId &&
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
  return {
    kind: "UNKNOWN",
    attemptId,
    transactionId,
    recorded: row?.recorded === true,
    synchronization: "UNKNOWN",
    reason: unknownReason("Commit", null),
  };
}
