import { StaffManager } from "@/components/staff/staff-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff",
};

export default async function StaffPage() {
  await getOrCreateBusiness();
  const [staff, services] = await Promise.all([getStaff(), getServices()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage team members and assign them to services."
      />
      <StaffManager staff={staff} services={services} />
    </div>
  );
}
