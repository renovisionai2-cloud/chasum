import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { paymentKindForAmount } from "@/lib/commerce/booking-financials";
import {
  assertCanonicalUuid,
  assertSupportedBusinessCurrency,
  normalizePaymentIntentV1,
} from "@/lib/commerce/payment-attempts/normalize";
import type {
  AuthoritativeBookingSnapshot,
  BookingOperationAuthority,
  BookingOperationIdentities,
  BookingOperationRequest,
  NormalizedBookingOperation,
} from "./types";

const BOOKING_SOURCES = new Set(["booking_sheet", "quick_appointment"]);
const MANUAL_METHODS = new Set([
  "cash",
  "e_transfer",
  "debit_card",
  "credit_card",
  "other",
]);

function fingerprint(canonicalUtf8: string): `v1:${string}` {
  return `v1:${createHash("sha256")
    .update(canonicalUtf8, "utf8")
    .digest("hex")}`;
}

function nullableTrimmed(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function canonicalTimestamp(value: string, field: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`${field} must be a finite ISO timestamp.`);
  }
  return date.toISOString();
}

function nonnegativeCents(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
  return value;
}

export function createBookingOperationIdentities(): BookingOperationIdentities {
  return {
    operationId: randomUUID(),
    attemptKey: randomUUID(),
    inlineCustomerId: randomUUID(),
  };
}

export function rotateBookingOperationIdentities(
  previous: BookingOperationIdentities,
): BookingOperationIdentities {
  const next = createBookingOperationIdentities();
  if (
    next.operationId === previous.operationId ||
    next.attemptKey === previous.attemptKey ||
    next.inlineCustomerId === previous.inlineCustomerId
  ) {
    return rotateBookingOperationIdentities(previous);
  }
  return next;
}

export function normalizeBookingOperation(
  authority: BookingOperationAuthority,
  request: BookingOperationRequest,
  snapshot: AuthoritativeBookingSnapshot,
): NormalizedBookingOperation {
  const businessId = assertCanonicalUuid(authority.businessId, "businessId");
  const actorId = assertCanonicalUuid(authority.actorId, "actorId");
  const currency = assertSupportedBusinessCurrency(authority.currency);
  const operationId = assertCanonicalUuid(
    request.identities.operationId,
    "operationId",
  );
  const attemptKey = assertCanonicalUuid(
    request.identities.attemptKey,
    "attemptKey",
  );
  const inlineCandidateId = assertCanonicalUuid(
    request.identities.inlineCustomerId,
    "inlineCustomerId",
  );
  if (
    new Set([operationId, attemptKey, inlineCandidateId]).size !== 3
  ) {
    throw new Error("Operation, attempt, and inline-customer identities must differ.");
  }
  if (!BOOKING_SOURCES.has(request.source)) {
    throw new Error("Booking source is not a trusted durable entry point.");
  }

  let customerId: string;
  let inlineName: string | null = null;
  let inlineEmail: string | null = null;
  let inlinePhoneDigits: string | null = null;
  if (request.customer.mode === "existing") {
    customerId = assertCanonicalUuid(
      request.customer.customerId,
      "customerId",
    );
  } else {
    customerId = assertCanonicalUuid(
      request.customer.inlineCustomerId,
      "inlineCustomerId",
    );
    if (customerId !== inlineCandidateId) {
      throw new Error("Inline-customer identity changed within the operation.");
    }
    inlineName = nullableTrimmed(request.customer.name);
    inlineEmail = nullableTrimmed(request.customer.email)?.toLowerCase() ?? null;
    inlinePhoneDigits =
      nullableTrimmed(request.customer.phone)?.replace(/\D/g, "") || null;
    if (!inlineName) throw new Error("Customer name is required.");
    if (!inlineEmail || !inlineEmail.includes("@")) {
      throw new Error("Customer email is required.");
    }
  }

  const locationId = assertCanonicalUuid(
    request.booking.locationId,
    "locationId",
  );
  const serviceId = assertCanonicalUuid(
    request.booking.serviceId,
    "serviceId",
  );
  const staffId = request.booking.staffId
    ? assertCanonicalUuid(request.booking.staffId, "staffId")
    : null;
  const roomId = request.booking.roomId
    ? assertCanonicalUuid(request.booking.roomId, "roomId")
    : null;
  const packageId = request.booking.packageId
    ? assertCanonicalUuid(request.booking.packageId, "packageId")
    : null;
  const packageName = nullableTrimmed(request.booking.packageName);
  if ((packageId === null) !== (packageName === null)) {
    throw new Error("Package identity and name must be supplied together.");
  }

  const originalResourceIds = request.booking.resourceIds ?? [];
  const resourceIds = originalResourceIds
    .map((id) => assertCanonicalUuid(id, "resourceId"))
    .sort();
  if (new Set(resourceIds).size !== resourceIds.length) {
    throw new Error("Resource identities must be unique.");
  }

  const requestedStart = canonicalTimestamp(
    request.booking.requestedStart,
    "requestedStart",
  );
  const requestedEnd = canonicalTimestamp(
    snapshot.requestedEnd,
    "requestedEnd",
  );
  if (new Date(requestedEnd).getTime() <= new Date(requestedStart).getTime()) {
    throw new Error("Booking end must be after its start.");
  }
  if (
    !Number.isSafeInteger(snapshot.durationMinutes) ||
    snapshot.durationMinutes <= 0
  ) {
    throw new Error("durationMinutes must be a positive integer.");
  }

  const subtotalCents = nonnegativeCents(
    snapshot.subtotalCents,
    "subtotalCents",
  );
  const taxCents = nonnegativeCents(snapshot.taxCents, "taxCents");
  const depositRequiredCents = nonnegativeCents(
    snapshot.depositRequiredCents,
    "depositRequiredCents",
  );
  const appointmentTotalCents = subtotalCents + taxCents;
  if (
    !Number.isSafeInteger(appointmentTotalCents) ||
    depositRequiredCents > appointmentTotalCents
  ) {
    throw new Error("Deposit and total are inconsistent.");
  }

  const paymentMode = request.payment.mode;
  const method =
    paymentMode === "none" ? null : request.payment.method ?? null;
  if (method !== null && !MANUAL_METHODS.has(method)) {
    throw new Error("Payment method is outside the durable manual path.");
  }
  let amountCents: number;
  if (paymentMode === "none") {
    if (method !== null || request.payment.customAmountCents != null) {
      throw new Error("No-payment mode cannot include a tender.");
    }
    amountCents = 0;
  } else if (paymentMode === "deposit") {
    if (
      depositRequiredCents <= 0 ||
      depositRequiredCents > appointmentTotalCents
    ) {
      throw new Error("A configured positive deposit is required.");
    }
    amountCents = depositRequiredCents;
  } else if (paymentMode === "full") {
    if (appointmentTotalCents <= 0) {
      throw new Error("Full payment requires a positive appointment total.");
    }
    amountCents = appointmentTotalCents;
  } else {
    const customAmountCents = request.payment.customAmountCents;
    if (
      typeof customAmountCents !== "number" ||
      !Number.isSafeInteger(customAmountCents) ||
      customAmountCents <= 0 ||
      customAmountCents > appointmentTotalCents
    ) {
      throw new Error("Custom payment must be positive and no more than the total.");
    }
    amountCents = customAmountCents;
  }
  const paymentKind =
    paymentMode === "none"
      ? "none"
      : paymentMode === "deposit"
        ? "deposit"
        : paymentMode === "full"
          ? "payment"
          : paymentKindForAmount(
              amountCents,
              depositRequiredCents,
              appointmentTotalCents,
            );
  const paymentNote = nullableTrimmed(request.payment.note);
  const appointmentNotes = nullableTrimmed(snapshot.appointmentNotes);
  const receiptRequested = request.payment.receiptRequested === true;

  const customerInputTuple = [
    "chasum.booking-customer-input",
    1,
    request.customer.mode,
    customerId,
    inlineName,
    inlineEmail,
    inlinePhoneDigits,
  ] as const;
  const customerInputCanonicalUtf8 = JSON.stringify(customerInputTuple);
  const bookingTuple = [
    "chasum.booking-operation",
    1,
    businessId,
    customerId,
    locationId,
    serviceId,
    staffId,
    requestedStart,
    requestedEnd,
    snapshot.requestedStatus,
    snapshot.durationMinutes,
    roomId,
    resourceIds,
    packageId,
    packageName,
    subtotalCents,
    taxCents,
    depositRequiredCents,
    paymentMode,
    appointmentNotes,
    paymentNote,
    receiptRequested,
  ] as const;
  const bookingCanonicalUtf8 = JSON.stringify(bookingTuple);
  const paymentIntent = normalizePaymentIntentV1({
    businessId,
    customerId,
    target: "booking_operation",
    targetId: operationId,
    amountCents,
    currency,
    method,
    paymentKind,
    providerRoute: paymentMode === "none" ? null : "manual",
    instrumentId: null,
  });

  const durableExpected = {
    operationId,
    actorId,
    customerId,
    requestedEnd,
    requestedStatus: snapshot.requestedStatus,
    durationMinutes: snapshot.durationMinutes,
    appointmentNotes,
    roomId,
    resourceIds,
    packageId,
    packageName,
    subtotalCents,
    taxCents,
    depositRequiredCents,
  };

  return {
    authority: { actorId, businessId, currency },
    identities: { operationId, attemptKey, inlineCustomerId: inlineCandidateId },
    source: request.source,
    customerOrigin: request.customer.mode,
    customerId,
    inlineName,
    inlineEmail,
    inlinePhoneDigits,
    customerInputTuple,
    customerInputCanonicalUtf8,
    customerInputFingerprint: fingerprint(customerInputCanonicalUtf8),
    bookingTuple,
    bookingCanonicalUtf8,
    bookingFingerprint: fingerprint(bookingCanonicalUtf8),
    paymentIntent,
    bookingIntent: {
      ...request.booking,
      businessId,
      customerId,
      requestedStart,
      requestedEnd,
      requestedStatus: snapshot.requestedStatus,
      durationMinutes: snapshot.durationMinutes,
      notes: appointmentNotes,
      resourceIds,
      roomId,
      packageId: packageId ?? undefined,
      packageName: packageName ?? undefined,
      priceCents: subtotalCents,
      taxCents,
      depositCents: depositRequiredCents,
      durableOperation: durableExpected,
    },
    durableExpected,
    paymentMode,
    receiptRequested,
  };
}
