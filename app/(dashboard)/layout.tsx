export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/dashboard/shell";
import { getSupabaseEnv } from "@/lib/env";
import {
  getLocationQuota,
  getLocationScope,
  getLocations,
} from "@/lib/actions/location";
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

  const [locations, locationScope, locationQuota, showHq] = await Promise.all([
    getLocations(),
    getLocationScope(),
    getLocationQuota(),
    isPlatformOwner(user),
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
    </DashboardShell>
  );
}
