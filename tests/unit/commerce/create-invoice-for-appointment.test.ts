import { beforeEach, describe, expect, it, vi } from "vitest";

const writeCommerceAudit = vi.fn();
const emitCommerceEvent = vi.fn(async (event: unknown) => event);

vi.mock("@/lib/commerce/audit", () => ({
  writeCommerceAudit: (...args: unknown[]) => writeCommerceAudit(...args),
}));

vi.mock("@/lib/commerce/events", () => ({
  createCommerceEvent: (input: Record<string, unknown>) => ({
    ...input,
    occurredAt: "2026-09-18T00:00:00.000Z",
  }),
  emitCommerceEvent: (...args: unknown[]) => emitCommerceEvent(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createInvoiceForAppointment } from "@/lib/commerce/invoices";

type Row = Record<string, unknown>;

const BUSINESS_ID = "biz-48";
const APPOINTMENT_ID = "appt-48";
const CUSTOMER_ID = "cust-48";
const SERVICE_ID = "svc-48";
const NOW = "2026-09-18T12:00:00.000Z";
const CATALOG_PRICE_DOLLARS = 250;

function canonicalAppointment(overrides: Row = {}): Row {
  return {
    id: APPOINTMENT_ID,
    business_id: BUSINESS_ID,
    customer_id: CUSTOMER_ID,
    service_id: SERVICE_ID,
    price_cents: 10000,
    tax_cents: 1300,
    discount_cents: 0,
    deposit_cents: 0,
    invoice_number: null,
    payment_status: "unpaid",
    amount_paid_cents: 0,
    services: { name: "Private Alpha Onboarding Consultation", price: CATALOG_PRICE_DOLLARS },
    ...overrides,
  };
}

function createDb(opts?: {
  appointment?: Row;
  existingInvoice?: Row;
  existingLines?: Row[];
  failFullAppointmentSelect?: boolean;
}) {
  const inserts: Array<{ table: string; payload: Row }> = [];
  const updates: Array<{ table: string; payload: Row }> = [];
  const rows: Record<string, Row[]> = {
    appointments: [opts?.appointment ?? canonicalAppointment()],
    commerce_invoices: opts?.existingInvoice ? [opts.existingInvoice] : [],
    commerce_invoice_lines: opts?.existingLines ? [...opts.existingLines] : [],
    commerce_invoice_sequences: [
      { business_id: BUSINESS_ID, next_number: 1, prefix: "INV" },
    ],
    customers: [
      { id: CUSTOMER_ID, name: "Darshan Phase 5 Test", email: "customer@example.invalid", phone: null },
    ],
    businesses: [
      { id: BUSINESS_ID, name: "Chasum HQ — Main", email: null, phone: null },
    ],
  };
  let invoiceCount = 0;
  let lineCount = 0;

  vi.mocked(createClient).mockResolvedValue({
    from: (table: string) => {
      const filters: Array<(row: Row) => boolean> = [];
      let pendingInsert: Row | null = null;
      let pendingUpdate: Row | null = null;
      let wantSingle = false;
      let selectSpec = "";

      const execute = () => {
        if (
          table === "appointments" &&
          !pendingInsert &&
          !pendingUpdate &&
          opts?.failFullAppointmentSelect &&
          selectSpec.includes("price_cents")
        ) {
          return {
            data: null,
            error: { message: "column appointments.price_cents does not exist" },
          };
        }

        if (pendingInsert) {
          const generated: Row = {
            created_at: NOW,
            currency: "usd",
            ...pendingInsert,
          };
          if (table === "commerce_invoices" && generated.id == null) {
            generated.id = `inv-${++invoiceCount}`;
          }
          if (table === "commerce_invoice_lines" && generated.id == null) {
            generated.id = `line-${++lineCount}`;
          }
          inserts.push({ table, payload: { ...pendingInsert } });
          rows[table] = rows[table] ?? [];
          rows[table].push(generated);
          const inserted = generated;
          pendingInsert = null;
          return { data: wantSingle ? inserted : [inserted], error: null };
        }

        if (pendingUpdate) {
          const matching = (rows[table] ?? []).filter((row) =>
            filters.every((filter) => filter(row)),
          );
          for (const row of matching) Object.assign(row, pendingUpdate);
          updates.push({ table, payload: { ...pendingUpdate } });
          const data = wantSingle ? (matching[0] ?? null) : matching;
          pendingUpdate = null;
          return { data, error: null };
        }

        const matching = (rows[table] ?? []).filter((row) =>
          filters.every((filter) => filter(row)),
        );
        return {
          data: wantSingle ? (matching[0] ?? null) : matching,
          error: null,
        };
      };

      const query = {
        select: (spec?: string) => {
          selectSpec = spec ?? selectSpec;
          return query;
        },
        insert: (value: Row) => {
          pendingInsert = { ...(value as Row) };
          return query;
        },
        update: (value: Row) => {
          pendingUpdate = { ...(value as Row) };
          return query;
        },
        eq: (key: string, value: unknown) => {
          filters.push((row) => row[key] === value);
          return query;
        },
        order: () => query,
        maybeSingle: () => {
          wantSingle = true;
          return Promise.resolve(execute());
        },
        single: () => {
          wantSingle = true;
          return Promise.resolve(execute());
        },
        then: (
          resolve: (value: ReturnType<typeof execute>) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(execute()).then(resolve, reject),
      };
      return query;
    },
  } as never);

  return { inserts, updates, rows };
}

function invoicePayload(db: ReturnType<typeof createDb>) {
  return db.inserts.find((entry) => entry.table === "commerce_invoices")?.payload;
}

function linePayload(db: ReturnType<typeof createDb>) {
  return db.inserts.find((entry) => entry.table === "commerce_invoice_lines")
    ?.payload;
}

async function createCanonicalInvoice(appointmentOverrides: Row = {}) {
  const db = createDb({ appointment: canonicalAppointment(appointmentOverrides) });
  const result = await createInvoiceForAppointment({
    businessId: BUSINESS_ID,
    appointmentId: APPOINTMENT_ID,
    actorId: "actor-48",
  });
  return { db, result };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createInvoiceForAppointment exclusive-tax integrity", () => {
  it("A: unpaid invoice uses exclusive subtotal plus separate tax", async () => {
    const { db, result } = await createCanonicalInvoice({ amount_paid_cents: 0 });
    const invoiceInsert = invoicePayload(db);
    const lineInsert = linePayload(db);

    expect(invoiceInsert).toMatchObject({
      subtotal_cents: 10000,
      tax_cents: 1300,
      discount_cents: 0,
      total_cents: 11300,
      amount_paid_cents: 0,
      balance_cents: 11300,
      status: "open",
    });
    expect(lineInsert).toMatchObject({
      unit_amount_cents: 10000,
      tax_cents: 1300,
      discount_cents: 0,
      total_cents: 11300,
    });
    expect(result.invoice).toMatchObject({
      subtotalCents: 10000,
      taxCents: 1300,
      discountCents: 0,
      totalCents: 11300,
      amountPaidCents: 0,
      balanceCents: 11300,
      status: "open",
    });
    expect(result.invoice?.lines[0]).toMatchObject({
      unitAmountCents: 10000,
      taxCents: 1300,
      totalCents: 11300,
    });
    expect(writeCommerceAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "invoice.created",
        afterState: { invoice_number: "INV-0001", total_cents: 11300 },
      }),
    );
    expect(emitCommerceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "invoice.generated",
        payload: { invoice_number: "INV-0001", total_cents: 11300 },
      }),
    );
  });

  it("B: partial payment below exclusive subtotal leaves tax in the balance", async () => {
    const { db, result } = await createCanonicalInvoice({ amount_paid_cents: 5000 });
    expect(invoicePayload(db)).toMatchObject({
      total_cents: 11300,
      amount_paid_cents: 5000,
      balance_cents: 6300,
      status: "partial",
    });
    expect(result.invoice).toMatchObject({
      totalCents: 11300,
      balanceCents: 6300,
      status: "partial",
    });
  });

  it("C: paying only the exclusive subtotal must remain partial, not paid", async () => {
    const { db, result } = await createCanonicalInvoice({ amount_paid_cents: 10000 });
    expect(invoicePayload(db)).toMatchObject({
      total_cents: 11300,
      amount_paid_cents: 10000,
      balance_cents: 1300,
      status: "partial",
    });
    expect(result.invoice?.status).toBe("partial");
    expect(result.invoice?.status).not.toBe("paid");
    expect(result.invoice?.balanceCents).toBe(1300);
  });

  it("D: paying exclusive subtotal plus tax marks the invoice paid", async () => {
    const { db, result } = await createCanonicalInvoice({ amount_paid_cents: 11300 });
    expect(invoicePayload(db)).toMatchObject({
      total_cents: 11300,
      amount_paid_cents: 11300,
      balance_cents: 0,
      status: "paid",
    });
    expect(result.invoice).toMatchObject({
      totalCents: 11300,
      balanceCents: 0,
      status: "paid",
    });
  });

  it("zero-tax control keeps exclusive subtotal as the total", async () => {
    const { db, result } = await createCanonicalInvoice({
      tax_cents: 0,
      amount_paid_cents: 0,
    });
    expect(invoicePayload(db)).toMatchObject({
      subtotal_cents: 10000,
      tax_cents: 0,
      total_cents: 10000,
      balance_cents: 10000,
      status: "open",
    });
    expect(linePayload(db)).toMatchObject({
      unit_amount_cents: 10000,
      tax_cents: 0,
      total_cents: 10000,
    });
    expect(result.invoice).toMatchObject({
      subtotalCents: 10000,
      taxCents: 0,
      totalCents: 10000,
      status: "open",
    });
  });

  it("reuses an existing invoice without rewriting stored amounts", async () => {
    const existing = {
      id: "inv-existing",
      business_id: BUSINESS_ID,
      customer_id: CUSTOMER_ID,
      appointment_id: APPOINTMENT_ID,
      invoice_number: "INV-0099",
      status: "open",
      issue_date: "2026-09-17",
      due_date: "2026-09-24",
      currency: "usd",
      subtotal_cents: 8700,
      tax_cents: 1300,
      discount_cents: 0,
      total_cents: 10000,
      amount_paid_cents: 0,
      amount_refunded_cents: 0,
      balance_cents: 10000,
      notes: null,
      business_snapshot: {},
      customer_snapshot: {},
      created_at: NOW,
    };
    const db = createDb({
      existingInvoice: existing,
      existingLines: [
        {
          id: "line-existing",
          invoice_id: "inv-existing",
          description: "Historical line",
          quantity: 1,
          unit_amount_cents: 8700,
          tax_cents: 1300,
          discount_cents: 0,
          total_cents: 10000,
          sort_order: 0,
        },
      ],
    });

    const result = await createInvoiceForAppointment({
      businessId: BUSINESS_ID,
      appointmentId: APPOINTMENT_ID,
    });

    expect(db.inserts.filter((entry) => entry.table === "commerce_invoices")).toEqual([]);
    expect(db.inserts.filter((entry) => entry.table === "commerce_invoice_lines")).toEqual([]);
    expect(writeCommerceAudit).not.toHaveBeenCalled();
    expect(emitCommerceEvent).not.toHaveBeenCalled();
    expect(result.invoice).toMatchObject({
      id: "inv-existing",
      invoiceNumber: "INV-0099",
      subtotalCents: 8700,
      taxCents: 1300,
      totalCents: 10000,
      balanceCents: 10000,
      status: "open",
    });
  });

  it("normalizes fractional stored cents with existing Math.round rules", async () => {
    const { db, result } = await createCanonicalInvoice({
      price_cents: 10000.4,
      tax_cents: 1300.4,
      amount_paid_cents: 0,
    });
    expect(invoicePayload(db)).toMatchObject({
      subtotal_cents: 10000,
      tax_cents: 1300,
      total_cents: 11300,
      balance_cents: 11300,
    });
    expect(result.invoice).toMatchObject({
      subtotalCents: 10000,
      taxCents: 1300,
      totalCents: 11300,
    });
  });

  it("keeps an explicit stored zero price even when the catalog price is nonzero", async () => {
    const { db, result } = await createCanonicalInvoice({
      price_cents: 0,
      tax_cents: 0,
      amount_paid_cents: 0,
    });
    expect(invoicePayload(db)).toMatchObject({
      subtotal_cents: 0,
      tax_cents: 0,
      total_cents: 0,
      balance_cents: 0,
      status: "paid",
    });
    expect(linePayload(db)).toMatchObject({
      unit_amount_cents: 0,
      tax_cents: 0,
      total_cents: 0,
    });
    expect(result.invoice).toMatchObject({
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });

  it("uses catalog fallback only when stored appointment price is null", async () => {
    const { db, result } = await createCanonicalInvoice({
      price_cents: null,
      tax_cents: 0,
      amount_paid_cents: 0,
    });
    expect(invoicePayload(db)).toMatchObject({
      subtotal_cents: 25000,
      tax_cents: 0,
      total_cents: 25000,
      status: "open",
    });
    expect(result.invoice?.subtotalCents).toBe(25000);
    expect(result.invoice?.totalCents).toBe(25000);
  });

  it("schema-compat missing price_cents still uses the existing catalog fallback", async () => {
    const db = createDb({
      appointment: {
        id: APPOINTMENT_ID,
        business_id: BUSINESS_ID,
        customer_id: CUSTOMER_ID,
        service_id: SERVICE_ID,
        deposit_cents: 0,
        invoice_number: null,
        services: { name: "Private Alpha Onboarding Consultation", price: CATALOG_PRICE_DOLLARS },
      },
      failFullAppointmentSelect: true,
    });

    const result = await createInvoiceForAppointment({
      businessId: BUSINESS_ID,
      appointmentId: APPOINTMENT_ID,
    });

    expect(invoicePayload(db)).toMatchObject({
      subtotal_cents: 25000,
      tax_cents: 0,
      total_cents: 25000,
    });
    expect(result.invoice?.totalCents).toBe(25000);
  });

  it("passthrough characterization: nonzero discount_cents is copied without a total formula", async () => {
    const { db, result } = await createCanonicalInvoice({
      discount_cents: 500,
      amount_paid_cents: 0,
    });
    expect(invoicePayload(db)).toMatchObject({
      discount_cents: 500,
      subtotal_cents: 10000,
      tax_cents: 1300,
      total_cents: 11300,
    });
    expect(linePayload(db)).toMatchObject({
      discount_cents: 500,
      unit_amount_cents: 10000,
      tax_cents: 1300,
      total_cents: 11300,
    });
    expect(result.invoice).toMatchObject({
      discountCents: 500,
      subtotalCents: 10000,
      taxCents: 1300,
      totalCents: 11300,
    });
  });
});
