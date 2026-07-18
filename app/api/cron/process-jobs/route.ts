import { NextResponse } from "next/server";
import { getCronSecret, isProductionRuntime } from "@/lib/env";
import { processPendingJobs } from "@/lib/integrations/jobs/processor";
import { logger } from "@/lib/observability/logger";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

function authorize(request: Request): NextResponse | null {
  const secret = getCronSecret();
  const authHeader = request.headers.get("authorization");

  if (isProductionRuntime()) {
    if (!secret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured for production." },
        { status: 503 },
      );
    }
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
  }

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

async function run(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

  const ip = clientIpFromHeaders(request.headers);
  const limit = checkRateLimit({
    key: `cron:process-jobs:${ip}`,
    ...RATE_LIMITS.cron,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const started = Date.now();
  const processed = await processPendingJobs(50);
  logger.info("cron", "processed jobs", {
    processed,
    latencyMs: Date.now() - started,
  });

  return NextResponse.json(
    { processed, timestamp: new Date().toISOString() },
    { headers: rateLimitHeaders(limit) },
  );
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
