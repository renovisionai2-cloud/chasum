import { AutomationManager } from "@/components/automation/automation-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  getRecurringRules,
  getWaitlistEntries,
} from "@/lib/actions/notifications";
import { getCustomers } from "@/lib/actions/customers";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Automation" };

export default async function AutomationPage() {
  await getOrCreateBusiness();
  const [waitlist, recurringRules, services, staff, customers] = await Promise.all([
    getWaitlistEntries(),
    getRecurringRules(),
    getServices(),
    getStaff(),
    getCustomers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation"
        description="Recurring appointments, waitlists, and automated notifications."
      />
      <AutomationManager
        waitlist={waitlist.map((w) => ({
          ...w,
          customer: Array.isArray(w.customer) ? w.customer[0] ?? null : w.customer,
          service: Array.isArray(w.service) ? w.service[0] ?? null : w.service,
          staff: Array.isArray(w.staff) ? w.staff[0] ?? null : w.staff,
        }))}
        recurringRules={recurringRules.map((r) => ({
          ...r,
          customer: Array.isArray(r.customer) ? r.customer[0] ?? null : r.customer,
          service: Array.isArray(r.service) ? r.service[0] ?? null : r.service,
          staff: Array.isArray(r.staff) ? r.staff[0] ?? null : r.staff,
        }))}
        services={services.map((s) => ({ id: s.id, name: s.name }))}
        staff={staff.map((s) => ({ id: s.id, name: s.name }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
