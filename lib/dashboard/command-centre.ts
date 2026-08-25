/**
 * Command Centre — pure helpers.
 * Facts must come from loaded snapshot fields. No fabricated metrics.
 */

import { isActiveBooking } from "@/lib/commerce/recognize";
import type { SetupStep } from "@/lib/onboarding/setup-progress";
import type { AppointmentStatus } from "@/lib/types/booking";

export type CommandCentreScheduleRow = {
  id: string;
  start_time: string;
  status: AppointmentStatus;
  customerName: string | null;
  customerId: string | null;
  serviceName: string | null;
  staffName: string | null;
  locationName: string | null;
};

export type CommandCentreAttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
};

export type CommandCentreSummerFact = {
  id: string;
  text: string;
  href: string;
};

export type CommandCentreMoneyView =
  | {
      available: true;
      collectedTodayCents: number;
      outstandingInvoicesCents: number;
      outstandingInvoicesCount: number;
      outstandingDepositsCents: number;
      outstandingDepositsCount: number;
    }
  | {
      available: false;
      message: string;
    };

export function isStartInRange(
  iso: string,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
}

export function activeScheduleRows(
  rows: CommandCentreScheduleRow[],
): CommandCentreScheduleRow[] {
  return rows
    .filter((row) => isActiveBooking(row.status))
    .slice()
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function countCancellationsToday(
  rows: CommandCentreScheduleRow[],
): number {
  return rows.filter((row) => row.status === "cancelled").length;
}

export function selectNextAppointment(
  rows: CommandCentreScheduleRow[],
  now: Date,
): CommandCentreScheduleRow | null {
  const nowMs = now.getTime();
  return (
    activeScheduleRows(rows).find((row) => {
      const start = new Date(row.start_time).getTime();
      return Number.isFinite(start) && start >= nowMs;
    }) ?? null
  );
}

export function appointmentScopeLabel(input: {
  mode: "all" | "single";
  locationName?: string | null;
}): string {
  if (input.mode === "all") return "All locations";
  const name = input.locationName?.trim();
  return name && name.length > 0 ? name : "This location";
}

export function moneyScopeCaption(appointmentScopeMode: "all" | "single"): string {
  if (appointmentScopeMode === "all") {
    return "Payments are for the whole business.";
  }
  return "Payments are for the whole business, not this location only.";
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

export function presentCommerceMoney(input: {
  schemaReady: boolean;
  schemaMessage: string | null;
  collectedTodayCents: number;
  outstandingInvoicesCents: number;
  outstandingInvoicesCount: number;
  outstandingDepositsCents: number;
  outstandingDepositsCount: number;
}): CommandCentreMoneyView {
  if (!input.schemaReady) {
    return {
      available: false,
      message:
        input.schemaMessage?.trim() ||
        "Payments data isn’t available yet.",
    };
  }
  return {
    available: true,
    collectedTodayCents: input.collectedTodayCents,
    outstandingInvoicesCents: input.outstandingInvoicesCents,
    outstandingInvoicesCount: input.outstandingInvoicesCount,
    outstandingDepositsCents: input.outstandingDepositsCents,
    outstandingDepositsCount: input.outstandingDepositsCount,
  };
}

export function buildAttentionItems(input: {
  pendingConfirmations: number;
  cancellationsToday: number;
  money: CommandCentreMoneyView;
  setupComplete: boolean;
  nextSetupStep: SetupStep | null;
}): CommandCentreAttentionItem[] {
  const items: CommandCentreAttentionItem[] = [];

  if (!input.setupComplete && input.nextSetupStep) {
    items.push({
      id: "setup",
      title: input.nextSetupStep.label,
      detail: input.nextSetupStep.description,
      href: input.nextSetupStep.href,
      actionLabel: "Continue setup",
    });
  }

  if (input.pendingConfirmations > 0) {
    items.push({
      id: "pending",
      title:
        input.pendingConfirmations === 1
          ? "1 appointment pending confirmation"
          : `${input.pendingConfirmations} appointments pending confirmation`,
      detail: "Review and confirm so the schedule is reliable.",
      href: "/dashboard/calendar?view=day",
      actionLabel: "Open Reception",
    });
  }

  if (input.cancellationsToday > 0) {
    items.push({
      id: "cancelled",
      title:
        input.cancellationsToday === 1
          ? "1 cancellation today"
          : `${input.cancellationsToday} cancellations today`,
      detail: "Openings may be available to rebook.",
      href: "/dashboard/calendar?view=day",
      actionLabel: "Open Reception",
    });
  }

  if (input.money.available) {
    if (
      input.money.outstandingInvoicesCount > 0 ||
      input.money.outstandingInvoicesCents > 0
    ) {
      items.push({
        id: "invoices",
        title:
          input.money.outstandingInvoicesCount === 1
            ? "1 outstanding invoice"
            : `${input.money.outstandingInvoicesCount} outstanding invoices`,
        detail: "Open balances on recorded invoices.",
        href: "/dashboard/payments",
        actionLabel: "Open Payments",
      });
    }
    if (
      input.money.outstandingDepositsCount > 0 ||
      input.money.outstandingDepositsCents > 0
    ) {
      items.push({
        id: "deposits",
        title:
          input.money.outstandingDepositsCount === 1
            ? "1 outstanding deposit or balance"
            : `${input.money.outstandingDepositsCount} outstanding deposits or balances`,
        detail: "Bookings still have an amount due.",
        href: "/dashboard/payments",
        actionLabel: "Open Payments",
      });
    }
  }

  return items;
}

export function buildSummerFacts(input: {
  setupComplete: boolean;
  appointmentsToday: number;
  nextAppointmentClock: string | null;
  pendingConfirmations: number;
  outstandingCount: number;
  attentionCount: number;
}): CommandCentreSummerFact[] {
  const facts: CommandCentreSummerFact[] = [];

  if (!input.setupComplete) {
    facts.push({
      id: "setup",
      text: "Setup is still incomplete — finish the remaining steps before relying on public booking.",
      href: "/dashboard/business",
    });
  }

  if (input.appointmentsToday === 0) {
    facts.push({
      id: "none-today",
      text: "You have no appointments scheduled today.",
      href: "/dashboard/calendar?view=day",
    });
  } else if (input.appointmentsToday === 1) {
    facts.push({
      id: "one-today",
      text: "You have 1 appointment today.",
      href: "/dashboard/calendar?view=day",
    });
  } else {
    facts.push({
      id: "many-today",
      text: `You have ${input.appointmentsToday} appointments today.`,
      href: "/dashboard/calendar?view=day",
    });
  }

  if (input.nextAppointmentClock) {
    facts.push({
      id: "next",
      text: `Your next appointment begins at ${input.nextAppointmentClock}.`,
      href: "/dashboard/calendar?view=day",
    });
  }

  if (input.pendingConfirmations > 0) {
    facts.push({
      id: "pending",
      text:
        input.pendingConfirmations === 1
          ? "1 appointment is still pending confirmation."
          : `${input.pendingConfirmations} appointments are still pending confirmation.`,
      href: "/dashboard/calendar?view=day",
    });
  }

  if (input.outstandingCount > 0) {
    facts.push({
      id: "outstanding",
      text:
        input.outstandingCount === 1
          ? "1 recorded balance still needs attention."
          : `${input.outstandingCount} recorded balances still need attention.`,
      href: "/dashboard/payments",
    });
  }

  if (
    input.setupComplete &&
    input.attentionCount === 0 &&
    facts.length < 3
  ) {
    facts.push({
      id: "clear",
      text: "Nothing urgent needs attention right now.",
      href: "/dashboard/ai-workforce/summer",
    });
  }

  return facts.slice(0, 3);
}

export function receptionHref(input: {
  dateYmd?: string | null;
  appointmentId?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("view", "day");
  if (input.dateYmd) params.set("date", input.dateYmd);
  if (input.appointmentId) params.set("appointment", input.appointmentId);
  return `/dashboard/calendar?${params.toString()}`;
}
