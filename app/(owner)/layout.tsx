export const dynamic = "force-dynamic";

import { OwnerShell } from "@/components/owner/shell";
import { getSupabaseEnv } from "@/lib/env";
import { requirePlatformOwner } from "@/lib/owner/auth";
import { redirect } from "next/navigation";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!getSupabaseEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const owner = await requirePlatformOwner();

  return (
    <OwnerShell userEmail={owner.email}>{children}</OwnerShell>
  );
}
