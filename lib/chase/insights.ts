import type {
  ChaseAlert,
  ChaseInsight,
  ChaseKpis,
  ChaseOperationsSnapshot,
  ChasePriority,
} from "@/lib/chase/types";

function insight(
  id: string,
  title: string,
  body: string,
  priority: ChasePriority,
  category: ChaseInsight["category"],
): ChaseInsight {
  return { id, title, body, priority, category };
}

/** Build prioritized recommendations from grounded KPIs — never invents. */
export function buildChaseInsights(input: {
  kpis: ChaseKpis;
  pendingConfirmations: number;
  outstandingDeposits: number;
  topServiceName: string | null;
  topStaffName: string | null;
  topStaffUtilPct: number | null;
  quietDayLabel: string | null;
  vipInactiveCount: number;
  lowUtilWeekday: string | null;
}): ChaseInsight[] {
  const list: ChaseInsight[] = [];
  const { kpis } = input;

  if (kpis.revenueWeekDeltaPct != null) {
    const delta = kpis.revenueWeekDeltaPct;
    if (delta >= 5) {
      list.push(
        insight(
          "rev-up",
          `Revenue is up ${delta}% versus last week`,
          "Protect high-value slots and keep popular services well staffed.",
          delta >= 14 ? "high" : "medium",
          "revenue",
        ),
      );
    } else if (delta <= -10) {
      list.push(
        insight(
          "rev-down",
          `Revenue is down ${Math.abs(delta)}% versus last week`,
          "Review quiet hours and outstanding confirmations before adding promotions.",
          "high",
          "revenue",
        ),
      );
    }
  }

  if (input.lowUtilWeekday) {
    list.push(
      insight(
        "quiet-day",
        `${input.lowUtilWeekday} has lower utilization`,
        "Consider targeted outreach or shorter shifts — Chase does not invent openings.",
        "medium",
        "capacity",
      ),
    );
  }

  if (input.topStaffName && input.topStaffUtilPct != null && input.topStaffUtilPct >= 85) {
    list.push(
      insight(
        "staff-hot",
        `${input.topStaffName} is booked at ${input.topStaffUtilPct}% capacity`,
        "Watch overtime and offer alternate employees for overflow demand.",
        input.topStaffUtilPct >= 95 ? "high" : "medium",
        "staff",
      ),
    );
  }

  if (input.topServiceName) {
    list.push(
      insight(
        "svc-top",
        `${input.topServiceName} leads service revenue`,
        "Keep inventory and preferred employees aligned to this service.",
        "low",
        "bookings",
      ),
    );
  }

  if (input.vipInactiveCount > 0) {
    list.push(
      insight(
        "vip-inactive",
        `${input.vipInactiveCount} high-value or overdue guests need follow-up`,
        "Review CRM overdue and inactive lists — outreach stays owner-approved.",
        "high",
        "customers",
      ),
    );
  }

  if (input.pendingConfirmations > 0) {
    list.push(
      insight(
        "pending",
        `${input.pendingConfirmations} appointments remain unconfirmed`,
        "Clear the confirmation queue to reduce no-shows.",
        input.pendingConfirmations >= 5 ? "high" : "medium",
        "ops",
      ),
    );
  }

  if (kpis.cancellationRatePct != null && kpis.cancellationRatePct >= 15) {
    list.push(
      insight(
        "cancel-rate",
        `Cancellation rate is ${kpis.cancellationRatePct}%`,
        "Review policies and reminder timing before changing availability.",
        "high",
        "bookings",
      ),
    );
  }

  if (input.outstandingDeposits > 0) {
    list.push(
      insight(
        "deposits",
        `${input.outstandingDeposits} appointments still need payment collection`,
        "Collect deposits from Reception or CRM — Chase will not charge customers.",
        "medium",
        "revenue",
      ),
    );
  }

  if (list.length === 0) {
    list.push(
      insight(
        "steady",
        "Operations look steady",
        "No urgent signals from today's data. Keep confirming bookings and watching capacity.",
        "low",
        "ops",
      ),
    );
  }

  const order: Record<ChasePriority, number> = { high: 0, medium: 1, low: 2 };
  return list.sort((a, b) => order[a.priority] - order[b.priority]);
}

export function buildChaseAlerts(input: {
  pendingConfirmations: number;
  outstandingDeposits: number;
  cancellationRatePct: number | null;
  availableSlots: number;
  todayAppointments: number;
  staffWorking: number;
  revenueWeekDeltaPct: number | null;
  upcomingClosures: ChaseOperationsSnapshot["upcomingClosures"];
  vacationSoon: boolean;
}): ChaseAlert[] {
  const alerts: ChaseAlert[] = [];

  for (const c of input.upcomingClosures.slice(0, 5)) {
    alerts.push({
      id: `closure-${c.id}`,
      title:
        c.kind === "business"
          ? "Upcoming business closure"
          : "Staff time off upcoming",
      body: c.label,
      severity: "info",
      when: c.startsAt,
    });
  }

  if (input.vacationSoon) {
    alerts.push({
      id: "vacation-soon",
      title: "Vacation begins soon",
      body: "At least one employee vacation starts within 7 days.",
      severity: "warning",
    });
  }

  if (input.availableSlots >= 8 && input.todayAppointments < Math.max(2, input.staffWorking)) {
    alerts.push({
      id: "low-friday-capacity",
      title: "Low utilization with open capacity",
      body: `${input.availableSlots} open slots remain while the day still looks light.`,
      severity: "warning",
    });
  }

  if (input.revenueWeekDeltaPct != null && input.revenueWeekDeltaPct <= -15) {
    alerts.push({
      id: "revenue-below",
      title: "Revenue below recent pace",
      body: `Week revenue is down ${Math.abs(input.revenueWeekDeltaPct)}% versus the prior week.`,
      severity: "critical",
    });
  }

  if (input.cancellationRatePct != null && input.cancellationRatePct >= 20) {
    alerts.push({
      id: "high-cancel",
      title: "High cancellation rate",
      body: `Cancellations are at ${input.cancellationRatePct}% of decided appointments.`,
      severity: "critical",
    });
  }

  if (input.outstandingDeposits > 0) {
    alerts.push({
      id: "deposits",
      title: "Outstanding deposits",
      body: `${input.outstandingDeposits} upcoming visits still need payment collection.`,
      severity: "warning",
    });
  }

  if (input.pendingConfirmations >= 3) {
    alerts.push({
      id: "unconfirmed",
      title: "Unconfirmed appointments",
      body: `${input.pendingConfirmations} bookings await confirmation.`,
      severity: "warning",
    });
  }

  return alerts;
}
