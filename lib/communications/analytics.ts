import type { ChaseCommunicationsMetrics } from "@/lib/communications/types";
import { isMissingSchemaError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { endOfDay, startOfDay } from "date-fns";

export async function getChaseCommunicationsMetrics(
  businessId: string,
): Promise<ChaseCommunicationsMetrics> {
  const supabase = await createClient();
  const now = new Date();
  const from = startOfDay(now).toISOString();
  const to = endOfDay(now).toISOString();

  const empty: ChaseCommunicationsMetrics = {
    sentToday: 0,
    failedToday: 0,
    deliverySuccessRate: null,
    smsFailures: 0,
    unsentQueued: 0,
    bounceOrFailRate: null,
  };

  const { data: logs, error } = await supabase
    .from("notification_logs")
    .select("status, channel")
    .eq("business_id", businessId)
    .gte("created_at", from)
    .lte("created_at", to)
    .limit(500);

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      console.warn("[comms.chase]", error.message);
    }
    return empty;
  }

  const rows = logs ?? [];
  const sentToday = rows.filter((r) => r.status === "sent").length;
  const failedToday = rows.filter((r) => r.status === "failed").length;
  const smsFailures = rows.filter(
    (r) => r.channel === "sms" && r.status === "failed",
  ).length;
  const decided = sentToday + failedToday;
  const deliverySuccessRate =
    decided > 0 ? Math.round((sentToday / decided) * 1000) / 10 : null;
  const bounceOrFailRate =
    decided > 0 ? Math.round((failedToday / decided) * 1000) / 10 : null;

  const { count: unsentQueued } = await supabase
    .from("background_jobs")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "pending")
    .in("job_type", ["email", "sms", "reminder"]);

  return {
    sentToday,
    failedToday,
    deliverySuccessRate,
    smsFailures,
    unsentQueued: unsentQueued ?? 0,
    bounceOrFailRate,
  };
}
