/**
 * Trusted Operator Access V1 — pure membership/auth helpers.
 *
 * V1 stores access as business_members.role = "admin" (full tenant-admin).
 * This is not employee RBAC, receptionist access, or Platform Admin.
 */

export const TRUSTED_OPERATOR_ROLE = "admin" as const;

export const TRUSTED_OPERATOR_METADATA_KEY = "chasum_operator" as const;

/** Installed SDK AdminUserAttributes.ban_duration — 100-year ban example from GoTrueAdminApi. */
export const TRUSTED_OPERATOR_BAN_DURATION = "876000h" as const;

/** Installed SDK value that lifts a ban (`ban_duration?: string | "none"`). */
export const TRUSTED_OPERATOR_UNBAN_DURATION = "none" as const;

export type TrustedOperatorStatus = "invited" | "active" | "revoked";

export type TrustedOperatorMetadata = {
  business_id: string;
  role: typeof TRUSTED_OPERATOR_ROLE;
  status: TrustedOperatorStatus;
  invited_by: string;
  invited_at: string;
  revoked_by?: string;
  revoked_at?: string;
};

export const EMAIL_DELIVERY_FAILED_MESSAGE =
  "Access was prepared, but the invitation email could not be delivered. Use Resend invite.";

export const OWNER_ONLY_MESSAGE =
  "Only the primary business owner can manage Trusted Admin access.";

export const PLATFORM_ADMIN_TARGET_MESSAGE =
  "Platform Admin identities cannot be granted Trusted Admin access.";

export const OTHER_TENANT_TARGET_MESSAGE =
  "That account already belongs to another Chasum business.";

export const ALREADY_OWNER_MESSAGE =
  "That account is already the primary owner of this business.";

export const ALREADY_ACTIVE_MESSAGE = "That person is already a Trusted Admin of this business.";

export const ALREADY_INVITED_MESSAGE =
  "That person already has a pending Trusted Admin invitation for this business.";

export const EXISTING_IDENTITY_COMPENSATION_FAILED_MESSAGE =
  "Trusted Admin setup failed and the existing account could not be restored. Contact the business owner before retrying.";

export type OperatorCompensationSnapshot = {
  hadOperatorMarker: boolean;
  previousOperator: unknown;
  wasBanned: boolean;
};

export function normalizeOperatorEmail(
  email: string | undefined | null,
): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

export function emailsMatch(
  left: string | undefined | null,
  right: string | undefined | null,
): boolean {
  const a = normalizeOperatorEmail(left);
  const b = normalizeOperatorEmail(right);
  return Boolean(a && b && a === b);
}

export function readOperatorMetadata(
  appMetadata: Record<string, unknown> | undefined | null,
): TrustedOperatorMetadata | null {
  if (!appMetadata || typeof appMetadata !== "object") return null;
  const raw = appMetadata[TRUSTED_OPERATOR_METADATA_KEY];
  if (!raw || typeof raw !== "object") return null;
  return raw as TrustedOperatorMetadata;
}

/** Fail closed for ANY present marker, including unknown future status values. */
export function hasOperatorMarker(
  appMetadata: Record<string, unknown> | undefined | null,
): boolean {
  if (!appMetadata || typeof appMetadata !== "object") return false;
  return Object.prototype.hasOwnProperty.call(
    appMetadata,
    TRUSTED_OPERATOR_METADATA_KEY,
  );
}

export function shouldFailClosedTenantCreate(input: {
  resolvedBusiness: { id: string } | null;
  appMetadata: Record<string, unknown> | undefined | null;
}): boolean {
  if (input.resolvedBusiness) return false;
  return hasOperatorMarker(input.appMetadata);
}

export function mergeOperatorAppMetadata(
  existing: Record<string, unknown> | undefined | null,
  operator: TrustedOperatorMetadata,
): Record<string, unknown> {
  const current =
    existing && typeof existing === "object" ? { ...existing } : {};
  current[TRUSTED_OPERATOR_METADATA_KEY] = operator;
  return current;
}

function cloneJsonValue(value: unknown): unknown {
  if (value && typeof value === "object") {
    return { ...(value as Record<string, unknown>) };
  }
  return value;
}

/** Capture only Trusted Operator / ban fields before mutating a pre-existing identity. */
export function snapshotOperatorCompensationState(input: {
  appMetadata: Record<string, unknown> | undefined | null;
  bannedUntil?: string | null;
}): OperatorCompensationSnapshot {
  const hadOperatorMarker = hasOperatorMarker(input.appMetadata);
  return {
    hadOperatorMarker,
    previousOperator: hadOperatorMarker
      ? cloneJsonValue(input.appMetadata![TRUSTED_OPERATOR_METADATA_KEY])
      : undefined,
    wasBanned: Boolean(input.bannedUntil),
  };
}

/**
 * Restore ONLY app_metadata.chasum_operator from a pre-attempt snapshot.
 * Reads whatever other keys currently exist so concurrent unrelated metadata is kept.
 */
export function restoreOperatorAppMetadata(
  current: Record<string, unknown> | undefined | null,
  snapshot: Pick<
    OperatorCompensationSnapshot,
    "hadOperatorMarker" | "previousOperator"
  >,
): Record<string, unknown> {
  const next = current && typeof current === "object" ? { ...current } : {};
  if (snapshot.hadOperatorMarker) {
    next[TRUSTED_OPERATOR_METADATA_KEY] = cloneJsonValue(
      snapshot.previousOperator,
    );
  } else {
    delete next[TRUSTED_OPERATOR_METADATA_KEY];
  }
  return next;
}

export function buildInvitedOperatorMetadata(input: {
  businessId: string;
  invitedBy: string;
  invitedAt: string;
  previous?: TrustedOperatorMetadata | null;
}): TrustedOperatorMetadata {
  return {
    business_id: input.businessId,
    role: TRUSTED_OPERATOR_ROLE,
    status: "invited",
    invited_by: input.previous?.invited_by ?? input.invitedBy,
    invited_at: input.previous?.invited_at ?? input.invitedAt,
  };
}

export function buildRevokedOperatorMetadata(input: {
  previous: TrustedOperatorMetadata | null;
  businessId: string;
  invitedBy: string;
  invitedAt: string;
  revokedBy: string;
  revokedAt: string;
}): TrustedOperatorMetadata {
  return {
    business_id: input.previous?.business_id ?? input.businessId,
    role: TRUSTED_OPERATOR_ROLE,
    status: "revoked",
    invited_by: input.previous?.invited_by ?? input.invitedBy,
    invited_at: input.previous?.invited_at ?? input.invitedAt,
    revoked_by: input.revokedBy,
    revoked_at: input.revokedAt,
  };
}

export function isPrimaryOwner(
  userId: string,
  business: { owner_id?: string | null } | null,
): boolean {
  return Boolean(business?.owner_id && business.owner_id === userId);
}

export function isDuplicateEmailCreateError(error: {
  code?: string;
  message?: string;
  status?: number;
} | null): boolean {
  if (!error) return false;
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "email_exists" ||
    code === "user_already_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("email_exists") ||
    (error.status === 422 && message.includes("email"))
  );
}

export function isUniqueMembershipConflict(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return (
    error.code === "23505" ||
    (error.message ?? "").toLowerCase().includes("duplicate key")
  );
}

export function trustedOperatorListStatus(input: {
  lastSignInAt?: string | null;
}): "active" | "pending" {
  return input.lastSignInAt ? "active" : "pending";
}

export function buildTrustedAdminInviteEmail(input: {
  businessName: string;
  actionLink: string;
}): { subject: string; html: string; text: string } {
  const subject = `You're invited as Trusted Admin of ${input.businessName}`;
  const text = [
    `You were invited as Trusted Admin of ${input.businessName}.`,
    "Trusted Admin means full access to this business during Private Alpha — operations, customers, payments, settings, employees, reports, and integrations.",
    `Accept access: ${input.actionLink}`,
    "If you were not expecting this, ignore the email and contact the business owner.",
  ].join("\n\n");
  const html = `
    <p>You were invited as <strong>Trusted Admin</strong> of <strong>${escapeHtml(input.businessName)}</strong>.</p>
    <p>Trusted Admin means full access to this business during Private Alpha — operations, customers, payments, settings, employees, reports, and integrations.</p>
    <p><a href="${escapeHtml(input.actionLink)}">Accept Trusted Admin access</a></p>
    <p>If you were not expecting this, ignore this email and contact the business owner.</p>
  `.trim();
  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
