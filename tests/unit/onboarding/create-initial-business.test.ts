import { beforeEach, describe, expect, it, vi } from "vitest";

const getBusiness = vi.fn();
const requireUser = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const rpc = vi.fn();
const update = vi.fn();

vi.mock("@/lib/actions/business", () => ({
  getBusiness: (...args: unknown[]) => getBusiness(...args),
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc,
    from: () => ({
      update: () => ({
        eq: () => ({
          eq: update,
        }),
      }),
    }),
  })),
}));

import { createInitialBusinessAction } from "@/lib/actions/create-initial-business";

const user = { id: "11111111-1111-1111-1111-111111111111", email: "a@b.c" };

describe("createInitialBusinessAction", () => {
  beforeEach(() => {
    getBusiness.mockReset();
    requireUser.mockReset();
    redirect.mockClear();
    rpc.mockReset();
    update.mockReset();
    requireUser.mockResolvedValue(user);
    update.mockResolvedValue({ error: null });
  });

  it("does not create when the user already has a business", async () => {
    getBusiness.mockResolvedValue({
      id: "biz-1",
      owner_id: user.id,
      name: "Existing",
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({ businessName: "Northshore Clinic" }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("creates a first business from the submitted name", async () => {
    getBusiness.mockResolvedValue(null);
    rpc.mockResolvedValue({
      data: {
        id: "biz-new",
        owner_id: user.id,
        name: "Northshore Clinic",
      },
      error: null,
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Northshore Clinic",
          timezone: "America/Toronto",
          currency: "cad",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(rpc).toHaveBeenCalledWith("ensure_business_for_owner", {
      p_name: "Northshore Clinic",
      p_preferred_slug: "northshore-clinic",
    });
    expect(update).toHaveBeenCalled();
  });

  it("rejects an empty business name without creating", async () => {
    getBusiness.mockResolvedValue(null);
    const result = await createInitialBusinessAction(
      {},
      form({ businessName: "" }),
    );
    expect(result.error).toMatch(/name/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects an invalid selected timezone without creating", async () => {
    getBusiness.mockResolvedValue(null);
    const result = await createInitialBusinessAction(
      {},
      form({
        businessName: "Northshore Clinic",
        timezone: "Not/AZone",
        currency: "cad",
      }),
    );
    expect(result.error).toMatch(/timezone/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects an invalid currency without creating", async () => {
    getBusiness.mockResolvedValue(null);
    const result = await createInitialBusinessAction(
      {},
      form({
        businessName: "Northshore Clinic",
        timezone: "America/Toronto",
        currency: "not-a-currency",
      }),
    );
    expect(result.error).toMatch(/currency/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not rename an existing authorized tenant returned by the RPC", async () => {
    getBusiness.mockResolvedValue(null);
    rpc.mockResolvedValue({
      data: {
        id: "gvm",
        owner_id: user.id,
        name: "GVM Baby World",
      },
      error: null,
    });

    await expect(
      createInitialBusinessAction(
        {},
        form({
          businessName: "Some Other Name",
          timezone: "America/Toronto",
          currency: "cad",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");
    expect(update).not.toHaveBeenCalled();
  });
});

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }
  return data;
}
