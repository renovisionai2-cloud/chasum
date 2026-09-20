// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/env", () => ({
  getResendApiKey: () => null,
  getTwilioConfig: () => null,
  getEmailFromAddress: () => "sender@example.invalid",
  getAppUrl: () => "https://example.invalid",
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => db,
}));

import { loadAppointmentNotifyContext } from "@/lib/notifications/booking-delivery";
import { APPOINTMENT_LOCATION_EMBED } from "@/lib/communications/appointment-location";

type Row = Record<string, unknown>;
const BIZ_A = "business-a";
const BIZ_B = "business-b";
const APPT = "appointment-a";
const LOC_A = "location-a";
const LOC_B = "location-b";
const LOC_FOREIGN = "location-foreign";

let rows: Record<string, Row[]>;

const db = {
  from(table: string) {
    const predicates: ((row: Row) => boolean)[] = [];
    let single = false;
    const run = () => {
      const found = (rows[table] ?? []).filter((row) =>
        predicates.every((p) => p(row)),
      );
      if (table === "appointments") {
        const data = found.map((row) => {
          const location = (rows.locations ?? []).find(
            (loc) => loc.id === row.location_id,
          );
          return {
            ...row,
            business: (rows.businesses ?? []).find(
              (b) => b.id === row.business_id,
            ),
            service: (rows.services ?? []).find((s) => s.id === row.service_id),
            staff: (rows.staff ?? []).find((s) => s.id === row.staff_id),
            customer: (rows.customers ?? []).find(
              (c) => c.id === row.customer_id,
            ),
            location: location ?? null,
          };
        });
        return {
          data: single ? (data[0] ?? null) : data,
          error: null,
        };
      }
      return {
        data: single ? (found[0] ?? null) : found,
        error: null,
      };
    };
    const query = {
      select() {
        return query;
      },
      eq(key: string, value: unknown) {
        predicates.push((row) => row[key] === value);
        return query;
      },
      order() {
        return query;
      },
      limit() {
        return query;
      },
      single() {
        single = true;
        return Promise.resolve(run());
      },
      then(resolve: (result: ReturnType<typeof run>) => unknown) {
        return Promise.resolve(run()).then(resolve);
      },
    };
    return query;
  },
};

beforeEach(() => {
  rows = {
    businesses: [
      {
        id: BIZ_A,
        name: "Studio A",
        email: "a@example.invalid",
        notification_email: "a@example.invalid",
        timezone: "America/Toronto",
        email_notifications_enabled: true,
        sms_notifications_enabled: false,
        owner_notifications_enabled: true,
        staff_notifications_enabled: false,
        subscription_plan_key: "starter",
        private_alpha_enabled: true,
      },
    ],
    appointments: [
      {
        id: APPT,
        business_id: BIZ_A,
        customer_id: "customer-a",
        staff_id: "staff-a",
        service_id: "service-a",
        location_id: LOC_A,
        start_time: "2026-08-04T18:10:00.000Z",
        end_time: "2026-08-04T18:40:00.000Z",
        status: "confirmed",
        notes: null,
        price_cents: 2500,
        tax_cents: 0,
        deposit_cents: 0,
        amount_paid_cents: 0,
        amount_refunded_cents: 0,
        payment_status: "unpaid",
      },
    ],
    customers: [
      {
        id: "customer-a",
        business_id: BIZ_A,
        name: "Ana",
        email: "ana@example.invalid",
        phone: null,
      },
    ],
    services: [{ id: "service-a", business_id: BIZ_A, name: "Scan" }],
    staff: [
      {
        id: "staff-a",
        business_id: BIZ_A,
        name: "Bobita",
        email: "staff@example.invalid",
      },
    ],
    locations: [
      {
        id: LOC_B,
        business_id: BIZ_A,
        name: "Harbour",
        timezone: "America/Toronto",
        address_line1: "999 Other Avenue",
        address_line2: null,
        city: "Hamilton",
        state: "ON",
        postal_code: "L8P 1A1",
        is_default: true,
      },
      {
        id: LOC_A,
        business_id: BIZ_A,
        name: "Burlington",
        timezone: "America/Vancouver",
        address_line1: "123 Example Street",
        address_line2: "Suite 200",
        city: "Burlington",
        state: "ON",
        postal_code: "L7M 1A1",
        is_default: false,
      },
      {
        id: LOC_FOREIGN,
        business_id: BIZ_B,
        name: "FOREIGN_PRIVATE_NAME",
        timezone: "America/New_York",
        address_line1: "1 Foreign Blvd",
        city: "Buffalo",
        state: "NY",
        postal_code: "14201",
      },
    ],
    tax_rates: [],
    commerce_transactions: [],
  };
});

describe("appointment notify context uses the appointment location only", () => {
  it("loads Location A address and never Location B / default / foreign address", async () => {
    const ctx = await loadAppointmentNotifyContext(APPT, BIZ_A);
    expect(ctx).not.toBeNull();
    expect(ctx!.locationName).toBe("Burlington");
    expect(ctx!.locationAddress).toEqual({
      addressLine1: "123 Example Street",
      addressLine2: "Suite 200",
      city: "Burlington",
      state: "ON",
      postalCode: "L7M 1A1",
    });
    expect(ctx!.locationTimezone).toBe("America/Vancouver");
    expect(JSON.stringify(ctx)).not.toContain("999 Other Avenue");
    expect(JSON.stringify(ctx)).not.toContain("Hamilton");
    expect(JSON.stringify(ctx)).not.toContain("Harbour");
    expect(JSON.stringify(ctx)).not.toContain("FOREIGN_PRIVATE_NAME");
    expect(JSON.stringify(ctx)).not.toContain("1 Foreign Blvd");
    expect(JSON.stringify(ctx)).not.toContain("Buffalo");
  });

  it("does not resolve a foreign-business location even if location_id points at it", async () => {
    rows.appointments[0].location_id = LOC_FOREIGN;
    const ctx = await loadAppointmentNotifyContext(APPT, BIZ_A);
    expect(ctx).not.toBeNull();
    expect(ctx!.locationName).toBeNull();
    expect(ctx!.locationAddress).toBeNull();
    expect(JSON.stringify(ctx)).not.toContain("FOREIGN_PRIVATE_NAME");
    expect(JSON.stringify(ctx)).not.toContain("1 Foreign Blvd");
  });

  it("does not fall back to the first or default location when location_id is missing", async () => {
    rows.appointments[0].location_id = null;
    const ctx = await loadAppointmentNotifyContext(APPT, BIZ_A);
    expect(ctx).not.toBeNull();
    expect(ctx!.locationName).toBeNull();
    expect(ctx!.locationAddress).toBeNull();
    expect(JSON.stringify(ctx)).not.toContain("999 Other Avenue");
    expect(JSON.stringify(ctx)).not.toContain("123 Example Street");
  });
});

describe("loader/processor source contract", () => {
  it("embeds structured location address fields from the appointment relation", () => {
    const delivery = readFileSync(
      join(process.cwd(), "lib/notifications/booking-delivery.ts"),
      "utf8",
    );
    const processor = readFileSync(
      join(process.cwd(), "lib/integrations/jobs/processor.ts"),
      "utf8",
    );
    expect(APPOINTMENT_LOCATION_EMBED).toContain("address_line1");
    expect(APPOINTMENT_LOCATION_EMBED).toContain("business_id");
    expect(delivery).toContain("APPOINTMENT_LOCATION_EMBED");
    expect(processor).toContain("APPOINTMENT_LOCATION_EMBED");
    expect(delivery).not.toMatch(/from\("locations"\)/);
    expect(processor).not.toMatch(/from\("locations"\)/);
  });
});
