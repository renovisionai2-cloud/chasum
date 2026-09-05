import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/observability/logger";

export type SendReliabilityContext = {
  /** Stable occurrence identity, persisted in the job before dispatch. */
  intentId: string;
  jobId?: string;
  attempt?: number;
  source: "inline" | "worker";
  entityType?: "appointment" | "receipt";
  entityId?: string;
};

export type ProviderOutcome = {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  skipped?: boolean;
  /** True only when the adapter can establish that no send was accepted. */
  retrySafe?: boolean;
};

export type DurableSendResult = ProviderOutcome & {
  deliveryState: "accepted" | "rejected" | "unknown" | "not_attempted";
  reconciliationRequired: boolean;
  duplicateSuppressed: boolean;
  providerCalled: boolean;
  intentId?: string;
  intentAttempt?: number;
};

export type SendIntent = {
  id: string;
  business_id: string;
  intent_key: string;
  channel: "email" | "sms";
  template_key: string;
  recipient_hash: string;
  state: "sending" | "accepted" | "rejected" | "unknown";
  owner_id: string;
  attempt: number;
  provider: string | null;
  provider_message_id: string | null;
  failure_code: string | null;
  first_job_id: string | null;
  last_job_id: string | null;
  source: "inline" | "worker";
  entity_type: "appointment" | "receipt" | null;
  entity_id: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
};

/** Persistence operations must return only rows they actually acquired/changed. */
export interface SendIntentStore {
  insert(row: SendIntent): Promise<SendIntent | null>;
  find(businessId: string, key: string): Promise<SendIntent | null>;
  compareAndSet(before: SendIntent, changes: Partial<SendIntent>): Promise<SendIntent | null>;
}

export function createSendIntentStore(): SendIntentStore {
  const db = createServiceClient();
  return {
    async insert(row) {
      const { data, error } = await db.from("communication_send_intents")
        .insert(row).select("*").single();
      if (error?.code === "23505") return null;
      if (error || !data) throw new Error("intent_reservation_write_failed");
      return data as SendIntent;
    },
    async find(businessId, key) {
      const { data, error } = await db.from("communication_send_intents")
        .select("*").eq("business_id", businessId).eq("intent_key", key).maybeSingle();
      if (error) throw new Error("intent_read_failed");
      return data as SendIntent | null;
    },
    async compareAndSet(before, changes) {
      const { data, error } = await db.from("communication_send_intents")
        .update(changes).eq("id", before.id).eq("business_id", before.business_id)
        .eq("intent_key", before.intent_key).eq("state", before.state)
        .eq("owner_id", before.owner_id).eq("attempt", before.attempt)
        .select("*").maybeSingle();
      if (error) throw new Error("intent_transition_write_failed");
      return data as SendIntent | null;
    },
  };
}

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export function sendIntentKey(intentId: string, channel: string, templateKey: string): string {
  return hash(JSON.stringify(["chasum-send-v1", intentId, channel, templateKey]));
}

type SendInput = {
  businessId: string;
  channel: "email" | "sms";
  templateKey: string;
  to: string;
  reliability: SendReliabilityContext;
};

function held(code: string, row?: SendIntent): DurableSendResult {
  return {
    success: false, provider: row?.provider ?? "unresolved", error: code,
    deliveryState: row ? "unknown" : "not_attempted", retrySafe: false,
    reconciliationRequired: true, duplicateSuppressed: Boolean(row),
    providerCalled: false, intentId: row?.id, intentAttempt: row?.attempt,
  };
}

function existingResult(row: SendIntent): DurableSendResult {
  if (row.state !== "accepted") return held("send_intent_requires_reconciliation", row);
  return {
    success: true, provider: row.provider ?? "unresolved",
    messageId: row.provider_message_id ?? undefined, deliveryState: "accepted",
    retrySafe: false, reconciliationRequired: false, duplicateSuppressed: true,
    providerCalled: false, intentId: row.id, intentAttempt: row.attempt,
  };
}

/** Read established delivery truth before mutable preferences/template context. */
export async function inspectSendIntent(input: SendInput, store?: SendIntentStore): Promise<DurableSendResult | null> {
  try {
    store ??= createSendIntentStore();
    const key = sendIntentKey(input.reliability.intentId, input.channel, input.templateKey);
    const row = await store.find(input.businessId, key);
    if (!row) return null;
    if (row.business_id !== input.businessId || row.intent_key !== key ||
        row.channel !== input.channel || row.template_key !== input.templateKey || row.recipient_hash !== hash(input.to) ||
        (row.entity_type ?? null) !== (input.reliability.entityType ?? null) ||
        (row.entity_id ?? null) !== (input.reliability.entityId ?? null)) {
      return held("send_intent_identity_changed", row);
    }
    if (row.state === "rejected") return null;
    logger.info("worker_reliability", "duplicate_suppressed", {
      businessId: input.businessId, jobId: input.reliability.jobId,
      intentId: row.id, state: row.state, providerCalled: false,
    });
    return existingResult(row);
  } catch {
    logger.error("worker_reliability", "intent_lookup_unconfirmed", { businessId: input.businessId, jobId: input.reliability.jobId });
    return held("send_intent_storage_unavailable");
  }
}

/**
 * Ordinary Retry must not bypass an unresolved earlier manual occurrence by
 * generating a fresh UUID. Entity correlation keeps this hold specific to the
 * appointment/receipt, allowing unrelated communications to proceed.
 */
export async function inspectUnresolvedSendIntent(
  input: Omit<SendInput, "reliability"> & { entityType: "appointment" | "receipt"; entityId: string },
): Promise<DurableSendResult | null> {
  try {
    const { data, error } = await createServiceClient().from("communication_send_intents")
      .select("*").eq("business_id", input.businessId).eq("channel", input.channel)
      .eq("template_key", input.templateKey)
      .eq("entity_type", input.entityType).eq("entity_id", input.entityId)
      .in("state", ["sending", "unknown"]).limit(1).maybeSingle();
    if (error) throw new Error("unresolved_intent_read_failed");
    return data ? held("prior_send_requires_reconciliation", data as SendIntent) : null;
  } catch {
    logger.error("worker_reliability", "unresolved_intent_lookup_unconfirmed", { businessId: input.businessId });
    return held("send_intent_storage_unavailable");
  }
}

/**
 * A committed sending reservation precedes the network call. There is deliberately
 * no expiry/reclaim for sending or unknown: provider acceptance cannot be inferred
 * from a timeout, missing log, dead process, or an expired provider dedupe window.
 */
export async function runDurableSend(
  input: SendInput,
  send: (idempotencyKey: string) => Promise<ProviderOutcome>,
  store?: SendIntentStore,
): Promise<DurableSendResult> {
  let row: SendIntent | undefined;
  const key = sendIntentKey(input.reliability.intentId, input.channel, input.templateKey);
  const recipientHash = hash(input.to);
  const identityMatches = (candidate: SendIntent) =>
    candidate.business_id === input.businessId && candidate.intent_key === key &&
    candidate.channel === input.channel && candidate.template_key === input.templateKey &&
    candidate.recipient_hash === recipientHash &&
    (candidate.entity_type ?? null) === (input.reliability.entityType ?? null) &&
    (candidate.entity_id ?? null) === (input.reliability.entityId ?? null);
  try {
    if (!input.businessId || !input.to || !input.templateKey || !input.reliability.intentId ||
        Boolean(input.reliability.entityType) !== Boolean(input.reliability.entityId)) {
      return held("send_intent_identity_missing");
    }
    store ??= createSendIntentStore();
    const now = new Date().toISOString();
    const proposed: SendIntent = {
      id: randomUUID(), business_id: input.businessId, intent_key: key,
      channel: input.channel, template_key: input.templateKey, recipient_hash: recipientHash,
      state: "sending", owner_id: randomUUID(), attempt: 1, provider: null,
      provider_message_id: null, failure_code: null,
      first_job_id: input.reliability.jobId ?? null, last_job_id: input.reliability.jobId ?? null,
      source: input.reliability.source, created_at: now, updated_at: now, accepted_at: null,
      entity_type: input.reliability.entityType ?? null, entity_id: input.reliability.entityId ?? null,
    };
    const inserted = await store.insert(proposed);
    if (inserted) {
      if (!identityMatches(inserted) || inserted.owner_id !== proposed.owner_id || inserted.state !== "sending") {
        return held("send_intent_reservation_mismatch", inserted);
      }
      row = inserted;
    } else {
      const prior = await store.find(input.businessId, key);
      if (!prior) return held("send_intent_conflict_unresolved");
      if (!identityMatches(prior)) return held("send_intent_identity_changed", prior);
      if (prior.state !== "rejected") {
        logger.info("worker_reliability", "duplicate_suppressed", {
          businessId: input.businessId, intentId: prior.id, state: prior.state,
        });
        return existingResult(prior);
      }
      // Only a persisted, confirmed rejection can acquire another attempt.
      const acquired = await store.compareAndSet(prior, {
        state: "sending", owner_id: randomUUID(), attempt: prior.attempt + 1,
        last_job_id: input.reliability.jobId ?? null, source: input.reliability.source,
        updated_at: now, failure_code: null,
      });
      if (!acquired) {
        const current = await store.find(input.businessId, key);
        return current && identityMatches(current) ? existingResult(current) : held("send_intent_claim_lost");
      }
      row = acquired;
    }
  } catch {
    logger.error("worker_reliability", "intent_reservation_unconfirmed", {
      businessId: input.businessId, jobId: input.reliability.jobId, providerCalled: false,
    });
    return held("send_intent_storage_unavailable", row);
  }

  logger.info("worker_reliability", "provider_request_started", {
    businessId: input.businessId, jobId: input.reliability.jobId,
    intentId: row.id, intentAttempt: row.attempt, source: input.reliability.source,
  });
  let result: ProviderOutcome;
  try {
    // A confirmed rejected attempt gets a new provider key; an ambiguous attempt
    // is never replayed. Provider idempotency is supplementary to the DB guard.
    result = await send(`chasum/${row.id}/${row.attempt}`);
  } catch {
    result = { success: false, provider: "unresolved", error: "provider_acceptance_unknown", retrySafe: false };
  }
  const state = result.success ? "accepted" : result.retrySafe === true || result.skipped ? "rejected" : "unknown";
  let persisted = false;
  try {
    const now = new Date().toISOString();
    persisted = Boolean(await store!.compareAndSet(row, {
      state, provider: result.provider, provider_message_id: result.messageId ?? null,
      failure_code: state === "accepted" ? null : state === "rejected" ? "provider_confirmed_not_accepted" : "provider_acceptance_unknown",
      accepted_at: state === "accepted" ? now : null, updated_at: now,
    }));
  } catch {
    // The original committed sending reservation remains a durable no-replay guard.
  }
  logger[persisted && state !== "unknown" ? "info" : "error"]("worker_reliability", "provider_result_recorded", {
    businessId: input.businessId, jobId: input.reliability.jobId, intentId: row.id,
    state, persisted, provider: result.provider, providerMessageId: result.messageId,
  });
  return {
    ...result, deliveryState: state, retrySafe: state === "rejected" && persisted && !result.skipped,
    reconciliationRequired: !persisted || state === "unknown", duplicateSuppressed: false,
    providerCalled: true, intentId: row.id, intentAttempt: row.attempt,
  };
}
