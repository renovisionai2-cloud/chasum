"use server";

import {
  ALREADY_ACTIVE_MESSAGE,
  ALREADY_INVITED_MESSAGE,
  ALREADY_OWNER_MESSAGE,
  buildInvitedOperatorMetadata,
  buildRevokedOperatorMetadata,
  buildTrustedAdminInviteEmail,
  EMAIL_DELIVERY_FAILED_MESSAGE,
  emailsMatch,
  isDuplicateEmailCreateError,
  isPrimaryOwner,
  isUniqueMembershipConflict,
  mergeOperatorAppMetadata,
  normalizeOperatorEmail,
  OTHER_TENANT_TARGET_MESSAGE,
  OWNER_ONLY_MESSAGE,
  PLATFORM_ADMIN_TARGET_MESSAGE,
  readOperatorMetadata,
  TRUSTED_OPERATOR_BAN_DURATION,
  TRUSTED_OPERATOR_ROLE,
  TRUSTED_OPERATOR_UNBAN_DURATION,
  trustedOperatorListStatus,
  type TrustedOperatorMetadata,
} from "@/lib/access/operator-membership";
import { getBusiness, requireUser } from "@/lib/actions/business";
import { getAuthCallbackUrl, getPlatformOwnerEmails } from "@/lib/env";
import { sendEmail } from "@/lib/integrations/providers/email";
import { logger } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types/booking";
import type { User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const LOG_SCOPE = "membership";

/** Structured application logs only — not a durable queryable membership audit ledger. */

export type TrustedOperatorRow = {
  email: string;
  status: "pending" | "active";
  invitedAt: string | null;
};

export type TrustedAccessPanelState = {
  canManage: boolean;
  operators: TrustedOperatorRow[];
};

type ServiceClient = ReturnType<typeof createAdminClient>;

type InviteIdentity = {
  user: User;
  created: boolean;
};

function logMembership(
  event: "invited" | "resent" | "revoked" | "failed",
  context: Record<string, unknown>,
) {
  const level = event === "failed" ? "error" : "info";
  logger[level](LOG_SCOPE, `membership.${event}`, {
    event: `membership.${event}`,
    ...context,
  });
}

function clientSubmittedForbiddenField(formData: FormData): string | null {
  for (const key of ["business_id", "user_id", "role", "owner_id"] as const) {
    if (String(formData.get(key) ?? "").trim()) {
      return key;
    }
  }
  return null;
}

async function requirePrimaryOwner(): Promise<
  | { ok: true; user: User; business: NonNullable<Awaited<ReturnType<typeof getBusiness>>> }
  | { ok: false; error: string }
> {
  const user = await requireUser();
  const business = await getBusiness();
  if (!business) {
    return { ok: false, error: "No business is available for this account." };
  }
  if (!isPrimaryOwner(user.id, business)) {
    return { ok: false, error: OWNER_ONLY_MESSAGE };
  }
  return { ok: true, user, business };
}

function isEmailCreateDuplicate(error: { code?: string; message?: string; status?: number } | null) {
  return isDuplicateEmailCreateError(error);
}

async function findUserByNormalizedEmail(
  admin: ServiceClient,
  email: string,
): Promise<User | null> {
  const matches: User[] = [];
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }
    const users = data.users ?? [];
    for (const candidate of users) {
      if (emailsMatch(candidate.email, email)) {
        matches.push(candidate);
      }
    }
    if (users.length < perPage) break;
  }
  if (matches.length > 1) {
    throw new Error("Multiple Auth users matched that email; refusing to guess.");
  }
  return matches[0] ?? null;
}

async function resolveAuthIdentity(
  admin: ServiceClient,
  email: string,
  displayName: string | null,
): Promise<InviteIdentity> {
  const attributes: {
    email: string;
    email_confirm: boolean;
    user_metadata?: { full_name: string };
  } = {
    email,
    email_confirm: false,
  };
  if (displayName) {
    attributes.user_metadata = { full_name: displayName };
  }

  const created = await admin.auth.admin.createUser(attributes);
  if (!created.error && created.data.user) {
    return { user: created.data.user, created: true };
  }
  if (!isEmailCreateDuplicate(created.error)) {
    throw new Error(created.error?.message ?? "Could not create the Auth identity.");
  }

  const existing = await findUserByNormalizedEmail(admin, email);
  if (!existing) {
    throw new Error("That email is already registered, but the Auth user could not be resolved.");
  }
  return { user: existing, created: false };
}

async function isPlatformAdminTarget(
  admin: ServiceClient,
  uid: string,
  email: string,
): Promise<boolean> {
  if (getPlatformOwnerEmails().includes(email)) return true;
  const byUser = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", uid)
    .maybeSingle();
  if (byUser.data) return true;
  const byEmail = await admin
    .from("platform_admins")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();
  return Boolean(byEmail.data);
}

async function findOtherTenantConflict(
  admin: ServiceClient,
  uid: string,
  currentBusinessId: string,
): Promise<"primary_owner" | "other_owner" | "other_member" | null> {
  const { data: owned, error: ownedError } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", uid);
  if (ownedError) {
    throw new Error(ownedError.message);
  }
  const ownedRows = owned ?? [];
  if (ownedRows.some((row) => row.id === currentBusinessId)) {
    return "primary_owner";
  }
  if (ownedRows.length > 0) {
    return "other_owner";
  }

  const { data: memberships, error: memberError } = await admin
    .from("business_members")
    .select("business_id, role, created_at")
    .eq("user_id", uid);
  if (memberError) {
    throw new Error(memberError.message);
  }
  if ((memberships ?? []).some((row) => row.business_id !== currentBusinessId)) {
    return "other_member";
  }
  return null;
}

async function loadCurrentMembership(
  admin: ServiceClient,
  businessId: string,
  uid: string,
): Promise<{ role: string; created_at: string } | null> {
  const { data, error } = await admin
    .from("business_members")
    .select("role, created_at")
    .eq("business_id", businessId)
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function insertAdminMembership(
  admin: ServiceClient,
  input: { businessId: string; userId: string; createdBy: string },
): Promise<{ duplicate: boolean }> {
  const { error } = await admin.from("business_members").insert({
    business_id: input.businessId,
    user_id: input.userId,
    role: TRUSTED_OPERATOR_ROLE,
    created_by: input.createdBy,
  });
  if (!error) return { duplicate: false };
  if (isUniqueMembershipConflict(error)) return { duplicate: true };
  throw new Error(error.message);
}

async function persistOperatorMetadata(
  admin: ServiceClient,
  user: User,
  operator: TrustedOperatorMetadata,
): Promise<User> {
  const { data: fresh, error: readError } = await admin.auth.admin.getUserById(
    user.id,
  );
  if (readError || !fresh.user) {
    throw new Error(readError?.message ?? "Could not read Auth app_metadata.");
  }
  const merged = mergeOperatorAppMetadata(
    (fresh.user.app_metadata ?? {}) as Record<string, unknown>,
    operator,
  );
  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
    user.id,
    { app_metadata: merged },
  );
  if (updateError || !updated.user) {
    throw new Error(updateError?.message ?? "Could not save Trusted Admin metadata.");
  }
  return updated.user;
}

async function generateInviteActionLink(input: {
  admin: ServiceClient;
  email: string;
  lastSignInAt: string | null | undefined;
}): Promise<string> {
  const generated = input.lastSignInAt
    ? await input.admin.auth.admin.generateLink({
        type: "magiclink",
        email: input.email,
        options: { redirectTo: getAuthCallbackUrl("/dashboard") },
      })
    : await input.admin.auth.admin.generateLink({
        type: "invite",
        email: input.email,
        options: { redirectTo: getAuthCallbackUrl("/dashboard") },
      });
  if (generated.error || !generated.data.properties?.action_link) {
    throw new Error(
      generated.error?.message ?? "Could not generate the invitation link.",
    );
  }
  return generated.data.properties.action_link;
}

async function deliverInviteEmail(input: {
  to: string;
  businessName: string;
  actionLink: string;
  idempotencyKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const content = buildTrustedAdminInviteEmail({
    businessName: input.businessName,
    actionLink: input.actionLink,
  });
  const result = await sendEmail({
    to: input.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    idempotencyKey: input.idempotencyKey,
  });
  if (!result.success) {
    return { ok: false, error: result.error ?? EMAIL_DELIVERY_FAILED_MESSAGE };
  }
  return { ok: true };
}

async function compensateCreatedIdentity(
  admin: ServiceClient,
  created: boolean,
  userId: string,
): Promise<void> {
  if (!created) return;
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(
      `Trusted Admin setup failed and the new Auth identity could not be removed (${error.message}).`,
    );
  }
}

async function commitTrustedAdminAccess(input: {
  admin: ServiceClient;
  actorId: string;
  business: { id: string; name: string };
  email: string;
  displayName: string | null;
  send: boolean;
}): Promise<ActionState> {
  const { admin, actorId, business, email, displayName, send } = input;
  let identity: InviteIdentity | null = null;

  try {
    if (getPlatformOwnerEmails().includes(email)) {
      logMembership("failed", {
        reason: "platform_admin_target",
        businessId: business.id,
      });
      return { error: PLATFORM_ADMIN_TARGET_MESSAGE };
    }

    identity = await resolveAuthIdentity(admin, email, displayName);

    if (identity.user.id === actorId) {
      await compensateCreatedIdentity(admin, identity.created, identity.user.id);
      return { error: ALREADY_OWNER_MESSAGE };
    }

    if (await isPlatformAdminTarget(admin, identity.user.id, email)) {
      await compensateCreatedIdentity(admin, identity.created, identity.user.id);
      logMembership("failed", {
        reason: "platform_admin_target",
        businessId: business.id,
        userId: identity.user.id,
      });
      return { error: PLATFORM_ADMIN_TARGET_MESSAGE };
    }

    const conflict = await findOtherTenantConflict(
      admin,
      identity.user.id,
      business.id,
    );
    if (conflict === "primary_owner") {
      await compensateCreatedIdentity(admin, identity.created, identity.user.id);
      return { error: ALREADY_OWNER_MESSAGE };
    }
    if (conflict === "other_owner" || conflict === "other_member") {
      await compensateCreatedIdentity(admin, identity.created, identity.user.id);
      return { error: OTHER_TENANT_TARGET_MESSAGE };
    }

    const existingMembership = await loadCurrentMembership(
      admin,
      business.id,
      identity.user.id,
    );
    if (existingMembership) {
      const status = trustedOperatorListStatus({
        lastSignInAt: identity.user.last_sign_in_at,
      });
      return {
        success:
          status === "active" ? ALREADY_ACTIVE_MESSAGE : ALREADY_INVITED_MESSAGE,
      };
    }

    const bannedUntil = identity.user.banned_until;
    if (bannedUntil) {
      const { error: unbanError } = await admin.auth.admin.updateUserById(
        identity.user.id,
        { ban_duration: TRUSTED_OPERATOR_UNBAN_DURATION },
      );
      if (unbanError) {
        await compensateCreatedIdentity(admin, identity.created, identity.user.id);
        return { error: unbanError.message };
      }
    }

    const invitedAt = new Date().toISOString();
    const previous = readOperatorMetadata(
      identity.user.app_metadata as Record<string, unknown>,
    );
    await persistOperatorMetadata(
      admin,
      identity.user,
      buildInvitedOperatorMetadata({
        businessId: business.id,
        invitedBy: actorId,
        invitedAt,
        previous,
      }),
    );

    const inserted = await insertAdminMembership(admin, {
      businessId: business.id,
      userId: identity.user.id,
      createdBy: actorId,
    });
    if (inserted.duplicate) {
      const status = trustedOperatorListStatus({
        lastSignInAt: identity.user.last_sign_in_at,
      });
      return {
        success:
          status === "active" ? ALREADY_ACTIVE_MESSAGE : ALREADY_INVITED_MESSAGE,
      };
    }

    if (!send) {
      return { success: ALREADY_INVITED_MESSAGE };
    }

    let actionLink: string;
    try {
      actionLink = await generateInviteActionLink({
        admin,
        email,
        lastSignInAt: identity.user.last_sign_in_at,
      });
    } catch (error) {
      logMembership("failed", {
        reason: "link_generation",
        businessId: business.id,
        userId: identity.user.id,
      });
      return {
        error:
          error instanceof Error
            ? error.message
            : "Access was prepared, but the invitation link could not be generated. Use Resend invite.",
      };
    }

    const delivered = await deliverInviteEmail({
      to: email,
      businessName: business.name,
      actionLink,
      idempotencyKey: `trusted-operator-invite:${business.id}:${identity.user.id}:${invitedAt}`,
    });
    if (!delivered.ok) {
      logMembership("failed", {
        reason: "email_delivery",
        businessId: business.id,
        userId: identity.user.id,
      });
      return { error: EMAIL_DELIVERY_FAILED_MESSAGE };
    }

    logMembership("invited", {
      businessId: business.id,
      userId: identity.user.id,
      createdIdentity: identity.created,
    });
    return {
      success: `Trusted Admin invitation sent to ${email}. They will have full access to this business during Private Alpha.`,
    };
  } catch (error) {
    if (identity?.created) {
      try {
        await compensateCreatedIdentity(admin, true, identity.user.id);
      } catch (cleanupError) {
        logMembership("failed", {
          reason: "compensation_failed",
          businessId: business.id,
          userId: identity.user.id,
          cleanup:
            cleanupError instanceof Error ? cleanupError.message : "unknown",
        });
        return {
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : "Trusted Admin setup failed and the new Auth identity could not be removed.",
        };
      }
    }
    logMembership("failed", {
      reason: "invite",
      businessId: business.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not invite Trusted Admin.",
    };
  }
}

export async function getTrustedAccessPanel(): Promise<TrustedAccessPanelState> {
  const user = await requireUser();
  const business = await getBusiness();
  if (!business || !isPrimaryOwner(user.id, business)) {
    return { canManage: false, operators: [] };
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("business_members")
    .select("user_id, role, created_at")
    .eq("business_id", business.id)
    .eq("role", TRUSTED_OPERATOR_ROLE)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

  const operators: TrustedOperatorRow[] = [];
  for (const row of rows ?? []) {
    if (row.user_id === business.owner_id) continue;
    const { data, error: userError } = await admin.auth.admin.getUserById(
      row.user_id,
    );
    if (userError || !data.user?.email) continue;
    operators.push({
      email: data.user.email,
      status: trustedOperatorListStatus({
        lastSignInAt: data.user.last_sign_in_at,
      }),
      invitedAt: row.created_at ?? null,
    });
  }

  return { canManage: true, operators };
}

export async function inviteTrustedOperator(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (clientSubmittedForbiddenField(formData)) {
    return { error: "Invalid invitation request." };
  }
  const email = normalizeOperatorEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { error: "Enter a valid email address." };
  }
  const displayName = String(formData.get("display_name") ?? "").trim() || null;

  const gate = await requirePrimaryOwner();
  if (!gate.ok) return { error: gate.error };

  const result = await commitTrustedAdminAccess({
    admin: createAdminClient(),
    actorId: gate.user.id,
    business: { id: gate.business.id, name: gate.business.name },
    email,
    displayName,
    send: true,
  });
  revalidatePath("/dashboard/employees");
  return result;
}

export async function resendTrustedOperatorInvite(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (clientSubmittedForbiddenField(formData)) {
    return { error: "Invalid invitation request." };
  }
  const email = normalizeOperatorEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { error: "Enter a valid email address." };
  }

  const gate = await requirePrimaryOwner();
  if (!gate.ok) return { error: gate.error };

  const admin = createAdminClient();
  const target = await findUserByNormalizedEmail(admin, email);
  if (!target) {
    return { error: "No Trusted Admin invitation exists for that email." };
  }

  const membership = await loadCurrentMembership(
    admin,
    gate.business.id,
    target.id,
  );
  if (!membership) {
    return { error: "No Trusted Admin invitation exists for that email." };
  }

  const conflict = await findOtherTenantConflict(
    admin,
    target.id,
    gate.business.id,
  );
  if (conflict === "other_owner" || conflict === "other_member") {
    return { error: OTHER_TENANT_TARGET_MESSAGE };
  }

  await persistOperatorMetadata(
    admin,
    target,
    buildInvitedOperatorMetadata({
      businessId: gate.business.id,
      invitedBy: gate.user.id,
      invitedAt: new Date().toISOString(),
      previous: readOperatorMetadata(
        target.app_metadata as Record<string, unknown>,
      ),
    }),
  );

  let actionLink: string;
  try {
    actionLink = await generateInviteActionLink({
      admin,
      email,
      lastSignInAt: target.last_sign_in_at,
    });
  } catch (error) {
    logMembership("failed", {
      reason: "resend_link",
      businessId: gate.business.id,
      userId: target.id,
    });
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not generate a new invitation link.",
    };
  }

  const delivered = await deliverInviteEmail({
    to: email,
    businessName: gate.business.name,
    actionLink,
    idempotencyKey: `trusted-operator-resend:${gate.business.id}:${target.id}:${Date.now()}`,
  });
  if (!delivered.ok) {
    logMembership("failed", {
      reason: "resend_email",
      businessId: gate.business.id,
      userId: target.id,
    });
    return { error: EMAIL_DELIVERY_FAILED_MESSAGE };
  }

  logMembership("resent", {
    businessId: gate.business.id,
    userId: target.id,
    alreadyActive: Boolean(target.last_sign_in_at),
  });
  revalidatePath("/dashboard/employees");
  if (target.last_sign_in_at) {
    return {
      success: `${ALREADY_ACTIVE_MESSAGE} A fresh sign-in link was sent to ${email}.`,
    };
  }
  return { success: `Invitation resent to ${email}.` };
}

export async function revokeTrustedOperator(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (clientSubmittedForbiddenField(formData)) {
    return { error: "Invalid revoke request." };
  }
  const email = normalizeOperatorEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { error: "Enter a valid email address." };
  }

  const gate = await requirePrimaryOwner();
  if (!gate.ok) return { error: gate.error };

  const admin = createAdminClient();
  const target = await findUserByNormalizedEmail(admin, email);
  if (!target) {
    return { error: "No Trusted Admin exists for that email in this business." };
  }
  if (target.id === gate.business.owner_id) {
    return { error: "The primary owner cannot be revoked as a Trusted Admin." };
  }

  const membership = await loadCurrentMembership(
    admin,
    gate.business.id,
    target.id,
  );
  if (!membership) {
    return { error: "No Trusted Admin exists for that email in this business." };
  }

  const { error: deleteError } = await admin
    .from("business_members")
    .delete()
    .eq("business_id", gate.business.id)
    .eq("user_id", target.id);
  if (deleteError) {
    logMembership("failed", {
      reason: "revoke_delete",
      businessId: gate.business.id,
      userId: target.id,
    });
    return { error: deleteError.message };
  }

  let hardeningWarning = false;
  try {
    const previous = readOperatorMetadata(
      target.app_metadata as Record<string, unknown>,
    );
    await persistOperatorMetadata(
      admin,
      target,
      buildRevokedOperatorMetadata({
        previous,
        businessId: gate.business.id,
        invitedBy: previous?.invited_by ?? gate.user.id,
        invitedAt: previous?.invited_at ?? new Date().toISOString(),
        revokedBy: gate.user.id,
        revokedAt: new Date().toISOString(),
      }),
    );
  } catch {
    hardeningWarning = true;
  }

  const { error: banError } = await admin.auth.admin.updateUserById(target.id, {
    ban_duration: TRUSTED_OPERATOR_BAN_DURATION,
  });
  if (banError) {
    hardeningWarning = true;
  }

  logMembership("revoked", {
    businessId: gate.business.id,
    userId: target.id,
    hardeningWarning,
  });
  revalidatePath("/dashboard/employees");
  if (hardeningWarning) {
    return {
      success:
        "Trusted Admin membership was removed. Session hardening could not be fully completed; they can no longer access this business.",
    };
  }
  return { success: `Trusted Admin access revoked for ${email}.` };
}
