/**
 * Spark / Chase CRM AI hooks — read-only analytics today; pluggable providers later.
 * Summer/Chase must not mutate CRM; booking changes go through the Booking Engine.
 */

import {
  getChaseCrmAnalytics,
  getSummerCrmSnapshot,
} from "@/lib/crm/ai-knowledge";
import { displayCustomerName } from "@/lib/crm/display";
import { loadCrmProfile } from "@/lib/crm/service";

export type CrmAiQueryKind =
  | "summarize_customer"
  | "inactive_customers"
  | "top_spenders"
  | "birthday_promotions"
  | "custom";

export type CrmAiQueryInput = {
  businessId: string;
  kind: CrmAiQueryKind;
  customerId?: string;
  prompt?: string;
  lookbackDays?: number;
};

export type CrmAiQueryResult = {
  kind: CrmAiQueryKind;
  summary: string;
  items?: Array<{ id: string; label: string; detail?: string }>;
  ready: boolean;
};

export interface CrmAiProvider {
  readonly name: string;
  query(input: CrmAiQueryInput): Promise<CrmAiQueryResult>;
}

class ChaseCrmProvider implements CrmAiProvider {
  readonly name = "chase_crm_analytics";

  async query(input: CrmAiQueryInput): Promise<CrmAiQueryResult> {
    if (input.kind === "summarize_customer" && input.customerId) {
      const [snapshot, profile] = await Promise.all([
        getSummerCrmSnapshot(input.businessId, input.customerId),
        loadCrmProfile(input.businessId, input.customerId),
      ]);
      if (!snapshot || !profile) {
        return {
          kind: input.kind,
          summary: "Customer not found.",
          ready: true,
        };
      }
      const lines = [
        `${snapshot.displayName} · ${snapshot.crmStatus}${snapshot.isVip ? " · VIP" : ""}`,
        snapshot.preferredEmployeeName
          ? `Preferred employee: ${snapshot.preferredEmployeeName}`
          : null,
        snapshot.preferredServices.length
          ? `Recent services: ${snapshot.preferredServices.join(", ")}`
          : null,
        `Lifetime visits ${snapshot.lifetimeVisits} · spend $${snapshot.lifetimeSpend.toFixed(0)}`,
        snapshot.nextAppointment
          ? `Next visit scheduled · ${snapshot.upcomingCount} upcoming`
          : "No upcoming appointments",
        snapshot.allowedNotes[0]
          ? `Latest note: ${snapshot.allowedNotes[0].body.slice(0, 120)}`
          : null,
      ].filter(Boolean);
      return {
        kind: input.kind,
        summary: lines.join(". ") + ".",
        items: snapshot.upcomingAppointments.map((a) => ({
          id: a.id,
          label: a.serviceName,
          detail: a.start,
        })),
        ready: true,
      };
    }

    const analytics = await getChaseCrmAnalytics(input.businessId);

    if (input.kind === "inactive_customers") {
      return {
        kind: input.kind,
        summary: `Chase found ${analytics.inactive.length} inactive customers (60+ days without activity). Retention: ${analytics.retention.repeatBookingRate}% repeat rate across ${analytics.retention.activeCustomers} active profiles.`,
        items: analytics.inactive.map((c) => ({
          id: c.id,
          label: c.name,
          detail: c.lastActivity
            ? `Last activity ${c.lastActivity.slice(0, 10)}`
            : "No recent activity",
        })),
        ready: true,
      };
    }

    if (input.kind === "top_spenders") {
      return {
        kind: input.kind,
        summary: `High-value customers: avg lifetime spend $${analytics.retention.averageLifetimeSpend.toFixed(0)}. ${analytics.retention.vipCount} VIP profiles.`,
        items: analytics.highValue.map((c) => ({
          id: c.id,
          label: c.name,
          detail: `$${c.lifetimeSpend.toFixed(0)} · ${c.visits} visits`,
        })),
        ready: true,
      };
    }

    if (input.kind === "birthday_promotions") {
      const profile = input.customerId
        ? await loadCrmProfile(input.businessId, input.customerId)
        : null;
      const dob = profile?.customer.date_of_birth;
      return {
        kind: input.kind,
        summary: dob
          ? `${displayCustomerName(profile!.customer)} birthday on file: ${dob}. Chase can queue outreach when marketing consent is on.`
          : "Add birthdays on CRM profiles to enable Chase birthday campaigns. Marketing consent gates promotional sends.",
        items: analytics.overdueFollowUp.slice(0, 5).map((c) => ({
          id: c.id,
          label: c.name,
          detail: `Follow-up overdue · ${c.daysSince}d since visit`,
        })),
        ready: true,
      };
    }

    return {
      kind: input.kind,
      summary:
        input.prompt?.trim() ||
        `Chase retention snapshot: ${analytics.retention.activeCustomers} active · ${analytics.retention.repeatBookingRate}% repeat · ${analytics.overdueFollowUp.length} overdue follow-ups.`,
      items: analytics.overdueFollowUp.map((c) => ({
        id: c.id,
        label: c.name,
        detail: `${c.daysSince}d since last visit`,
      })),
      ready: true,
    };
  }
}

let provider: CrmAiProvider | null = null;

export function getCrmAiProvider(): CrmAiProvider {
  if (!provider) provider = new ChaseCrmProvider();
  return provider;
}

export async function runCrmAiQuery(
  input: CrmAiQueryInput,
): Promise<CrmAiQueryResult> {
  return getCrmAiProvider().query(input);
}
