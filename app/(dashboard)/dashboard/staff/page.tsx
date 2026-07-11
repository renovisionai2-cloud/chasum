import { StaffManager } from "@/components/staff/staff-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getServices } from "@/lib/actions/services";
import { getStaff } from "@/lib/actions/staff";
import {
  getStaffVacations,
  getStaffWorkingHours,
} from "@/lib/actions/staff-schedule";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff",
};

export default async function StaffPage() {
  await getOrCreateBusiness();
  const [staff, services] = await Promise.all([getStaff(), getServices()]);

  const scheduleEntries = await Promise.all(
    staff.map(async (member) => {
      const [hours, vacations] = await Promise.all([
        getStaffWorkingHours(member.id),
        getStaffVacations(member.id),
      ]);
      return [member.id, { hours, vacations }] as const;
    }),
  );

  const schedules = Object.fromEntries(scheduleEntries);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage team members, schedules, and service assignments."
      />
      <StaffManager staff={staff} services={services} schedules={schedules} />
    </div>
  );
}
