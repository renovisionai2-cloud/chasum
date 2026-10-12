// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createBookingOperationIdentities,
  normalizeBookingOperation,
  rotateBookingOperationIdentities,
} from "@/lib/commerce/booking-operations/normalize";
import type {
  AuthoritativeBookingSnapshot,
  BookingOperationRequest,
} from "@/lib/commerce/booking-operations/types";

const BUSINESS_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const LOCATION_ID = "33333333-3333-4333-8333-333333333333";
const SERVICE_ID = "44444444-4444-4444-8444-444444444444";
const STAFF_ID = "55555555-5555-4555-8555-555555555555";
const ACTOR_ID = "66666666-6666-4666-8666-666666666666";
const OPERATION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ATTEMPT_KEY = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const INLINE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const snapshot: AuthoritativeBookingSnapshot = {
  requestedEnd: "2026-10-08T15:00:00.000Z",
  requestedStatus: "confirmed",
  durationMinutes: 60,
  subtotalCents: 10_000,
  taxCents: 0,
  depositRequiredCents: 5_000,
  appointmentNotes: null,
};

function request(
  overrides: Partial<BookingOperationRequest> = {},
): BookingOperationRequest {
  return {
    identities: {
      operationId: OPERATION_ID,
      attemptKey: ATTEMPT_KEY,
      inlineCustomerId: INLINE_ID,
    },
    source: "booking_sheet",
    customer: { mode: "existing", customerId: CUSTOMER_ID },
    booking: {
      channel: "staff",
      locationId: LOCATION_ID,
      serviceId: SERVICE_ID,
      staffId: STAFF_ID,
      requestedStart: "2026-10-08T14:00:00.000Z",
      resourceIds: [],
    },
    payment: {
      mode: "deposit",
      method: "e_transfer",
      note: " Front desk ",
      receiptRequested: true,
    },
    ...overrides,
  };
}

describe("durable booking-operation normalization", () => {
  it("matches the literal cross-language customer, booking, and payment vectors", () => {
    const normalized = normalizeBookingOperation(
      { actorId: ACTOR_ID, businessId: BUSINESS_ID, currency: "CAD" },
      request(),
      snapshot,
    );

    expect(normalized.customerInputCanonicalUtf8).toBe(
      '["chasum.booking-customer-input",1,"existing","22222222-2222-4222-8222-222222222222",null,null,null]',
    );
    expect(normalized.customerInputFingerprint).toBe(
      "v1:8114e0705028bcb1a6af08c8a209a3a07f9e1453eb74b001f02409d42b68cfff",
    );
    expect(normalized.bookingCanonicalUtf8).toBe(
      '["chasum.booking-operation",1,"11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222","33333333-3333-4333-8333-333333333333","44444444-4444-4444-8444-444444444444","55555555-5555-4555-8555-555555555555","2026-10-08T14:00:00.000Z","2026-10-08T15:00:00.000Z","confirmed",60,null,[],null,null,10000,0,5000,"deposit",null,"Front desk",true]',
    );
    expect(normalized.bookingFingerprint).toBe(
      "v1:078131ec379301c6181ed8a74e742a1420aab2582ea972c4b23e8b989496780a",
    );
    expect(normalized.paymentIntent.canonicalUtf8).toBe(
      '["chasum.payment-attempt",1,"11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222","booking_operation","aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",5000,"cad","e_transfer","deposit","manual",null]',
    );
    expect(normalized.paymentIntent.fingerprint).toBe(
      "v1:bab0cff753a9719d785ae15821405c74b2fa38bf71cff0dd830592de39f40ff1",
    );

    const resourceRequest = request();
    resourceRequest.booking.resourceIds = [
      "88888888-8888-4888-8888-888888888888",
      "77777777-7777-4777-8777-777777777777",
    ];
    const withResources = normalizeBookingOperation(
      { actorId: ACTOR_ID, businessId: BUSINESS_ID, currency: "CAD" },
      resourceRequest,
      snapshot,
    );
    expect(withResources.bookingCanonicalUtf8).toContain(
      '["77777777-7777-4777-8777-777777777777","88888888-8888-4888-8888-888888888888"]',
    );
    expect(withResources.bookingFingerprint).toBe(
      "v1:df71428681de3da5e8249765c9d59cd3c3aa36a304b5686c7aa0aefb3a3d220c",
    );
  });

  it("normalizes inline identity before either booking or payment tuple", () => {
    const normalized = normalizeBookingOperation(
      { actorId: ACTOR_ID, businessId: BUSINESS_ID, currency: "cad" },
      request({
        source: "quick_appointment",
        customer: {
          mode: "inline",
          inlineCustomerId: INLINE_ID,
          name: "  Jordan Lee ",
          email: " JORDAN@EXAMPLE.COM ",
          phone: "+1 (905) 555-0100",
        },
        payment: { mode: "none" },
      }),
      snapshot,
    );

    expect(normalized.customerId).toBe(INLINE_ID);
    expect(normalized.inlineName).toBe("Jordan Lee");
    expect(normalized.inlineEmail).toBe("jordan@example.com");
    expect(normalized.inlinePhoneDigits).toBe("19055550100");
    expect(normalized.bookingTuple[3]).toBe(INLINE_ID);
    expect(normalized.paymentIntent.customerId).toBe(INLINE_ID);
    expect(normalized.paymentIntent).toMatchObject({
      amountCents: 0,
      method: null,
      paymentKind: "none",
      providerRoute: null,
    });
  });

  it("creates and rotates all three opaque identities together", () => {
    const first = createBookingOperationIdentities();
    const second = rotateBookingOperationIdentities(first);
    for (const value of [...Object.values(first), ...Object.values(second)]) {
      expect(value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
    expect(
      new Set([...Object.values(first), ...Object.values(second)]).size,
    ).toBe(6);
  });

  it("rejects malformed identities and every unsupported tender before admission", () => {
    expect(() =>
      normalizeBookingOperation(
        { actorId: ACTOR_ID, businessId: BUSINESS_ID, currency: "cad" },
        request({
          identities: {
            operationId: "bad",
            attemptKey: ATTEMPT_KEY,
            inlineCustomerId: INLINE_ID,
          },
        }),
        snapshot,
      ),
    ).toThrow("operationId");
    expect(() =>
      normalizeBookingOperation(
        { actorId: ACTOR_ID, businessId: BUSINESS_ID, currency: "cad" },
        request({
          payment: {
            mode: "deposit",
            method: "gift_card",
          } as never,
        }),
        snapshot,
      ),
    ).toThrow("outside the durable manual path");
    expect(() =>
      normalizeBookingOperation(
        { actorId: ACTOR_ID, businessId: BUSINESS_ID, currency: "cad" },
        request({ payment: { mode: "custom", method: "cash", customAmountCents: 10_001 } }),
        snapshot,
      ),
    ).toThrow("no more than the total");
  });
});
