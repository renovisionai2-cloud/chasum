import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RPC = readFileSync(
  join(process.cwd(), "supabase/migrations/040_book_public_appointment.sql"),
  "utf8",
);

const RPC_LOWER = RPC.toLowerCase();

describe("book_public_appointment RPC contract", () => {
  it("is an additive SECURITY DEFINER plpgsql function with a fixed search_path", () => {
    expect(RPC_LOWER).toContain("create or replace function book_public_appointment");
    expect(RPC_LOWER).toContain("language plpgsql");
    expect(RPC_LOWER).toContain("security definer");
    expect(RPC_LOWER).toContain("set search_path = public");
    expect(RPC_LOWER).not.toContain("alter owner");
  });

  it("revokes PUBLIC execute and grants only anon and authenticated", () => {
    expect(RPC_LOWER).toMatch(
      /revoke all on function book_public_appointment\([\s\S]*\) from public/,
    );
    expect(RPC_LOWER).toMatch(
      /grant execute on function book_public_appointment\([\s\S]*\) to anon, authenticated/,
    );
    expect(RPC_LOWER).not.toContain("to service_role");
  });

  it("requires named staff and does not introduce optional-staff persistence", () => {
    expect(RPC).toContain("p_staff_id uuid");
    expect(RPC).not.toMatch(/p_staff_id uuid default null/i);
    expect(RPC).toContain("Staff is required for public booking");
    expect(RPC).not.toMatch(/p_staff_id\s+uuid\s+default\s+null/i);
  });

  it("uses an appointment_status typed variable instead of the legacy text defect", () => {
    expect(RPC).toMatch(/v_status\s+appointment_status/);
    expect(RPC).not.toMatch(/v_status\s+text/);
    expect(RPC).toContain("'pending'::appointment_status");
    expect(RPC).toContain("'confirmed'::appointment_status");
    expect(RPC).toContain(
      "Public booking status must be pending or confirmed",
    );
    expect(RPC).not.toMatch(/v_status := p_status/);
  });

  it("revalidates tenant relationships in the database", () => {
    expect(RPC).toContain("from businesses where id = p_business_id");
    expect(RPC).toContain("from locations");
    expect(RPC).toContain("and business_id = p_business_id");
    expect(RPC).toContain("from services");
    expect(RPC).toContain("from staff");
    expect(RPC).toContain("accept_online_bookings");
    expect(RPC).toContain("from staff_services");
    expect(RPC).toContain("Staff member does not offer this service");
    expect(RPC).toContain("Service not available");
    expect(RPC).toContain("Staff not available");
    expect(RPC).toContain("Location not found");
    expect(RPC).toContain("Customer not found");
  });

  it("reuses validate_appointment_slot and maps exclusion collisions", () => {
    expect(RPC_LOWER).toContain("perform validate_appointment_slot(");
    expect(RPC_LOWER).toContain("when exclusion_violation then");
    expect(RPC).toContain("Time slot no longer available");
  });

  it("upserts the customer in the same transaction as the appointment", () => {
    expect(RPC_LOWER).toContain("upsert_booking_customer(");
    expect(RPC).toContain("p_customer_name");
    expect(RPC).toContain("p_customer_email");
    expect(RPC_LOWER).not.toContain("delete from customers");
  });

  it("does not accept arbitrary JSON rows or restore the legacy RPC as the writer", () => {
    expect(RPC_LOWER).not.toContain("jsonb");
    expect(RPC_LOWER).not.toMatch(/\bjson\b/);
    expect(RPC_LOWER).not.toContain("drop function");
    expect(RPC_LOWER).not.toContain("create_public_appointment(");
    expect(RPC).toContain("p_price_cents");
    expect(RPC).toContain("p_tax_cents");
    expect(RPC).toContain("p_deposit_cents");
    expect(RPC).toContain("p_start_time");
    expect(RPC).toContain("p_end_time");
  });
});
