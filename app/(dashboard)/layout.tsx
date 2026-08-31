export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/dashboard/shell";
import { PreviewBuildBadge } from "@/components/system/preview-build-badge";
import { getBusiness } from "@/lib/actions/business";
import { getSupabaseEnv } from "@/lib/env";
import {
  getLocationQuota,
  getLocationScope,
  getLocations,
} from "@/lib/actions/location";
import { isPlatformOwner } from "@/lib/owner/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePostAuthDestination } from "@/lib/tenancy/post-auth-destination";
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

  const [business, showHq] = await Promise.all([
    getBusiness(),
    isPlatformOwner(user),
  ]);

  if (!business) {
    redirect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: false,
        isPlatformAdmin: showHq,
      }),
    );
  }

  const [locations, locationScope, locationQuota] = await Promise.all([
    getLocations(),
    getLocationScope(),
    getLocationQuota(),
  ]);

  return (
    <DashboardShell
      userEmail={user.email ?? undefined}
      locations={locations}
      locationScope={locationScope}
      locationQuota={locationQuota}
      showHq={showHq}
    >
      {children}
      <PreviewBuildBadge />
    </DashboardShell>
  );
}
