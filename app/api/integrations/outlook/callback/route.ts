import { NextResponse } from "next/server";
import { completeOutlookCalendarConnect } from "@/lib/actions/integrations";
import { getAppUrl } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${getAppUrl()}/dashboard/integrations?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${getAppUrl()}/dashboard/integrations?error=missing_code`,
    );
  }

  try {
    await completeOutlookCalendarConnect(code, state);
    return NextResponse.redirect(
      `${getAppUrl()}/dashboard/integrations?success=outlook_connected`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      `${getAppUrl()}/dashboard/integrations?error=${encodeURIComponent(message)}`,
    );
  }
}
