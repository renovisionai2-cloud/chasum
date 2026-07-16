import { EmployeeManager } from "@/components/employees/employee-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getDepartments, getEmployeeDirectory } from "@/lib/actions/employees";
import { getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employees",
};

export default async function EmployeesPage() {
  await getOrCreateBusiness();
  const [employees, services, locations, departments] = await Promise.all([
    getEmployeeDirectory(),
    getServices(),
    getLocations(),
    getDepartments(),
  ]);

  return (
    <div className="ds-page">
      <PageHeader
        title="Employees"
        description="Employee Management — directory, roles, schedules, payroll, documents, and performance for your whole team."
      />
      <EmployeeManager
        employees={employees}
        services={services}
        locations={locations}
        departments={departments}
      />
    </div>
  );
}
