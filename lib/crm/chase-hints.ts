import type { CrmInsights } from "@/lib/crm/types";

function daysBetween(iso: string | null, now = Date.now()) {
  if (!iso) return null;
  return Math.floor((now - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

/** Build Chase cards from a single profile's insights (safe for client components). */
export function chaseHintsFromInsights(insights: CrmInsights): string[] {
  const hints: string[] = [];
  if (insights.upcomingCount === 0 && insights.lastVisit) {
    const days = daysBetween(insights.lastVisit);
    if (days != null && days > 30) {
      hints.push(`No upcoming visit — last seen ${days} days ago.`);
    }
  }
  if (insights.noShowRate >= 20) {
    hints.push(`Elevated no-show rate (${insights.noShowRate}%).`);
  }
  if (insights.lifetimeRevenue >= 500) {
    hints.push("High-value customer — protect preferred slots.");
  }
  if (insights.completedAppointments >= 3 && insights.upcomingCount === 0) {
    hints.push(
      "Repeat guest without a next booking — good follow-up candidate.",
    );
  }
  return hints;
}
