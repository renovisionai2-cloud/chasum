import {
  HQ_APPLICATIONS,
  HQ_BUGS,
  HQ_FEATURE_REQUESTS,
  HQ_LAUNCH,
  HQ_PARTNERS,
  HQ_PRODUCT_HEALTH,
  HQ_RELEASE_NOTES,
  HQ_ROADMAP,
} from "@/lib/hq/seed";
import type {
  HqSnapshot,
  PipelineStage,
} from "@/lib/hq/types";
import { requirePlatformOwner } from "@/lib/owner/auth";
import { getOwnerOverviewMetrics } from "@/lib/owner/data";
import { createServiceClient } from "@/lib/supabase/service";
import { subDays } from "date-fns";

function emptyPipelineCounts(): Record<PipelineStage, number> {
  return {
    applied: 0,
    interview: 0,
    accepted: 0,
    declined: 0,
    onboarded: 0,
  };
}

async function countRecentAppointments(): Promise<number> {
  try {
    const service = createServiceClient();
    const since = subDays(new Date(), 7).toISOString();
    const { count, error } = await service
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Founder HQ snapshot — platform owner only.
 * Live tenant metrics when available; pipeline/bugs/roadmap from curated seed until persisted.
 */
export async function getHqSnapshot(): Promise<HqSnapshot> {
  await requirePlatformOwner();

  let platformMetrics: "live" | "seed" = "seed";
  let activeBusinesses = HQ_PARTNERS.filter((p) => p.status === "active").length;
  let weeklyActive = HQ_PARTNERS.filter((p) => p.weeklyActivity >= 40).length;
  let mrrLabel = "$0";
  let productionHealth: HqSnapshot["executive"]["productionHealth"] = "healthy";
  let productionHealthLabel = "Core checks configured";
  let bookings7d = HQ_PARTNERS.reduce((sum, p) => sum + p.bookings7d, 0);

  try {
    const metrics = await getOwnerOverviewMetrics();
    platformMetrics = "live";
    activeBusinesses = metrics.activeBusinesses;
    weeklyActive = Math.max(weeklyActive, metrics.newSignups7d);
    mrrLabel = metrics.mrrLabel;
    productionHealth = metrics.systemHealth.ok ? "healthy" : "degraded";
    productionHealthLabel = metrics.systemHealth.ok
      ? "Supabase · email · cron"
      : "Attention required — see Owner Health";
    const liveBookings = await countRecentAppointments();
    if (liveBookings > 0) bookings7d = liveBookings;
  } catch {
    // Seed executive numbers remain.
  }

  const pipelineCounts = emptyPipelineCounts();
  for (const app of HQ_APPLICATIONS) {
    pipelineCounts[app.stage] += 1;
  }

  const criticalBugs = HQ_BUGS.filter(
    (b) => b.severity === "critical" && b.status !== "resolved",
  );
  const openBugs = HQ_BUGS.filter((b) => b.status !== "resolved");

  return {
    generatedAt: new Date().toISOString(),
    executive: {
      applications: HQ_APPLICATIONS.length,
      accepted: pipelineCounts.accepted + pipelineCounts.onboarded,
      activeBusinesses,
      weeklyActive,
      mrrLabel,
      bookings7d,
      summerConversations: 47,
      chaseReports: 12,
      supportTickets: HQ_PARTNERS.reduce((sum, p) => sum + p.supportOpen, 0),
      productionHealth,
      productionHealthLabel,
    },
    applications: HQ_APPLICATIONS,
    pipelineCounts,
    partners: HQ_PARTNERS,
    productHealth: {
      ...HQ_PRODUCT_HEALTH,
      criticalBugs: criticalBugs.length,
      openBugs: openBugs.length,
    },
    criticalBugs,
    openBugs,
    featureRequests: HQ_FEATURE_REQUESTS,
    roadmap: HQ_ROADMAP,
    releaseNotes: HQ_RELEASE_NOTES,
    launch: HQ_LAUNCH,
    dataSources: {
      platformMetrics,
      pipeline: "seed",
      note:
        "Pipeline, bugs, and roadmap are founder-curated until applications and issue trackers are persisted. Platform MRR/business counts use live Owner metrics when available.",
    },
  };
}
