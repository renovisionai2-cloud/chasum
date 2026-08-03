import { NextResponse } from "next/server";

/**
 * Non-production build identity for Preview verification.
 * Never includes secrets — commit SHA and Vercel env only.
 */
export async function GET() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    null;
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || null;
  const ref = process.env.VERCEL_GIT_COMMIT_REF || null;

  return NextResponse.json(
    {
      commit,
      commitShort: commit ? commit.slice(0, 7) : null,
      env,
      ref,
      production: env === "production",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
