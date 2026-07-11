import {
  DashboardDesktopHeader,
  DashboardHeader,
  DashboardSidebar,
} from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar userEmail={user.email} className="fixed inset-y-0" />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardHeader userEmail={user.email ?? undefined} />
        <DashboardDesktopHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
