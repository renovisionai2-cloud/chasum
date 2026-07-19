import {
  ALPHA_FEEDBACK,
  ALPHA_FOUNDER_NOTES,
  ALPHA_PARTNERS,
  ALPHA_SUPPORT,
  ALPHA_WEEKLY_REPORT,
} from "@/lib/hq/private-alpha/seed";
import type { PrivateAlphaSnapshot } from "@/lib/hq/private-alpha/types";
import { requirePlatformOwner } from "@/lib/owner/auth";

/**
 * Private Alpha Management snapshot — platform owners only.
 * Curated founder ops data for the four Founding Design Partners.
 */
export async function getPrivateAlphaSnapshot(): Promise<PrivateAlphaSnapshot> {
  await requirePlatformOwner();

  const partners = ALPHA_PARTNERS;
  const openSupport = ALPHA_SUPPORT.filter((s) => s.status !== "resolved");
  const openFeedback = ALPHA_FEEDBACK.filter(
    (f) => f.status !== "completed" && f.status !== "rejected",
  );
  const avgHealth = Math.round(
    partners.reduce((sum, p) => sum + p.healthScore, 0) / partners.length,
  );

  return {
    generatedAt: new Date().toISOString(),
    partners,
    feedback: ALPHA_FEEDBACK,
    support: ALPHA_SUPPORT,
    weeklyReport: ALPHA_WEEKLY_REPORT,
    founderNotes: ALPHA_FOUNDER_NOTES,
    totals: {
      partners: partners.length,
      active: partners.filter((p) => p.status === "active").length,
      onboarding: partners.filter((p) => p.status === "onboarding").length,
      atRisk: partners.filter(
        (p) => p.risk === "high" || p.risk === "critical" || p.status === "at_risk",
      ).length,
      openSupport: openSupport.length,
      openFeedback: openFeedback.length,
      avgHealth,
    },
  };
}

export function onboardingPct(partner: {
  onboarding: { done: boolean }[];
}): number {
  if (!partner.onboarding.length) return 0;
  const done = partner.onboarding.filter((s) => s.done).length;
  return Math.round((done / partner.onboarding.length) * 100);
}
