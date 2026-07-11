import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/env";
import { processPendingJobs } from "@/lib/integrations/jobs/processor";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = getCronSecret();

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processPendingJobs(50);
  return NextResponse.json({ processed, timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  return GET(request);
}
