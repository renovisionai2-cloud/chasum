import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { cookies, redirect } = vi.hoisted(() => ({
  cookies: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies }));
vi.mock("next/navigation", () => ({ redirect }));

import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

const PROJECT_REF = "wnfahklzaxirftyskctd";
const COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`;
const MUTABLE_COOKIE_VALUES = Symbol.for("next.mutated.cookies");
const originalEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

function cookieStore({
  existing = [{ name: COOKIE_NAME, value: "" }],
  mutable,
  failAt,
}: {
  existing?: Array<{ name: string; value: string }>;
  mutable: boolean;
  failAt?: number;
}) {
  const failure = new Error("COOKIE_WRITE_FAILED");
  let writes = 0;
  const store = {
    getAll: vi.fn(() => existing),
    set: vi.fn(() => {
      writes += 1;
      if (writes === failAt) throw failure;
    }),
  };
  if (mutable) {
    Object.defineProperty(store, MUTABLE_COOKIE_VALUES, { value: [] });
  }
  return { store, failure };
}

async function realSignOut() {
  const client = await createClient();
  return client.auth.signOut();
}

describe("Supabase SSR server cookie adapter", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      `https://${PROJECT_REF}.supabase.co`;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "synthetic-anon-key";
    cookies.mockReset();
    redirect.mockReset();
    redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalEnv.url === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv.url;
    }
    if (originalEnv.key === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnv.key;
    }
  });

  it("removes the real Supabase SSR auth cookie in a mutable context", async () => {
    const { store } = cookieStore({ mutable: true });
    cookies.mockResolvedValue(store);

    await expect(realSignOut()).resolves.toEqual({ error: null });

    expect(store.set).toHaveBeenCalledTimes(1);
    expect(store.set).toHaveBeenCalledWith(
      COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("propagates a mutable-context cookie deletion failure", async () => {
    const { store, failure } = cookieStore({ mutable: true, failAt: 1 });
    cookies.mockResolvedValue(store);

    await expect(realSignOut()).rejects.toBe(failure);
    expect(store.set).toHaveBeenCalledTimes(1);
  });

  it("propagates a partial chunk-deletion failure", async () => {
    const existing = [
      { name: `${COOKIE_NAME}.0`, value: "" },
      { name: `${COOKIE_NAME}.1`, value: "" },
    ];
    const { store, failure } = cookieStore({
      existing,
      mutable: true,
      failAt: 2,
    });
    cookies.mockResolvedValue(store);

    await expect(realSignOut()).rejects.toBe(failure);
    expect(store.set).toHaveBeenCalledTimes(2);
    expect(store.set.mock.calls[0][0]).toBe(`${COOKIE_NAME}.0`);
    expect(store.set.mock.calls[1][0]).toBe(`${COOKIE_NAME}.1`);
  });

  it("preserves read-only Server Component cookie behavior", async () => {
    const { store } = cookieStore({ mutable: false, failAt: 1 });
    cookies.mockResolvedValue(store);

    await expect(realSignOut()).resolves.toEqual({ error: null });
    expect(store.set).toHaveBeenCalledTimes(1);
  });

  it("returns the existing safe action error instead of a false logout", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { store } = cookieStore({ mutable: true, failAt: 1 });
    cookies.mockResolvedValue(store);

    await expect(signOut({}, new FormData())).resolves.toEqual({
      error: "We couldn't sign you out. Please try again.",
    });

    expect(redirect).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[auth.signOut] unexpected_failure",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "COOKIE_WRITE_FAILED",
    );
  });
});
