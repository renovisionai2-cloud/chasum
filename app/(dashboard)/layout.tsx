export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/dashboard/shell";
import { PreviewBuildBadge } from "@/components/system/preview-build-badge";
import {
  getOrCreateBusiness,
  listAuthorizedBusinesses,
} from "@/lib/actions/business";
import { getSupabaseEnv } from "@/lib/env";
import {
  getLocationQuota,
  getLocationScope,
  getLocations,
} from "@/lib/actions/location";
import { planAllowsApiIntegrations } from "@/lib/billing/plan-features";
import { isPlatformOwner } from "@/lib/owner/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!getSupabaseEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateBusiness();
  const [locations, locationScope, locationQuota, showHq, authorized] =
    await Promise.all([
      getLocations(),
      getLocationScope(),
      getLocationQuota(),
      isPlatformOwner(user),
      listAuthorizedBusinesses(),
    ]);

  const showDeveloper =
    showHq || planAllowsApiIntegrations(business);

  return (
    <DashboardShell
      userEmail={user.email ?? undefined}
      locations={locations}
      locationScope={locationScope}
      locationQuota={locationQuota}
      showHq={showHq}
      showDeveloper={showDeveloper}
      authorizedBusinesses={authorized.map((row) => ({
        id: row.id,
        name: row.name,
      }))}
      activeBusinessId={business.id}
    >
      {children}
      <PreviewBuildBadge />
    </DashboardShell>
  );
}
