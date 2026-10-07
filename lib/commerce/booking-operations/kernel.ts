import "server-only";

import { requireBusiness, requireUser } from "@/lib/actions/business";
import {
  resolveRequestedStatus,
  validateBooking,
} from "@/lib/booking-engine/availability";
import { findRoomConflicts } from "@/lib/booking-engine/conflicts";
import { createBooking } from "@/lib/booking-engine/mutations/create";
import { durableOperationBookingPersistence } from "@/lib/booking-engine/persistence";
import { assertNamedStaffRequired } from "@/lib/booking/optional-staff";
import {
  resolveBookingFinancials,
} from "@/lib/commerce/booking-financials";
import {
  assertCanonicalUuid,
  assertSupportedBusinessCurrency,
  isCanonicalUuid,
} from "@/lib/commerce/payment-attempts/normalize";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { normalizeBookingOperation } from "./normalize";
import type {
  AuthoritativeBookingSnapshot,
  BookingOperationAuthority,
  BookingOperationBootstrapOutcome,
  BookingOperationCloseReason,
  BookingOperationFoundSnapshot,
  BookingOperationHistoryCursor,
  BookingOperationHistoryPage,
  BookingOperationHistorySummary,
  BookingOperationKernelDependencies,
  BookingOperationKernelResult,
  BookingOperationReadResult,
  BookingOperationRequest,
  BookingOperationSource,
  NormalizedBookingOperation,
} from "./types";

type RpcError = { message?: string | null; code?: string | null } | null;
type JsonRecord = Record<string, unknown>;

const CLOSE_REASONS = new Set([
  "PRICING_CHANGED",
  "SLOT_CONFLICT",
  "CUSTOMER_REASSIGNED",
  "APPOINTMENT_CANCELLED",
  "OPERATOR_ABANDONED",
]);
const MANUAL_METHODS = new Set([
  "cash",
  "e_transfer",
  "debit_card",
  "credit_card",
  "other",
]);
const OBLIGATION_KINDS = new Set([
  "appointment_cache",
  "invoice_settlement",
  "customer_payment_events",
  "receipt",
]);

function firstRow(data: unknown): JsonRecord | null {
  if (Array.isArray(data) && data.length !== 1) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === "object" ? (row as JsonRecord) : null;
}

function object(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function stringOrNull(value: unknown): string | null | undefined {
  return value === null ? null : typeof value === "string" ? value : undefined;
}

function finiteInteger(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

function unknown(operationId: string, reason: string): BookingOperationKernelResult {
  return { kind: "UNKNOWN", operationId, reason };
}

function resultFromSnapshot(
  snapshot: BookingOperationFoundSnapshot,
): BookingOperationKernelResult {
  if (snapshot.operatorState === "UNKNOWN") {
    return unknown(snapshot.operationId, "Canonical state requires review.");
  }
  return {
    kind: snapshot.operatorState,
    operationId: snapshot.operationId,
    appointmentId: snapshot.appointmentId,
    attemptId: snapshot.attemptId,
    transactionId: snapshot.transactionId,
    appointmentSaved: snapshot.appointmentSaved,
    reason:
      snapshot.closeReason ??
      (snapshot.paymentMode === "none" ? "NO_PAYMENT_REQUESTED" : null),
  };
}

export async function runBookingOperationKernel(
  request: BookingOperationRequest,
  dependencies: BookingOperationKernelDependencies,
): Promise<BookingOperationKernelResult> {
  let operationId: string;
  try {
    operationId = assertCanonicalUuid(
      request.identities.operationId,
      "operationId",
    );
    assertCanonicalUuid(request.identities.attemptKey, "attemptKey");
    assertCanonicalUuid(
      request.identities.inlineCustomerId,
      "inlineCustomerId",
    );
  } catch (error) {
    return {
      kind: "INVALID",
      reason: error instanceof Error ? error.message : "Invalid operation identity.",
    };
  }

  const authority = await dependencies.resolveAuthority();
  let snapshot: AuthoritativeBookingSnapshot;
  let normalized: NormalizedBookingOperation;
  try {
    snapshot = await dependencies.validateAndPrice(authority, request);
    normalized = normalizeBookingOperation(authority, request, snapshot);
  } catch (error) {
    return {
      kind: "INVALID",
      reason:
        error instanceof Error
          ? error.message
          : "Booking request could not be validated.",
    };
  }

  let initialRead: BookingOperationReadResult;
  try {
    initialRead = await dependencies.read(operationId);
  } catch {
    return unknown(operationId, "Canonical recovery transport is uncertain.");
  }
  if (initialRead.kind === "NOT_AUTHORIZED") return { kind: "NOT_AUTHORIZED" };
  if (initialRead.kind === "UNKNOWN") {
    return unknown(operationId, initialRead.reason);
  }
  if (initialRead.kind === "ABSENT" && !dependencies.admissionEnabled) {
    return { kind: "NOT_ADMITTED_DISABLED" };
  }

  let bootstrap: BookingOperationBootstrapOutcome;
  try {
    bootstrap = await dependencies.bootstrap(normalized);
  } catch {
    return unknown(operationId, "Operation admission transport is uncertain.");
  }
  if (bootstrap.kind === "NOT_AUTHORIZED") return { kind: "NOT_AUTHORIZED" };
  if (bootstrap.kind === "CUSTOMER_MATCH_REQUIRES_SELECTION") return bootstrap;
  if (bootstrap.kind === "KEY_CONFLICT") {
    return { kind: "KEY_CONFLICT", operationId };
  }
  if (bootstrap.kind === "UNKNOWN") {
    return unknown(operationId, bootstrap.reason);
  }
  if (
    bootstrap.operationId !== operationId ||
    bootstrap.customerId !== normalized.customerId ||
    !isCanonicalUuid(bootstrap.attemptId)
  ) {
    return unknown(operationId, "Admission returned mismatched durable identities.");
  }

  let appointmentId: string | null;
  try {
    appointmentId = await dependencies.recoverAppointment(
      authority.businessId,
      operationId,
    );
  } catch {
    return unknown(operationId, "Appointment recovery is uncertain.");
  }
  if (!appointmentId) {
    let created;
    try {
      created = await dependencies.createAppointment(normalized);
    } catch {
      created = {
        kind: "UNKNOWN" as const,
        reason: "Appointment persistence transport is uncertain.",
      };
    }
    if (created.kind === "CONFLICT") {
      const reason: BookingOperationCloseReason =
        created.reason === "DURABLE_BOOKING_PRICING_CHANGED"
          ? "PRICING_CHANGED"
          : "SLOT_CONFLICT";
      try {
        const closed = await dependencies.close(normalized, reason);
        if (closed.kind === "NOT_AUTHORIZED") return { kind: "NOT_AUTHORIZED" };
        if (closed.kind === "UNKNOWN") {
          return unknown(operationId, closed.reason);
        }
        if (closed.kind === "RECOVERY_REQUIRED") {
          return unknown(
            operationId,
            "A durable appointment or ledger won the close race.",
          );
        }
      } catch {
        return unknown(operationId, "Booking close fence is uncertain.");
      }
      const closedRead = await dependencies.read(operationId);
      return closedRead.kind === "FOUND"
        ? resultFromSnapshot(closedRead.snapshot)
        : unknown(operationId, "Closed booking state could not be certified.");
    }
    if (created.kind === "CREATED" || created.kind === "EXISTING") {
      appointmentId = created.appointmentId;
    } else {
      try {
        appointmentId = await dependencies.recoverAppointment(
          authority.businessId,
          operationId,
        );
      } catch {
        appointmentId = null;
      }
      if (!appointmentId) return unknown(operationId, created.reason);
    }
  }
  if (!isCanonicalUuid(appointmentId)) {
    return unknown(operationId, "Recovered appointment identity is malformed.");
  }

  let bound;
  try {
    bound = await dependencies.bind(normalized, appointmentId);
  } catch {
    return unknown(operationId, "Appointment binding transport is uncertain.");
  }
  if (bound.kind === "NOT_AUTHORIZED") return { kind: "NOT_AUTHORIZED" };
  if (bound.kind === "CLOSED") {
    return unknown(operationId, "The booking operation closed before binding.");
  }
  if (bound.kind === "UNKNOWN") return unknown(operationId, bound.reason);
  if (
    bound.operationId !== operationId ||
    bound.appointmentId !== appointmentId ||
    bound.attemptId !== bootstrap.attemptId
  ) {
    return unknown(operationId, "Binding returned mismatched durable identities.");
  }

  if (normalized.paymentMode !== "none") {
    let commit;
    try {
      commit = await dependencies.commit(normalized, bound.attemptId);
    } catch {
      return unknown(operationId, "Manual payment commit transport is uncertain.");
    }
    if (
      commit.attemptId !== null &&
      commit.attemptId !== bound.attemptId
    ) {
      return unknown(operationId, "Commit returned a mismatched attempt identity.");
    }
  }

  let finalRead: BookingOperationReadResult;
  try {
    finalRead = await dependencies.read(operationId);
  } catch {
    return unknown(operationId, "Final canonical read transport is uncertain.");
  }
  if (finalRead.kind === "NOT_AUTHORIZED") return { kind: "NOT_AUTHORIZED" };
  if (finalRead.kind !== "FOUND") {
    return unknown(
      operationId,
      finalRead.kind === "UNKNOWN"
        ? finalRead.reason
        : "Final canonical operation is not visible.",
    );
  }
  return resultFromSnapshot(finalRead.snapshot);
}

async function resolveCurrentAuthority(): Promise<BookingOperationAuthority> {
  const user = await requireUser();
  const business = await requireBusiness();
  return {
    actorId: assertCanonicalUuid(user.id, "actorId"),
    businessId: assertCanonicalUuid(business.id, "businessId"),
    currency: assertSupportedBusinessCurrency(business.currency ?? ""),
  };
}

async function assertCurrentAuthority(
  expected: BookingOperationAuthority,
): Promise<void> {
  const current = await resolveCurrentAuthority();
  if (
    current.actorId !== expected.actorId ||
    current.businessId !== expected.businessId ||
    current.currency !== expected.currency
  ) {
    throw new Error("Booking-operation authority changed.");
  }
}

async function validateAndPriceCurrent(
  authority: BookingOperationAuthority,
  request: BookingOperationRequest,
): Promise<AuthoritativeBookingSnapshot> {
  await assertCurrentAuthority(authority);
  const staffError = assertNamedStaffRequired(
    request.booking.staffId,
    request.booking.channel,
  );
  if (staffError) throw new Error(staffError);

  const intent = {
    ...request.booking,
    businessId: authority.businessId,
    customerId:
      request.customer.mode === "existing"
        ? request.customer.customerId
        : request.customer.inlineCustomerId,
  };
  const validation = await validateBooking(intent);
  if (!validation.ok) {
    throw new Error(
      validation.conflicts[0]?.message ?? "Booking validation failed.",
    );
  }
  if (intent.roomId) {
    const conflicts = await findRoomConflicts({
      businessId: authority.businessId,
      roomId: intent.roomId,
      startIso: intent.requestedStart,
      endIso: validation.endTime,
    });
    if (conflicts.length > 0) {
      throw new Error(conflicts[0]?.message ?? "Room is unavailable.");
    }
  }

  const supabase = await createClient();
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("price, deposit_cents, deposit_required, tax_rate_bps")
    .eq("id", intent.serviceId)
    .eq("business_id", authority.businessId)
    .maybeSingle();
  if (serviceError || !service) {
    throw new Error("Service pricing could not be verified.");
  }
  const { data: taxRows, error: taxError } = await supabase
    .from("tax_rates")
    .select("id, name, rate_bps, inclusive, is_default, is_active")
    .eq("business_id", authority.businessId)
    .eq("is_active", true);
  if (taxError) throw new Error("Tax pricing could not be verified.");

  const financials = resolveBookingFinancials({
    catalogPriceCents: Math.round(Number(service.price ?? 0) * 100),
    serviceTaxRateBps: service.tax_rate_bps ?? null,
    taxRates: (taxRows ?? []) as Parameters<typeof resolveBookingFinancials>[0]["taxRates"],
    depositRequiredCents: service.deposit_cents ?? null,
    depositRequired: service.deposit_required,
  });
  return {
    requestedEnd: validation.endTime,
    requestedStatus: resolveRequestedStatus(
      validation.context,
      intent.requestedStatus,
    ),
    durationMinutes: validation.context.durationMinutes,
    subtotalCents: financials.subtotalCents,
    taxCents: financials.taxCents,
    depositRequiredCents: financials.depositRequiredCents,
    appointmentNotes: intent.notes?.trim() || null,
  };
}

function mapBootstrap(data: unknown, error: RpcError): BookingOperationBootstrapOutcome {
  if (error) {
    if (error.code === "42501") return { kind: "NOT_AUTHORIZED" };
    return { kind: "UNKNOWN", reason: "Operation admission failed." };
  }
  const row = firstRow(data);
  if (!row || typeof row.outcome !== "string") {
    return { kind: "UNKNOWN", reason: "Operation admission returned invalid evidence." };
  }
  if (row.outcome === "CUSTOMER_MATCH_REQUIRES_SELECTION") {
    return { kind: "CUSTOMER_MATCH_REQUIRES_SELECTION" };
  }
  if (row.outcome === "NOT_AUTHORIZED") return { kind: "NOT_AUTHORIZED" };
  if (
    row.outcome === "KEY_CONFLICT" &&
    isCanonicalUuid(row.operation_id) &&
    isCanonicalUuid(row.attempt_id) &&
    isCanonicalUuid(row.conflict_event_id)
  ) {
    return {
      kind: "KEY_CONFLICT",
      operationId: row.operation_id,
      attemptId: row.attempt_id,
      conflictEventId: row.conflict_event_id,
    };
  }
  if (
    (row.outcome === "ADMITTED" || row.outcome === "EXISTING") &&
    isCanonicalUuid(row.operation_id) &&
    isCanonicalUuid(row.customer_id) &&
    isCanonicalUuid(row.attempt_id) &&
    ["REQUESTED", "ACCEPTED", "FAILED", "SKIPPED"].includes(
      String(row.execution_state),
    )
  ) {
    return {
      kind: row.outcome,
      operationId: row.operation_id,
      customerId: row.customer_id,
      attemptId: row.attempt_id,
      executionState: row.execution_state as
        | "REQUESTED"
        | "ACCEPTED"
        | "FAILED"
        | "SKIPPED",
    };
  }
  return { kind: "UNKNOWN", reason: "Operation admission returned malformed evidence." };
}

function rpcService() {
  return createServiceClient({ requestTimeoutMs: 10_000 });
}

function bootstrapArgs(normalized: NormalizedBookingOperation) {
  const intent = normalized.bookingIntent;
  return {
    p_business_id: normalized.authority.businessId,
    p_operation_id: normalized.identities.operationId,
    p_attempt_key: normalized.identities.attemptKey,
    p_actor_id: normalized.authority.actorId,
    p_source: normalized.source,
    p_booking_fingerprint: normalized.bookingFingerprint,
    p_payment_fingerprint: normalized.paymentIntent.fingerprint,
    p_customer_input_fingerprint: normalized.customerInputFingerprint,
    p_customer_origin: normalized.customerOrigin,
    p_existing_customer_id:
      normalized.customerOrigin === "existing" ? normalized.customerId : null,
    p_inline_customer_id:
      normalized.customerOrigin === "inline" ? normalized.customerId : null,
    p_inline_name: normalized.inlineName,
    p_inline_email: normalized.inlineEmail,
    p_inline_phone: normalized.inlinePhoneDigits,
    p_location_id: intent.locationId,
    p_service_id: intent.serviceId,
    p_staff_id: intent.staffId,
    p_requested_start: intent.requestedStart,
    p_requested_end: normalized.durableExpected.requestedEnd,
    p_requested_status: normalized.durableExpected.requestedStatus,
    p_duration_minutes: normalized.durableExpected.durationMinutes,
    p_room_id: normalized.durableExpected.roomId,
    p_resource_ids: normalized.durableExpected.resourceIds,
    p_package_id: normalized.durableExpected.packageId,
    p_package_name: normalized.durableExpected.packageName,
    p_subtotal_cents: normalized.durableExpected.subtotalCents,
    p_tax_cents: normalized.durableExpected.taxCents,
    p_deposit_required_cents:
      normalized.durableExpected.depositRequiredCents,
    p_payment_mode: normalized.paymentMode,
    p_appointment_notes: normalized.durableExpected.appointmentNotes,
    p_payment_note: normalized.paymentIntent.paymentKind === "none"
      ? normalized.bookingTuple[20]
      : normalized.bookingTuple[20],
    p_receipt_requested: normalized.receiptRequested,
    p_payment_kind: normalized.paymentIntent.paymentKind,
    p_payment_amount_cents: normalized.paymentIntent.amountCents,
    p_currency: normalized.paymentIntent.currency,
    p_method: normalized.paymentIntent.method,
    p_provider_route: normalized.paymentIntent.providerRoute,
  };
}

function createProductionDependencies(): BookingOperationKernelDependencies {
  return {
    // New operation admission remains deliberately inert until the separately
    // reviewed connected projection/workflow activation gate.
    admissionEnabled: false,
    resolveAuthority: resolveCurrentAuthority,
    validateAndPrice: validateAndPriceCurrent,
    async bootstrap(normalized) {
      await assertCurrentAuthority(normalized.authority);
      const { data, error } = await rpcService().rpc(
        "bootstrap_booking_operation_v1",
        bootstrapArgs(normalized),
      );
      return mapBootstrap(data, error);
    },
    async recoverAppointment(businessId, operationId) {
      const authority = await resolveCurrentAuthority();
      if (authority.businessId !== businessId) {
        throw new Error("Booking-operation authority changed.");
      }
      const { data, error } = await rpcService()
        .from("appointments")
        .select("id")
        .eq("business_id", businessId)
        .eq("booking_operation_id", operationId)
        .limit(2);
      if (error || (data?.length ?? 0) > 1) {
        throw new Error("Appointment recovery returned uncertain evidence.");
      }
      return data?.[0]?.id ?? null;
    },
    async createAppointment(normalized) {
      await assertCurrentAuthority(normalized.authority);
      const result = await createBooking(
        normalized.bookingIntent,
        durableOperationBookingPersistence(
          normalized.durableExpected,
          async (args) => {
            const { data, error } = await rpcService().rpc(
              "persist_booking_operation_appointment_v1",
              args,
            );
            return {
              data,
              error: error ? { message: error.message } : null,
            };
          },
        ),
      );
      if (result.phase === "success" && result.data?.appointmentId) {
        return { kind: "CREATED", appointmentId: result.data.appointmentId };
      }
      if (
        result.phase === "conflict" ||
        result.error === "DURABLE_BOOKING_PRICING_CHANGED"
      ) {
        return {
          kind: "CONFLICT",
          reason:
            result.error === "DURABLE_BOOKING_PRICING_CHANGED"
              ? result.error
              : "SLOT_CONFLICT",
        };
      }
      return {
        kind: "UNKNOWN",
        reason: result.error ?? "Appointment persistence is uncertain.",
      };
    },
    async bind(normalized, appointmentId) {
      await assertCurrentAuthority(normalized.authority);
      const { data, error } = await rpcService().rpc(
        "bind_booking_operation_appointment_v1",
        {
          p_business_id: normalized.authority.businessId,
          p_operation_id: normalized.identities.operationId,
          p_actor_id: normalized.authority.actorId,
          p_appointment_id: appointmentId,
        },
      );
      if (error) {
        return error.code === "42501"
          ? { kind: "NOT_AUTHORIZED" as const }
          : { kind: "UNKNOWN" as const, reason: "Binding failed." };
      }
      const row = firstRow(data);
      if (
        row &&
        (row.outcome === "BOUND" || row.outcome === "EXISTING") &&
        isCanonicalUuid(row.operation_id) &&
        isCanonicalUuid(row.appointment_id) &&
        isCanonicalUuid(row.attempt_id)
      ) {
        return {
          kind: row.outcome,
          operationId: row.operation_id,
          appointmentId: row.appointment_id,
          attemptId: row.attempt_id,
        };
      }
      if (row?.outcome === "CLOSED") return { kind: "CLOSED" };
      return { kind: "UNKNOWN", reason: "Binding returned invalid evidence." };
    },
    async close(normalized, reason) {
      await assertCurrentAuthority(normalized.authority);
      const { data, error } = await rpcService().rpc(
        "close_booking_operation_v1",
        {
          p_business_id: normalized.authority.businessId,
          p_operation_id: normalized.identities.operationId,
          p_actor_id: normalized.authority.actorId,
          p_reason: reason,
          p_expected_current_customer_id: null,
          p_replacement_customer_id: null,
          p_cancel: false,
        },
      );
      if (error) {
        return error.code === "42501"
          ? { kind: "NOT_AUTHORIZED" as const }
          : { kind: "UNKNOWN" as const, reason: "Close fence failed." };
      }
      const row = firstRow(data);
      if (
        row &&
        (row.outcome === "CLOSED" || row.outcome === "EXISTING") &&
        isCanonicalUuid(row.operation_id) &&
        isCanonicalUuid(row.attempt_id) &&
        (row.appointment_id === null || isCanonicalUuid(row.appointment_id)) &&
        typeof row.recorded === "boolean"
      ) {
        return {
          kind: row.outcome,
          operationId: row.operation_id,
          appointmentId: row.appointment_id as string | null,
          attemptId: row.attempt_id,
          recorded: row.recorded,
        };
      }
      if (row?.outcome === "RECOVERY_REQUIRED") {
        return { kind: "RECOVERY_REQUIRED", recorded: row.recorded === true };
      }
      return { kind: "UNKNOWN", reason: "Close returned invalid evidence." };
    },
    async commit(normalized, attemptId) {
      await assertCurrentAuthority(normalized.authority);
      const { data, error } = await rpcService().rpc(
        "commit_booking_operation_manual_payment_v1",
        {
          p_business_id: normalized.authority.businessId,
          p_operation_id: normalized.identities.operationId,
          p_actor_id: normalized.authority.actorId,
          p_attempt_id: attemptId,
        },
      );
      if (error) {
        return {
          kind: "UNKNOWN",
          attemptId,
          transactionId: null,
          recorded: false,
          synchronization: "UNKNOWN",
          reason: "Commit failed.",
        };
      }
      const row = firstRow(data);
      if (
        row &&
        (row.outcome === "RECORDED" || row.outcome === "REPLAY") &&
        row.attempt_id === attemptId &&
        isCanonicalUuid(row.transaction_id) &&
        row.recorded === true &&
        row.synchronization === "PENDING"
      ) {
        return {
          kind: row.outcome,
          attemptId,
          transactionId: row.transaction_id,
          recorded: true,
          synchronization: "PENDING",
        };
      }
      if (
        row?.outcome === "NOT_COMMITTABLE" &&
        row.attempt_id === attemptId
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
        transactionId: isCanonicalUuid(row?.transaction_id)
          ? row.transaction_id
          : null,
        recorded: row?.recorded === true,
        synchronization: "UNKNOWN",
        reason: "Commit returned non-canonical evidence.",
      };
    },
    read: readBookingOperationCanonical,
  };
}

function parseCanonicalPayload(payloadValue: unknown): BookingOperationReadResult {
  const payload = object(payloadValue);
  if (!payload) return { kind: "UNKNOWN", reason: "Canonical payload is malformed." };
  if (payload.found === false) return { kind: "ABSENT" };
  if (payload.found !== true) {
    return { kind: "UNKNOWN", reason: "Canonical payload has no visibility state." };
  }
  const operation = object(payload.operation);
  const attempt = object(payload.attempt);
  const appointment = payload.appointment === null ? null : object(payload.appointment);
  const ledger = payload.ledger === null ? null : object(payload.ledger);
  const events = Array.isArray(payload.events) ? payload.events : null;
  const obligations = Array.isArray(payload.obligations)
    ? payload.obligations
    : null;
  const appointmentCount = finiteInteger(payload.appointment_count);
  const attemptCount = finiteInteger(payload.attempt_count);
  const ledgerCount = finiteInteger(payload.ledger_count);
  if (
    !operation ||
    !attempt ||
    !events ||
    !obligations ||
    attemptCount !== 1 ||
    appointmentCount === null ||
    appointmentCount > 1 ||
    ledgerCount === null ||
    ledgerCount > 1 ||
    (appointmentCount === 1) !== Boolean(appointment) ||
    (ledgerCount === 1) !== Boolean(ledger)
  ) {
    return { kind: "UNKNOWN", reason: "Canonical relation counts contradict." };
  }

  const operationId = operation.id;
  const actorId = operation.actor_id;
  const attemptId = attempt.id;
  const appointmentId = appointment?.id ?? null;
  if (
    !isCanonicalUuid(operationId) ||
    !isCanonicalUuid(actorId) ||
    !isCanonicalUuid(attemptId) ||
    (appointmentId !== null && !isCanonicalUuid(appointmentId)) ||
    attempt.booking_operation_id !== operationId ||
    (appointment && appointment.booking_operation_id !== operationId) ||
    (attempt.appointment_id !== null &&
      attempt.appointment_id !== appointmentId)
  ) {
    return { kind: "UNKNOWN", reason: "Canonical identities contradict." };
  }
  const lifecycleState = operation.lifecycle_state;
  const executionState = attempt.execution_state;
  const paymentMode = operation.payment_mode;
  const source = operation.source;
  if (
    !["OPEN", "APPOINTMENT_CREATED", "CLOSED"].includes(String(lifecycleState)) ||
    !["REQUESTED", "ACCEPTED", "FAILED", "SKIPPED"].includes(
      String(executionState),
    ) ||
    !["none", "deposit", "full", "custom"].includes(String(paymentMode)) ||
    !["booking_sheet", "quick_appointment"].includes(String(source)) ||
    (lifecycleState === "APPOINTMENT_CREATED" && !appointment)
  ) {
    return { kind: "UNKNOWN", reason: "Canonical lifecycle is contradictory." };
  }

  const parsedEvents = events.map((value) => {
    const event = object(value);
    return event &&
      isCanonicalUuid(event.id) &&
      finiteInteger(event.sequence) !== null &&
      typeof event.type === "string" &&
      typeof event.money_state === "string" &&
      typeof event.occurred_at === "string"
      ? {
          id: event.id,
          sequence: event.sequence as number,
          type: event.type,
          moneyState: event.money_state,
          failureClass: stringOrNull(event.failure_class) ?? null,
          failureCode: stringOrNull(event.failure_code) ?? null,
          occurredAt: event.occurred_at,
        }
      : null;
  });
  const parsedObligations = obligations.map((value) => {
    const obligation = object(value);
    return obligation &&
      typeof obligation.kind === "string" &&
      typeof obligation.state === "string" &&
      typeof obligation.updated_at === "string"
      ? {
          kind: obligation.kind,
          state: obligation.state,
          failureCode: stringOrNull(obligation.failure_code) ?? null,
          updatedAt: obligation.updated_at,
          completedAt: stringOrNull(obligation.completed_at) ?? null,
        }
      : null;
  });
  if (parsedEvents.some((value) => value === null) || parsedObligations.some((value) => value === null)) {
    return { kind: "UNKNOWN", reason: "Canonical history is malformed." };
  }
  for (let index = 1; index < parsedEvents.length; index += 1) {
    if (
      (parsedEvents[index - 1]?.sequence ?? 0) >=
      (parsedEvents[index]?.sequence ?? 0)
    ) {
      return { kind: "UNKNOWN", reason: "Canonical event order contradicts." };
    }
  }
  if (
    new Set(parsedObligations.map((value) => value?.kind)).size !==
    parsedObligations.length
  ) {
    return { kind: "UNKNOWN", reason: "Canonical obligations are duplicated." };
  }

  let operatorState: BookingOperationFoundSnapshot["operatorState"] = "UNKNOWN";
  let synchronization: BookingOperationFoundSnapshot["synchronization"] = "UNKNOWN";
  let recoveryAction: BookingOperationFoundSnapshot["recoveryAction"] = "REVIEW";
  if (executionState === "SKIPPED" && ledgerCount === 0 && obligations.length === 0) {
    operatorState = "NOT_RECORDED";
    synchronization = "NOT_REQUIRED";
    recoveryAction = appointment ? "NONE" : lifecycleState === "CLOSED" ? "NONE" : "CREATE_APPOINTMENT";
  } else if (executionState === "FAILED" && ledgerCount === 0) {
    operatorState = "NOT_RECORDED";
    synchronization = "NOT_REQUIRED";
    recoveryAction = "NONE";
  } else if (executionState === "REQUESTED" && ledgerCount === 0 && appointment) {
    operatorState = "PAYMENT_RECOVERY_REQUIRED";
    synchronization = "PENDING";
    recoveryAction = attempt.appointment_id ? "COMMIT_PAYMENT" : "BIND_APPOINTMENT";
  } else if (
    executionState === "ACCEPTED" &&
    ledgerCount === 1 &&
    obligations.length === 4 &&
    parsedObligations.every((value) => value && OBLIGATION_KINDS.has(value.kind))
  ) {
    const complete = parsedObligations.every(
      (value) =>
        value?.state === "COMPLETE" || value?.state === "NOT_REQUIRED",
    );
    operatorState = complete
      ? "RECORDED"
      : "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED";
    synchronization = complete ? "COMPLETE" : "PENDING";
    recoveryAction = complete ? "NONE" : "REVIEW";
  } else if (executionState === "REQUESTED" && ledgerCount === 0 && !appointment) {
    operatorState = "PAYMENT_RECOVERY_REQUIRED";
    synchronization = "PENDING";
    recoveryAction = "CREATE_APPOINTMENT";
  }

  const transactionId = ledger?.id ?? null;
  if (
    (transactionId !== null && !isCanonicalUuid(transactionId)) ||
    (ledger &&
      (ledger.appointment_id !== appointmentId ||
        ledger.amount_cents !== attempt.amount_cents ||
        ledger.currency !== attempt.currency ||
        ledger.method !== attempt.method ||
        ledger.kind !== attempt.payment_kind ||
        ledger.status !== "succeeded" ||
        ledger.provider !== attempt.provider_route))
  ) {
    return { kind: "UNKNOWN", reason: "Canonical ledger identity is malformed." };
  }
  const closeReason = stringOrNull(operation.close_reason);
  const method = stringOrNull(attempt.method);
  const failureClass = stringOrNull(attempt.failure_class);
  const failureCode = stringOrNull(attempt.failure_code);
  const resolvedAt = stringOrNull(attempt.resolved_at);
  const providerRoute = stringOrNull(attempt.provider_route);
  const paymentKind = attempt.payment_kind;
  const recoveryDisposition = attempt.recovery_disposition;
  if (
    closeReason === undefined ||
    method === undefined ||
    failureClass === undefined ||
    failureCode === undefined ||
    resolvedAt === undefined ||
    providerRoute === undefined ||
    (closeReason !== null && !CLOSE_REASONS.has(closeReason)) ||
    (method !== null && !MANUAL_METHODS.has(method)) ||
    !["payment", "deposit", "none"].includes(String(paymentKind)) ||
    !["RECOVER", "DO_NOT_RETRY", "NEW_ATTEMPT_ALLOWED"].includes(
      String(recoveryDisposition),
    ) ||
    typeof operation.created_at !== "string" ||
    typeof operation.updated_at !== "string" ||
    typeof attempt.created_at !== "string" ||
    !Number.isFinite(new Date(operation.created_at).getTime()) ||
    !Number.isFinite(new Date(operation.updated_at).getTime()) ||
    !Number.isFinite(new Date(attempt.created_at).getTime()) ||
    (resolvedAt !== null &&
      !Number.isFinite(new Date(resolvedAt).getTime())) ||
    finiteInteger(attempt.amount_cents) === null ||
    typeof attempt.currency !== "string" ||
    !/^[a-z]{3}$/.test(attempt.currency) ||
    (executionState === "SKIPPED" &&
      (paymentKind !== "none" ||
        recoveryDisposition !== "DO_NOT_RETRY" ||
        providerRoute !== null ||
        method !== null ||
        attempt.amount_cents !== 0 ||
        ledgerCount !== 0)) ||
    (executionState === "ACCEPTED" &&
      (paymentKind === "none" ||
        providerRoute !== "manual" ||
        ledgerCount !== 1)) ||
    ((failureClass === null) !== (failureCode === null)) ||
    (executionState === "FAILED"
      ? failureClass === null || resolvedAt === null
      : failureClass !== null) ||
    (executionState === "REQUESTED"
      ? resolvedAt !== null
      : resolvedAt === null) ||
    (lifecycleState === "CLOSED"
      ? closeReason === null
      : closeReason !== null)
  ) {
    return { kind: "UNKNOWN", reason: "Canonical scalar fields are malformed." };
  }

  return {
    kind: "FOUND",
    snapshot: {
      operationId,
      actorId,
      source: source as BookingOperationFoundSnapshot["source"],
      lifecycleState:
        lifecycleState as BookingOperationFoundSnapshot["lifecycleState"],
      closeReason:
        closeReason as BookingOperationFoundSnapshot["closeReason"],
      createdAt: operation.created_at,
      updatedAt: operation.updated_at,
      appointmentId,
      appointmentSaved: appointment !== null,
      attemptId,
      executionState:
        executionState as BookingOperationFoundSnapshot["executionState"],
      recoveryDisposition:
        recoveryDisposition as BookingOperationFoundSnapshot["recoveryDisposition"],
      paymentMode:
        paymentMode as BookingOperationFoundSnapshot["paymentMode"],
      paymentKind:
        paymentKind as BookingOperationFoundSnapshot["paymentKind"],
      amountCents: attempt.amount_cents as number,
      currency: attempt.currency,
      method: method as BookingOperationFoundSnapshot["method"],
      failureClass,
      failureCode,
      attemptCreatedAt: attempt.created_at,
      attemptResolvedAt: resolvedAt,
      events: parsedEvents as BookingOperationFoundSnapshot["events"],
      transactionId,
      ledgerCount,
      rawRecorded: ledgerCount === 1,
      obligations:
        parsedObligations as BookingOperationFoundSnapshot["obligations"],
      operatorState,
      synchronization,
      recoveryAction,
      communicationEligibility: "NOT_IMPLEMENTED",
      consistency: "SINGLE_STATEMENT_READ_COMMITTED",
    },
  };
}

function decodeCursor(
  cursor: BookingOperationHistoryCursor | undefined,
): { attentionRank: number; createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const value = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as unknown;
    const row = object(value);
    if (
      !row ||
      (row.attentionRank !== 0 && row.attentionRank !== 1) ||
      typeof row.createdAt !== "string" ||
      !Number.isFinite(new Date(row.createdAt).getTime()) ||
      !isCanonicalUuid(row.id)
    ) {
      throw new Error("invalid");
    }
    return {
      attentionRank: row.attentionRank,
      createdAt: new Date(row.createdAt).toISOString(),
      id: row.id,
    };
  } catch {
    throw new Error("History cursor is invalid.");
  }
}

function encodeCursor(value: JsonRecord): BookingOperationHistoryCursor | null {
  if (
    (value.attention_rank !== 0 && value.attention_rank !== 1) ||
    typeof value.created_at !== "string" ||
    !isCanonicalUuid(value.id)
  ) {
    return null;
  }
  return Buffer.from(
    JSON.stringify({
      attentionRank: value.attention_rank,
      createdAt: value.created_at,
      id: value.id,
    }),
    "utf8",
  ).toString("base64url") as BookingOperationHistoryCursor;
}

export async function readBookingOperationCanonical(
  operationId: string,
): Promise<BookingOperationReadResult> {
  let canonicalOperationId: string;
  try {
    canonicalOperationId = assertCanonicalUuid(operationId, "operationId");
  } catch (error) {
    return {
      kind: "UNKNOWN",
      reason: error instanceof Error ? error.message : "Operation identity is invalid.",
    };
  }
  const authority = await resolveCurrentAuthority();
  const { data, error } = await rpcService().rpc("read_booking_operations_v1", {
    p_business_id: authority.businessId,
    p_actor_id: authority.actorId,
    p_mode: "one",
    p_operation_id: canonicalOperationId,
    p_cursor_attention_rank: null,
    p_cursor_created_at: null,
    p_cursor_id: null,
    p_limit: 1,
  });
  if (error) {
    return error.code === "42501"
      ? { kind: "NOT_AUTHORIZED" }
      : { kind: "UNKNOWN", reason: "Canonical operation read failed." };
  }
  const row = firstRow(data);
  return row
    ? parseCanonicalPayload(row.payload)
    : { kind: "UNKNOWN", reason: "Canonical operation read returned invalid evidence." };
}

export async function listBookingOperationHistory(input?: {
  cursor?: BookingOperationHistoryCursor;
  limit?: number;
}): Promise<BookingOperationHistoryPage> {
  let cursor: ReturnType<typeof decodeCursor>;
  try {
    cursor = decodeCursor(input?.cursor);
  } catch (error) {
    return {
      kind: "UNKNOWN",
      reason: error instanceof Error ? error.message : "History cursor is invalid.",
    };
  }
  const limit = input?.limit ?? 20;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    return { kind: "UNKNOWN", reason: "History limit must be between 1 and 50." };
  }
  const authority = await resolveCurrentAuthority();
  const { data, error } = await rpcService().rpc("read_booking_operations_v1", {
    p_business_id: authority.businessId,
    p_actor_id: authority.actorId,
    p_mode: "history",
    p_operation_id: null,
    p_cursor_attention_rank: cursor?.attentionRank ?? null,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: limit,
  });
  if (error) {
    return error.code === "42501"
      ? { kind: "NOT_AUTHORIZED" }
      : { kind: "UNKNOWN", reason: "Booking-operation history read failed." };
  }
  const row = firstRow(data);
  const payload = object(row?.payload);
  const rawItems = payload && Array.isArray(payload.items) ? payload.items : null;
  if (!payload || !rawItems) {
    return { kind: "UNKNOWN", reason: "History returned invalid evidence." };
  }
  const items: BookingOperationHistorySummary[] = [];
  for (const raw of rawItems) {
    const summary = object(raw);
    const closeReason = stringOrNull(summary?.close_reason);
    const method = stringOrNull(summary?.method);
    const amountCents = finiteInteger(summary?.amount_cents);
    const ledgerCount = finiteInteger(summary?.ledger_count);
    const transactionId =
      summary?.transaction_id === null ? null : summary?.transaction_id;
    if (
      !summary ||
      !isCanonicalUuid(summary.operation_id) ||
      (summary.appointment_id !== null &&
        !isCanonicalUuid(summary.appointment_id)) ||
      !isCanonicalUuid(summary.attempt_id) ||
      !["booking_sheet", "quick_appointment"].includes(String(summary.source)) ||
      !["OPEN", "APPOINTMENT_CREATED", "CLOSED"].includes(
        String(summary.lifecycle_state),
      ) ||
      !["REQUESTED", "ACCEPTED", "FAILED", "SKIPPED"].includes(
        String(summary.execution_state),
      ) ||
      !["none", "deposit", "full", "custom"].includes(
        String(summary.payment_mode),
      ) ||
      !["NOT_RECORDED", "PAYMENT_RECOVERY_REQUIRED", "RECORDED", "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED", "UNKNOWN"].includes(
        String(summary.operator_state),
      ) ||
      !["NOT_REQUIRED", "PENDING", "COMPLETE", "UNKNOWN"].includes(
        String(summary.synchronization),
      ) ||
      !["NONE", "CREATE_APPOINTMENT", "BIND_APPOINTMENT", "COMMIT_PAYMENT", "REVIEW"].includes(
        String(summary.recovery_action),
      ) ||
      closeReason === undefined ||
      (closeReason !== null && !CLOSE_REASONS.has(closeReason)) ||
      method === undefined ||
      (method !== null && !MANUAL_METHODS.has(method)) ||
      amountCents === null ||
      ledgerCount === null ||
      ledgerCount > 1 ||
      typeof summary.currency !== "string" ||
      !/^[a-z]{3}$/.test(summary.currency) ||
      typeof summary.created_at !== "string" ||
      typeof summary.updated_at !== "string" ||
      !Number.isFinite(new Date(summary.created_at).getTime()) ||
      !Number.isFinite(new Date(summary.updated_at).getTime()) ||
      (ledgerCount === 0
        ? transactionId !== null
        : !isCanonicalUuid(transactionId))
    ) {
      return { kind: "UNKNOWN", reason: "History summary is malformed." };
    }
    items.push({
      operationId: summary.operation_id,
      source: summary.source as BookingOperationHistorySummary["source"],
      lifecycleState:
        summary.lifecycle_state as BookingOperationHistorySummary["lifecycleState"],
      closeReason:
        closeReason as BookingOperationHistorySummary["closeReason"],
      createdAt: summary.created_at,
      updatedAt: summary.updated_at,
      appointmentId: summary.appointment_id as string | null,
      appointmentSaved: summary.appointment_id !== null,
      attemptId: summary.attempt_id,
      executionState:
        summary.execution_state as BookingOperationHistorySummary["executionState"],
      paymentMode:
        summary.payment_mode as BookingOperationHistorySummary["paymentMode"],
      amountCents,
      currency: summary.currency,
      method:
        method as BookingOperationHistorySummary["method"],
      transactionId: transactionId as string | null,
      ledgerCount,
      rawRecorded: ledgerCount === 1,
      operatorState:
        summary.operator_state as BookingOperationHistorySummary["operatorState"],
      synchronization:
        summary.synchronization as BookingOperationHistorySummary["synchronization"],
      recoveryAction:
        summary.recovery_action as BookingOperationHistorySummary["recoveryAction"],
    });
  }
  const nextCursorRaw =
    payload.next_cursor === null ? null : object(payload.next_cursor);
  const nextCursor =
    nextCursorRaw === null ? null : encodeCursor(nextCursorRaw);
  if (nextCursorRaw && !nextCursor) {
    return { kind: "UNKNOWN", reason: "History cursor evidence is malformed." };
  }
  return { kind: "PAGE", items, nextCursor };
}

async function runPreparedForSource(
  source: BookingOperationSource,
  request: Omit<BookingOperationRequest, "source">,
): Promise<BookingOperationKernelResult> {
  return runBookingOperationKernel(
    { ...request, source },
    createProductionDependencies(),
  );
}

export async function runPreparedBookingSheetOperation(
  request: Omit<BookingOperationRequest, "source">,
): Promise<BookingOperationKernelResult> {
  return runPreparedForSource("booking_sheet", request);
}

export async function runPreparedQuickAppointmentOperation(
  request: Omit<BookingOperationRequest, "source">,
): Promise<BookingOperationKernelResult> {
  return runPreparedForSource("quick_appointment", request);
}
