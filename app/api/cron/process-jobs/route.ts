import { NextResponse } from "next/server";
import { getCronSecret, isProductionRuntime } from "@/lib/env";
import { processPendingJobs } from "@/lib/integrations/jobs/processor";

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

  // Local / preview: require bearer only when a secret is configured.
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function GET(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

  const processed = await processPendingJobs(50);
  return NextResponse.json({ processed, timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  return GET(request);
}
