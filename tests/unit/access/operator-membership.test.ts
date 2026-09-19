import { describe, expect, it } from "vitest";
import {
  ALREADY_ACTIVE_MESSAGE,
  buildInvitedOperatorMetadata,
  buildRevokedOperatorMetadata,
  buildTrustedAdminInviteEmail,
  emailsMatch,
  hasOperatorMarker,
  isDuplicateEmailCreateError,
  isPrimaryOwner,
  isUniqueMembershipConflict,
  mergeOperatorAppMetadata,
  normalizeOperatorEmail,
  restoreOperatorAppMetadata,
  shouldFailClosedTenantCreate,
  snapshotOperatorCompensationState,
  TRUSTED_OPERATOR_BAN_DURATION,
  TRUSTED_OPERATOR_ROLE,
  TRUSTED_OPERATOR_UNBAN_DURATION,
  trustedOperatorListStatus,
} from "@/lib/access/operator-membership";

describe("trusted operator helpers", () => {
  it("normalizes email by trim + lowercase + exact match", () => {
    expect(normalizeOperatorEmail("  Owner@GVM.example  ")).toBe(
      "owner@gvm.example",
    );
    expect(emailsMatch("A@x.com", "a@x.com")).toBe(true);
    expect(emailsMatch("a@x.com", "b@x.com")).toBe(false);
    expect(normalizeOperatorEmail("not-an-email")).toBeNull();
  });

  it("treats admin as the only V1 trusted role", () => {
    expect(TRUSTED_OPERATOR_ROLE).toBe("admin");
  });

  it("uses installed SDK ban and unban values", () => {
    expect(TRUSTED_OPERATOR_BAN_DURATION).toBe("876000h");
    expect(TRUSTED_OPERATOR_UNBAN_DURATION).toBe("none");
  });

  it("fail-closes tenant auto-create for any present operator marker", () => {
    expect(
      shouldFailClosedTenantCreate({
        resolvedBusiness: null,
        appMetadata: { chasum_operator: { status: "invited" } },
      }),
    ).toBe(true);
    expect(
      shouldFailClosedTenantCreate({
        resolvedBusiness: null,
        appMetadata: { chasum_operator: { status: "revoked" } },
      }),
    ).toBe(true);
    expect(
      shouldFailClosedTenantCreate({
        resolvedBusiness: null,
        appMetadata: { chasum_operator: { status: "future_unknown" } },
      }),
    ).toBe(true);
    expect(
      shouldFailClosedTenantCreate({
        resolvedBusiness: { id: "biz-1" },
        appMetadata: { chasum_operator: { status: "invited" } },
      }),
    ).toBe(false);
  });

  it("does not fail-close ordinary signup users without the marker", () => {
    expect(
      shouldFailClosedTenantCreate({
        resolvedBusiness: null,
        appMetadata: { provider: "email" },
      }),
    ).toBe(false);
    expect(hasOperatorMarker({ provider: "email" })).toBe(false);
    expect(hasOperatorMarker({ chasum_operator: { status: "invited" } })).toBe(
      true,
    );
  });

  it("merges operator metadata without dropping unrelated app_metadata", () => {
    const merged = mergeOperatorAppMetadata(
      { provider: "email", providers: ["email"], plan: "trial" },
      buildInvitedOperatorMetadata({
        businessId: "biz-1",
        invitedBy: "owner-1",
        invitedAt: "2026-09-19T00:00:00.000Z",
      }),
    );
    expect(merged.provider).toBe("email");
    expect(merged.providers).toEqual(["email"]);
    expect(merged.plan).toBe("trial");
    expect(merged.chasum_operator).toMatchObject({
      business_id: "biz-1",
      role: "admin",
      status: "invited",
    });
  });

  it("restores or removes only the Trusted Operator metadata key", () => {
    const current = {
      provider: "email",
      plan: "trial",
      chasum_operator: { status: "invited", business_id: "biz-1" },
    };
    expect(
      restoreOperatorAppMetadata(current, {
        hadOperatorMarker: false,
        previousOperator: undefined,
      }),
    ).toEqual({ provider: "email", plan: "trial" });

    const previous = {
      business_id: "biz-1",
      role: "admin" as const,
      status: "revoked" as const,
      invited_by: "owner-1",
      invited_at: "2026-09-01T00:00:00.000Z",
      revoked_by: "owner-1",
      revoked_at: "2026-09-02T00:00:00.000Z",
    };
    expect(
      restoreOperatorAppMetadata(
        { provider: "email", chasum_operator: { status: "invited" } },
        snapshotOperatorCompensationState({
          appMetadata: { provider: "email", chasum_operator: previous },
          bannedUntil: "2099-01-01T00:00:00.000Z",
        }),
      ),
    ).toEqual({ provider: "email", chasum_operator: previous });
  });

  it("retains invited timestamps when revoking", () => {
    const invited = buildInvitedOperatorMetadata({
      businessId: "biz-1",
      invitedBy: "owner-1",
      invitedAt: "2026-09-19T00:00:00.000Z",
    });
    const revoked = buildRevokedOperatorMetadata({
      previous: invited,
      businessId: "biz-1",
      invitedBy: "owner-1",
      invitedAt: invited.invited_at,
      revokedBy: "owner-1",
      revokedAt: "2026-09-19T01:00:00.000Z",
    });
    expect(revoked.status).toBe("revoked");
    expect(revoked.invited_at).toBe("2026-09-19T00:00:00.000Z");
    expect(revoked.revoked_by).toBe("owner-1");
  });

  it("authorizes only the primary owner_id", () => {
    expect(isPrimaryOwner("owner-1", { owner_id: "owner-1" })).toBe(true);
    expect(isPrimaryOwner("admin-1", { owner_id: "owner-1" })).toBe(false);
    expect(isPrimaryOwner("owner-1", null)).toBe(false);
  });

  it("detects email-exists and membership unique conflicts", () => {
    expect(isDuplicateEmailCreateError({ code: "email_exists" })).toBe(true);
    expect(
      isDuplicateEmailCreateError({
        status: 422,
        message: "A user with this email address has already been registered",
      }),
    ).toBe(true);
    expect(isUniqueMembershipConflict({ code: "23505" })).toBe(true);
    expect(ALREADY_ACTIVE_MESSAGE).toMatch(/already a Trusted Admin/i);
  });

  it("lists pending vs active from last_sign_in_at", () => {
    expect(trustedOperatorListStatus({ lastSignInAt: null })).toBe("pending");
    expect(
      trustedOperatorListStatus({ lastSignInAt: "2026-09-19T00:00:00.000Z" }),
    ).toBe("active");
  });

  it("builds a truthful invite email that includes the action link only in the payload", () => {
    const email = buildTrustedAdminInviteEmail({
      businessName: "GVM Baby World",
      actionLink: "https://example.test/invite-link-do-not-log",
    });
    expect(email.subject).toContain("Trusted Admin");
    expect(email.subject).toContain("GVM Baby World");
    expect(email.text).toContain("full access to this business during Private Alpha");
    expect(email.html).toContain("https://example.test/invite-link-do-not-log");
    expect(email.text).not.toMatch(/receptionist|employee login|limited access/i);
  });
});
