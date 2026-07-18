import { describe, expect, it } from "vitest";
import { hashApiKey, requireScope } from "@/lib/api/auth";
import {
  hasPermission,
  permissionsForRole,
} from "@/lib/employees/roles";
import { canAccessCrm } from "@/lib/crm/permissions";
import {
  createAppointmentBodySchema,
  createCustomerBodySchema,
  patchAppointmentBodySchema,
} from "@/lib/validation/schemas";

describe("authentication helpers", () => {
  it("hashes API keys deterministically", () => {
    const a = hashApiKey("chsm_abc");
    const b = hashApiKey("chsm_abc");
    const c = hashApiKey("chsm_xyz");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(64);
  });

  it("treats write scope as satisfying read", () => {
    expect(requireScope(["write"], "read")).toBe(true);
    expect(requireScope(["read"], "write")).toBe(false);
  });
});

describe("employees + CRM permissions", () => {
  it("loads owner permissions catalog", () => {
    const perms = permissionsForRole("owner");
    expect(perms).toContain("crm:write");
    expect(hasPermission(perms, "crm:write")).toBe(true);
  });

  it("gates CRM to business owners today", () => {
    expect(canAccessCrm("clients:read", true)).toBe(true);
    expect(canAccessCrm("clients:read", false)).toBe(false);
  });
});

describe("zod API schemas", () => {
  it("accepts valid appointment create bodies", () => {
    const parsed = createAppointmentBodySchema.safeParse({
      service_id: "550e8400-e29b-41d4-a716-446655440001",
      staff_id: "550e8400-e29b-41d4-a716-446655440002",
      customer_id: "550e8400-e29b-41d4-a716-446655440003",
      start_time: "2026-07-18T15:00:00.000Z",
      end_time: "2026-07-18T16:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects mass-assignment fields on patch", () => {
    const parsed = patchAppointmentBodySchema.safeParse({
      status: "confirmed",
      business_id: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(parsed.success).toBe(false);
  });

  it("validates customer email", () => {
    expect(
      createCustomerBodySchema.safeParse({
        name: "Ada",
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });
});
