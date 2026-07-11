import { IntegrationsManager } from "@/components/integrations/integrations-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getCalendarConnections } from "@/lib/actions/integrations";
import { getStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  await getOrCreateBusiness();
  const [connections, staff] = await Promise.all([
    getCalendarConnections(),
    getStaff(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect external calendars for two-way sync and conflict detection."
      />
      <IntegrationsManager
        connections={connections.map((c) => ({
          ...c,
          staff: Array.isArray(c.staff) ? c.staff[0] ?? null : c.staff,
        }))}
        staff={staff.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
