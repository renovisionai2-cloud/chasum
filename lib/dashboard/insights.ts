import type { AiEmployeeId } from "@/lib/ai-workforce/types";

export type DashboardInsight = {
  id: string;
  employeeId: AiEmployeeId;
  employeeName: string;
  role: string;
  message: string;
  href: string;
};

type InsightInput = {
  todayCount: number;
  yesterdayCount: number;
  lastWeekSameDayCount: number;
  weekCount: number;
  previousWeekCount: number;
  pendingConfirmations: number;
  upcomingCount: number;
  customerCount: number;
  weekdayName: string;
};

/**
 * Build AI-style recommendations from real dashboard metrics only.
 * Returns an empty list when nothing evidence-based can be said.
 */
export function buildDashboardInsights(input: InsightInput): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (input.pendingConfirmations > 0) {
    insights.push({
      id: "pending-confirmations",
      employeeId: "sophia",
      employeeName: "Sophia",
      role: "AI Customer Success",
      message:
        input.pendingConfirmations === 1
          ? "Sophia noticed 1 appointment still pending confirmation."
          : `Sophia noticed ${input.pendingConfirmations} appointments still pending confirmation.`,
      href: "/dashboard/calendar",
    });
  }

  if (
    input.lastWeekSameDayCount > 0 &&
    input.todayCount < input.lastWeekSameDayCount
  ) {
    insights.push({
      id: "vs-last-weekday",
      employeeId: "leo",
      employeeName: "Leo",
      role: "AI Business Advisor",
      message: `Leo reports bookings today (${input.todayCount}) are lower than last ${input.weekdayName} (${input.lastWeekSameDayCount}).`,
      href: "/dashboard/calendar",
    });
  }

  if (input.todayCount === 0 && input.weekCount > 0) {
    insights.push({
      id: "clear-today",
      employeeId: "alex",
      employeeName: "Alex",
      role: "AI Scheduler",
      message:
        "Alex sees an open day on the calendar — review availability and fill open slots when ready.",
      href: "/dashboard/calendar",
    });
  }

  if (
    input.previousWeekCount > 0 &&
    input.weekCount > 0 &&
    input.weekCount < input.previousWeekCount
  ) {
    insights.push({
      id: "week-vs-prev",
      employeeId: "maya",
      employeeName: "Maya",
      role: "AI Marketing Manager",
      message: `Maya notes this week has ${input.weekCount} bookings vs ${input.previousWeekCount} last week — quiet windows may need outreach (owner approval required).`,
      href: "/dashboard/ai-workforce/maya",
    });
  }

  if (input.customerCount > 0 && input.upcomingCount === 0) {
    insights.push({
      id: "no-upcoming",
      employeeId: "emma",
      employeeName: "Emma",
      role: "AI Receptionist",
      message: `Emma sees ${input.customerCount} clients on file but no upcoming appointments — consider reaching out or opening the booking link.`,
      href: "/dashboard/clients",
    });
  }

  return insights.slice(0, 4);
}

export function buildAiSummary(input: {
  todayCount: number;
  pendingConfirmations: number;
  todayRevenue: number;
  weekCount: number;
}): string {
  const parts: string[] = [];

  if (input.todayCount === 0) {
    parts.push("No appointments on the calendar today.");
  } else if (input.todayCount === 1) {
    parts.push("You have 1 appointment today.");
  } else {
    parts.push(`You have ${input.todayCount} appointments today.`);
  }

  if (input.pendingConfirmations > 0) {
    parts.push(
      input.pendingConfirmations === 1
        ? "1 is awaiting confirmation."
        : `${input.pendingConfirmations} are awaiting confirmation.`,
    );
  }

  if (input.todayRevenue > 0) {
    parts.push(
      `Completed revenue today is $${input.todayRevenue.toFixed(0)}.`,
    );
  }

  if (input.weekCount > 0) {
    parts.push(
      input.weekCount === 1
        ? "1 booking is on the books this week."
        : `${input.weekCount} bookings are on the books this week.`,
    );
  }

  return parts.join(" ");
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstNameFromUser(input: {
  email?: string | null;
  fullName?: string | null;
}): string {
  const full = input.fullName?.trim();
  if (full) return full.split(/\s+/)[0] ?? full;
  const local = input.email?.split("@")[0]?.trim();
  if (!local) return "there";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  const first = cleaned.split(/\s+/)[0] ?? cleaned;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function formatComparison(
  current: number,
  previous: number,
  options?: { invert?: boolean },
): { label: string; tone: "up" | "down" | "flat" } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return { label: "New vs prior period", tone: "up" };
  }
  const delta = current - previous;
  if (delta === 0) return { label: "Same as prior period", tone: "flat" };
  const pct = Math.round((Math.abs(delta) / previous) * 100);
  const up = delta > 0;
  const tone = options?.invert
    ? up
      ? "down"
      : "up"
    : up
      ? "up"
      : "down";
  return {
    label: `${up ? "+" : "−"}${pct}% vs prior period`,
    tone,
  };
}
