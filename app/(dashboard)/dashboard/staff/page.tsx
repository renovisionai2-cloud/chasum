import { StaffManager } from "@/components/staff/staff-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import { getAllStaffSchedules } from "@/lib/actions/staff-schedule";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff",
};

export default async function StaffPage() {
  await getOrCreateBusiness();
  const [staff, services, locations] = await Promise.all([
    getStaff(),
    getServices(),
    getLocations(),
  ]);
  const schedules = await getAllStaffSchedules(staff.map((member) => member.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage team members, schedules, qualifications, and service assignments."
      />
      <StaffManager
        staff={staff}
        services={services}
        locations={locations}
        schedules={schedules}
      />
    </div>
  );
}
