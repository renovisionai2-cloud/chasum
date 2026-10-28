// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  normalizePaymentIntentV1,
  normalizeR1aManualIntent,
} from "@/lib/commerce/payment-attempts/normalize";
import type {
  PaymentAttemptKind,
  PaymentAttemptMethod,
  PaymentAttemptProvider,
  PaymentAttemptTarget,
} from "@/lib/commerce/payment-attempts/types";

type Vector = {
  name: string;
  tuple: [
    "chasum.payment-attempt",
    1,
    string,
    string,
    PaymentAttemptTarget,
    string | null,
    number,
    string,
    PaymentAttemptMethod | null,
    PaymentAttemptKind,
    PaymentAttemptProvider,
    string | null,
  ];
  canonical_utf8: string;
  sha256: string;
  fingerprint: `v1:${string}`;
};

const fixture = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "tests/fixtures/fingerprint-v1-reference-vectors.json",
    ),
    "utf8",
  ),
) as { vectors: Vector[] };

describe("payment-attempt fingerprint v1", () => {
  it.each(fixture.vectors)(
    "matches literal vector $name",
    ({ tuple, canonical_utf8, fingerprint }) => {
      const normalized = normalizePaymentIntentV1({
        businessId: tuple[2],
        customerId: tuple[3],
        target: tuple[4],
        targetId: tuple[5],
        amountCents: tuple[6],
        currency: tuple[7],
        method: tuple[8],
        paymentKind: tuple[9],
        providerRoute: tuple[10],
        instrumentId: tuple[11],
      });
      expect(normalized.tuple).toEqual(tuple);
      expect(normalized.canonicalUtf8).toBe(canonical_utf8);
      expect(normalized.fingerprint).toBe(fingerprint);
    },
  );

  it("normalizes casing but rejects malformed tuple relationships", () => {
    const normalized = normalizePaymentIntentV1({
      businessId: "11111111-1111-4111-8111-111111111111",
      customerId: "22222222-2222-4222-8222-222222222222",
      target: "customer",
      targetId: null,
      amountCents: 500,
      currency: "CAD",
      method: "cash",
      paymentKind: "payment",
      providerRoute: "manual",
      instrumentId: null,
    });
    expect(normalized.currency).toBe("cad");
    expect(() =>
      normalizePaymentIntentV1({
        ...normalized,
        amountCents: 0,
      }),
    ).toThrow("amountCents");
    expect(() =>
      normalizePaymentIntentV1({
        ...normalized,
        method: "gift_card",
        instrumentId: null,
      }),
    ).toThrow("gift-card identity");
    expect(() =>
      normalizePaymentIntentV1({
        ...normalized,
        target: "appointment",
        targetId: null,
      }),
    ).toThrow("targetId");
  });

  it("preserves a configured supported Business currency for R1a", () => {
    const normalized = normalizeR1aManualIntent(
      {
        businessId: "11111111-1111-4111-8111-111111111111",
        currency: "CAD",
      },
      {
        attemptKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        source: "collect_payment",
        customerId: "22222222-2222-4222-8222-222222222222",
        target: "customer",
        amountCents: 500,
        method: "cash",
        paymentKind: "payment",
      },
    );

    expect(normalized.currency).toBe("cad");
    expect(normalized.tuple[7]).toBe("cad");
  });

  it("rejects every non-R1a mode before admission", () => {
    const authority = {
      businessId: "11111111-1111-4111-8111-111111111111",
      currency: "cad",
    };
    const base = {
      attemptKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      source: "collect_payment" as const,
      customerId: "22222222-2222-4222-8222-222222222222",
      target: "appointment" as const,
      appointmentId: "33333333-3333-4333-8333-333333333333",
      amountCents: 500,
      method: "cash" as const,
      paymentKind: "payment" as const,
    };

    expect(() =>
      normalizeR1aManualIntent(authority, { ...base, invoiceId: "invoice" }),
    ).toThrow("invoice");
    expect(() =>
      normalizeR1aManualIntent(authority, {
        ...base,
        explicitInvoiceIntent: true,
      }),
    ).toThrow("invoice");
    expect(() =>
      normalizeR1aManualIntent(authority, {
        ...base,
        providerRoute: "stripe",
      }),
    ).toThrow("Provider");
    for (const method of ["gift_card", "store_credit"] as const) {
      expect(() =>
        normalizeR1aManualIntent(authority, { ...base, method }),
      ).toThrow("outside R1a");
    }
    expect(() =>
      normalizeR1aManualIntent(authority, {
        ...base,
        paymentKind: "none",
        amountCents: 0,
      }),
    ).toThrow("outside R1a");
    for (const paymentKind of ["refund", "void", "adjustment"]) {
      expect(() =>
        normalizeR1aManualIntent(authority, {
          ...base,
          paymentKind,
        } as never),
      ).toThrow("outside R1a");
    }
    expect(() =>
      normalizeR1aManualIntent(authority, {
        ...base,
        target: "booking_operation",
        appointmentId: null,
      } as never),
    ).toThrow("R1a target must be an existing customer or appointment.");
  });
});
