import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/env";
import { cleanupImportArtifacts } from "@/lib/server/import-artifact-cleanup";
import { RATE_LIMITS, checkRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function run(request: Request) {
  // Stricter local posture too: never invoke privileged cleanup without a secret.
  const secret = getCronSecret();
  if (!secret) return NextResponse.json({ error: "Cleanup is unavailable." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = checkRateLimit({ key: "cron:cleanup-import-artifacts", ...RATE_LIMITS.cron });
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: rateLimitHeaders(limit) });
  try {
    const counts = await cleanupImportArtifacts();
    return NextResponse.json(counts, { headers: { ...rateLimitHeaders(limit), "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Cleanup could not complete." }, { status: 503 });
  }
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
