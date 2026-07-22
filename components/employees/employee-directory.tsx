"use client";

import { AddMyselfAsProviderButton } from "@/components/employees/add-myself-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { bulkUpdateEmployeeStatus } from "@/lib/actions/employees";
import {
  EMPLOYMENT_STATUS_LABELS,
  ROLE_DEFINITIONS,
  type EmployeeRoleKey,
  type EmploymentStatus,
} from "@/lib/employees/roles";
import type { Department } from "@/lib/employees/types";
import type { Location, Service, StaffWithServices } from "@/lib/types/booking";
import { useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  UserCog,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

const PAGE_SIZE = 12;

export type DirectoryEmployee = StaffWithServices & {
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  employment_status?: string;
  role_key?: string;
  department_id?: string | null;
  location?: Pick<Location, "id" | "name"> | null;
  department?: Pick<Department, "id" | "name" | "color"> | null;
};

type SortKey = "name" | "title" | "status" | "role";

function roleLabel(key: string | undefined) {
  if (!key) return ROLE_DEFINITIONS.employee.label;
  if (key === "custom") return "Custom";
  if (key in ROLE_DEFINITIONS) {
    return ROLE_DEFINITIONS[key as Exclude<EmployeeRoleKey, "custom">].label;
  }
  return key;
}

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
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const refresh = useRefresh();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = employees.filter((employee) => {
      if (activeFilter === "active" && !employee.is_active) return false;
      if (activeFilter === "inactive" && employee.is_active) return false;
      if (statusFilter !== "all") {
        const status =
          employee.employment_status ??
          (employee.is_active ? "active" : "terminated");
        if (status !== statusFilter) return false;
      }
      if (deptFilter !== "all" && employee.department_id !== deptFilter) {
        return false;
      }
      if (locationFilter !== "all" && employee.location_id !== locationFilter) {
        return false;
      }
      if (!q) return true;
      return (
        employee.name.toLowerCase().includes(q) ||
        (employee.first_name ?? "").toLowerCase().includes(q) ||
        (employee.last_name ?? "").toLowerCase().includes(q) ||
        (employee.preferred_name ?? "").toLowerCase().includes(q) ||
        (employee.email ?? "").toLowerCase().includes(q) ||
        (employee.title ?? "").toLowerCase().includes(q) ||
        (employee.phone ?? "").includes(q)
      );
    });

    rows = [...rows].sort((a, b) => {
      if (sortKey === "title") {
        return (a.title ?? "").localeCompare(b.title ?? "");
      }
      if (sortKey === "status") {
        return String(a.employment_status ?? "").localeCompare(
          String(b.employment_status ?? ""),
        );
      }
      if (sortKey === "role") {
        return String(a.role_key ?? "").localeCompare(String(b.role_key ?? ""));
      }
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [
    employees,
    search,
    statusFilter,
    deptFilter,
    locationFilter,
    activeFilter,
    sortKey,
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function resetPage() {
    setPage(1);
    setSelected([]);
  }

  function toggleSelected(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function togglePageSelection() {
    const ids = pageRows.map((row) => row.id);
    const allSelected = ids.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  function runBulk(isActive: boolean) {
    if (selected.length === 0) return;
    startTransition(async () => {
      const result = await bulkUpdateEmployeeStatus(selected, isActive);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Updated.", "success");
        setSelected([]);
        refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search employees…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              aria-label="Search employees"
            />
          </div>
          <Select
            aria-label="Filter by booking status"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as typeof activeFilter);
              resetPage();
            }}
          >
            <option value="all">All booking status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Select
            aria-label="Filter by employment status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
          >
            <option value="all">All employment</option>
            {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by department"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              resetPage();
            }}
          >
            <option value="all">All departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filter by location"
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              resetPage();
            }}
            className="w-44"
          >
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Sort employees"
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as SortKey);
              resetPage();
            }}
            className="w-36"
          >
            <option value="name">Name</option>
            <option value="title">Title</option>
            <option value="role">Role</option>
            <option value="status">Status</option>
          </Select>
          <Button type="button" onClick={onAdd}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add employee
          </Button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted/30 px-3 py-2 text-sm">
          <span>{selected.length} selected</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => runBulk(true)}
          >
            Activate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => runBulk(false)}
          >
            Deactivate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSelected([])}
          >
            Clear
          </Button>
        </div>
      ) : null}

      {pageRows.length === 0 ? (
        <EmptyState
          variant="panel"
          glyph={UserCog}
          title={
            employees.length === 0 ? "Invite your first employee" : "No matches"
          }
          description={
            employees.length === 0
              ? "Providers power your calendar — add yourself or invite a teammate so bookings can start."
              : "Try a different search or filter."
          }
        >
          {employees.length === 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={onAdd}>
                <Plus className="h-4 w-4" />
                Add employee
              </Button>
              <AddMyselfAsProviderButton />
            </div>
          ) : null}
        </EmptyState>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  pageRows.length > 0 &&
                  pageRows.every((row) => selected.includes(row.id))
                }
                onChange={togglePageSelection}
                aria-label="Select employees on this page"
              />
              Select page
            </label>
            <span aria-hidden="true">·</span>
            <span>
              {services.length} services · {locations.length} locations
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageRows.map((employee) => {
              const status = (employee.employment_status ??
                (employee.is_active ? "active" : "terminated")) as EmploymentStatus;
              const serviceCount = employee.staff_services?.length ?? 0;
              return (
                <Card key={employee.id} className="ds-card-interactive">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected.includes(employee.id)}
                        onChange={() => toggleSelected(employee.id)}
                        aria-label={`Select ${employee.name}`}
                      />
                      <Link
                        href={`/dashboard/employees/${employee.id}`}
                        className="flex min-w-0 flex-1 items-start gap-3"
                      >
                        <div
                          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted"
                          style={{
                            boxShadow: `inset 0 0 0 2px ${employee.color}`,
                          }}
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
                            <div className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">
                              {employee.name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{employee.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {employee.title || "Team member"}
                          </p>
                          <p className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{roleLabel(employee.role_key)}</span>
                            <span>·</span>
                            <span>
                              {EMPLOYMENT_STATUS_LABELS[status] ?? status}
                            </span>
                            {!employee.is_active ? (
                              <span className="text-destructive">Inactive</span>
                            ) : null}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {employee.location?.name ?? "No location"}
                            <span aria-hidden="true">·</span>
                            {serviceCount} service{serviceCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Page {currentPage} / {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
