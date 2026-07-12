export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/dashboard/shell";
import { getSupabaseEnv } from "@/lib/env";
import {
  getLocationQuota,
  getLocationScope,
  getLocations,
} from "@/lib/actions/location";
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
    >
      {children}
    </DashboardShell>
  );
}
