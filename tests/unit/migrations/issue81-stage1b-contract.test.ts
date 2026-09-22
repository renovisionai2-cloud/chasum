import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260922050000_issue_81_stage_1b_relationship_booking_convergence.sql",
  ),
  "utf8",
);

describe("Issue #81 Stage 1B migration contract", () => {
  it("guards every governed relationship and tenant key", () => {
    for (const trigger of [
      "service_locations_same_business",
      "staff_locations_same_business",
      "staff_services_same_business",
      "services_business_id_immutable",
      "staff_business_id_immutable",
      "locations_business_id_immutable",
    ]) {
      expect(migration).toContain(trigger);
    }
  });

  it("converges all booking RPCs on the three relationships", () => {
    const slots = migration.slice(
      migration.indexOf("create or replace function get_available_slots"),
      migration.indexOf("create or replace function validate_appointment_slot"),
    );
    const validate = migration.slice(
      migration.indexOf("create or replace function validate_appointment_slot"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.book_public_appointment"),
    );
    const book = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.book_public_appointment"),
    );

    expect(slots).toContain("service_locations");
    expect(slots).toContain("staff_locations");
    expect(slots).toContain("staff_services");

    expect(validate).toContain("service_locations");
    expect(validate).toContain("staff_locations");
    expect(validate).toContain("staff_services");

    expect(book).toContain("service_locations");
    expect(book).toContain("staff_locations");
    expect(book).toContain("staff_services");
  });

  it("keeps the live public-booking function syntactically dollar-quoted", () => {
    const book = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.book_public_appointment"),
    );
    expect(book).toContain("AS $$\ndeclare");
    expect(book).toContain("end;\n$$;");
    expect(book).not.toContain("AS $\ndeclare");
  });

  it("validates final booking before customer mutation", () => {
    const book = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.book_public_appointment"),
    );
    const validateIndex = book.indexOf("perform validate_appointment_slot");
    const customerIndex = book.indexOf("v_customer_id := upsert_booking_customer");
    expect(validateIndex).toBeGreaterThan(-1);
    expect(customerIndex).toBeGreaterThan(validateIndex);
  });

  it("removes default PUBLIC execute and grants only intended API roles", () => {
    for (const fn of [
      "get_available_slots",
      "validate_appointment_slot",
      "book_public_appointment",
    ]) {
      expect(migration).toContain(`revoke execute on function public.${fn}`);
      expect(migration).toContain(`grant execute on function public.${fn}`);
    }
    expect(migration).toContain("from public, anon, authenticated, service_role");
    expect(migration).toContain("to anon, authenticated, service_role");
  });

  it("does not introduce resource-aware booking or optional staff persistence", () => {
    expect(migration).not.toContain("appointment_resources");
    expect(migration).not.toContain("resource_id");
    expect(migration).toContain("Staff is required for public booking");
  });
});
