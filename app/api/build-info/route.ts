import { getSupabaseProjectRef } from "@/lib/env";
import { NextResponse } from "next/server";

/**
 * Non-production build identity for Preview verification.
 * Never includes secrets — commit SHA, Vercel env, and public Supabase project ref only.
 */
export async function GET() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    null;
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || null;
  const ref = process.env.VERCEL_GIT_COMMIT_REF || null;
  const supabaseProjectRef = getSupabaseProjectRef();

  return NextResponse.json(
    {
      commit,
      commitShort: commit ? commit.slice(0, 7) : null,
      env,
      ref,
      supabaseProjectRef,
      production: env === "production",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
