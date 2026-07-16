import { EmployeeProfileView } from "@/components/employees/employee-profile";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getDepartments, loadEmployeeProfile } from "@/lib/actions/employees";
import { getLocations } from "@/lib/actions/location";
import { getServices } from "@/lib/actions/services";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const employee = await loadEmployeeProfile(id);
  return {
    title: employee ? `${employee.name} · Employees` : "Employee",
  };
}

export default async function EmployeeProfilePage({ params }: PageProps) {
  const { id } = await params;
  await getOrCreateBusiness();
  const [employee, services, locations, departments] = await Promise.all([
    loadEmployeeProfile(id),
    getServices(),
    getLocations(),
    getDepartments(),
  ]);

  if (!employee) notFound();

  return (
    <div className="ds-page">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/employees" className="mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            aria-label="Back to employees"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Employee profile"
          description="Roles, schedule, locations, payroll, documents, and performance."
        />
      </div>
      <EmployeeProfileView
        employee={employee}
        services={services}
        locations={locations}
        departments={departments}
      />
    </div>
  );
}
