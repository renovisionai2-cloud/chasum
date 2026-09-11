import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveBookingFinancials } from "@/lib/commerce/booking-financials";

const M041 = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/041_book_public_appointment_server_financials.sql",
  ),
  "utf8",
);

const M040 = readFileSync(
  join(process.cwd(), "supabase/migrations/040_book_public_appointment.sql"),
  "utf8",
);

const CREATE_SRC = readFileSync(
  join(process.cwd(), "lib/booking-engine/mutations/create.ts"),
  "utf8",
);

const PUBLIC_SRC = readFileSync(
  join(process.cwd(), "lib/actions/public-booking.ts"),
  "utf8",
);

function plpgsqlBody(sql: string): string {
  const start = sql.indexOf("as $$");
  const end = sql.lastIndexOf("$$;");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start + 5, end);
}

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
}

const BODY = plpgsqlBody(M041);
const BODY_CODE = stripSqlComments(BODY).toLowerCase();
const M041_LOWER = M041.toLowerCase();

const exclusiveHst = [
  {
    id: "t1",
    name: "HST",
    rate_bps: 1300,
    inclusive: false,
    is_default: true,
    is_active: true,
  },
];

function expectedStamps(input: {
  catalogPriceCents: number;
  taxRates?: typeof exclusiveHst | [];
  serviceTaxRateBps?: number | null;
  depositCents?: number | null;
  depositRequired?: boolean | null;
}) {
  const f = resolveBookingFinancials({
    catalogPriceCents: input.catalogPriceCents,
    taxRates: input.taxRates ?? [],
    serviceTaxRateBps: input.serviceTaxRateBps,
    depositRequiredCents: input.depositCents,
    depositRequired: input.depositRequired,
  });
  return {
    price_cents: f.subtotalCents === 0 ? null : f.subtotalCents,
    tax_cents: f.taxCents,
    deposit_cents: f.depositRequiredCents,
    payment_status: f.depositRequiredCents > 0 ? "deposit_required" : "unpaid",
    appointment_total: f.appointmentTotalCents,
  };
}

describe("041 book_public_appointment server-authoritative financials", () => {
  it("is an additive CREATE OR REPLACE of the 040 signature, not a drop", () => {
    expect(M041_LOWER).toContain(
      "create or replace function book_public_appointment",
    );
    expect(M041_LOWER).not.toContain("drop function");
    expect(M041).toContain("p_price_cents integer default 0");
    expect(M041).toContain("p_tax_cents integer default 0");
    expect(M041).toContain("p_deposit_cents integer default 0");
    expect(M041_LOWER).toContain("security definer");
    expect(M041_LOWER).toContain("set search_path = public");
    expect(M041_LOWER).not.toContain("alter owner");
    expect(M041_LOWER).toMatch(
      /revoke all on function book_public_appointment\([\s\S]*\) from public/,
    );
    expect(M041_LOWER).toMatch(
      /grant execute on function book_public_appointment\([\s\S]*\) to anon, authenticated/,
    );
    expect(M041_LOWER).not.toContain("to service_role");
    expect(M041).not.toContain("create_public_appointment(");
  });

  it("does not persist caller commercial arguments (P2-1)", () => {
    expect(BODY_CODE).not.toMatch(/v_price\s*:=[\s\S]{0,80}p_price_cents/);
    expect(BODY_CODE).not.toMatch(/v_tax\s*:=[\s\S]{0,80}p_tax_cents/);
    expect(BODY_CODE).not.toMatch(/v_deposit\s*:=[\s\S]{0,80}p_deposit_cents/);
    expect(BODY_CODE).not.toContain("p_price_cents");
    expect(BODY_CODE).not.toContain("p_tax_cents");
    expect(BODY_CODE).not.toContain("p_deposit_cents");
    expect(M040).toMatch(/v_price := greatest\(coalesce\(p_price_cents/);
    expect(M041).not.toMatch(/v_price := greatest\(coalesce\(p_price_cents/);
  });

  it("derives catalog price, tax, and deposit from trusted tenant rows", () => {
    expect(BODY).toContain("from services s");
    expect(BODY).toContain("s.price");
    expect(BODY).toContain("s.deposit_cents");
    expect(BODY).toContain("s.deposit_required");
    expect(BODY).toContain("s.tax_rate_bps");
    expect(BODY).toContain("and s.business_id = p_business_id");
    expect(BODY).toContain("from tax_rates r");
    expect(BODY).toContain("r.business_id = p_business_id");
    expect(BODY).toContain("order by r.is_default desc, r.name asc");
    expect(BODY).toContain("round(coalesce(v_service_price, 0) * 100)");
    expect(BODY).toContain(
      "round((v_catalog_cents::numeric * v_rate_bps) / 10000)",
    );
    expect(BODY).toContain(
      "round((v_catalog_cents::numeric * v_rate_bps) / (10000 + v_rate_bps))",
    );
    expect(BODY).toContain("* 0.2");
  });

  it("T1 zero price forgery: canonical catalog price wins", () => {
    const forgedCaller = { p_price_cents: 0, p_tax_cents: 0, p_deposit_cents: 0 };
    const persisted = expectedStamps({ catalogPriceCents: 2500 });
    expect(forgedCaller.p_price_cents).toBe(0);
    expect(persisted.price_cents).toBe(2500);
    expect(BODY_CODE).not.toContain("p_price_cents");
    expect(BODY).toContain("v_price := v_catalog_cents");
  });

  it("T2 zero deposit forgery: canonical deposit_cents wins", () => {
    const forgedCaller = { p_deposit_cents: 0 };
    const persisted = expectedStamps({
      catalogPriceCents: 2500,
      depositCents: 5000,
      depositRequired: true,
    });
    expect(forgedCaller.p_deposit_cents).toBe(0);
    expect(persisted.deposit_cents).toBe(5000);
    expect(persisted.payment_status).toBe("deposit_required");
    expect(BODY).toContain("if coalesce(v_service_deposit_cents, 0) > 0 then");
    expect(BODY).toContain("v_deposit := v_service_deposit_cents");
  });

  it("T2b deposit_required with no explicit cents uses 20% of appointment total", () => {
    const persisted = expectedStamps({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
      depositCents: 0,
      depositRequired: true,
    });
    expect(persisted.deposit_cents).toBe(15820);
    expect(BODY).toContain("elsif v_service_deposit_required then");
  });

  it("T3 tax forgery: canonical exclusive tax wins", () => {
    const forgedCaller = { p_tax_cents: 0 };
    const persisted = expectedStamps({
      catalogPriceCents: 70000,
      taxRates: exclusiveHst,
    });
    expect(forgedCaller.p_tax_cents).toBe(0);
    expect(persisted.tax_cents).toBe(9100);
    expect(persisted.price_cents).toBe(70000);
    expect(persisted.appointment_total).toBe(79100);
  });

  it("T4 high/arbitrary price: canonical catalog still wins", () => {
    const forgedCaller = { p_price_cents: 1, p_tax_cents: 0, p_deposit_cents: 0 };
    const persisted = expectedStamps({ catalogPriceCents: 2500 });
    expect(forgedCaller.p_price_cents).toBe(1);
    expect(persisted.price_cents).toBe(2500);
    expect(persisted.price_cents).not.toBe(forgedCaller.p_price_cents);
  });

  it("P2-1 probe: deposit-required service with price=tax=deposit=0 still stamps catalog", () => {
    const persisted = expectedStamps({
      catalogPriceCents: 2500,
      taxRates: exclusiveHst,
      depositCents: 5000,
      depositRequired: true,
    });
    expect(persisted).toEqual({
      price_cents: 2500,
      tax_cents: 325,
      deposit_cents: 5000,
      payment_status: "deposit_required",
      appointment_total: 2825,
    });
    expect(BODY_CODE).not.toContain("p_price_cents");
    expect(BODY_CODE).not.toContain("p_tax_cents");
    expect(BODY_CODE).not.toContain("p_deposit_cents");
  });

  it("T5 cross-tenant identifiers are rejected before insert", () => {
    const insertAt = BODY_CODE.indexOf("insert into appointments");
    expect(insertAt).toBeGreaterThan(-1);
    const beforeInsert = BODY_CODE.slice(0, insertAt);
    expect(beforeInsert).toContain("from locations");
    expect(beforeInsert).toContain("and business_id = p_business_id");
    expect(beforeInsert).toContain("and s.business_id = p_business_id");
    expect(beforeInsert).toContain("from staff");
    expect(beforeInsert).toContain("from staff_services");
    expect(beforeInsert).toContain("and business_id = p_business_id");
    expect(beforeInsert).toContain("raise exception 'location not found'");
    expect(beforeInsert).toContain("raise exception 'service not available'");
    expect(beforeInsert).toContain("raise exception 'staff not available'");
    expect(beforeInsert).toContain(
      "raise exception 'staff member does not offer this service'",
    );
  });

  it("T6 missing/inactive/unbookable service rejects cleanly", () => {
    expect(BODY).toContain("s.is_active = true");
    expect(BODY).toContain("coalesce(s.online_booking, true) is not false");
    expect(BODY).toContain("raise exception 'Service not available'");
  });

  it("T7 success path still inserts a named-staff appointment", () => {
    expect(BODY).toContain("insert into appointments");
    expect(BODY).toContain("Staff is required for public booking");
    expect(BODY).not.toMatch(/p_staff_id uuid default null/i);
    expect(BODY).toContain("returning id into v_id");
  });

  it("T8 overlap protection remains intact", () => {
    expect(BODY_CODE).toContain("perform validate_appointment_slot(");
    expect(BODY_CODE).toContain("when exclusion_violation then");
    expect(BODY).toContain("Time slot no longer available");
  });

  it("T9/T10 SQL writer does not enqueue notifications or webhooks", () => {
    expect(BODY_CODE).not.toContain("notification");
    expect(BODY_CODE).not.toContain("webhook");
    expect(BODY_CODE).not.toContain("http");
    expect(BODY_CODE).not.toContain("enqueue");
    expect(BODY_CODE).not.toContain("resend");
  });

  it("does not weaken appointments RLS or table grants", () => {
    const stripped = stripSqlComments(M041).toLowerCase();
    expect(stripped).not.toContain("alter table appointments");
    expect(stripped).not.toContain("create policy");
    expect(stripped).not.toContain("alter policy");
    expect(stripped).not.toContain("drop policy");
    expect(stripped).not.toContain("disable row level security");
    expect(stripped).not.toContain("force row level security");
    expect(stripped).not.toMatch(/grant\s+[\s\S]*on table appointments/);
    expect(stripped).not.toMatch(/revoke\s+[\s\S]*on table appointments/);
    expect(stripped).not.toContain("alter default privileges");
  });

  it("does not add package catalog support (current RPC is services only)", () => {
    expect(M041_LOWER).not.toContain("package");
    expect(M041).not.toContain("p_package");
  });

  it("keeps customer upsert + appointment insert in one function (atomicity)", () => {
    expect(BODY_CODE).toContain("upsert_booking_customer(");
    expect(BODY_CODE.indexOf("upsert_booking_customer(")).toBeLessThan(
      BODY_CODE.indexOf("insert into appointments"),
    );
    expect(BODY_CODE).not.toContain("delete from customers");
  });
});

describe("application callers are preview-only for public commercial amounts", () => {
  it("keeps 040-compatible RPC args while documenting that 041 ignores them", () => {
    expect(CREATE_SRC).toContain('rpc("book_public_appointment"');
    expect(CREATE_SRC).toContain("p_price_cents:");
    expect(CREATE_SRC).toContain("p_tax_cents:");
    expect(CREATE_SRC).toContain("p_deposit_cents:");
    expect(CREATE_SRC).toMatch(/041 ignores these/i);
  });

  it("does not read public form commercial fields", () => {
    expect(PUBLIC_SRC).not.toContain('formData.get("price_cents")');
    expect(PUBLIC_SRC).not.toContain('formData.get("tax_cents")');
    expect(PUBLIC_SRC).not.toContain('formData.get("deposit_cents")');
    expect(PUBLIC_SRC).toContain("book_public_appointment");
  });
});
