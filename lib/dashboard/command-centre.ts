/**
 * Command Centre — pure helpers (greeting, Summer facts, attention items).
 * No fabricated metrics. All facts must come from loaded snapshot fields.
 */

export type CommandCentreScope = {
  mode: "all" | "single";
  locationName?: string | null;
};

export type CommandCentreAttentionItem = {
  id: string;
  title: string;
  why: string;
  status: string;
  href: string;
  related?: string;
  occurredAt?: string | null;
};

export type CommandCentreSummerFact = {
  kind: "fact" | "suggestion";
  text: string;
};

/**
 * Greeting windows in business-local clock time:
 * 05:00–11:59 → morning · 12:00–16:59 → afternoon · 17:00–04:59 → evening
 */
export function greetingForHour(hour: number): string {
  const h = ((Math.trunc(hour) % 24) + 24) % 24;
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
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

export function scopeLabel(scope: CommandCentreScope): string | null {
  if (scope.mode === "single" && scope.locationName) {
    return scope.locationName;
  }
  if (scope.mode === "all") return "All locations";
  return null;
}

export function buildDailySummary(input: {
  setupComplete: boolean;
  businessName: string;
  appointmentsToday: number;
  attentionCount: number;
}): string {
  if (!input.setupComplete) {
    return `Finish setup so ${input.businessName} can take real bookings.`;
  }
  const appt =
    input.appointmentsToday === 0
      ? "No appointments on the calendar today"
      : input.appointmentsToday === 1
        ? "1 appointment today"
        : `${input.appointmentsToday} appointments today`;
  if (input.attentionCount === 0) {
    return `${appt}. Nothing urgent needs attention right now.`;
  }
  if (input.attentionCount === 1) {
    return `${appt}. 1 item needs attention.`;
  }
  return `${appt}. ${input.attentionCount} items need attention.`;
}

export function buildSummerFacts(input: {
  appointmentsToday: number | null;
  outstandingBalanceCount: number;
  failedCommunicationsToday: number | null;
  nextAppointmentClock: string | null;
  pendingConfirmations: number;
}): CommandCentreSummerFact[] {
  const facts: CommandCentreSummerFact[] = [];

  if (input.appointmentsToday != null) {
    if (input.appointmentsToday === 0) {
      facts.push({
        kind: "fact",
        text: "You have no appointments scheduled today.",
      });
    } else if (input.appointmentsToday === 1) {
      facts.push({ kind: "fact", text: "You have 1 appointment today." });
    } else {
      facts.push({
        kind: "fact",
        text: `You have ${input.appointmentsToday} appointments today.`,
      });
    }
  }

  if (input.nextAppointmentClock) {
    facts.push({
      kind: "fact",
      text: `Your next appointment begins at ${input.nextAppointmentClock}.`,
    });
  }

  if (input.outstandingBalanceCount > 0) {
    facts.push({
      kind: "fact",
      text:
        input.outstandingBalanceCount === 1
          ? "1 appointment has an outstanding balance."
          : `${input.outstandingBalanceCount} appointments have outstanding balances.`,
    });
  }

  if (
    input.failedCommunicationsToday != null &&
    input.failedCommunicationsToday > 0
  ) {
    facts.push({
      kind: "fact",
      text:
        input.failedCommunicationsToday === 1
          ? "1 customer message failed today."
          : `${input.failedCommunicationsToday} customer messages failed today.`,
    });
  }

  if (input.pendingConfirmations > 0) {
    facts.push({
      kind: "suggestion",
      text:
        input.pendingConfirmations === 1
          ? "Review the appointment still awaiting confirmation."
          : `Review ${input.pendingConfirmations} appointments awaiting confirmation.`,
    });
  }

  return facts.slice(0, 5);
}

export function buildAttentionItems(input: {
  setupComplete: boolean;
  failedCommunicationsToday: number | null;
  outstandingDepositsCount: number;
  outstandingInvoicesCount: number;
  unassignedTodayCount: number;
  pendingConfirmations: number;
  cancelledTodayCount: number;
  commerceSchemaReady: boolean;
}): CommandCentreAttentionItem[] {
  const items: CommandCentreAttentionItem[] = [];

  if (!input.setupComplete) {
    items.push({
      id: "setup-incomplete",
      title: "Setup incomplete",
      why: "Public booking and day-to-day ops need profile, services, staff, and hours.",
      status: "Blocking",
      href: "/dashboard/business",
    });
  }

  if (
    input.failedCommunicationsToday != null &&
    input.failedCommunicationsToday > 0
  ) {
    items.push({
      id: "failed-comms",
      title:
        input.failedCommunicationsToday === 1
          ? "1 message failed"
          : `${input.failedCommunicationsToday} messages failed`,
      why: "Customers may not have received a confirmation or reminder.",
      status: "Failed delivery",
      href: "/dashboard/notifications",
    });
  }

  if (input.commerceSchemaReady && input.outstandingDepositsCount > 0) {
    items.push({
      id: "outstanding-deposits",
      title:
        input.outstandingDepositsCount === 1
          ? "1 outstanding deposit or balance"
          : `${input.outstandingDepositsCount} outstanding deposits or balances`,
      why: "Collecting balances reduces no-shows and keeps cash flow clear.",
      status: "Payment follow-up",
      href: "/dashboard/payments",
    });
  }

  if (input.commerceSchemaReady && input.outstandingInvoicesCount > 0) {
    items.push({
      id: "outstanding-invoices",
      title:
        input.outstandingInvoicesCount === 1
          ? "1 open invoice balance"
          : `${input.outstandingInvoicesCount} open invoice balances`,
      why: "Open balances need follow-up or payment recording.",
      status: "Outstanding",
      href: "/dashboard/payments",
    });
  }

  if (input.unassignedTodayCount > 0) {
    items.push({
      id: "unassigned",
      title:
        input.unassignedTodayCount === 1
          ? "1 unassigned appointment today"
          : `${input.unassignedTodayCount} unassigned appointments today`,
      why: "Assign an employee before the visit so the schedule is clear.",
      status: "Unassigned",
      href: "/dashboard/calendar?view=day",
    });
  }

  if (input.pendingConfirmations > 0) {
    items.push({
      id: "pending-confirmations",
      title:
        input.pendingConfirmations === 1
          ? "1 appointment awaiting confirmation"
          : `${input.pendingConfirmations} appointments awaiting confirmation`,
      why: "Pending bookings may need a call or confirmation before the visit.",
      status: "Pending",
      href: "/dashboard/calendar",
    });
  }

  if (input.cancelledTodayCount > 0) {
    items.push({
      id: "cancelled-today",
      title:
        input.cancelledTodayCount === 1
          ? "1 cancellation today"
          : `${input.cancelledTodayCount} cancellations today`,
      why: "These cancelled times may now be available — review openings for possible rebooking.",
      status: "Cancelled",
      href: "/dashboard/calendar?view=day",
    });
  }

  return items;
}

export function sortScheduleByStart<T extends { start_time: string }>(
  rows: T[],
): T[] {
  return [...rows].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
}
