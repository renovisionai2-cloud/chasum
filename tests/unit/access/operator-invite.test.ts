import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/observability/logger";
import {
  EMAIL_DELIVERY_FAILED_MESSAGE,
  OWNER_ONLY_MESSAGE,
  OTHER_TENANT_TARGET_MESSAGE,
  PLATFORM_ADMIN_TARGET_MESSAGE,
  TRUSTED_OPERATOR_BAN_DURATION,
  TRUSTED_OPERATOR_UNBAN_DURATION,
} from "@/lib/access/operator-membership";

const requireUser = vi.fn();
const getBusiness = vi.fn();
const sendEmail = vi.fn();
const getPlatformOwnerEmails = vi.fn(() => ["platform@chasumai.com"]);
const createAdminClient = vi.fn();

vi.mock("@/lib/actions/business", () => ({
  requireUser: () => requireUser(),
  getBusiness: () => getBusiness(),
}));

vi.mock("@/lib/integrations/providers/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

vi.mock("@/lib/env", () => ({
  getAuthCallbackUrl: () => "https://chasum.vercel.app/auth/callback?next=%2Fdashboard",
  getPlatformOwnerEmails: () => getPlatformOwnerEmails(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

type UserRow = {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  last_sign_in_at?: string | null;
  banned_until?: string;
};

const OWNER = {
  id: "owner-1",
  email: "owner@tenant.test",
  app_metadata: {},
};
const ADMIN_MEMBER = {
  id: "admin-1",
  email: "admin@tenant.test",
  app_metadata: { chasum_operator: { status: "active" } },
};
const BUSINESS = {
  id: "biz-1",
  name: "GVM Baby World",
  owner_id: "owner-1",
};

function form(email: string, extra: Record<string, string> = {}) {
  const data = new FormData();
  data.set("email", email);
  for (const [key, value] of Object.entries(extra)) {
    data.set(key, value);
  }
  return data;
}

function createHarness(options?: {
  users?: UserRow[];
  memberships?: { business_id: string; user_id: string; role: string; created_at?: string }[];
  owned?: { id: string; owner_id: string }[];
  platformAdmins?: { user_id: string; email?: string }[];
  createError?: { code?: string; message?: string; status?: number } | null;
  insertError?: { code?: string; message?: string } | null;
  generateError?: string | null;
}) {
  const users = [...(options?.users ?? [])];
  const memberships = [...(options?.memberships ?? [])];
  const owned = [...(options?.owned ?? [])];
  const platformAdmins = [...(options?.platformAdmins ?? [])];
  const calls = {
    createUser: 0,
    generateLink: 0,
    deleteUser: 0,
    insert: 0,
    updateUserById: [] as Array<Record<string, unknown>>,
    inviteUserByEmail: 0,
    signOut: 0,
    sequence: [] as string[],
  };

  const admin = {
    auth: {
      admin: {
        async createUser(attrs: { email: string }) {
          calls.createUser += 1;
          calls.sequence.push("createUser");
          if (options?.createError) {
            return { data: { user: null }, error: options.createError };
          }
          const existing = users.find((u) => u.email === attrs.email);
          if (existing) {
            return {
              data: { user: null },
              error: { code: "email_exists", message: "already registered" },
            };
          }
          const user: UserRow = {
            id: `new-${attrs.email}`,
            email: attrs.email,
            app_metadata: { provider: "email" },
            last_sign_in_at: null,
          };
          users.push(user);
          return { data: { user }, error: null };
        },
        async getUserById(id: string) {
          const user = users.find((u) => u.id === id) ?? null;
          return { data: { user }, error: user ? null : { message: "missing" } };
        },
        async updateUserById(id: string, patch: Record<string, unknown>) {
          calls.updateUserById.push(patch);
          if (patch.app_metadata) calls.sequence.push("metadata");
          if (patch.ban_duration === TRUSTED_OPERATOR_UNBAN_DURATION) {
            calls.sequence.push("unban");
          } else if (typeof patch.ban_duration === "string") {
            calls.sequence.push("ban");
          }
          const user = users.find((u) => u.id === id);
          if (!user) return { data: { user: null }, error: { message: "missing" } };
          if (patch.app_metadata) {
            user.app_metadata = patch.app_metadata as Record<string, unknown>;
          }
          if (patch.ban_duration === TRUSTED_OPERATOR_UNBAN_DURATION) {
            delete user.banned_until;
          }
          if (
            typeof patch.ban_duration === "string" &&
            patch.ban_duration !== TRUSTED_OPERATOR_UNBAN_DURATION
          ) {
            user.banned_until = "2099-01-01T00:00:00.000Z";
          }
          return { data: { user }, error: null };
        },
        async deleteUser(id: string) {
          calls.deleteUser += 1;
          calls.sequence.push("deleteUser");
          const idx = users.findIndex((u) => u.id === id);
          if (idx >= 0) users.splice(idx, 1);
          return { data: { user: {} }, error: null };
        },
        async listUsers() {
          return { data: { users }, error: null };
        },
        async generateLink() {
          calls.generateLink += 1;
          calls.sequence.push("generateLink");
          if (options?.generateError) {
            return { data: null, error: { message: options.generateError } };
          }
          return {
            data: {
              properties: { action_link: "https://auth.example/invite-secret" },
              user: users[0] ?? null,
            },
            error: null,
          };
        },
        async inviteUserByEmail() {
          calls.inviteUserByEmail += 1;
          throw new Error("inviteUserByEmail must not be used");
        },
        async signOut() {
          calls.signOut += 1;
          throw new Error("admin.signOut must not be used");
        },
      },
    },
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq(column: string, value: string) {
          this._eq = { ...(this._eq ?? {}), [column]: value };
          return this;
        },
        ilike(column: string, value: string) {
          this._ilike = { column, value };
          return this;
        },
        order() {
          return this;
        },
        async maybeSingle() {
          if (table === "platform_admins") {
            const hit = platformAdmins.find((row) => {
              if (this._eq?.user_id) return row.user_id === this._eq.user_id;
              if (this._ilike?.value) {
                return row.email?.toLowerCase() === String(this._ilike.value).toLowerCase();
              }
              return false;
            });
            return { data: hit ?? null, error: null };
          }
          if (table === "business_members") {
            const hit = memberships.find(
              (row) =>
                row.business_id === this._eq?.business_id &&
                row.user_id === this._eq?.user_id,
            );
            return { data: hit ?? null, error: null };
          }
          return { data: null, error: null };
        },
        then(
          resolve: (value: { data: unknown; error: null }) => unknown,
        ) {
          if (table === "businesses") {
            const rows = owned.filter((row) =>
              this._eq?.owner_id ? row.owner_id === this._eq.owner_id : true,
            );
            return Promise.resolve({ data: rows, error: null }).then(resolve);
          }
          if (table === "business_members" && this._eq?.user_id && !this._eq?.business_id) {
            const rows = memberships.filter((row) => row.user_id === this._eq.user_id);
            return Promise.resolve({ data: rows, error: null }).then(resolve);
          }
          if (table === "business_members" && this._eq?.business_id) {
            const rows = memberships.filter(
              (row) =>
                row.business_id === this._eq.business_id &&
                (!this._eq.role || row.role === this._eq.role) &&
                (!this._eq.user_id || row.user_id === this._eq.user_id),
            );
            return Promise.resolve({ data: rows, error: null }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
        insert(row: { business_id: string; user_id: string; role: string }) {
          calls.insert += 1;
          calls.sequence.push("insert");
          if (options?.insertError) {
            return Promise.resolve({ error: options.insertError });
          }
          memberships.push({
            ...row,
            created_at: "2026-09-19T00:00:00.000Z",
          });
          return Promise.resolve({ error: null });
        },
        delete() {
          return {
            eq(column: string, value: string) {
              this._eq = { ...(this._eq ?? {}), [column]: value };
              return this;
            },
            then(resolve: (value: { error: null }) => unknown) {
              const idx = memberships.findIndex(
                (row) =>
                  row.business_id === this._eq.business_id &&
                  row.user_id === this._eq.user_id,
              );
              if (idx >= 0) memberships.splice(idx, 1);
              return Promise.resolve({ error: null }).then(resolve);
            },
            _eq: {} as Record<string, string>,
          };
        },
        _eq: {} as Record<string, string>,
        _ilike: undefined as { column: string; value: string } | undefined,
      };
    },
  };

  createAdminClient.mockReturnValue(admin);
  return { admin, calls, users, memberships };
}

describe("trusted operator invite/revoke actions", () => {
  beforeEach(() => {
    vi.resetModules();
    requireUser.mockReset();
    getBusiness.mockReset();
    sendEmail.mockReset();
    createAdminClient.mockReset();
    vi.mocked(logger.info).mockReset();
    vi.mocked(logger.error).mockReset();
    getPlatformOwnerEmails.mockReturnValue(["platform@chasumai.com"]);
    requireUser.mockResolvedValue(OWNER);
    getBusiness.mockResolvedValue(BUSINESS);
    sendEmail.mockResolvedValue({ success: true, messageId: "msg-1" });
  });

  it("lets the primary owner invite and only generates a link after membership", async () => {
    const harness = createHarness();
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("op@tenant.test"));

    expect(result.error).toBeUndefined();
    expect(result.success).toMatch(/invitation sent/i);
    expect(harness.calls.createUser).toBe(1);
    expect(harness.calls.insert).toBe(1);
    expect(harness.calls.generateLink).toBe(1);
    expect(harness.calls.inviteUserByEmail).toBe(0);
    expect(harness.calls.sequence.indexOf("metadata")).toBeGreaterThan(-1);
    expect(harness.calls.sequence.indexOf("insert")).toBeGreaterThan(
      harness.calls.sequence.indexOf("metadata"),
    );
    expect(harness.calls.sequence.indexOf("generateLink")).toBeGreaterThan(
      harness.calls.sequence.indexOf("insert"),
    );
    expect(harness.memberships[0]).toMatchObject({
      business_id: "biz-1",
      role: "admin",
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const payload = sendEmail.mock.calls[0][0] as { html: string; to: string };
    expect(payload.to).toBe("op@tenant.test");
    expect(payload.html).toContain("https://auth.example/invite-secret");
    const metadataWrite = harness.calls.updateUserById.find((patch) =>
      Boolean(patch.app_metadata),
    );
    expect(metadataWrite).toBeTruthy();
    expect(harness.calls.generateLink).toBe(1);
    expect(JSON.stringify(vi.mocked(logger).info.mock.calls)).not.toContain(
      "invite-secret",
    );
    expect(JSON.stringify(vi.mocked(logger).error.mock.calls)).not.toContain(
      "invite-secret",
    );
  });

  it("rejects a delegated Trusted Admin from inviting", async () => {
    requireUser.mockResolvedValue(ADMIN_MEMBER);
    getBusiness.mockResolvedValue(BUSINESS);
    createHarness();
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("other@tenant.test"));
    expect(result.error).toBe(OWNER_ONLY_MESSAGE);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects an unauthorized user with no business", async () => {
    getBusiness.mockResolvedValue(null);
    createHarness();
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("other@tenant.test"));
    expect(result.error).toMatch(/no business/i);
  });

  it("rejects client-supplied business_id / role / user_id", async () => {
    createHarness();
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator(
      {},
      form("op@tenant.test", { business_id: "other-biz", role: "owner", user_id: "u-9" }),
    );
    expect(result.error).toMatch(/invalid invitation request/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a Platform Admin target", async () => {
    createHarness();
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("platform@chasumai.com"));
    expect(result.error).toBe(PLATFORM_ADMIN_TARGET_MESSAGE);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a target who already owns another tenant", async () => {
    createHarness({
      createError: { code: "email_exists", message: "already registered" },
      users: [
        {
          id: "other-owner",
          email: "other@tenant.test",
          app_metadata: {},
        },
      ],
      owned: [{ id: "biz-hq", owner_id: "other-owner" }],
    });
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("other@tenant.test"));
    expect(result.error).toBe(OTHER_TENANT_TARGET_MESSAGE);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a target who is already a member of another tenant including HQ", async () => {
    createHarness({
      createError: { code: "email_exists", message: "already registered" },
      users: [{ id: "hq-admin", email: "hq@tenant.test", app_metadata: {} }],
      memberships: [
        { business_id: "hq-biz", user_id: "hq-admin", role: "admin" },
      ],
    });
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("hq@tenant.test"));
    expect(result.error).toBe(OTHER_TENANT_TARGET_MESSAGE);
  });

  it("is idempotent for an existing same-business invitation and does not auto-resend", async () => {
    createHarness({
      createError: { code: "email_exists", message: "already registered" },
      users: [
        {
          id: "op-1",
          email: "op@tenant.test",
          app_metadata: { chasum_operator: { status: "invited" } },
        },
      ],
      memberships: [
        { business_id: "biz-1", user_id: "op-1", role: "admin" },
      ],
    });
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("op@tenant.test"));
    expect(result.success).toMatch(/pending Trusted Admin invitation/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("deletes a newly created Auth user when membership insert fails", async () => {
    const harness = createHarness({
      insertError: { message: "membership failed" },
    });
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("op@tenant.test"));
    expect(result.error).toMatch(/membership failed|could not/i);
    expect(harness.calls.deleteUser).toBe(1);
    expect(harness.calls.generateLink).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("never deletes a pre-existing Auth user on failure", async () => {
    const harness = createHarness({
      createError: { code: "email_exists", message: "already registered" },
      users: [{ id: "op-1", email: "op@tenant.test", app_metadata: { provider: "email" } }],
      insertError: { message: "membership failed" },
    });
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    await inviteTrustedOperator({}, form("op@tenant.test"));
    expect(harness.calls.deleteUser).toBe(0);
  });

  it("leaves Pending access when email delivery fails after membership", async () => {
    sendEmail.mockResolvedValue({ success: false, error: "provider down" });
    const harness = createHarness();
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("op@tenant.test"));
    expect(result.error).toBe(EMAIL_DELIVERY_FAILED_MESSAGE);
    expect(harness.memberships).toHaveLength(1);
    expect(harness.calls.deleteUser).toBe(0);
  });

  it("handles concurrent unique membership conflicts as already invited", async () => {
    createHarness({
      insertError: { code: "23505", message: "duplicate key" },
    });
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("op@tenant.test"));
    expect(result.success).toMatch(/pending Trusted Admin invitation/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("lets only the primary owner revoke, using ban_duration not signOut", async () => {
    const harness = createHarness({
      users: [
        {
          id: "op-1",
          email: "op@tenant.test",
          app_metadata: { chasum_operator: { status: "invited" } },
        },
      ],
      memberships: [{ business_id: "biz-1", user_id: "op-1", role: "admin" }],
    });
    const { revokeTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await revokeTrustedOperator({}, form("op@tenant.test"));
    expect(result.success).toMatch(/revoked/i);
    expect(harness.memberships).toHaveLength(0);
    expect(harness.calls.updateUserById.some((patch) => patch.ban_duration === TRUSTED_OPERATOR_BAN_DURATION)).toBe(true);
    expect(harness.calls.signOut).toBe(0);
  });

  it("rejects a Platform Admin recorded in platform_admins", async () => {
    createHarness({
      createError: { code: "email_exists", message: "already registered" },
      users: [{ id: "pa-1", email: "pa@tenant.test", app_metadata: {} }],
      platformAdmins: [{ user_id: "pa-1", email: "pa@tenant.test" }],
    });
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("pa@tenant.test"));
    expect(result.error).toBe(PLATFORM_ADMIN_TARGET_MESSAGE);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("lets the primary owner resend without creating another membership", async () => {
    const harness = createHarness({
      users: [
        {
          id: "op-1",
          email: "op@tenant.test",
          app_metadata: { chasum_operator: { status: "invited" } },
        },
      ],
      memberships: [{ business_id: "biz-1", user_id: "op-1", role: "admin" }],
    });
    const { resendTrustedOperatorInvite } = await import(
      "@/lib/actions/operator-access"
    );
    const result = await resendTrustedOperatorInvite({}, form("op@tenant.test"));
    expect(result.success).toMatch(/resent/i);
    expect(harness.calls.insert).toBe(0);
    expect(harness.calls.generateLink).toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("returns truthful already-active status on explicit resend", async () => {
    createHarness({
      users: [
        {
          id: "op-1",
          email: "op@tenant.test",
          app_metadata: { chasum_operator: { status: "active" } },
          last_sign_in_at: "2026-09-19T00:00:00.000Z",
        },
      ],
      memberships: [{ business_id: "biz-1", user_id: "op-1", role: "admin" }],
    });
    const { resendTrustedOperatorInvite } = await import(
      "@/lib/actions/operator-access"
    );
    const result = await resendTrustedOperatorInvite({}, form("op@tenant.test"));
    expect(result.success).toMatch(/already a Trusted Admin/i);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("hides Trusted Access management from a delegated admin", async () => {
    requireUser.mockResolvedValue(ADMIN_MEMBER);
    createHarness();
    const { getTrustedAccessPanel } = await import(
      "@/lib/actions/operator-access"
    );
    const panel = await getTrustedAccessPanel();
    expect(panel.canManage).toBe(false);
    expect(panel.operators).toEqual([]);
  });

  it("rejects delegated admin revoke", async () => {
    requireUser.mockResolvedValue(ADMIN_MEMBER);
    createHarness({
      users: [{ id: "op-1", email: "op@tenant.test", app_metadata: {} }],
      memberships: [{ business_id: "biz-1", user_id: "op-1", role: "admin" }],
    });
    const { revokeTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await revokeTrustedOperator({}, form("op@tenant.test"));
    expect(result.error).toBe(OWNER_ONLY_MESSAGE);
  });

  it("re-invites a revoked user by clearing the installed unban value", async () => {
    const harness = createHarness({
      createError: { code: "email_exists", message: "already registered" },
      users: [
        {
          id: "op-1",
          email: "op@tenant.test",
          app_metadata: { chasum_operator: { status: "revoked" } },
          banned_until: "2099-01-01T00:00:00.000Z",
        },
      ],
    });
    const { inviteTrustedOperator } = await import("@/lib/actions/operator-access");
    const result = await inviteTrustedOperator({}, form("op@tenant.test"));
    expect(result.error).toBeUndefined();
    expect(
      harness.calls.updateUserById.some(
        (patch) => patch.ban_duration === TRUSTED_OPERATOR_UNBAN_DURATION,
      ),
    ).toBe(true);
    expect(harness.memberships).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
