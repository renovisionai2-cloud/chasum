export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/dashboard/shell";
import { PreviewBuildBadge } from "@/components/system/preview-build-badge";
import {
  getBusiness,
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
import { BUSINESS_ONBOARDING_PATH } from "@/lib/tenancy/post-auth-destination";
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

  const business = await getBusiness();
  const showHq = await isPlatformOwner(user);

  if (!business) {
    if (!showHq) {
      redirect(BUSINESS_ONBOARDING_PATH);
    }

    return (
      <DashboardShell
        userEmail={user.email ?? undefined}
        locations={[]}
        locationScope={{ mode: "all" }}
        locationQuota={{ plan: null, currentCount: 0, canAdd: false }}
        showHq
        showDeveloper
        authorizedBusinesses={[]}
        activeBusinessId=""
      >
        {children}
        <PreviewBuildBadge />
      </DashboardShell>
    );
  }

  const [locations, locationScope, locationQuota, authorized] =
    await Promise.all([
      getLocations(),
      getLocationScope(),
      getLocationQuota(),
      listAuthorizedBusinesses(),
    ]);

  const showDeveloper = showHq || planAllowsApiIntegrations(business);

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
