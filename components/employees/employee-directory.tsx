"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  EMPLOYMENT_STATUS_LABELS,
  ROLE_DEFINITIONS,
  type EmployeeRoleKey,
  type EmploymentStatus,
} from "@/lib/employees/roles";
import type { Department } from "@/lib/employees/types";
import type { Location, Service, StaffWithServices } from "@/lib/types/booking";
import { Building2, Plus, Search, UserCog } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type DirectoryEmployee = StaffWithServices & {
  phone?: string | null;
  employment_status?: string;
  role_key?: string;
  department_id?: string | null;
  location?: Pick<Location, "id" | "name"> | null;
  department?: Pick<Department, "id" | "name" | "color"> | null;
};

export function EmployeeDirectory({
  employees,
  services,
  locations,
  departments,
  onAdd,
}: {
  employees: DirectoryEmployee[];
  services: Service[];
  locations: Location[];
  departments: Department[];
  onAdd: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (statusFilter !== "all") {
        const status = employee.employment_status ?? (employee.is_active ? "active" : "terminated");
        if (status !== statusFilter) return false;
      }
      if (deptFilter !== "all" && employee.department_id !== deptFilter) return false;
      if (locationFilter !== "all" && employee.location_id !== locationFilter) {
        return false;
      }
      if (!q) return true;
      return (
        employee.name.toLowerCase().includes(q) ||
        (employee.email ?? "").toLowerCase().includes(q) ||
        (employee.title ?? "").toLowerCase().includes(q) ||
        (employee.phone ?? "").includes(q)
      );
    });
  }, [employees, search, statusFilter, deptFilter, locationFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search employees"
          />
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add employee
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by department"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="all">All departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="all">All locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="panel"
          glyph={UserCog}
          title={employees.length === 0 ? "No employees yet" : "No matches"}
          description={
            employees.length === 0
              ? "Add your first team member to manage schedules, roles, and payroll."
              : "Try a different search or filter."
          }
        >
          {employees.length === 0 ? (
            <Button type="button" onClick={onAdd} className="mt-4">
              <Plus className="h-4 w-4" />
              Add employee
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((employee) => {
            const role = (employee.role_key ?? "employee") as EmployeeRoleKey;
            const status = (employee.employment_status ??
              (employee.is_active ? "active" : "terminated")) as EmploymentStatus;
            const serviceCount = employee.staff_services?.length ?? 0;
            return (
              <Link
                key={employee.id}
                href={`/dashboard/employees/${employee.id}`}
                className="block"
              >
                <Card className="ds-card-interactive h-full transition-colors hover:border-primary/40">
                  <CardContent className="flex gap-4 p-4">
                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted"
                      style={{ boxShadow: `inset 0 0 0 2px ${employee.color}` }}
                    >
                      {employee.photo_url ? (
                        <Image
                          src={employee.photo_url}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
                          {employee.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{employee.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {employee.title || "Team member"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {EMPLOYMENT_STATUS_LABELS[status] ?? status}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {ROLE_DEFINITIONS[role]?.label ?? role}
                        {employee.department?.name
                          ? ` · ${employee.department.name}`
                          : ""}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {employee.location?.name ?? "No location"}
                        {serviceCount > 0 ? ` · ${serviceCount} services` : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {employees.length} employees ·{" "}
        {services.length} services available for assignment
      </p>
    </div>
  );
}
