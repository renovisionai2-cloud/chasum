import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  resolve: vi.fn(),
  rpc: vi.fn(),
  service: vi.fn(),
}));
vi.mock("@/lib/actions/business", () => ({
  requireUser: mocks.user,
  resolveBusinessForUser: mocks.resolve,
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mocks.service,
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
import { submitBusinessIdentity } from "@/lib/actions/tenant-identity";
function form(intent = "create_new") {
  const data = new FormData();
  Object.entries({
    intent,
    name: "New Studio",
    email: "CONTACT@NEW.TEST",
    phone: "+1 416 555 0100",
    city: "Toronto",
    region: "Ontario",
    country: "CA",
    website: "www.new.test/private?token=secret",
    confirmation: "yes",
  }).forEach(([k, v]) => data.set(k, v));
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({
    id: "verified-actor",
    email_confirmed_at: "2026-01-01",
    app_metadata: {},
  });
  mocks.resolve.mockResolvedValue(null);
  mocks.service.mockReturnValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: { status: "created" }, error: null });
});
describe("explicit business identity action", () => {
  it("uses the verified actor and authoritative RPC despite forged browser approval/identity", async () => {
    const data = form();
    data.set("actor_user_id", "victim");
    data.set("preflightApproved", "true");
    data.set("decision", "private_alpha_override");
    await expect(submitBusinessIdentity({}, data)).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
    expect(mocks.resolve).toHaveBeenCalledWith("verified-actor");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith(
      "decide_business_identity",
      expect.objectContaining({
        p_actor_user_id: "verified-actor",
        p_intent: "create_new",
        p_email: "contact@new.test",
        p_website: "https://www.new.test",
      }),
    );
    expect(mocks.rpc.mock.calls[0][1]).not.toHaveProperty("preflightApproved");
  });
  it("existing-business intent records access request only", async () => {
    mocks.rpc.mockResolvedValue({
      data: { status: "join_existing" },
      error: null,
    });
    expect(await submitBusinessIdentity({}, form("join_existing"))).toEqual({
      existing: true,
    });
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({
      p_intent: "join_existing",
      p_name: null,
      p_email: null,
    });
  });
  it("rechecks existing ownership before invoking privileged code", async () => {
    mocks.resolve.mockResolvedValue({ id: "existing" });
    expect(await submitBusinessIdentity({}, form())).toHaveProperty("error");
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it.each(["invited", "revoked"])(
    "fails closed for unresolved %s operator",
    async (status) => {
      mocks.user.mockResolvedValue({
        id: "operator",
        email_confirmed_at: "yes",
        app_metadata: { chasum_operator: { status } },
      });
      await expect(submitBusinessIdentity({}, form())).rejects.toThrow(
        "REDIRECT:/access-denied",
      );
      expect(mocks.service).not.toHaveBeenCalled();
    },
  );
  it("rejects unverified accounts", async () => {
    mocks.user.mockResolvedValue({ id: "user", app_metadata: {} });
    expect(await submitBusinessIdentity({}, form())).toHaveProperty("error");
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it.each(["intent", "confirmation", "phone", "email", "city"])(
    "rejects missing %s without privileged invocation",
    async (key) => {
      const data = form();
      data.delete(key);
      expect(await submitBusinessIdentity({}, data)).toHaveProperty("error");
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("ambiguity never leaks candidate identity or creates a second request", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        status: "ambiguous",
        candidate_business_id: "private",
        email: "private@example.test",
      },
      error: null,
    });
    expect(await submitBusinessIdentity({}, form())).toEqual({ review: true });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("missing migration or failed preflight fails closed without RPC fallback", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "secret database detail", code: "PGRST202" },
    });
    const result = await submitBusinessIdentity({}, form());
    expect(result.error).toContain("unavailable");
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("concurrent winner reported as existing cannot be treated as a new business", async () => {
    mocks.rpc.mockResolvedValue({ data: { status: "existing" }, error: null });
    expect(await submitBusinessIdentity({}, form())).toHaveProperty("error");
  });
});
